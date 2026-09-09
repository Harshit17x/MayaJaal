from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import numpy as np
import onnxruntime as ort


from app.core.config import settings


logger = logging.getLogger(__name__)


class ONNXEngineError(Exception):
    """Base exception for ONNX engine errors."""


class ONNXModelError(ONNXEngineError):
    """Raised when an ONNX model cannot be loaded or is invalid."""


class ONNXInferenceError(ONNXEngineError):
    """Raised when inference fails."""


class ONNXEngine:
    """
    Safe, reusable ONNX Runtime inference engine.

    Designed for:
    - GPU acceleration (CUDAExecutionProvider) when available
    - CPU fallback (CPUExecutionProvider)
    - Multiple ONNX models
    - Loading models only once
    - Controlled CPU usage
    - Dynamic model input/output inspection
    """

    def __init__(
        self,
        model_path: str | Path,
        intra_op_threads: int = 2,
        inter_op_threads: int = 1,
    ) -> None:
        self.model_path = Path(model_path)

        self.intra_op_threads = max(1, intra_op_threads)
        self.inter_op_threads = max(1, inter_op_threads)

        self.session: ort.InferenceSession | None = None
        self.metadata: dict[str, str] = {}
        self.class_labels: list[str] | None = None
        self.input_size: tuple[int, int] | None = None

        self._validate_model_path()
        self._create_session()

    def _validate_model_path(self) -> None:
        """Validate the ONNX model path before loading."""

        if not self.model_path.exists():
            raise ONNXModelError(
                f"ONNX model not found: {self.model_path}"
            )

        if not self.model_path.is_file():
            raise ONNXModelError(
                f"Model path is not a file: {self.model_path}"
            )

        if self.model_path.suffix.lower() != ".onnx":
            raise ONNXModelError(
                f"Expected an .onnx file, got: {self.model_path.name}"
            )

        if self.model_path.stat().st_size == 0:
            raise ONNXModelError(
                f"ONNX model is empty: {self.model_path}"
            )

    def _get_execution_providers(self) -> list[str]:
        """Detect and return preferred execution providers (GPU / CPU)."""
        available = ort.get_available_providers()
        requested_device = getattr(settings, "device", "auto").lower().strip()

        providers: list[str] = []

        if requested_device in ("auto", "cuda", "gpu"):
            if "CUDAExecutionProvider" in available:
                providers.append("CUDAExecutionProvider")
                logger.info(
                    "CUDAExecutionProvider is available and selected for GPU acceleration."
                )
            elif requested_device in ("cuda", "gpu"):
                logger.warning(
                    "CUDA/GPU device requested, but 'CUDAExecutionProvider' is not in available providers %s. Falling back to CPU.",
                    available,
                )

        providers.append("CPUExecutionProvider")
        return providers

    def _create_session(self) -> None:
        """Create the ONNX Runtime session."""

        try:
            session_options = ort.SessionOptions()

            # Enable graph optimizations.
            session_options.graph_optimization_level = (
                ort.GraphOptimizationLevel.ORT_ENABLE_ALL
            )

            # CPU resource control.
            session_options.intra_op_num_threads = self.intra_op_threads
            session_options.inter_op_num_threads = self.inter_op_threads

            # Execution providers (prioritizes CUDA GPU if available)
            providers = self._get_execution_providers()

            self.session = ort.InferenceSession(
                str(self.model_path),
                sess_options=session_options,
                providers=providers,
            )

            active_providers = self.session.get_providers()

            self._extract_metadata()

            logger.info(
                "Loaded ONNX model: %s | Active providers: %s | Class labels: %s | Input size: %s",
                self.model_path.name,
                active_providers,
                len(self.class_labels) if self.class_labels else "none",
                self.input_size or "dynamic",
            )

        except Exception as exc:
            logger.exception(
                "Failed to load ONNX model: %s",
                self.model_path,
            )

            raise ONNXModelError(
                f"Failed to load ONNX model '{self.model_path.name}': {exc}"
            ) from exc

    def _extract_metadata(self) -> None:
        """Extract embedded model metadata, class labels, and input image size."""
        if self.session is None:
            return

        try:
            model_meta = self.session.get_modelmeta()
            if model_meta and model_meta.custom_metadata_map:
                self.metadata = dict(model_meta.custom_metadata_map)

                # 1. Parse class names/labels if embedded in metadata
                if "names" in self.metadata:
                    raw_names = self.metadata["names"]
                    parsed = None
                    try:
                        import ast
                        parsed = ast.literal_eval(raw_names)
                    except Exception:
                        try:
                            import json
                            parsed = json.loads(raw_names)
                        except Exception:
                            pass

                    if isinstance(parsed, dict):
                        # Sort by integer keys (e.g. {0: 'Blunt_Weapon', ...})
                        sorted_items = sorted(
                            [(int(k), str(v)) for k, v in parsed.items()],
                            key=lambda x: x[0],
                        )
                        self.class_labels = [v for _, v in sorted_items]
                    elif isinstance(parsed, list):
                        self.class_labels = [str(x) for x in parsed]

                # 2. Parse imgsz (e.g. [640, 640])
                if "imgsz" in self.metadata:
                    raw_imgsz = self.metadata["imgsz"]
                    try:
                        import ast
                        val = ast.literal_eval(raw_imgsz)
                        if isinstance(val, (list, tuple)) and len(val) >= 2:
                            self.input_size = (int(val[1]), int(val[0]))  # (width, height)
                        elif isinstance(val, int):
                            self.input_size = (val, val)
                    except Exception:
                        pass

        except Exception as exc:
            logger.debug(
                "Failed to extract metadata from model '%s': %s",
                self.model_path.name,
                exc,
            )

        # Fallback: check static input shape from session
        if not self.input_size and self.session.get_inputs():
            first_input = self.session.get_inputs()[0]
            shape = first_input.shape
            if len(shape) == 4:
                # Shape is [B, C, H, W]
                h, w = shape[2], shape[3]
                if isinstance(h, int) and isinstance(w, int) and h > 0 and w > 0:
                    self.input_size = (w, h)

    def get_inputs(self) -> list[dict[str, Any]]:
        """Return information about model inputs."""

        if self.session is None:
            raise ONNXModelError("ONNX session is not initialized.")

        inputs = []

        for input_meta in self.session.get_inputs():
            inputs.append(
                {
                    "name": input_meta.name,
                    "shape": input_meta.shape,
                    "type": input_meta.type,
                }
            )

        return inputs

    def get_outputs(self) -> list[dict[str, Any]]:
        """Return information about model outputs."""

        if self.session is None:
            raise ONNXModelError("ONNX session is not initialized.")

        outputs = []

        for output_meta in self.session.get_outputs():
            outputs.append(
                {
                    "name": output_meta.name,
                    "shape": output_meta.shape,
                    "type": output_meta.type,
                }
            )

        return outputs

    def predict(
        self,
        input_data: np.ndarray,
        input_name: str | None = None,
    ) -> list[np.ndarray]:
        """
        Run inference using a NumPy array.

        Preprocessing is intentionally kept outside this class because
        Riyan's final ONNX models are not available yet.
        """

        if self.session is None:
            raise ONNXInferenceError(
                "Cannot run inference: ONNX session is not initialized."
            )

        if not isinstance(input_data, np.ndarray):
            raise ONNXInferenceError(
                "input_data must be a NumPy ndarray."
            )

        if input_data.size == 0:
            raise ONNXInferenceError(
                "input_data cannot be empty."
            )

        try:
            if input_name is None:
                model_inputs = self.session.get_inputs()

                if not model_inputs:
                    raise ONNXInferenceError(
                        "The ONNX model has no inputs."
                    )

                input_name = model_inputs[0].name

            results = self.session.run(
                None,
                {input_name: input_data},
            )

            return results

        except ONNXInferenceError:
            raise

        except Exception as exc:
            logger.exception(
                "ONNX inference failed for model: %s",
                self.model_path.name,
            )

            raise ONNXInferenceError(
                f"Inference failed for '{self.model_path.name}': {exc}"
            ) from exc

    def get_model_info(self) -> dict[str, Any]:
        """Return useful information about the loaded model."""

        if self.session is None:
            raise ONNXModelError("ONNX session is not initialized.")

        return {
            "model_name": self.model_path.name,
            "model_path": str(self.model_path),
            "providers": self.session.get_providers(),
            "inputs": self.get_inputs(),
            "outputs": self.get_outputs(),
            "class_labels": self.class_labels,
            "input_size": list(self.input_size) if self.input_size else None,
            "task": self.metadata.get("task", "detect"),
            "intra_op_threads": self.intra_op_threads,
            "inter_op_threads": self.inter_op_threads,
        }

    def close(self) -> None:
        """Release the ONNX Runtime session."""

        if self.session is not None:
            self.session = None

            logger.info(
                "Closed ONNX model: %s",
                self.model_path.name,
            )

    def __enter__(self) -> "ONNXEngine":
        return self

    def __exit__(
        self,
        exc_type: Any,
        exc_value: Any,
        traceback: Any,
    ) -> None:
        self.close()