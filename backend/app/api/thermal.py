from __future__ import annotations

import base64
import logging
from typing import Any, Dict, List, Optional

import cv2
from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
import numpy as np
from pydantic import BaseModel, Field

from app.core.runtime import inference_service, model_manager
from app.pipeline.preprocessor import PreprocessingConfig, Preprocessor
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
        raw_res = inference_service.predict(model_name, tensor)

        from app.pipeline.postprocessor import Postprocessor, PostprocessorConfig

        post = Postprocessor(PostprocessorConfig(conf_threshold=conf_threshold))
        detections = post.process(raw_res, original_size=(img_bgr.shape[0], img_bgr.shape[1]))
        return [d.to_dict() for d in detections]
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
