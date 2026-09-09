from __future__ import annotations

import logging
import time
from typing import Any

import numpy as np

from app.pipeline.postprocessor import (
    Postprocessor,
    PostprocessorConfig,
)
from app.core.resource_manager import (
    ResourceManager,
    ResourceManagerError,
)
from app.inference.model_manager import (
    ModelManager,
    ModelManagerError,
    ModelNotFoundError,
)


logger = logging.getLogger(__name__)


class InferenceServiceError(Exception):
    """Base exception for inference service errors."""


class InferenceResourceError(InferenceServiceError):
    """Raised when inference resources are unavailable."""


class InferenceService:
    """
    High-level inference service.

    Connects:
        ModelManager
            +
        ResourceManager
            +
        ONNX inference
            +
        Postprocessor (detection decoding & NMS)
    """

    def __init__(
        self,
        model_manager: ModelManager,
        resource_manager: ResourceManager,
        inference_timeout_seconds: float = 30.0,
    ) -> None:
        if inference_timeout_seconds <= 0:
            raise ValueError(
                "inference_timeout_seconds must be greater than 0."
            )

        self.model_manager = model_manager
        self.resource_manager = resource_manager
        self.inference_timeout_seconds = inference_timeout_seconds

    def predict(
        self,
        model_name: str,
        input_data: np.ndarray,
        input_name: str | None = None,
        postprocess: bool = True,
        conf_threshold: float = 0.25,
        iou_threshold: float = 0.45,
        original_image_size: tuple[int, int] | None = None,
        class_labels: list[str] | None = None,
    ) -> dict[str, Any]:
        """
        Run inference using a loaded model.

        Returns a JSON-serializable structure with detections and tensor metadata.
        """

        if not model_name or not model_name.strip():
            raise InferenceServiceError(
                "model_name cannot be empty."
            )

        if not isinstance(input_data, np.ndarray):
            raise InferenceServiceError(
                "input_data must be a NumPy ndarray."
            )

        if input_data.size == 0:
            raise InferenceServiceError(
                "input_data cannot be empty."
            )

        model_name = model_name.strip()

        start_time = time.perf_counter()

        try:
            if not self.model_manager.is_loaded(model_name):
                raise ModelNotFoundError(
                    f"Model '{model_name}' is not loaded."
                )

            with self.resource_manager.inference_slot(
                timeout=self.inference_timeout_seconds
            ):
                outputs = self.model_manager.predict(
                    model_name=model_name,
                    input_data=input_data,
                    input_name=input_name,
                )

            elapsed_seconds = (
                time.perf_counter() - start_time
            )

            output_metadata = []

            for index, output in enumerate(outputs):
                if isinstance(output, np.ndarray):
                    output_metadata.append(
                        {
                            "index": index,
                            "type": "numpy.ndarray",
                            "shape": list(output.shape),
                            "dtype": str(output.dtype),
                        }
                    )
                else:
                    output_metadata.append(
                        {
                            "index": index,
                            "type": type(output).__name__,
                        }
                    )

            detections: list[dict[str, Any]] = []

            if postprocess and outputs:
                # Infer model input width/height if 4D tensor (e.g. [1, 3, H, W])
                model_input_size = None
                if input_data.ndim == 4:
                    # channel_first format: [B, C, H, W]
                    model_input_size = (int(input_data.shape[3]), int(input_data.shape[2]))
                elif input_data.ndim == 3:
                    model_input_size = (int(input_data.shape[2]), int(input_data.shape[1]))

                # Resolve active class labels: prefer explicitly passed labels, otherwise use model engine labels
                active_class_labels = class_labels
                if active_class_labels is None:
                    try:
                        engine = self.model_manager.get_model(model_name)
                        if getattr(engine, "class_labels", None):
                            active_class_labels = engine.class_labels
                    except Exception:
                        pass

                postprocessor = Postprocessor(
                    config=PostprocessorConfig(
                        conf_threshold=conf_threshold,
                        iou_threshold=iou_threshold,
                        class_labels=active_class_labels,
                    )
                )

                detections = postprocessor.decode(
                    outputs=outputs,
                    model_input_size=model_input_size,
                    original_image_size=original_image_size,
                )

            logger.info(
                "Inference completed | "
                "model=%s | latency=%.4fs | detections=%d",
                model_name,
                elapsed_seconds,
                len(detections),
            )

            return {
                "model_name": model_name,
                "status": "success",
                "latency_seconds": round(
                    elapsed_seconds,
                    6,
                ),
                "latency_ms": round(elapsed_seconds * 1000, 2),
                "inference_time_ms": round(elapsed_seconds * 1000, 2),
                "input": {
                    "shape": list(input_data.shape),
                    "dtype": str(input_data.dtype),
                },
                "detections_count": len(detections),
                "detections": detections,
                "outputs": output_metadata,
            }

        except ModelNotFoundError:
            raise

        except ResourceManagerError as exc:
            logger.warning(
                "Inference resource unavailable | model=%s",
                model_name,
            )

            raise InferenceResourceError(
                str(exc)
            ) from exc

        except ModelManagerError as exc:
            logger.exception(
                "Model inference failed | model=%s",
                model_name,
            )

            raise InferenceServiceError(
                f"Inference failed for model "
                f"'{model_name}': {exc}"
            ) from exc

        except Exception as exc:
            logger.exception(
                "Unexpected inference service error | model=%s",
                model_name,
            )

            raise InferenceServiceError(
                f"Unexpected inference error: {exc}"
            ) from exc
