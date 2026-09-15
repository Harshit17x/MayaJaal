from __future__ import annotations

import base64
import logging
from pathlib import Path
import tempfile
import uuid
from typing import Any, Dict, List, Optional

import cv2
from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse, Response
import numpy as np
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.runtime import inference_service, model_manager
from app.pipeline.preprocessor import PreprocessingConfig, Preprocessor
from app.pipeline.video_loader import VideoLoader, VideoLoaderError
from app.tracking.annotator import convert_video_to_h264
from app.pipeline.thermal_fusion_service import (
    FusedTarget,
    RadiometricCalibration,
    ThermalPalette,
    thermal_fusion_service,
)

logger = logging.getLogger("SIH26187.ThermalAPI")

router = APIRouter(
    prefix="/api/thermal",
    tags=["Thermal & Dual-Spectrum"],
)


class PaletteInfo(BaseModel):
    id: str
    name: str
    description: str
    military_role: str
    icon: str


AVAILABLE_PALETTES: List[PaletteInfo] = [
    PaletteInfo(
        id="standard",
        name="Optical 4K (Daylight)",
        description="Standard natural color visible spectrum (RGB).",
        military_role="Daylight visual identification, facial biometrics & license plates",
        icon="Sun",
    ),
    PaletteInfo(
        id="ironbow",
        name="Ironbow (Radiometric FLIR)",
        description="High-contrast false color thermal mapping (Deep Violet to Yellow/White).",
        military_role="Perimeter heat signature spotting, vehicle engine detection & fever/core screening",
        icon="Flame",
    ),
    PaletteInfo(
        id="white_hot",
        name="White Hot (Tactical FLIR)",
        description="Linear grayscale thermal map where warmer objects appear white/light grey.",
        military_role="Standard military scout thermal, long-distance target acquisition",
        icon="Eye",
    ),
    PaletteInfo(
        id="black_hot",
        name="Black Hot (Inverted FLIR)",
        description="Inverted grayscale thermal map where warm bodies appear dark black against cool terrain.",
        military_role="Sniper & QRT target silhouette recognition against bright skylines / sand",
        icon="Moon",
    ),
    PaletteInfo(
        id="nvg_green",
        name="NVG Green Phosphor (P43)",
        description="530nm tactical night vision goggles phosphor green simulation with dynamic contrast.",
        military_role="Low-light movement tracking, fence wire inspection in pitch darkness",
        icon="ShieldAlert",
    ),
    PaletteInfo(
        id="amber",
        name="Tactical Amber Phosphor",
        description="High-contrast warm amber phosphor display engineered to reduce operator eye fatigue.",
        military_role="Continuous 24/7 Tactical Operations Center (TOC) surveillance shifts",
        icon="Sparkles",
    ),
    PaletteInfo(
        id="msx_fusion",
        name="FLIR MSX Dual-Spectrum Fusion",
        description="Dynamic detail fusion superimposing optical high-frequency contours directly onto thermal heatmaps.",
        military_role="Instant situational context: identifies barbed wire, vehicle badges & concealed faces",
        icon="Layers",
    ),
]


def _decode_image_upload(file_bytes: bytes, filename: str) -> np.ndarray:
    """Safely decodes an uploaded image buffer to a BGR numpy array."""
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Empty file uploaded: {filename}",
        )
    nparr = np.frombuffer(file_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to decode image file: {filename}. Supported formats: JPEG, PNG, WEBP.",
        )
    return img_bgr


def _run_detection_if_model_loaded(
    img_bgr: np.ndarray,
    model_name: str = "best",
    conf_threshold: float = 0.25,
) -> List[Dict[str, Any]]:
    """Runs threat detection if the ONNX model is available."""
    if not model_manager.is_loaded(model_name):
        return []

    try:
        prep = Preprocessor(
            PreprocessingConfig(
                target_width=640,
                target_height=640,
                convert_bgr_to_rgb=True,
                normalize=False,
                scale=1.0 / 255.0,
                channel_first=True,
                add_batch_dimension=True,
            )
        )
        tensor = prep.process(img_bgr)
        h, w = img_bgr.shape[:2]
        res = inference_service.predict(
            model_name=model_name,
            input_data=tensor,
            postprocess=True,
            conf_threshold=conf_threshold,
            original_image_size=(w, h),
        )
        return res.get("detections", [])
    except Exception as exc:
        logger.warning("Threat detection inference skipped in thermal pipeline: %s", exc)
        return []


@router.get("/palettes", response_model=List[PaletteInfo])
def get_available_palettes() -> List[PaletteInfo]:
    """Returns all supported radiometric thermal and night-vision palettes with tactical metadata."""
    return AVAILABLE_PALETTES


