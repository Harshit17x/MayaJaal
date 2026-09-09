"""
Thread-safe store for per-camera ByteTracker sessions.

Each RTSP camera is identified by a ``camera_id`` string (usually the camera
UUID from the cameras table or the raw RTSP URL).  The store ensures that a
single ByteTrackerWrapper instance is reused across multiple API calls to the
same camera, preserving track IDs between requests.

For uploaded video files (stateless use-case) this store is NOT used — the
API endpoint creates a fresh tracker per request instead.
"""
from __future__ import annotations

import logging
import threading
from datetime import datetime, timezone
from typing import Iterator

from app.tracking.config import TrackerConfig
from app.tracking.tracker import ByteTrackerWrapper

logger = logging.getLogger(__name__)


class SessionInfo:
    """Metadata wrapper around a tracker session."""

    __slots__ = ("tracker", "camera_id", "created_at", "last_updated_at", "total_frames")

    def __init__(self, camera_id: str, tracker: ByteTrackerWrapper) -> None:
        self.camera_id = camera_id
        self.tracker = tracker
        self.created_at: datetime = datetime.now(tz=timezone.utc)
        self.last_updated_at: datetime = self.created_at
        self.total_frames: int = 0

    def touch(self) -> None:
        self.last_updated_at = datetime.now(tz=timezone.utc)
        self.total_frames += 1


class TrackerSessionStore:
    """
    Thread-safe registry mapping ``camera_id`` → ``ByteTrackerWrapper``.

    Typical usage:
        store = TrackerSessionStore()

        # In RTSP tracking endpoint:
        tracker = store.get_or_create(camera_id="cam-001")
        tracked = tracker.update(detections, frame_resolution)
        store.touch(camera_id="cam-001")

        # When camera is removed or stream is reset:
        store.reset("cam-001")

        # On shutdown:
        store.reset_all()
    """

    def __init__(self) -> None:
        self._sessions: dict[str, SessionInfo] = {}
        self._lock = threading.Lock()

    # ------------------------------------------------------------------
    # Session lifecycle
    # ------------------------------------------------------------------

    def get_or_create(
        self,
        camera_id: str,
        config: TrackerConfig | None = None,
    ) -> ByteTrackerWrapper:
        """
        Return the existing tracker for ``camera_id``, or create a new one.

        Args:
            camera_id:  Unique identifier for the camera / stream.
            config:     TrackerConfig used only when creating a NEW session.
                        Ignored when an existing session is returned.

        Returns:
            The ByteTrackerWrapper bound to this camera.
        """
        camera_id = camera_id.strip()
        if not camera_id:
            raise ValueError("camera_id cannot be empty.")

        with self._lock:
            if camera_id not in self._sessions:
                tracker = ByteTrackerWrapper(config or TrackerConfig())
                self._sessions[camera_id] = SessionInfo(camera_id, tracker)
                logger.info(
                    "TrackerSessionStore: new session created | camera_id=%s",
                    camera_id,
                )

            return self._sessions[camera_id].tracker

    def touch(self, camera_id: str) -> None:
        """Record that a frame was processed for ``camera_id``."""
        with self._lock:
            if camera_id in self._sessions:
                self._sessions[camera_id].touch()

    def reset(self, camera_id: str) -> bool:
        """
        Reset and remove the tracker session for ``camera_id``.

        Returns:
            True  if the session existed and was removed.
            False if no session was found for that camera_id.
        """
        with self._lock:
            if camera_id not in self._sessions:
                return False

            self._sessions[camera_id].tracker.reset()
            del self._sessions[camera_id]

        logger.info(
            "TrackerSessionStore: session reset | camera_id=%s",
            camera_id,
        )
        return True

    def reset_all(self) -> int:
        """
        Reset and remove all tracker sessions.

        Returns:
            Number of sessions that were removed.
        """
        with self._lock:
            count = len(self._sessions)
            for info in self._sessions.values():
                info.tracker.reset()
            self._sessions.clear()

        logger.info(
            "TrackerSessionStore: all %d sessions cleared.",
            count,
        )
        return count

    # ------------------------------------------------------------------
    # Inspection
    # ------------------------------------------------------------------

    def list_sessions(self) -> list[dict]:
        """Return a JSON-serialisable summary of all active sessions."""
        with self._lock:
            return [
                {
                    "camera_id": info.camera_id,
                    "created_at": info.created_at.isoformat(),
                    "last_updated_at": info.last_updated_at.isoformat(),
                    "total_frames": info.total_frames,
                    "current_frame_index": info.tracker.frame_index,
                }
                for info in self._sessions.values()
            ]

    def session_count(self) -> int:
        with self._lock:
            return len(self._sessions)

    def __contains__(self, camera_id: str) -> bool:
        with self._lock:
            return camera_id in self._sessions


# ---------------------------------------------------------------------------
# Application-level singleton — imported by api/tracking.py and runtime
# ---------------------------------------------------------------------------
tracker_session_store = TrackerSessionStore()
