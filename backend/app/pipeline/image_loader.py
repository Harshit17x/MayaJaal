from __future__ import annotations

import logging
from pathlib import Path

import cv2
import numpy as np

from app.core.config import settings


logger = logging.getLogger(__name__)


class ImageLoaderError(Exception):
    """Base exception for image loading errors."""


class ImageFileNotFoundError(ImageLoaderError):
    """Raised when an image file does not exist."""


class UnsupportedImageError(ImageLoaderError):
    """Raised when an image format is not supported."""


class InvalidImageError(ImageLoaderError):
    """Raised when an image cannot be decoded or is invalid."""


def validate_image_path(image_path: str | Path) -> Path:
    """Validate an image path before loading it."""

    path = Path(image_path)

    if not path.exists():
        raise ImageFileNotFoundError(
            f"Image file not found: {path}"
        )

    if not path.is_file():
        raise ImageLoaderError(
            f"Image path is not a file: {path}"
        )

    if path.suffix.lower() not in settings.allowed_image_extensions:
        raise UnsupportedImageError(
            f"Unsupported image format: {path.suffix}. "
            f"Allowed formats: "
            f"{', '.join(settings.allowed_image_extensions)}"
        )

    if path.stat().st_size == 0:
        raise InvalidImageError(
            f"Image file is empty: {path}"
        )

    return path


def load_image(image_path: str | Path) -> np.ndarray:
    """
    Validate and decode an image using OpenCV.

    Returns:
        Image as a BGR NumPy array.
    """

    path = validate_image_path(image_path)

    try:
        image = cv2.imread(
            str(path),
            cv2.IMREAD_COLOR,
        )

    except Exception as exc:
        logger.exception(
            "OpenCV failed while reading image: %s",
            path,
        )

        raise InvalidImageError(
            f"Failed to read image '{path.name}': {exc}"
        ) from exc

    if image is None:
        raise InvalidImageError(
            f"OpenCV could not decode image: {path.name}"
        )

    if image.size == 0:
        raise InvalidImageError(
            f"Decoded image is empty: {path.name}"
        )

    if image.ndim != 3 or image.shape[2] != 3:
        raise InvalidImageError(
            f"Expected a 3-channel image, "
            f"got shape {image.shape}"
        )

    logger.info(
        "Image loaded successfully: %s | shape=%s | dtype=%s",
        path.name,
        image.shape,
        image.dtype,
    )

    return image