@router.post("/simulate")
async def simulate_thermal(
    file: UploadFile = File(...),
    palette: str = Form("ironbow"),
) -> Response:
    """
    Transforms an optical visible frame into a physically calibrated synthetic FLIR radiometric image.
    Returns JPEG binary.
    """
    contents = await file.read()
    img_bgr = _decode_image_upload(contents, file.filename or "input.jpg")

    # Detect targets for heat blooming
    detections = _run_detection_if_model_loaded(img_bgr)

    # Simulate radiometric thermal
    thermal_img = thermal_fusion_service.simulate_thermal_from_optical(
        img_bgr,
        detections=detections,
        palette=palette,
    )

    # Render thermal HUD
    annotated = thermal_fusion_service.draw_thermal_hud(
        thermal_img,
        palette_name=palette,
    )

    ret, jpeg = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 90])
    if not ret:
        raise HTTPException(status_code=500, detail="Failed to encode simulated thermal image.")

    return Response(content=jpeg.tobytes(), media_type="image/jpeg")


@router.post("/fuse-images")
async def fuse_dual_spectrum_images(
    optical_file: UploadFile = File(...),
    thermal_file: Optional[UploadFile] = File(None),
    palette: str = Form("ironbow"),
    fusion_mode: str = Form("msx"),  # msx | side_by_side | pip | blend
    blend_alpha: float = Form(0.5),
    conf_threshold: float = Form(0.25),
) -> Dict[str, Any]:
    """
    Dual-Spectrum Sensor Fusion endpoint.
    Accepts optical image and optional thermal image.
    If thermal image is omitted, automatically synthesizes a calibrated FLIR thermal counterpart.
    Executes cross-spectral AI target detection, radiometric analysis, and returns composite base64 preview.
    """
    opt_bytes = await optical_file.read()
    opt_bgr = _decode_image_upload(opt_bytes, optical_file.filename or "optical.jpg")

    # Optical detections
    opt_dets = _run_detection_if_model_loaded(opt_bgr, conf_threshold=conf_threshold)

    # Process or synthesize thermal frame
    if thermal_file is not None:
        thm_bytes = await thermal_file.read()
        thm_bgr = _decode_image_upload(thm_bytes, thermal_file.filename or "thermal.jpg")
        # Run detection directly on thermal image
        thm_dets = _run_detection_if_model_loaded(thm_bgr, conf_threshold=conf_threshold)
        thermal_colored = thermal_fusion_service.apply_palette(thm_bgr, palette=palette)
    else:
        # Synthesize thermal from optical
        thermal_colored = thermal_fusion_service.simulate_thermal_from_optical(
            opt_bgr,
            detections=opt_dets,
            palette=palette,
        )
        thm_dets = opt_dets

    # Cross-spectral decision fusion
    fused_targets = thermal_fusion_service.fuse_detections(
        optical_detections=opt_dets,
        thermal_detections=thm_dets,
        thermal_frame=thermal_colored,
    )

    # Apply composition / fusion
    if fusion_mode == "msx":
        fused_frame = thermal_fusion_service.fuse_msx_detail(opt_bgr, thermal_colored)
    elif fusion_mode in ("side_by_side", "pip", "blend"):
        fused_frame = thermal_fusion_service.compose_dual_stream(
            optical_frame=opt_bgr,
            thermal_frame=thermal_colored,
            mode=fusion_mode,
            blend_alpha=blend_alpha,
        )
    else:
        fused_frame = thermal_colored

    # Draw tactical thermal HUD
    annotated = thermal_fusion_service.draw_thermal_hud(
        fused_frame,
        palette_name=palette,
        fused_targets=fused_targets,
    )

    # Encode to base64 for direct frontend rendering
    ret, jpeg = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 85])
    b64_fused = base64.b64encode(jpeg.tobytes()).decode("utf-8") if ret else ""

    h, w = opt_bgr.shape[:2]
    center_temp = thermal_fusion_service.estimate_spot_temperature(thermal_colored, w // 2, h // 2)

    return {
        "status": "success",
        "palette": palette,
        "fusion_mode": fusion_mode,
        "fused_image_base64": f"data:image/jpeg;base64,{b64_fused}",
        "radiometrics": {
            "center_spot_temp_celsius": center_temp,
            "min_ambient_celsius": thermal_fusion_service.calibration.min_temp_celsius,
            "max_target_celsius": thermal_fusion_service.calibration.max_temp_celsius,
        },
        "target_count": len(fused_targets),
        "fused_targets": [t.to_dict() for t in fused_targets],
    }


@router.get("/spot-temp")
def get_spot_temperature(
    intensity: int = Query(..., ge=0, le=255, description="Pixel thermal intensity 0..255"),
) -> Dict[str, Any]:
    """Calculates calibrated Celsius temperature from an 8-bit thermal sensor pixel intensity."""
    c = thermal_fusion_service.calibration
    temp = c.min_temp_celsius + (intensity / 255.0) * (c.max_temp_celsius - c.min_temp_celsius)
    temp = round((temp * c.gain) + c.offset, 1)
    return {
        "intensity": intensity,
        "temp_celsius": temp,
        "classification": "HUMAN_CORE" if 35.0 <= temp <= 39.0 else "VEHICLE_EXHAUST" if temp >= 50.0 else "AMBIENT_COLD",
    }


@router.post("/video")
async def process_thermal_video(
    file: UploadFile = File(...),
    palette: str = Form("ironbow"),
    max_frames: int = Form(300),
    fusion_mode: str = Form("msx"),
    conf_threshold: float = Form(0.25),
    model_name: str = Form("best"),
) -> Dict[str, Any]:
    """
    Transforms an uploaded visible video into a synthetic radiometric FLIR / NVG video sequence (H.264 MP4).
    Applies real-time thermal calibration, heat-bloom synthesis on targets, and tactical thermal HUD.
    """
    if file is None or not file.filename:
        raise HTTPException(status_code=400, detail="Video file is required.")

    extension = Path(file.filename).suffix.lower()
    if not extension or extension not in settings.allowed_video_extensions:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported video type: {extension}. Allowed: {settings.allowed_video_extensions}",
        )

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
            detail=f"Uploaded video exceeds maximum allowed size of {settings.max_upload_size_mb} MB.",
        )

    settings.temp_directory.mkdir(parents=True, exist_ok=True)
    thermal_dir = settings.temp_directory / "thermal_videos"
    thermal_dir.mkdir(parents=True, exist_ok=True)

    session_id = uuid.uuid4().hex[:12]
    temp_input_path = settings.temp_directory / f"thm_in_{session_id}{extension}"
    raw_out_path = settings.temp_directory / f"thm_raw_{session_id}.mp4"
    final_out_path = thermal_dir / f"thermal_{session_id}.mp4"

    try:
        temp_input_path.write_bytes(data)

        # Ensure model is available for heat-blooming
        if not model_manager.is_loaded(model_name):
            cand = settings.model_directory / f"{model_name}.onnx"
            if cand.exists():
                try:
                    model_manager.load_model(model_name, cand)
                except Exception:
                    pass

        writer: cv2.VideoWriter | None = None
        has_written = False
        frames_processed = 0
        total_targets = 0
        frame_results: List[Dict[str, Any]] = []

        with VideoLoader(temp_input_path) as video:
            metadata = video.get_metadata()
            fps = float(metadata.get("fps") or 25.0)
            if fps <= 0 or fps > 120:
                fps = 25.0

            while frames_processed < max_frames:
                success, frame = video.read_frame()
                if not success or frame is None:
                    break

                h, w = frame.shape[:2]
                if writer is None:
                    writer = cv2.VideoWriter(
                        str(raw_out_path),
                        cv2.VideoWriter_fourcc(*"mp4v"),
                        fps,
                        (w, h),
                    )

                # Threat detection for thermal blooming
                dets = _run_detection_if_model_loaded(frame, model_name=model_name, conf_threshold=conf_threshold)

                # Thermal transform
                if palette == "standard":
                    thermal_frame = frame.copy()
                else:
                    thermal_frame = thermal_fusion_service.simulate_thermal_from_optical(
                        frame,
                        detections=dets,
                        palette=palette,
                    )
                    if fusion_mode == "msx" and palette not in ("standard",):
                        thermal_frame = thermal_fusion_service.fuse_msx_detail(frame, thermal_frame)

                # Fuse detections to target models
                fused_targets = thermal_fusion_service.fuse_detections(
                    optical_detections=dets,
                    thermal_detections=dets,
                    thermal_frame=thermal_frame,
                )
                total_targets += len(fused_targets)

                # Tactical HUD
                annotated = thermal_fusion_service.draw_thermal_hud(
                    thermal_frame,
                    palette_name=palette,
                    fused_targets=fused_targets,
                )

                if writer is not None and writer.isOpened():
                    writer.write(annotated)
                    has_written = True

                frame_results.append({
                    "frame_index": frames_processed,
                    "target_count": len(fused_targets),
                    "fused_targets": [t.to_dict() for t in fused_targets],
                })
                frames_processed += 1

        if writer is not None:
            writer.release()

        annotated_video_url: Optional[str] = None
        if has_written and raw_out_path.exists():
            success = convert_video_to_h264(raw_out_path, final_out_path)
            if success and final_out_path.exists():
                annotated_video_url = f"/api/thermal/videos/thermal_{session_id}.mp4"
            if raw_out_path.exists():
                try:
                    raw_out_path.unlink()
                except OSError:
                    pass

        return {
            "status": "success",
            "palette": palette,
            "fusion_mode": fusion_mode,
            "frames_requested": max_frames,
            "frames_processed": frames_processed,
            "target_count": total_targets,
            "annotated_video_url": annotated_video_url,
            "results": frame_results,
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Error processing thermal video: %s", exc)
        raise HTTPException(status_code=500, detail=f"Thermal video processing failed: {exc}") from exc
    finally:
        if temp_input_path.exists():
            try:
                temp_input_path.unlink()
            except OSError:
                pass


@router.api_route("/videos/{filename}", methods=["GET", "HEAD"])
async def get_thermal_video(filename: str):
    """
    Serve a generated radiometric FLIR / NVG H.264 MP4 video.
    """
    safe_name = Path(filename).name
    target_path = settings.temp_directory / "thermal_videos" / safe_name
    if not target_path.exists() or not target_path.is_file():
        raise HTTPException(status_code=404, detail="Thermal video not found.")
    return FileResponse(
        str(target_path),
        media_type="video/mp4",
        content_disposition_type="inline",
        headers={
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=3600",
        },
    )

