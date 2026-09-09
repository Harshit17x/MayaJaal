"""
/api/tracking — ByteTrack multi-object tracking endpoints.

Endpoints
---------
POST   /api/tracking/video
    Stateless video upload tracking (fresh tracker per request).

POST   /api/tracking/rtsp
    Stateful RTSP tracking using per-camera session (track IDs persist
    across multiple requests to the same camera_id).

GET    /api/tracking/rtsp/sessions
    List all active RTSP tracker sessions.

DELETE /api/tracking/rtsp/{camera_id}
    Reset and remove the tracker session for a specific camera.
"""
from __future__ import annotations

import logging
import tempfile
from pathlib import Path

import cv2
import numpy as np
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.runtime import (
    inference_service,
    model_manager,
)
from app.pipeline.preprocessor import (
    PreprocessingConfig,
    PreprocessingError,
    Preprocessor,
)
from app.pipeline.video_loader import VideoLoader, VideoLoaderError
from app.pipeline.rtsp_loader import (
    InvalidRTSPUrlError,
    RTSPConnectionError,
    RTSPError,
    RTSPReadError,
    RTSPStream,
)
from app.tracking.config import TrackerConfig
from app.tracking.tracker import ByteTrackerWrapper, ByteTrackerError
from app.tracking.session_store import tracker_session_store


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/tracking",
    tags=["Tracking"],
)


# ---------------------------------------------------------------------------
# Helpers shared with /api/inference (local duplicates to avoid coupling)
# ---------------------------------------------------------------------------

def _get_model_input_size(model_name: str) -> tuple[int, int]:
    """Return preferred (width, height) for a model, defaulting to 640×640."""
    try:
        engine = model_manager.get_model(model_name)
        if getattr(engine, "input_size", None):
            return engine.input_size
    except Exception:
        pass
    return (640, 640)


def _create_preprocessor(target_width: int = 640, target_height: int = 640) -> Preprocessor:
    return Preprocessor(
        PreprocessingConfig(
            target_width=target_width,
            target_height=target_height,
            convert_bgr_to_rgb=True,
            normalize=False,
            scale=1.0 / 255.0,
            channel_first=True,
            add_batch_dimension=True,
        )
    )


