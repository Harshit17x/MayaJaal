"""
ByteTracker wrapper.

Wraps supervision's ByteTrack class to integrate cleanly with the existing
MayaJaal Postprocessor output format (list of Detection dicts).

Compatibility:
    supervision 0.21 – 0.30:  ByteTrack class from supervision.tracker.byte_tracker.core
    supervision >= 0.31:      Will raise ByteTrackerError with helpful upgrade guidance.

Usage:
    config  = TrackerConfig(frame_rate=25)
    tracker = ByteTrackerWrapper(config)

    for frame in video:
        detections = postprocessor.decode(...)   # existing pipeline output
        tracked    = tracker.update(detections, frame_resolution=(w, h))
        for obj in tracked:
            print(obj.track_id, obj.box)

    tracker.reset()   # between independent video sessions
"""
from __future__ import annotations

import logging
import warnings
from typing import Any

import numpy as np

from app.tracking.config import TrackerConfig
from app.tracking.models import TrackedObject, TrackState

logger = logging.getLogger(__name__)


class ByteTrackerError(Exception):
    """Raised when the ByteTracker dependency is unavailable or fails."""


class ByteTrackerWrapper:
    """
    Thin stateful wrapper around supervision.ByteTracker.

    Accepts the raw detection list produced by Postprocessor.decode() and
    returns a list of TrackedObject instances enriched with persistent track IDs.

    Thread-safety: NOT thread-safe.  Each camera / session must own its own
    ByteTrackerWrapper instance (managed by TrackerSessionStore).
    """

    def __init__(self, config: TrackerConfig | None = None) -> None:
        self.config = config or TrackerConfig()
        self._tracker = self._build_tracker()
        self._frame_idx: int = 0

        logger.debug(
            "ByteTrackerWrapper initialised | frame_rate=%d | "
            "lost_track_buffer=%d | activation_threshold=%.2f",
            self.config.frame_rate,
            self.config.lost_track_buffer,
            self.config.track_activation_threshold,
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def update(
        self,
        detections: list[dict[str, Any]],
        frame_resolution: tuple[int, int],
    ) -> list[TrackedObject]:
        """
        Feed one frame's detections into ByteTracker and return tracked objects.

        Args:
            detections:
                Output of Postprocessor.decode() — a list of dicts each with
                keys ``box`` ([x1,y1,x2,y2]), ``confidence``, ``class_id``,
                ``class_name``.
            frame_resolution:
                ``(width, height)`` of the *original* (pre-resize) frame.
                Required by supervision.ByteTracker for coordinate handling.

        Returns:
            List of TrackedObject for this frame.  Only active (non-deleted)
            tracks are returned.  Empty list when there are no tracked objects.
        """
        self._frame_idx += 1

        if not detections:
            # Still call update so Kalman predictions advance and lost tracks age
            try:
                from supervision.detection.core import Detections as SvDetections
                empty = SvDetections.empty()
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore", FutureWarning)
                    self._tracker.update_with_detections(empty)
            except Exception:
                pass
            return []

        try:
            from supervision.detection.core import Detections as SvDetections
        except ImportError as exc:
            raise ByteTrackerError(
                "The 'supervision' package is required for ByteTrack. "
                "Install it with: pip install 'supervision>=0.21.0,<0.31.0'"
            ) from exc

        # ---------------------------------------------------------------
        # Convert Postprocessor dicts → supervision.Detections NumPy arrays
        # ---------------------------------------------------------------
        xyxy      = np.array([d["box"] for d in detections], dtype=np.float32)      # [N,4]
        confs     = np.array([d["confidence"] for d in detections], dtype=np.float32)  # [N]
        class_ids = np.array([d["class_id"] for d in detections], dtype=int)          # [N]

        sv_dets = SvDetections(
            xyxy=xyxy,
            confidence=confs,
            class_id=class_ids,
        )

        # ---------------------------------------------------------------
        # Run ByteTrack
        # ---------------------------------------------------------------
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore", FutureWarning)
                tracked_sv = self._tracker.update_with_detections(sv_dets)
        except Exception as exc:
            logger.warning(
                "ByteTracker.update_with_detections failed at frame %d: %s",
                self._frame_idx,
                exc,
            )
            return []

        if tracked_sv is None or len(tracked_sv) == 0:
            return []

        # ---------------------------------------------------------------
        # Convert supervision.Detections back to TrackedObject list
        # ---------------------------------------------------------------
        results: list[TrackedObject] = []

        track_ids  = tracked_sv.tracker_id   # int array | None
        boxes      = tracked_sv.xyxy
        confidences = tracked_sv.confidence if tracked_sv.confidence is not None else np.zeros(len(boxes))
        cls_ids    = tracked_sv.class_id if tracked_sv.class_id is not None else np.zeros(len(boxes), dtype=int)

        # Build class_name lookup from original detections (keyed by class_id)
        cls_name_map: dict[int, str] = {d["class_id"]: d["class_name"] for d in detections}

        for i in range(len(boxes)):
            tid = int(track_ids[i]) if track_ids is not None else -1
            cid = int(cls_ids[i])
            box = [float(v) for v in boxes[i]]
            conf = float(confidences[i])
            cls_name = cls_name_map.get(cid, f"class_{cid}")

            results.append(
                TrackedObject(
                    track_id=tid,
                    box=box,
                    confidence=conf,
                    class_id=cid,
                    class_name=cls_name,
                    state="confirmed",
                )
            )

        logger.debug(
            "ByteTracker | frame=%d | input_dets=%d | active_tracks=%d",
            self._frame_idx,
            len(detections),
            len(results),
        )

        return results

    def reset(self) -> None:
        """
        Reset tracker state completely.

        Call between independent video files or when a camera session is
        intentionally restarted so that track IDs restart from 1.
        """
        self._tracker = self._build_tracker()
        self._frame_idx = 0
        logger.debug("ByteTrackerWrapper reset.")

    @property
    def frame_index(self) -> int:
        """Number of frames processed since last reset."""
        return self._frame_idx

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _build_tracker(self):  # type: ignore[return]
        """
        Construct the underlying ByteTrack tracker.

        supervision 0.30 moved ByteTrack out of the top-level namespace.
        We import directly from the submodule and suppress the FutureWarning
        about eventual removal in 0.31+.
        """
        try:
            # Direct submodule import — works in supervision 0.21–0.30
            with warnings.catch_warnings():
                warnings.simplefilter("ignore", FutureWarning)
                from supervision.tracker.byte_tracker.core import ByteTrack
        except ImportError:
            # Fallback: try legacy top-level name (supervision < 0.28)
            try:
                import supervision as sv
                ByteTrack = sv.ByteTracker  # type: ignore[attr-defined]
            except AttributeError:
                raise ByteTrackerError(
                    "ByteTrack is unavailable in this version of supervision. "
                    "Install supervision>=0.21.0,<0.31.0 to use ByteTrack tracking."
                )

        with warnings.catch_warnings():
            warnings.simplefilter("ignore", FutureWarning)
            return ByteTrack(
                track_activation_threshold=self.config.track_activation_threshold,
                lost_track_buffer=self.config.lost_track_buffer,
                minimum_matching_threshold=self.config.minimum_matching_threshold,
                frame_rate=self.config.frame_rate,
                minimum_consecutive_frames=self.config.minimum_consecutive_frames,
            )
