from typing import Any
import onnxruntime as ort
from fastapi import APIRouter

from app.core.config import settings


router = APIRouter(
    prefix="/api",
    tags=["System"],
)


@router.get("/health")
async def health() -> dict[str, Any]:
    """Return backend health, device config, and execution providers."""
    available_providers = ort.get_available_providers()
    gpu_available = "CUDAExecutionProvider" in available_providers

    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
        "device_configured": settings.device,
        "gpu_available": gpu_available,
        "available_providers": available_providers,
    }
