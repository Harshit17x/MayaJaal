from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import cv2

from app.core.config import settings


logger = logging.getLogger(__name__)


class VideoLoaderError(Exception):
    """Base exception for video loading errors."""


class VideoFileNotFoundError(VideoLoaderError):
    """Raised when a video file does not exist."""


class UnsupportedVideoError(VideoLoaderError):
    """Raised when a video format is not supported."""


class InvalidVideoError(VideoLoaderError):
    """Raised when a video cannot be opened or is invalid."""


class VideoLoader:
    """
    Safe video reader for local video files.

    Responsibilities:
    - Validate video paths.
    - Open videos using OpenCV.
    - Expose video metadata.
    - Read frames safely.
    - Detect end-of-stream.
    - Release resources cleanly.
    """

    def __init__(self, video_path: str | Path) -> None:
        self.video_path = Path(video_path)
        self.capture: cv2.VideoCapture | None = None

        self._validate_video_path()
        self._open_video()

    def _validate_video_path(self) -> None:
        """Validate the video file before opening it."""

        if not self.video_path.exists():
            raise VideoFileNotFoundError(
                f"Video file not found: {self.video_path}"
            )

        if not self.video_path.is_file():
            raise VideoLoaderError(
                f"Video path is not a file: {self.video_path}"
            )

        if (
            self.video_path.suffix.lower()
            not in settings.allowed_video_extensions
        ):
            raise UnsupportedVideoError(
                f"Unsupported video format: "
                f"{self.video_path.suffix}. "
                f"Allowed formats: "
                f"{', '.join(settings.allowed_video_extensions)}"
            )

        if self.video_path.stat().st_size == 0:
            raise InvalidVideoError(
                f"Video file is empty: {self.video_path}"
            )

    def _open_video(self) -> None:
        """Open the video using OpenCV."""

        try:
            capture = cv2.VideoCapture(str(self.video_path))

        except Exception as exc:
            logger.exception(
                "OpenCV failed while opening video: %s",
                self.video_path,
            )

            raise InvalidVideoError(
                f"Failed to open video "
                f"'{self.video_path.name}': {exc}"
            ) from exc

        if not capture.isOpened():
            capture.release()

            raise InvalidVideoError(
                f"OpenCV could not open video: "
                f"{self.video_path.name}"
            )

        self.capture = capture

        logger.info(
            "Video opened successfully: %s",
            self.video_path.name,
        )

    def get_metadata(self) -> dict[str, Any]:
        """Return useful video metadata."""

        if self.capture is None:
            raise InvalidVideoError(
                "Video capture is not initialized."
            )

        fps = self.capture.get(cv2.CAP_PROP_FPS)
        frame_count = self.capture.get(cv2.CAP_PROP_FRAME_COUNT)
        width = self.capture.get(cv2.CAP_PROP_FRAME_WIDTH)
        height = self.capture.get(cv2.CAP_PROP_FRAME_HEIGHT)

        return {
            "filename": self.video_path.name,
            "path": str(self.video_path),
            "fps": fps,
            "frame_count": int(frame_count),
            "width": int(width),
            "height": int(height),
            "duration_seconds": (
                frame_count / fps if fps > 0 else None
            ),
        }

    def read_frame(self) -> tuple[bool, Any]:
        """
        Read the next frame.

        Returns:
            (True, frame) when successful.
            (False, None) at end-of-stream or on read failure.
        """

        if self.capture is None:
            raise InvalidVideoError(
                "Video capture is not initialized."
            )

        try:
            success, frame = self.capture.read()

        except Exception as exc:
            logger.exception(
                "Failed to read video frame: %s",
                self.video_path.name,
            )

            raise InvalidVideoError(
                f"Failed to read frame from "
                f"'{self.video_path.name}': {exc}"
            ) from exc

        if not success or frame is None:
            return False, None

        if frame.size == 0:
            raise InvalidVideoError(
                f"Video returned an empty frame: "
                f"{self.video_path.name}"
            )

        return True, frame

    def release(self) -> None:
        """Release the video capture resource."""

        if self.capture is not None:
            self.capture.release()
            self.capture = None

            logger.info(
                "Video released: %s",
                self.video_path.name,
            )

    def __enter__(self) -> "VideoLoader":
        return self

    def __exit__(
        self,
        exc_type: Any,
        exc_value: Any,
        traceback: Any,
    ) -> None:
        self.release()