def _build_tracker_config(
    activation_threshold: float,
    lost_track_buffer: int,
    matching_threshold: float,
    frame_rate: int,
    min_consecutive_frames: int,
) -> TrackerConfig:
    try:
        return TrackerConfig(
            track_activation_threshold=activation_threshold,
            lost_track_buffer=lost_track_buffer,
            minimum_matching_threshold=matching_threshold,
            frame_rate=frame_rate,
            minimum_consecutive_frames=min_consecutive_frames,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid tracker config: {exc}") from exc


# ---------------------------------------------------------------------------
# POST /api/tracking/video — stateless video upload tracking
# ---------------------------------------------------------------------------

@router.post("/video")
async def video_tracking(
    model_name: str = Form(...),
    file: UploadFile = File(...),
    max_frames: int = Form(300),
    conf_threshold: float = Form(0.25),
    iou_threshold: float = Form(0.45),
    # ByteTracker config params (exposed as form fields with sensible defaults)
    tracker_activation_threshold: float = Form(0.25),
    tracker_lost_track_buffer: int = Form(30),
    tracker_matching_threshold: float = Form(0.8),
    tracker_frame_rate: int = Form(30),
    tracker_min_consecutive_frames: int = Form(1),
) -> dict:
    """
    Run ByteTrack multi-object tracking on an uploaded video.

    A **fresh** tracker is created per request (stateless).
    Returns per-frame tracked objects with persistent ``track_id`` values.
    """

    # ── Model validation ────────────────────────────────────────────────
    model_name = (model_name or "").strip()
    if not model_name:
        raise HTTPException(status_code=400, detail="model_name is required.")

    # ── File validation ──────────────────────────────────────────────────
    if file is None or not file.filename:
        raise HTTPException(status_code=400, detail="Video file is required.")

    extension = Path(file.filename).suffix.lower()
    if not extension:
        raise HTTPException(status_code=415, detail="Uploaded video must have a file extension.")
    if extension not in settings.allowed_video_extensions:
        raise HTTPException(status_code=415, detail=f"Unsupported video type: {extension}")

    # ── Frame limit ──────────────────────────────────────────────────────
    if not isinstance(max_frames, int) or max_frames < 1 or max_frames > 3000:
        raise HTTPException(status_code=400, detail="max_frames must be between 1 and 3000.")

    # ── Read upload ──────────────────────────────────────────────────────
    try:
        data = await file.read()
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Unable to read uploaded video.") from exc

    if not data:
        raise HTTPException(status_code=400, detail="Uploaded video is empty.")

    max_size = settings.max_upload_size_mb * 1024 * 1024
    if len(data) > max_size:
        raise HTTPException(
            status_code=413,
            detail=f"Uploaded video exceeds the maximum allowed size of {settings.max_upload_size_mb} MB.",
        )

    # ── Tracker config ───────────────────────────────────────────────────
    tracker_config = _build_tracker_config(
        activation_threshold=tracker_activation_threshold,
        lost_track_buffer=tracker_lost_track_buffer,
        matching_threshold=tracker_matching_threshold,
        frame_rate=tracker_frame_rate,
        min_consecutive_frames=tracker_min_consecutive_frames,
    )

    temp_path: Path | None = None

    try:
        # ── Write to temp file ───────────────────────────────────────────
        settings.temp_directory.mkdir(parents=True, exist_ok=True)

        try:
            with tempfile.NamedTemporaryFile(
                dir=settings.temp_directory,
                suffix=extension,
                prefix="track_",
                delete=False,
            ) as tmp:
                tmp.write(data)
                tmp.flush()
                temp_path = Path(tmp.name)
        except OSError as exc:
            raise HTTPException(status_code=500, detail="Unable to create temporary video file.") from exc

        if not temp_path.exists() or temp_path.stat().st_size == 0:
            raise HTTPException(status_code=500, detail="Temporary video file could not be created.")

        # ── Per-request tracker ──────────────────────────────────────────
        tracker = ByteTrackerWrapper(tracker_config)

        try:
            tw, th = _get_model_input_size(model_name)
            preprocessor = _create_preprocessor(target_width=tw, target_height=th)
        except Exception as exc:
            raise HTTPException(status_code=500, detail="Could not initialise preprocessor.") from exc

        frame_results: list[dict] = []
        frames_processed = 0

        # ── Open video ───────────────────────────────────────────────────
        with VideoLoader(temp_path) as video:
            try:
                metadata = video.get_metadata()
            except VideoLoaderError as exc:
                raise HTTPException(status_code=400, detail=str(exc)) from exc

            while frames_processed < max_frames:
                try:
                    success, frame = video.read_frame()
                except VideoLoaderError as exc:
                    raise HTTPException(status_code=400, detail=str(exc)) from exc
                except Exception as exc:
                    raise HTTPException(
                        status_code=500,
                        detail="Unexpected error while reading video frame.",
                    ) from exc

                if not success or frame is None:
                    break

                if not isinstance(frame, np.ndarray) or frame.size == 0:
                    raise HTTPException(status_code=500, detail="VideoLoader returned an invalid frame.")

                if frame.ndim != 3 or frame.shape[2] != 3:
                    raise HTTPException(status_code=400, detail="Video frame must be a 3-channel color image.")

                # ── Preprocess ───────────────────────────────────────────
                try:
                    tensor = preprocessor.process(frame)
                except PreprocessingError as exc:
                    raise HTTPException(status_code=400, detail=str(exc)) from exc

                # ── Detect ───────────────────────────────────────────────
                orig_h, orig_w = frame.shape[:2]
                try:
                    inference_result = inference_service.predict(
                        model_name=model_name,
                        input_data=tensor,
                        postprocess=True,
                        conf_threshold=conf_threshold,
                        iou_threshold=iou_threshold,
                        original_image_size=(orig_w, orig_h),
                    )
                except KeyError as exc:
                    raise HTTPException(status_code=404, detail=str(exc)) from exc
                except Exception as exc:
                    raise HTTPException(status_code=500, detail="Video frame inference failed.") from exc

                raw_detections: list[dict] = inference_result.get("detections", [])

                # ── Track ─────────────────────────────────────────────────
                try:
                    tracked_objects = tracker.update(
                        detections=raw_detections,
                        frame_resolution=(orig_w, orig_h),
                    )
                except ByteTrackerError as exc:
                    raise HTTPException(status_code=500, detail=str(exc)) from exc

                frame_results.append(
                    {
                        "frame_index": frames_processed,
                        "tracked_objects": [t.to_dict() for t in tracked_objects],
                        "detections_count": len(raw_detections),
                        "tracks_count": len(tracked_objects),
                    }
                )

                frames_processed += 1

        return {
            "model_name": model_name,
            "status": "success",
            "video": metadata,
            "frames_requested": max_frames,
            "frames_processed": frames_processed,
            "tracker_config": {
                "track_activation_threshold": tracker_config.track_activation_threshold,
                "lost_track_buffer": tracker_config.lost_track_buffer,
                "minimum_matching_threshold": tracker_config.minimum_matching_threshold,
                "frame_rate": tracker_config.frame_rate,
                "minimum_consecutive_frames": tracker_config.minimum_consecutive_frames,
            },
            "results": frame_results,
        }

    except HTTPException:
        raise

    except VideoLoaderError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    except Exception as exc:
        logger.exception("Unexpected error in video tracking.")
        raise HTTPException(status_code=500, detail="Video tracking failed.") from exc

    finally:
        if temp_path is not None:
            try:
                if temp_path.exists():
                    temp_path.unlink()
            except OSError:
                pass


# ---------------------------------------------------------------------------
# POST /api/tracking/rtsp — stateful RTSP tracking
# ---------------------------------------------------------------------------

@router.post("/rtsp")
async def rtsp_tracking(
    model_name: str = Form(...),
    rtsp_url: str = Form(...),
    camera_id: str = Form(...),
    max_frames: int = Form(5),
    conf_threshold: float = Form(0.25),
    iou_threshold: float = Form(0.45),
    # ByteTracker config (only applied when creating a NEW session for camera_id)
    tracker_activation_threshold: float = Form(0.25),
    tracker_lost_track_buffer: int = Form(30),
    tracker_matching_threshold: float = Form(0.8),
    tracker_frame_rate: int = Form(30),
    tracker_min_consecutive_frames: int = Form(1),
) -> dict:
    """
    Run ByteTrack tracking on a live RTSP stream.

    The tracker is **stateful**: track IDs persist across multiple requests
    for the same ``camera_id``.  Use ``DELETE /api/tracking/rtsp/{camera_id}``
    to explicitly reset track state.

    Processes a bounded number of frames per call (``max_frames``) to prevent
    unbounded HTTP requests.
    """

    # ── Validation ───────────────────────────────────────────────────────
    model_name = (model_name or "").strip()
    if not model_name:
        raise HTTPException(status_code=400, detail="model_name is required.")

    rtsp_url = (rtsp_url or "").strip()
    if not rtsp_url:
        raise HTTPException(status_code=400, detail="rtsp_url is required.")
    if not rtsp_url.lower().startswith("rtsp://"):
        raise HTTPException(status_code=400, detail="rtsp_url must start with rtsp://")

    camera_id = (camera_id or "").strip()
    if not camera_id:
        raise HTTPException(status_code=400, detail="camera_id is required.")

    if not isinstance(max_frames, int) or max_frames < 1 or max_frames > 100:
        raise HTTPException(status_code=400, detail="max_frames must be between 1 and 100.")

    # ── Tracker config (only used if this is a new session) ──────────────
    tracker_config = _build_tracker_config(
        activation_threshold=tracker_activation_threshold,
        lost_track_buffer=tracker_lost_track_buffer,
        matching_threshold=tracker_matching_threshold,
        frame_rate=tracker_frame_rate,
        min_consecutive_frames=tracker_min_consecutive_frames,
    )

    # ── Retrieve / create per-camera tracker ─────────────────────────────
    try:
        tracker = tracker_session_store.get_or_create(camera_id, config=tracker_config)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    stream: RTSPStream | None = None

    try:
        # ── RTSP connection ───────────────────────────────────────────────
        try:
            stream = RTSPStream(
                rtsp_url=rtsp_url,
                reconnect_attempts=3,
                reconnect_delay_seconds=1.0,
                connection_timeout_ms=5000,
                read_timeout_ms=5000,
            )
        except (InvalidRTSPUrlError, ValueError) as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        try:
            stream.connect()
        except RTSPConnectionError as exc:
            raise HTTPException(status_code=503, detail=f"Unable to connect to RTSP stream: {exc}") from exc

        # ── Preprocessor ─────────────────────────────────────────────────
        try:
            tw, th = _get_model_input_size(model_name)
            preprocessor = _create_preprocessor(target_width=tw, target_height=th)
        except Exception as exc:
            raise HTTPException(status_code=500, detail="Unable to initialise RTSP preprocessor.") from exc

        frame_results: list[dict] = []
        frames_processed = 0
        reconnect_count = 0

        # ── Bounded frame loop ────────────────────────────────────────────
        while frames_processed < max_frames:
            try:
                frame = stream.read_frame()
            except RTSPReadError as exc:
                reconnect_count += 1
                if reconnect_count > 1:
                    raise HTTPException(
                        status_code=503,
                        detail="RTSP frame read failed after reconnection attempt.",
                    ) from exc
                try:
                    reconnected = stream.reconnect()
                except RTSPError as reconnect_exc:
                    raise HTTPException(
                        status_code=503,
                        detail=f"RTSP stream disconnected and reconnection failed: {reconnect_exc}",
                    ) from reconnect_exc
                if not reconnected:
                    raise HTTPException(status_code=503, detail="RTSP stream disconnected and reconnection failed.")
                continue

            if frame is None:
                break

            if not isinstance(frame, np.ndarray) or frame.size == 0:
                raise HTTPException(status_code=500, detail="RTSP stream returned an invalid frame.")

            if frame.ndim != 3 or frame.shape[2] != 3:
                raise HTTPException(status_code=400, detail="RTSP frame must be a 3-channel color image.")

            # ── Preprocess ───────────────────────────────────────────────
            try:
                tensor = preprocessor.process(frame)
            except PreprocessingError as exc:
                raise HTTPException(status_code=400, detail=str(exc)) from exc

            # ── Detect ───────────────────────────────────────────────────
            orig_h, orig_w = frame.shape[:2]
            try:
                inference_result = inference_service.predict(
                    model_name=model_name,
                    input_data=tensor,
                    postprocess=True,
                    conf_threshold=conf_threshold,
                    iou_threshold=iou_threshold,
                    original_image_size=(orig_w, orig_h),
                )
            except KeyError as exc:
                raise HTTPException(status_code=404, detail=str(exc)) from exc
            except Exception as exc:
                raise HTTPException(status_code=500, detail="RTSP frame inference failed.") from exc

            raw_detections: list[dict] = inference_result.get("detections", [])

            # ── Track ─────────────────────────────────────────────────────
            try:
                tracked_objects = tracker.update(
                    detections=raw_detections,
                    frame_resolution=(orig_w, orig_h),
                )
            except ByteTrackerError as exc:
                raise HTTPException(status_code=500, detail=str(exc)) from exc

            # Record touch so session store stats are accurate
            tracker_session_store.touch(camera_id)

            frame_results.append(
                {
                    "frame_index": frames_processed,
                    "tracked_objects": [t.to_dict() for t in tracked_objects],
                    "detections_count": len(raw_detections),
                    "tracks_count": len(tracked_objects),
                }
            )

            frames_processed += 1

        return {
            "model_name": model_name,
            "status": "success",
            "camera_id": camera_id,
            "rtsp_url": rtsp_url,
            "frames_requested": max_frames,
            "frames_processed": frames_processed,
            "tracker_frame_index": tracker.frame_index,
            "results": frame_results,
        }

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception("Unexpected error in RTSP tracking | camera_id=%s", camera_id)
        raise HTTPException(status_code=500, detail="RTSP tracking failed.") from exc

    finally:
        if stream is not None:
            try:
                stream.disconnect()
            except Exception:
                pass


# ---------------------------------------------------------------------------
# GET /api/tracking/rtsp/sessions — list active tracker sessions
# ---------------------------------------------------------------------------

@router.get("/rtsp/sessions")
async def list_rtsp_sessions() -> dict:
    """List all active per-camera ByteTracker sessions."""
    sessions = tracker_session_store.list_sessions()
    return {
        "status": "success",
        "session_count": len(sessions),
        "sessions": sessions,
    }


# ---------------------------------------------------------------------------
# DELETE /api/tracking/rtsp/{camera_id} — reset a specific tracker session
# ---------------------------------------------------------------------------

@router.delete("/rtsp/{camera_id}")
async def reset_rtsp_session(camera_id: str) -> dict:
    """
    Reset and remove the ByteTracker session for the given ``camera_id``.

    After this call, the next request with the same ``camera_id`` will start
    with a fresh tracker and track IDs will restart from 1.
    """
    camera_id = (camera_id or "").strip()
    if not camera_id:
        raise HTTPException(status_code=400, detail="camera_id cannot be empty.")

    removed = tracker_session_store.reset(camera_id)

    if not removed:
        raise HTTPException(
            status_code=404,
            detail=f"No active tracker session found for camera_id='{camera_id}'.",
        )

    return {
        "status": "success",
        "message": f"Tracker session for camera_id='{camera_id}' has been reset.",
    }
