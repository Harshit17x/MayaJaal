from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.pipeline.alert_service import alert_service, SNAPSHOTS_DIR
from app.pipeline.feed_scanner import feed_scanner_service

logger = logging.getLogger("SIH26187.AlertsAPI")

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


class AlertCreateRequest(BaseModel):
    title: str = Field(..., min_length=2)
    location: str = Field(..., min_length=2)
    severity: str = Field("High")
    cameraId: Optional[str] = None
    cameraName: Optional[str] = None
    className: str = Field("suspect")
    confidence: float = Field(0.90, ge=0.0, le=1.0)
    box: Optional[list[float]] = None
    suspectName: Optional[str] = None
    threatLevel: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None


@router.get("")
async def list_alerts(
    severity: Optional[str] = Query(None, description="Filter by severity (High, Medium, Low)"),
    acknowledged: Optional[bool] = Query(None, description="Filter by acknowledged state"),
    camera_id: Optional[str] = Query(None, description="Filter by camera ID"),
    limit: int = Query(50, ge=1, le=500, description="Max alerts to return"),
) -> list[dict[str, Any]]:
    """Retrieve security and suspect sighting alerts with optional filtering."""
    return alert_service.get_alerts(
        severity=severity,
        acknowledged=acknowledged,
        camera_id=camera_id,
        limit=limit,
    )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_alert(payload: AlertCreateRequest) -> dict[str, Any]:
    """Manually dispatch a security alert to the system and WebSocket subscribers."""
    return alert_service.create_alert(
        title=payload.title,
        location=payload.location,
        severity=payload.severity,
        camera_id=payload.cameraId,
        camera_name=payload.cameraName,
        class_name=payload.className,
        confidence=payload.confidence,
        box=payload.box,
        suspect_name=payload.suspectName,
        threat_level=payload.threatLevel,
        category=payload.category,
        notes=payload.notes,
    )


@router.patch("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str) -> dict[str, Any]:
    """Acknowledge a specific alert by ID."""
    success = alert_service.acknowledge_alert(alert_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID '{alert_id}' not found.",
        )
    return {"success": True, "alert_id": alert_id, "acknowledged": True}


class QrtDispatchRequest(BaseModel):
    unitName: str = Field(..., min_length=2, description="Designation of Quick Reaction Team unit")
    notes: Optional[str] = Field(None, description="Tactical dispatch notes or mission instructions")


@router.get("/trajectory/{suspect_name}")
async def get_suspect_trajectory(suspect_name: str) -> dict[str, Any]:
    """Retrieve chronological multi-camera trajectory and movement telemetry for a suspect."""
    return alert_service.get_suspect_trajectory(suspect_name)


@router.post("/{alert_id}/dispatch")
async def dispatch_qrt(alert_id: str, payload: QrtDispatchRequest) -> dict[str, Any]:
    """Deploy Quick Reaction Team to intercept suspect at camera location."""
    result = alert_service.dispatch_qrt_team(
        alert_id=alert_id,
        unit_name=payload.unitName,
        notes=payload.notes,
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID '{alert_id}' not found.",
        )
    return {"success": True, "alert_id": alert_id, "dispatch": result}


@router.post("/clear")
async def clear_alerts() -> dict[str, Any]:
    """Clear all security alerts from the active ring buffer."""
    alert_service.clear_all()
    return {"success": True, "message": "All alerts cleared."}


@router.get("/snapshots/{filename}")
async def get_alert_snapshot(filename: str):
    """Serve forensic snapshot JPEG image for an alert."""
    # Sanitize filename to prevent directory traversal
    clean_name = Path(filename).name
    snapshot_path = SNAPSHOTS_DIR / clean_name

    if not snapshot_path.exists() or not snapshot_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Snapshot '{clean_name}' not found.",
        )

    return FileResponse(
        path=str(snapshot_path),
        media_type="image/jpeg",
        filename=clean_name,
    )


# =========================================================================
# Continuous Scanner Control Endpoints
# =========================================================================

@router.get("/scanner/status")
async def get_scanner_status() -> dict[str, Any]:
    """Retrieve operational telemetry and health of the Continuous Face Scanner."""
    return feed_scanner_service.get_status()


@router.post("/scanner/start")
async def start_scanner() -> dict[str, Any]:
    """Start continuous multi-feed scanning across active camera streams."""
    return feed_scanner_service.start()


@router.post("/scanner/stop")
async def stop_scanner() -> dict[str, Any]:
    """Stop continuous multi-feed scanning."""
    return feed_scanner_service.stop()


# =========================================================================
# Real-Time WebSocket Alerts Endpoint
# =========================================================================

@router.websocket("/ws")
async def alerts_websocket_endpoint(websocket: WebSocket) -> None:
    """
    WebSocket endpoint for real-time security alerts and suspect sightings.
    Clients connect here to receive instantaneous 'NEW_ALERT' broadcasts.
    """
    await alert_service.broadcaster.connect(websocket)
    try:
        while True:
            # Keep connection open and accept ping / incoming messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        alert_service.broadcaster.disconnect(websocket)
    except Exception as exc:
        logger.debug("WebSocket client disconnected with exception: %s", exc)
        alert_service.broadcaster.disconnect(websocket)
