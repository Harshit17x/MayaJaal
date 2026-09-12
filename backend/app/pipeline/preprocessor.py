from __future__ import annotations

import logging
from dataclasses import dataclass

import cv2
import numpy as np


logger = logging.getLogger(__name__)


class PreprocessingError(Exception):
    """Base exception for preprocessing errors."""


class InvalidFrameError(PreprocessingError):
    """Raised when an input frame is invalid."""


class InvalidTargetSizeError(PreprocessingError):
    """Raised when the requested target size is invalid."""


class TensorValidationError(PreprocessingError):
    """Raised when the final tensor is invalid."""


@dataclass(frozen=True)
class PreprocessingConfig:
    """
    Generic preprocessing configuration.

    Model-specific values can be changed later when
    the final ONNX models are available.
    """

    target_width: int
    target_height: int

    convert_bgr_to_rgb: bool = True
    normalize: bool = False
    scale: float = 1.0 / 255.0
    mean: tuple[float, float, float] | None = None
    std: tuple[float, float, float] | None = None

    channel_first: bool = True
    add_batch_dimension: bool = True


class Preprocessor:
    """
    Convert OpenCV frames into ONNX-compatible tensors.

    Pipeline:

        BGR frame
          ?
        validation
          ?
        resize
          ?
        optional BGR ? RGB
          ?
        float32 conversion
          ?
        optional scaling/normalization
          ?
        optional HWC ? CHW
          ?
        optional batch dimension
          ?
        tensor validation
    """

    def __init__(self, config: PreprocessingConfig) -> None:
        self.config = config

        self._validate_config()

    def _validate_config(self) -> None:
        """Validate preprocessing configuration."""

        if (
            self.config.target_width <= 0
            or self.config.target_height <= 0
        ):
            raise InvalidTargetSizeError(
                "Target width and height must be greater than 0."
            )

        if self.config.scale <= 0:
            raise PreprocessingError(
                "Scale must be greater than 0."
            )

        if (
            self.config.mean is not None
            and len(self.config.mean) != 3
        ):
            raise PreprocessingError(
                "Mean must contain exactly 3 values."
            )

        if (
            self.config.std is not None
            and len(self.config.std) != 3
        ):
            raise PreprocessingError(
                "Std must contain exactly 3 values."
            )

        if (
            self.config.normalize
            and self.config.std is not None
            and any(value == 0 for value in self.config.std)
        ):
            raise PreprocessingError(
                "Standard deviation values cannot be zero."
            )

    def validate_frame(self, frame: np.ndarray) -> None:
        """Validate an OpenCV frame."""

        if not isinstance(frame, np.ndarray):
            raise InvalidFrameError(
                "Frame must be a NumPy ndarray."
            )

        if frame.size == 0:
            raise InvalidFrameError(
                "Frame cannot be empty."
            )

        if frame.ndim != 3:
            raise InvalidFrameError(
                f"Expected a 3-dimensional frame, "
                f"got {frame.ndim} dimensions."
            )

        if frame.shape[2] != 3:
            raise InvalidFrameError(
                f"Expected 3 channels, "
                f"got {frame.shape[2]}."
            )

    def _process_single(self, frame: np.ndarray) -> np.ndarray:
        """Convert a single OpenCV BGR frame into a preprocessed 3D array (C, H, W) or (H, W, C)."""
        self.validate_frame(frame)

        resized = cv2.resize(
            frame,
            (
                self.config.target_width,
                self.config.target_height,
            ),
            interpolation=cv2.INTER_LINEAR,
        )

        processed = resized

        if self.config.convert_bgr_to_rgb:
            processed = cv2.cvtColor(
                processed,
                cv2.COLOR_BGR2RGB,
            )

        tensor = processed.astype(
            np.float32,
            copy=False,
        )

        if self.config.normalize:
            tensor *= self.config.scale

            if self.config.mean is not None:
                tensor -= np.asarray(
                    self.config.mean,
                    dtype=np.float32,
                )

            if self.config.std is not None:
                tensor /= np.asarray(
                    self.config.std,
                    dtype=np.float32,
                )

        elif self.config.scale != 1.0:
            tensor *= self.config.scale

        if self.config.channel_first:
            tensor = np.transpose(
                tensor,
                (2, 0, 1),
            )

        return tensor

    def process(self, frame: np.ndarray | list[np.ndarray]) -> np.ndarray:
        """
        Convert an OpenCV BGR frame (or list of frames) into an ONNX-ready tensor.
        """
        if isinstance(frame, (list, tuple)):
            return self.process_batch(list(frame))

        try:
            tensor = self._process_single(frame)

            if self.config.add_batch_dimension:
                tensor = np.expand_dims(
                    tensor,
                    axis=0,
                )

            self._validate_tensor(tensor)

            logger.debug(
                "Preprocessing successful | "
                "input=%s | output=%s | dtype=%s",
                frame.shape,
                tensor.shape,
                tensor.dtype,
            )

            return tensor

        except PreprocessingError:
            raise

        except Exception as exc:
            logger.exception(
                "Preprocessing failed."
            )

            raise PreprocessingError(
                f"Frame preprocessing failed: {exc}"
            ) from exc

    def process_batch(self, frames: list[np.ndarray]) -> np.ndarray:
        """
        Convert a batch of OpenCV BGR frames (e.g. 2 to 6 frames) into an ONNX-ready batch tensor.
        Returns a single contiguous NumPy tensor of shape (B, C, H, W).
        """
        if not frames:
            raise InvalidFrameError("Batch frames list cannot be empty.")

        try:
            processed_tensors = [self._process_single(f) for f in frames]
            batch_tensor = np.stack(processed_tensors, axis=0).astype(np.float32)

            self._validate_tensor(batch_tensor)

            logger.debug(
                "Batch preprocessing successful | batch_size=%d | output_shape=%s | dtype=%s",
                len(frames),
                batch_tensor.shape,
                batch_tensor.dtype,
            )

            return batch_tensor

        except PreprocessingError:
            raise

        except Exception as exc:
            logger.exception("Batch preprocessing failed.")
            raise PreprocessingError(f"Batch preprocessing failed: {exc}") from exc

    @staticmethod
    def _validate_tensor(tensor: np.ndarray) -> None:
        """Validate the final tensor."""

        if not isinstance(tensor, np.ndarray):
            raise TensorValidationError(
                "Processed output is not a NumPy ndarray."
            )

        if tensor.size == 0:
            raise TensorValidationError(
                "Processed tensor is empty."
            )

        if tensor.dtype != np.float32:
            raise TensorValidationError(
                f"Expected float32 tensor, "
                f"got {tensor.dtype}."
            )

        if not np.isfinite(tensor).all():
            raise TensorValidationError(
                "Processed tensor contains NaN or infinite values."
            )
