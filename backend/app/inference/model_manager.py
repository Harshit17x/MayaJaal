from __future__ import annotations

import logging
import threading
from pathlib import Path
from typing import Any

from app.inference.onnx_engine import (
    ONNXEngine,
    ONNXEngineError,
    ONNXModelError,
)

logger = logging.getLogger(__name__)


class ModelManagerError(Exception):
    """Base exception for model manager errors."""


class ModelNotFoundError(ModelManagerError):
    """Raised when a requested model is not loaded."""


class ModelAlreadyLoadedError(ModelManagerError):
    """Raised when attempting to load an already loaded model."""


class ModelManager:
    """
    Manages multiple ONNX models.

    Responsibilities:
    - Load models once and keep them cached.
    - Prevent duplicate model loading.
    - Provide safe model lookup.
    - Unload individual models.
    - Report model status.
    - Isolate failures between models.
    """

    def __init__(
        self,
        max_models: int = 4,
        intra_op_threads: int = 2,
        inter_op_threads: int = 1,
        gpu_mem_limit_gb: float | None = None,
    ) -> None:
        if max_models < 1:
            raise ValueError("max_models must be at least 1.")

        self.max_models = max_models
        self.intra_op_threads = max(1, intra_op_threads)
        self.inter_op_threads = max(1, inter_op_threads)
        # None means "let ONNXEngine read from settings" (0 = unlimited)
        self.gpu_mem_limit_gb = gpu_mem_limit_gb

        self._models: dict[str, ONNXEngine] = {}

        # Protects the model cache from simultaneous API requests.
        self._lock = threading.RLock()

    def load_model(
        self,
        model_name: str,
        model_path: str | Path,
    ) -> dict[str, Any]:
        """
        Load an ONNX model into the cache.

        A model is loaded only once. If loading fails,
        the existing loaded models remain unaffected.
        """

        if not model_name or not model_name.strip():
            raise ModelManagerError(
                "model_name cannot be empty."
            )

        model_name = model_name.strip()

        with self._lock:
            if model_name in self._models:
                raise ModelAlreadyLoadedError(
                    f"Model '{model_name}' is already loaded."
                )

            if len(self._models) >= self.max_models:
                raise ModelManagerError(
                    f"Maximum loaded model limit reached: "
                    f"{self.max_models}"
                )

            try:
                engine = ONNXEngine(
                    model_path=model_path,
                    intra_op_threads=self.intra_op_threads,
                    inter_op_threads=self.inter_op_threads,
                    gpu_mem_limit_gb=self.gpu_mem_limit_gb,
                )

                self._models[model_name] = engine

                logger.info(
                    "Model '%s' loaded successfully.",
                    model_name,
                )

                return {
                    "model_name": model_name,
                    "status": "loaded",
                    "model_info": engine.get_model_info(),
                }

            except ONNXModelError:
                logger.exception(
                    "Failed to load model '%s'.",
                    model_name,
                )
                raise

            except Exception as exc:
                logger.exception(
                    "Unexpected error while loading model '%s'.",
                    model_name,
                )

                raise ModelManagerError(
                    f"Unexpected error loading '{model_name}': {exc}"
                ) from exc

    def get_model(self, model_name: str) -> ONNXEngine:
        """Return a loaded model."""

        if not model_name or not model_name.strip():
            raise ModelNotFoundError(
                "model_name cannot be empty."
            )

        with self._lock:
            engine = self._models.get(model_name.strip())

            if engine is None:
                raise ModelNotFoundError(
                    f"Model '{model_name}' is not loaded."
                )

            return engine

    def is_loaded(self, model_name: str) -> bool:
        """Check whether a model is currently loaded."""

        with self._lock:
            return model_name.strip() in self._models

    def list_models(self) -> list[str]:
        """Return names of all loaded models."""

        with self._lock:
            return list(self._models.keys())

    def get_status(self) -> dict[str, Any]:
        """Return the status of all loaded models."""

        with self._lock:
            models: dict[str, Any] = {}

            for name, engine in self._models.items():
                try:
                    models[name] = {
                        "status": "loaded",
                        "info": engine.get_model_info(),
                    }
                except Exception as exc:
                    logger.exception(
                        "Could not get status for model '%s'.",
                        name,
                    )

                    models[name] = {
                        "status": "error",
                        "error": str(exc),
                    }

            return {
                "loaded_count": len(self._models),
                "max_models": self.max_models,
                "loaded_models": list(self._models.keys()),
                "models": models,
            }

    def unload_model(self, model_name: str) -> None:
        """Unload one model and release its ONNX session."""

        with self._lock:
            engine = self._models.pop(model_name.strip(), None)

            if engine is None:
                raise ModelNotFoundError(
                    f"Model '{model_name}' is not loaded."
                )

            try:
                engine.close()

                logger.info(
                    "Model '%s' unloaded successfully.",
                    model_name,
                )

            except Exception as exc:
                logger.exception(
                    "Error while unloading model '%s'.",
                    model_name,
                )

                raise ModelManagerError(
                    f"Failed to unload '{model_name}': {exc}"
                ) from exc

    def unload_all(self) -> None:
        """Unload all models safely."""

        with self._lock:
            model_names = list(self._models.keys())

            for model_name in model_names:
                engine = self._models.pop(model_name)

                try:
                    engine.close()

                    logger.info(
                        "Model '%s' unloaded.",
                        model_name,
                    )

                except Exception:
                    logger.exception(
                        "Error unloading model '%s'.",
                        model_name,
                    )

    def predict(
        self,
        model_name: str,
        input_data: Any,
        input_name: str | None = None,
    ) -> list[Any]:
        """
        Run inference using a named cached model.
        """

        engine = self.get_model(model_name)

        try:
            return engine.predict(
                input_data=input_data,
                input_name=input_name,
            )

        except ONNXEngineError:
            logger.exception(
                "Inference failed using model '%s'.",
                model_name,
            )
            raise

        except Exception as exc:
            logger.exception(
                "Unexpected inference error using model '%s'.",
                model_name,
            )

            raise ModelManagerError(
                f"Unexpected inference error for '{model_name}': {exc}"
            ) from exc

    def __enter__(self) -> "ModelManager":
        return self

    def __exit__(
        self,
        exc_type: Any,
        exc_value: Any,
        traceback: Any,
    ) -> None:
        self.unload_all()