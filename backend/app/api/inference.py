from __future__ import annotations

import asyncio
from pathlib import Path
import tempfile
from typing import Any

import cv2
import numpy as np
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.core.config import settings
from app.core.runtime import (
    inference_service,
    model_manager,
    resource_manager,
)
from app.pipeline.preprocessor import (
    PreprocessingConfig,
    PreprocessingError,
)
from app.pipeline.video_loader import (
    VideoLoader,
    VideoLoaderError,
)
from app.pipeline.rtsp_loader import (
    InvalidRTSPUrlError,
    RTSPConnectionError,
    RTSPError,
    RTSPReadError,
    RTSPStream,
)


router = APIRouter(
    prefix="/api/inference",
    tags=["Inference"],
)


def get_model_input_size(model_name: str) -> tuple[int, int]:
    """
    Get the preferred (width, height) resolution for a model.
    Defaults to (640, 640) for YOLO models or uses model metadata.
    """
    try:
        engine = model_manager.get_model(model_name)
        if getattr(engine, "input_size", None):
            return engine.input_size
    except Exception:
        pass
    return (640, 640)


def create_preprocessor(target_width: int = 640, target_height: int = 640):
    """
    Create the preprocessing pipeline with model-specific input resolution.
    """

    from app.pipeline.preprocessor import Preprocessor

    config = PreprocessingConfig(
        target_width=target_width,
        target_height=target_height,
        convert_bgr_to_rgb=True,
        normalize=False,
        scale=1.0 / 255.0,
        channel_first=True,
        add_batch_dimension=True,
    )

    return Preprocessor(config)


@router.get("/status")
async def inference_status() -> dict:
    """Return inference service and resource status."""

    try:
        return {
            "status": "ready",
            "resource_manager": resource_manager.get_status(),
            "models": model_manager.get_status(),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve inference service status.",
        ) from exc


@router.post("/image")
async def image_inference(
    model_name: str = Form(...),
    file: UploadFile = File(...),
    conf_threshold: float = Form(0.25),
    iou_threshold: float = Form(0.45),
    postprocess: bool = Form(True),
) -> dict:
    """Run inference on a single uploaded image."""

    # -------------------------
    # Model validation
    # -------------------------

    if not isinstance(model_name, str):
        raise HTTPException(
            status_code=400,
            detail="model_name must be a string.",
        )

    model_name = model_name.strip()

    if not model_name:
        raise HTTPException(
            status_code=400,
            detail="model_name is required.",
        )

    # -------------------------
    # File validation
    # -------------------------

    if file is None:
        raise HTTPException(
            status_code=400,
            detail="Image file is required.",
        )

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="A filename is required.",
        )

    extension = Path(file.filename).suffix.lower()

    if not extension:
        raise HTTPException(
            status_code=415,
            detail="Uploaded image must have a file extension.",
        )

    if extension not in settings.allowed_image_extensions:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported image type: {extension}",
        )

    # -------------------------
    # Read upload
    # -------------------------

    try:
        data = await file.read()

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="Unable to read uploaded image.",
        ) from exc

    if not data:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty.",
        )

    # -------------------------
    # Size validation
    # -------------------------

    max_size = settings.max_upload_size_mb * 1024 * 1024

    if len(data) > max_size:
        raise HTTPException(
            status_code=413,
            detail=(
                "Uploaded image exceeds the maximum allowed size "
                f"of {settings.max_upload_size_mb} MB."
            ),
        )

    # -------------------------
    # Decode image
    # -------------------------

    try:
        image_array = np.frombuffer(
            data,
            dtype=np.uint8,
        )

        if image_array.size == 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded image contains no data.",
            )

        frame = cv2.imdecode(
            image_array,
            cv2.IMREAD_COLOR,
        )

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="Unable to decode uploaded image.",
        ) from exc

    if frame is None:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not a valid image.",
        )

    if not isinstance(frame, np.ndarray):
        raise HTTPException(
            status_code=400,
            detail="Decoded image is not a valid NumPy array.",
        )

    if frame.size == 0:
        raise HTTPException(
            status_code=400,
            detail="Decoded image is empty.",
        )

    if frame.ndim != 3 or frame.shape[2] != 3:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image must be a 3-channel color image.",
        )

    # -------------------------
    # Preprocessing + inference
    # -------------------------

    try:
        tw, th = get_model_input_size(model_name)
        preprocessor = create_preprocessor(target_width=tw, target_height=th)

        tensor = preprocessor.process(frame)

        orig_h, orig_w = frame.shape[:2]

        return inference_service.predict(
            model_name=model_name,
            input_data=tensor,
            postprocess=postprocess,
            conf_threshold=conf_threshold,
            iou_threshold=iou_threshold,
            original_image_size=(orig_w, orig_h),
        )

    except PreprocessingError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except KeyError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Image inference failed.",
        ) from exc


