from __future__ import annotations

import logging
from pathlib import Path
import tempfile
import threading
import time
from typing import Optional
import uuid

import cv2
from fastapi import APIRouter, File, Form, HTTPException, Query, Response, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
import numpy as np

from app.core.config import settings
from app.pipeline.anpr_service import PLATES_DIR, anpr_pipeline

logger = logging.getLogger("SIH26187.ANPR.API")

router = APIRouter(
    prefix="/api/anpr",
    tags=["ANPR"],
)

# ── Session-based stream stop registry ────────────────────────────────────────
# Maps session_id → threading.Event.  The ANPR stream generator checks this
# event on every iteration.  When the frontend navigates away it calls
# DELETE /api/anpr/stream/stop?session_id=X which sets the event, causing the
# generator to exit within one frame interval (~40 ms) and freeing GPU/CPU.
_stream_stop_events: dict[str, threading.Event] = {}


@router.post("/image")
async def scan_image(
    file: UploadFile = File(...),
    camera_id: str = Form("CAM-UPLOAD"),
) -> dict:
    """Scan an uploaded static image for vehicles, license plates, and text."""
    try:
        content = await file.read()
        nparr = np.frombuffer(content, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img_bgr is None:
            raise HTTPException(status_code=400, detail="Invalid image file format")

        result = anpr_pipeline.process_image(img_bgr, camera_id=camera_id)
        return result
    except Exception as exc:
        logger.exception("ANPR image scan error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/video")
async def scan_video(
    file: UploadFile = File(...),
    camera_id: str = Form("VIDEO-ANPR"),
    stride: int = Form(10),
) -> dict:
    """Process an uploaded video clip, tracking and recording unique license plates."""
    suffix = Path(file.filename or "video.mp4").suffix or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_path = Path(temp_file.name)

    try:
        result = anpr_pipeline.process_video(temp_path, camera_id=camera_id, stride=stride)
        return result
    finally:
        try:
            if temp_path.exists():
                temp_path.unlink()
        except Exception:
            pass


@router.get("/records")
def get_records(
    query: Optional[str] = Query(None, description="Search by plate number or vehicle type"),
    camera_id: Optional[str] = Query(None, description="Filter by camera outpost ID"),
    limit: int = Query(50, ge=1, le=200),
) -> list[dict]:
    """Retrieve history of recently captured vehicle license plate detections."""
    records = anpr_pipeline.records
    if query:
        q = query.strip().upper()
        records = [r for r in records if q in r["plateNumber"].upper() or q in r["vehicleType"].upper()]
    if camera_id:
        records = [r for r in records if r.get("cameraId") == camera_id]

    return list(reversed(records))[:limit]


@router.get("/watchlist")
def get_watchlist() -> list[dict]:
    """Get the current tactical watchlist / BOLO vehicle list."""
    items = []
    for p, entry in anpr_pipeline.watchlist.items():
        clean_p = p.strip().upper()
        plate_str = entry.get("plateNumber") or entry.get("plate_number") or clean_p
        v_type = entry.get("vehicleType") or entry.get("vehicle_type") or "car"
        added = entry.get("addedAt") or entry.get("added_at") or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        item_id = str(entry.get("id") or f"wl_{clean_p}")
        items.append({
            "id": item_id,
            "plateNumber": plate_str,
            "plate_number": plate_str,
            "reason": entry.get("reason", "Flagged Suspect Vehicle"),
            "severity": entry.get("severity", "high"),
            "vehicleType": v_type,
            "vehicle_type": v_type,
            "addedAt": added,
            "added_at": added,
        })
    return items


@router.post("/watchlist")
def add_to_watchlist(
    plate_number: str = Form(...),
    reason: str = Form("Suspect Vehicle Entry"),
    severity: str = Form("high"),
    vehicle_type: str = Form("car"),
) -> dict:
    """Add a license plate to the real-time interception watchlist."""
    clean_plate = plate_number.strip().upper()
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    entry = {
        "id": f"wl_{clean_plate}",
        "plate_number": clean_plate,
        "plateNumber": clean_plate,
        "reason": reason,
        "severity": severity,
        "vehicle_type": vehicle_type,
        "vehicleType": vehicle_type,
        "added_at": now_iso,
        "addedAt": now_iso,
    }
    anpr_pipeline.watchlist[clean_plate] = entry
    return {"status": "success", "message": f"Plate {clean_plate} added to watchlist", "entry": entry}


@router.delete("/watchlist/{plate_number}")
def remove_from_watchlist(plate_number: str) -> dict:
    """Remove a vehicle license plate from the watchlist."""
    clean_plate = plate_number.strip().upper()
    if clean_plate in anpr_pipeline.watchlist:
        del anpr_pipeline.watchlist[clean_plate]
        return {"status": "success", "message": f"Plate {clean_plate} removed from watchlist"}
    raise HTTPException(status_code=404, detail="Plate not found on watchlist")


@router.delete("/stream/stop")
def stop_anpr_stream(
    session_id: str = Query(..., description="Stream session ID to stop"),
) -> dict:
    """Signal the ANPR stream generator to stop immediately.

    The frontend calls this when the user navigates away from the ANPR page.
    The generator checks this flag at the top of every frame loop and exits
    within one frame interval (~40 ms), releasing all GPU/CPU inference resources.
    """
    event = _stream_stop_events.pop(session_id, None)
    if event is not None:
        event.set()
        logger.info("ANPR stream stop signal sent for session: %s", session_id)
        return {"status": "stopping", "session_id": session_id}
    logger.debug(
        "ANPR stream stop: session %s not found (may have already ended)", session_id
    )
    return {"status": "not_found", "session_id": session_id}


@router.get("/stream")
def stream_anpr(
    rtsp_url: str = Query("sample", description="RTSP feed URL or 'sample'"),
    camera_id: str = Query("BOP-04-ANPR", description="Camera identifier"),
    fps: int = Query(24, ge=5, le=30),
    ocr_stride: int = Query(10, ge=1, le=60, description="Run EasyOCR on every Nth frame"),
    session_id: Optional[str] = Query(
        None,
        description="Unique client session ID.  When provided, DELETE /api/anpr/stream/stop stops inference.",
    ),
) -> StreamingResponse:
    """Live MJPEG stream with real-time green plate reticles and vehicle identification."""
    sid = session_id or str(uuid.uuid4())
    stop_event = threading.Event()
    _stream_stop_events[sid] = stop_event

    def _gen_with_cleanup():
        try:
            yield from anpr_pipeline.stream_generator(
                stream_url=rtsp_url,
                camera_id=camera_id,
                fps_limit=fps,
                ocr_stride=ocr_stride,
                stop_event=stop_event,
            )
        finally:
            # Clean up registry entry when generator ends for any reason
            _stream_stop_events.pop(sid, None)

    return StreamingResponse(
        _gen_with_cleanup(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
            "Connection": "close",
        },
    )


@router.get("/plates/{filename}")
def get_plate_snapshot(filename: str) -> Response:
    """Serve a cropped license plate snapshot image."""
    safe_name = Path(filename).name
    file_path = PLATES_DIR / safe_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Plate snapshot not found")
    return FileResponse(file_path, media_type="image/jpeg")


@router.get("/videos/{filename}")
def get_processed_video(filename: str) -> Response:
    """Serve a processed ANPR video file."""
    safe_name = Path(filename).name
    file_path = settings.temp_directory / safe_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Processed video not found")
    return FileResponse(file_path, media_type="video/mp4")
