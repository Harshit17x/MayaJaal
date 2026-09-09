from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.runtime import model_manager


router = APIRouter(
    prefix="/api/models",
    tags=["Models"],
)


class ModelLoadRequest(BaseModel):
    model_name: str = Field(min_length=1)
    model_file: str = Field(min_length=1)


@router.get("")
async def model_status() -> dict:
    """Return the current model manager status."""

    return model_manager.get_status()


@router.post("/load")
async def load_model(request: ModelLoadRequest) -> dict:
    """Load and cache an ONNX model."""

    model_name = request.model_name.strip()
    model_file = Path(request.model_file)

    if not model_name:
        raise HTTPException(
            status_code=400,
            detail="model_name is required.",
        )

    if model_file.suffix.lower() != ".onnx":
        raise HTTPException(
            status_code=415,
            detail="Only .onnx model files are supported.",
        )

    model_path = settings.model_directory / model_file.name

    if not model_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Model file '{model_file.name}' not found.",
        )

    if not model_path.is_file():
        raise HTTPException(
            status_code=400,
            detail=f"Model path '{model_file.name}' is not a file.",
        )

    try:
        result = model_manager.load_model(
            model_name=model_name,
            model_path=model_path,
        )

        return {
            "model_name": model_name,
            "status": "loaded",
            "model_info": result,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Failed to load the ONNX model.",
        ) from exc


@router.delete("/{model_name}")
async def unload_model(model_name: str) -> dict:
    """Unload a cached model."""

    model_name = model_name.strip()

    if not model_name:
        raise HTTPException(
            status_code=400,
            detail="model_name is required.",
        )

    try:
        model_manager.unload_model(model_name)

        return {
            "model_name": model_name,
            "status": "unloaded",
        }

    except Exception as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc