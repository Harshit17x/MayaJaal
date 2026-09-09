from __future__ import annotations

import logging
import time
from typing import Any

import cv2


logger = logging.getLogger(__name__)


class RTSPError(Exception):
    """Base exception for RTSP stream errors."""


class InvalidRTSPUrlError(RTSPError):
    """Raised when an RTSP URL is invalid."""


class RTSPConnectionError(RTSPError):
    """Raised when an RTSP stream cannot be opened."""


class RTSPReadError(RTSPError):
    """Raised when a frame cannot be read from the stream."""


class RTSPStream:
    """
    Safe RTSP stream reader for CCTV cameras.

    Features:
    - RTSP URL validation
    - Controlled connection timeout
    - Controlled frame-read timeout
    - Connection failure handling
    - Frame-read failure handling
    - Bounded reconnect attempts
    - Resource cleanup
    """

    def __init__(
        self,
        rtsp_url: str,
        reconnect_attempts: int = 3,
        reconnect_delay_seconds: float = 2.0,
        connection_timeout_ms: int = 5000,
        read_timeout_ms: int = 5000,
    ) -> None:
        self.rtsp_url = rtsp_url.strip()

        if not self.rtsp_url:
            raise InvalidRTSPUrlError(
                "RTSP URL cannot be empty."
            )

        if not self.rtsp_url.lower().startswith("rtsp://"):
            raise InvalidRTSPUrlError(
                "RTSP URL must start with rtsp://"
            )

        if reconnect_attempts < 0:
            raise ValueError(
                "reconnect_attempts cannot be negative."
            )

        if reconnect_delay_seconds < 0:
            raise ValueError(
                "reconnect_delay_seconds cannot be negative."
            )

        if connection_timeout_ms <= 0:
            raise ValueError(
                "connection_timeout_ms must be greater than 0."
            )

        if read_timeout_ms <= 0:
            raise ValueError(
                "read_timeout_ms must be greater than 0."
            )

        self.reconnect_attempts = reconnect_attempts
        self.reconnect_delay_seconds = reconnect_delay_seconds
        self.connection_timeout_ms = connection_timeout_ms
        self.read_timeout_ms = read_timeout_ms

        self.capture: cv2.VideoCapture | None = None

    def connect(self) -> None:
        """Open the RTSP stream with bounded timeouts."""

        self.release()

        params = [
            cv2.CAP_PROP_OPEN_TIMEOUT_MSEC,
            self.connection_timeout_ms,
            cv2.CAP_PROP_READ_TIMEOUT_MSEC,
            self.read_timeout_ms,
        ]

        try:
            capture = cv2.VideoCapture(
                self.rtsp_url,
                cv2.CAP_FFMPEG,
                params,
            )

        except Exception as exc:
            logger.exception(
                "Failed to create RTSP capture."
            )

            raise RTSPConnectionError(
                f"Failed to connect to RTSP stream: {exc}"
            ) from exc

        if not capture.isOpened():
            capture.release()

            raise RTSPConnectionError(
                "Could not open RTSP stream."
            )

        self.capture = capture

        logger.info(
            "RTSP stream connected successfully."
        )

    def read_frame(self) -> Any:
        """Read one frame from the RTSP stream."""

        if self.capture is None:
            raise RTSPConnectionError(
                "RTSP stream is not connected."
            )

        try:
            success, frame = self.capture.read()

        except Exception as exc:
            logger.exception(
                "RTSP frame read failed."
            )

            raise RTSPReadError(
                f"RTSP frame read failed: {exc}"
            ) from exc

        if not success or frame is None:
            raise RTSPReadError(
                "RTSP stream returned no frame."
            )

        if frame.size == 0:
            raise RTSPReadError(
                "RTSP stream returned an empty frame."
            )

        return frame

    def reconnect(self) -> bool:
        """
        Attempt bounded reconnection attempts.

        Returns:
            True if reconnection succeeds.
            False if all attempts fail.
        """

        self.release()

        for attempt in range(
            1,
            self.reconnect_attempts + 1,
        ):
            logger.warning(
                "RTSP reconnect attempt %d/%d.",
                attempt,
                self.reconnect_attempts,
            )

            try:
                self.connect()
                return True

            except RTSPConnectionError as exc:
                logger.warning(
                    "RTSP reconnect attempt failed: %s",
                    exc,
                )

                if attempt < self.reconnect_attempts:
                    time.sleep(
                        self.reconnect_delay_seconds
                    )

        logger.error(
            "RTSP reconnection failed after %d attempts.",
            self.reconnect_attempts,
        )

        return False

    def get_status(self) -> dict[str, Any]:
        """Return current RTSP stream status."""

        connected = (
            self.capture is not None
            and self.capture.isOpened()
        )

        return {
            "connected": connected,
            "url_configured": bool(self.rtsp_url),
            "reconnect_attempts": self.reconnect_attempts,
            "connection_timeout_ms": self.connection_timeout_ms,
            "read_timeout_ms": self.read_timeout_ms,
        }

    def release(self) -> None:
        """Release the RTSP capture resource."""

        if self.capture is not None:
            self.capture.release()
            self.capture = None

            logger.info(
                "RTSP stream released."
            )

    def __enter__(self) -> "RTSPStream":
        self.connect()
        return self

    def __exit__(
        self,
        exc_type: Any,
        exc_value: Any,
        traceback: Any,
    ) -> None:
        self.release()