# ---------------------------------------------------------------------------
# Helpers – video-level aggregation
# ---------------------------------------------------------------------------


def _aggregate_video_detections(
    frame_results: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Produce a video-level threat summary from per-frame detection results.

    Returns:
        total_detections   – sum of all bounding boxes across all frames
        frames_with_detections – number of frames that had ≥1 detection
        unique_classes     – sorted list of distinct class names detected
        peak_confidence    – highest single-detection confidence in the clip
        class_counts       – {class_name: total_count} across all frames
        threat_detected    – True when any detection was found
    """
    total_detections = 0
    frames_with_detections = 0
    class_counts: dict[str, int] = {}
    peak_confidence = 0.0

    for frame in frame_results:
        inference = frame.get("inference", {})
        detections: list[dict[str, Any]] = inference.get("detections", [])

        if detections:
            frames_with_detections += 1
            total_detections += len(detections)

            for det in detections:
                cls = det.get("class_name") or "unknown"
                class_counts[cls] = class_counts.get(cls, 0) + 1

                conf = det.get("confidence", 0.0)
                if isinstance(conf, (int, float)) and conf > peak_confidence:
                    peak_confidence = float(conf)

    return {
        "total_detections": total_detections,
        "frames_with_detections": frames_with_detections,
        "unique_classes": sorted(class_counts.keys()),
        "peak_confidence": round(peak_confidence, 4),
        "class_counts": class_counts,
        "threat_detected": total_detections > 0,
    }


# ---------------------------------------------------------------------------
# Video inference – blocking worker (runs in a thread)
# ---------------------------------------------------------------------------


def _run_video_inference_sync(
    temp_path: Path,
    model_name: str,
    max_frames: int,
    frame_skip: int,
    conf_threshold: float,
    iou_threshold: float,
    postprocess: bool,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """
    Blocking video inference worker.

    Opens the video, samples frames according to *frame_skip*, runs
    preprocessing + ONNX inference on each sampled frame, and returns
    ``(metadata, frame_results)``.

    Raises VideoLoaderError / HTTPException on failure.
    """

    with VideoLoader(temp_path) as video:

        try:
            metadata = video.get_metadata()
        except VideoLoaderError as exc:
            raise HTTPException(
                status_code=400,
                detail=str(exc),
            ) from exc

        tw, th = get_model_input_size(model_name)
        preprocessor = create_preprocessor(target_width=tw, target_height=th)

        frame_results: list[dict[str, Any]] = []
        frames_read = 0        # total frames read from the file
        frames_processed = 0   # frames actually sent through inference

        while frames_processed < max_frames:

            # -------------------------
            # Read next frame
            # -------------------------

            try:
                success, frame = video.read_frame()
            except VideoLoaderError as exc:
                raise HTTPException(
                    status_code=400,
                    detail=str(exc),
                ) from exc
            except Exception as exc:
                raise HTTPException(
                    status_code=500,
                    detail="Unexpected error while reading video frame.",
                ) from exc

            if not success or frame is None:
                break  # end-of-stream

            frames_read += 1

            # -------------------------
            # Frame sampling
            # -------------------------
            # frame_skip=1 → every frame
            # frame_skip=2 → every other frame
            # frame_skip=N → one in every N frames

            if (frames_read - 1) % frame_skip != 0:
                continue

            # -------------------------
            # Frame validation
            # -------------------------

            if not isinstance(frame, np.ndarray):
                raise HTTPException(
                    status_code=500,
                    detail="VideoLoader returned an invalid frame type.",
                )

            if frame.size == 0:
                raise HTTPException(
                    status_code=400,
                    detail="VideoLoader returned an empty frame.",
                )

            if frame.ndim != 3 or frame.shape[2] != 3:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "VideoLoader returned a frame that is "
                        "not a 3-channel color image."
                    ),
                )

            # -------------------------
            # Preprocessing
            # -------------------------

            try:
                tensor = preprocessor.process(frame)
            except PreprocessingError as exc:
                raise HTTPException(
                    status_code=400,
                    detail=str(exc),
                ) from exc
            except Exception as exc:
                raise HTTPException(
                    status_code=500,
                    detail="Video frame preprocessing failed.",
                ) from exc

            # -------------------------
            # Inference
            # -------------------------

            try:
                orig_h, orig_w = frame.shape[:2]

                result = inference_service.predict(
                    model_name=model_name,
                    input_data=tensor,
                    postprocess=postprocess,
                    conf_threshold=conf_threshold,
                    iou_threshold=iou_threshold,
                    original_image_size=(orig_w, orig_h),
                )
            except KeyError as exc:
                raise HTTPException(
                    status_code=404,
                    detail=str(exc),
                ) from exc
            except Exception as exc:
                raise HTTPException(
                    status_code=500,
                    detail="Video frame inference failed.",
                ) from exc

            frame_results.append(
                {
                    "frame_index": frames_read - 1,   # original 0-based index in file
                    "sampled_index": frames_processed, # 0-based index among sampled frames
                    "inference": result,
                }
            )

            frames_processed += 1

    return metadata, frame_results


# ---------------------------------------------------------------------------
# /api/inference/video endpoint
# ---------------------------------------------------------------------------


@router.post("/video")
async def video_inference(
    model_name: str = Form(...),
    file: UploadFile = File(...),
    max_frames: int = Form(30),
    frame_skip: int = Form(1),
    conf_threshold: float = Form(0.25),
    iou_threshold: float = Form(0.45),
    postprocess: bool = Form(True),
) -> dict:
    """
    Run bounded inference on frames sampled from an uploaded video.

    Parameters
    ----------
    model_name     : Name of a loaded ONNX model.
    file           : Video file (mp4 / avi / mov / mkv / webm).
    max_frames     : Maximum number of frames to run inference on (1-300).
    frame_skip     : Sample one frame every *frame_skip* frames (1 = every
                     frame, 2 = every other frame, etc.).  Useful for long
                     videos where processing every frame is unnecessary.
    conf_threshold : Minimum detection confidence (0-1).
    iou_threshold  : NMS IoU threshold (0-1).
    postprocess    : Whether to run NMS / bbox decoding.

    Returns
    -------
    A JSON object containing:
    - ``video``             – video metadata (fps, dimensions, duration …)
    - ``frames_requested``  – max_frames param
    - ``frames_processed``  – actual frames that went through inference
    - ``frame_skip``        – the sampling interval used
    - ``results``           – per-frame inference results
    - ``summary``           – video-level aggregated threat summary
    """

    # -------------------------
    # Model validation
    # -------------------------

    if not isinstance(model_name, str):
        raise HTTPException(
            status_code=400,
            detail="model_name must be a string.",
        )

    model_name = model_name.strip()

    if not model_name:
        raise HTTPException(
            status_code=400,
            detail="model_name is required.",
        )

    # -------------------------
    # File validation
    # -------------------------

    if file is None:
        raise HTTPException(
            status_code=400,
            detail="Video file is required.",
        )

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="A filename is required.",
        )

    # -------------------------
    # Frame limit validation
    # -------------------------

    if not isinstance(max_frames, int):
        raise HTTPException(
            status_code=400,
            detail="max_frames must be an integer.",
        )

    if max_frames < 1 or max_frames > 300:
        raise HTTPException(
            status_code=400,
            detail="max_frames must be between 1 and 300.",
        )

    # -------------------------
    # Frame-skip validation
    # -------------------------

    if not isinstance(frame_skip, int):
        raise HTTPException(
            status_code=400,
            detail="frame_skip must be an integer.",
        )

    if frame_skip < 1 or frame_skip > 120:
        raise HTTPException(
            status_code=400,
            detail="frame_skip must be between 1 and 120.",
        )

    # -------------------------
    # Extension validation
    # -------------------------

    extension = Path(file.filename).suffix.lower()

    if not extension:
        raise HTTPException(
            status_code=415,
            detail="Uploaded video must have a file extension.",
        )

    if extension not in settings.allowed_video_extensions:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported video type: {extension}",
        )

    # -------------------------
    # Read upload
    # -------------------------

    try:
        data = await file.read()

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="Unable to read uploaded video.",
        ) from exc

    if not data:
        raise HTTPException(
            status_code=400,
            detail="Uploaded video is empty.",
        )

    # -------------------------
    # Size validation
    # -------------------------

    max_size = settings.max_upload_size_mb * 1024 * 1024

    if len(data) > max_size:
        raise HTTPException(
            status_code=413,
            detail=(
                "Uploaded video exceeds the maximum allowed size "
                f"of {settings.max_upload_size_mb} MB."
            ),
        )

    temp_path = None

    try:
        # -------------------------
        # Temporary directory
        # -------------------------

        try:
            settings.temp_directory.mkdir(
                parents=True,
                exist_ok=True,
            )

        except OSError as exc:
            raise HTTPException(
                status_code=500,
                detail="Unable to create temporary directory.",
            ) from exc

        # -------------------------
        # Write upload to a unique temp file
        # -------------------------

        try:
            with tempfile.NamedTemporaryFile(
                dir=settings.temp_directory,
                suffix=extension,
                prefix="upload_",
                delete=False,
            ) as temp_file:

                temp_file.write(data)
                temp_file.flush()

                temp_path = Path(temp_file.name)

        except OSError as exc:
            raise HTTPException(
                status_code=500,
                detail="Unable to create temporary video file.",
            ) from exc

        # -------------------------
        # Temporary file validation
        # -------------------------

        if not temp_path.exists():
            raise HTTPException(
                status_code=500,
                detail="Temporary video file could not be created.",
            )

        if not temp_path.is_file():
            raise HTTPException(
                status_code=500,
                detail="Temporary video path is not a file.",
            )

        if temp_path.stat().st_size == 0:
            raise HTTPException(
                status_code=400,
                detail="Temporary video file is empty.",
            )

        # -------------------------
        # Run blocking inference in a thread pool
        # so the async event loop is not blocked.
        # -------------------------

        try:
            metadata, frame_results = await asyncio.to_thread(
                _run_video_inference_sync,
                temp_path,
                model_name,
                max_frames,
                frame_skip,
                conf_threshold,
                iou_threshold,
                postprocess,
            )

        except HTTPException:
            raise

        except VideoLoaderError as exc:
            raise HTTPException(
                status_code=400,
                detail=str(exc),
            ) from exc

        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail="Video inference failed.",
            ) from exc

        # -------------------------
        # Aggregate threat summary
        # -------------------------

        summary = _aggregate_video_detections(frame_results)

        # -------------------------
        # Video response
        # -------------------------

        return {
            "model_name": model_name,
            "status": "success",
            "video": metadata,
            "frames_requested": max_frames,
            "frames_processed": len(frame_results),
            "frame_skip": frame_skip,
            "summary": summary,
            "results": frame_results,
        }

    except HTTPException:
        raise

    except VideoLoaderError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Video inference failed.",
        ) from exc

    finally:
        # -------------------------
        # Always cleanup temp file
        # -------------------------

        if temp_path is not None:

            try:
                if temp_path.exists():
                    temp_path.unlink()

            except OSError:
                pass


@router.post("/rtsp")
async def rtsp_inference(
    model_name: str = Form(...),
    rtsp_url: str = Form(...),
    max_frames: int = Form(5),
    conf_threshold: float = Form(0.25),
    iou_threshold: float = Form(0.45),
    postprocess: bool = Form(True),
) -> dict:
    """
    Run bounded inference on an RTSP CCTV stream.

    The endpoint processes a limited number of frames per request
    to prevent an unbounded HTTP request from running forever.
    """

    # -------------------------
    # Model validation
    # -------------------------

    if not isinstance(model_name, str):
        raise HTTPException(
            status_code=400,
            detail="model_name must be a string.",
        )

    model_name = model_name.strip()

    if not model_name:
        raise HTTPException(
            status_code=400,
            detail="model_name is required.",
        )

    # -------------------------
    # RTSP URL validation
    # -------------------------

    if not isinstance(rtsp_url, str):
        raise HTTPException(
            status_code=400,
            detail="rtsp_url must be a string.",
        )

    rtsp_url = rtsp_url.strip()

    if not rtsp_url:
        raise HTTPException(
            status_code=400,
            detail="rtsp_url is required.",
        )

    if not rtsp_url.lower().startswith("rtsp://"):
        raise HTTPException(
            status_code=400,
            detail="rtsp_url must start with rtsp://",
        )

    # -------------------------
    # Frame limit validation
    # -------------------------

    if not isinstance(max_frames, int):
        raise HTTPException(
            status_code=400,
            detail="max_frames must be an integer.",
        )

    if max_frames < 1 or max_frames > 100:
        raise HTTPException(
            status_code=400,
            detail="max_frames must be between 1 and 100.",
        )

    stream = None

    try:
        # -------------------------
        # Create RTSP stream
        # -------------------------

        try:
            stream = RTSPStream(
                rtsp_url=rtsp_url,
                reconnect_attempts=3,
                reconnect_delay_seconds=1.0,
                connection_timeout_ms=5000,
                read_timeout_ms=5000,
            )

        except InvalidRTSPUrlError as exc:
            raise HTTPException(
                status_code=400,
                detail=str(exc),
            ) from exc

        except ValueError as exc:
            raise HTTPException(
                status_code=400,
                detail=str(exc),
            ) from exc

        # -------------------------
        # Connect
        # -------------------------

        try:
            stream.connect()

        except RTSPConnectionError as exc:
            raise HTTPException(
                status_code=503,
                detail=f"Unable to connect to RTSP stream: {exc}",
            ) from exc

        # -------------------------
        # Preprocessor
        # -------------------------

        try:
            tw, th = get_model_input_size(model_name)
            preprocessor = create_preprocessor(target_width=tw, target_height=th)

        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail="Unable to initialize RTSP preprocessor.",
            ) from exc

        frame_results = []
        frames_processed = 0
        reconnect_count = 0

        # -------------------------
        # Bounded RTSP loop
        # -------------------------

        while frames_processed < max_frames:

            try:
                frame = stream.read_frame()

            except RTSPReadError as exc:

                reconnect_count += 1

                if reconnect_count > 1:
                    raise HTTPException(
                        status_code=503,
                        detail=(
                            "RTSP frame read failed after "
                            "reconnection attempt."
                        ),
                    ) from exc

                try:
                    reconnected = stream.reconnect()

                except RTSPError as reconnect_exc:
                    raise HTTPException(
                        status_code=503,
                        detail=(
                            "RTSP stream disconnected and "
                            f"reconnection failed: {reconnect_exc}"
                        ),
                    ) from reconnect_exc

                if not reconnected:
                    raise HTTPException(
                        status_code=503,
                        detail=(
                            "RTSP stream disconnected and "
                            "reconnection failed."
                        ),
                    )

                continue

            except RTSPConnectionError as exc:
                raise HTTPException(
                    status_code=503,
                    detail=str(exc),
                ) from exc

            except RTSPError as exc:
                raise HTTPException(
                    status_code=503,
                    detail=str(exc),
                ) from exc

            except Exception as exc:
                raise HTTPException(
                    status_code=500,
                    detail="Unexpected RTSP frame-read error.",
                ) from exc

            # -------------------------
            # Frame validation
            # -------------------------

            if frame is None:
                raise HTTPException(
                    status_code=503,
                    detail="RTSP stream returned no frame.",
                )

            if not isinstance(frame, np.ndarray):
                raise HTTPException(
                    status_code=500,
                    detail="RTSP loader returned an invalid frame type.",
                )

            if frame.size == 0:
                raise HTTPException(
                    status_code=400,
                    detail="RTSP stream returned an empty frame.",
                )

            if frame.ndim != 3 or frame.shape[2] != 3:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "RTSP stream returned a frame that is "
                        "not a 3-channel color image."
                    ),
                )

            # -------------------------
            # Preprocessing
            # -------------------------

            try:
                tensor = preprocessor.process(frame)

            except PreprocessingError as exc:
                raise HTTPException(
                    status_code=400,
                    detail=str(exc),
                ) from exc

            except Exception as exc:
                raise HTTPException(
                    status_code=500,
                    detail="RTSP frame preprocessing failed.",
                ) from exc

            # -------------------------
            # Inference
            # -------------------------

            try:
                orig_h, orig_w = frame.shape[:2]

                result = inference_service.predict(
                    model_name=model_name,
                    input_data=tensor,
                    postprocess=postprocess,
                    conf_threshold=conf_threshold,
                    iou_threshold=iou_threshold,
                    original_image_size=(orig_w, orig_h),
                )

            except KeyError as exc:
                raise HTTPException(
                    status_code=404,
                    detail=str(exc),
                ) from exc

            except Exception as exc:
                raise HTTPException(
                    status_code=500,
                    detail="RTSP frame inference failed.",
                ) from exc

            # -------------------------
            # Store result
            # -------------------------

            frame_results.append(
                {
                    "frame_index": frames_processed,
                    "inference": result,
                }
            )

            frames_processed += 1

        # -------------------------
        # Success response
        # -------------------------

        return {
            "model_name": model_name,
            "status": "success",
            "stream": {
                "rtsp_url_configured": True,
                "frames_requested": max_frames,
                "frames_processed": frames_processed,
                "reconnects": reconnect_count,
            },
            "results": frame_results,
        }

    except HTTPException:
        raise

    except RTSPError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="RTSP inference failed.",
        ) from exc

    finally:
        # -------------------------
        # Always release RTSP resource
        # -------------------------

        if stream is not None:

            try:
                stream.release()

            except Exception:
                pass
