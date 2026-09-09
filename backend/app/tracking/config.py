"""
ByteTracker configuration.

Maps to the supervision ByteTrack constructor parameters with sensible
defaults for border surveillance use-cases (30 FPS, low missed-frame buffer).
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class TrackerConfig:
    """
    Immutable configuration for ByteTrackerWrapper.

    Attributes:
        track_activation_threshold:
            Minimum detection confidence required to initialise a new track.
            Detections below this are used as "low-confidence" candidates for
            re-association only (ByteTrack two-stage matching).
            Default: 0.25

        lost_track_buffer:
            Number of frames a track is kept alive without a matching detection
            before it is permanently removed.
            Default: 30  (1 second at 30 FPS)

        minimum_matching_threshold:
            IoU threshold used by the Hungarian algorithm for matching.
            Higher → stricter match, fewer identity switches.
            Default: 0.8

        frame_rate:
            Expected stream / video frame rate.  Used by the internal Kalman
            filter to scale process noise.
            Default: 30

        minimum_consecutive_frames:
            Minimum consecutive matched frames before a track transitions from
            "tentative" to "confirmed".
            Default: 1  (immediate; increase to 3 for high-noise scenes)
    """

    track_activation_threshold: float = 0.25
    lost_track_buffer: int = 30
    minimum_matching_threshold: float = 0.8
    frame_rate: int = 30
    minimum_consecutive_frames: int = 1

    def __post_init__(self) -> None:
        if not 0.0 < self.track_activation_threshold <= 1.0:
            raise ValueError(
                "track_activation_threshold must be in (0, 1]."
            )
        if self.lost_track_buffer < 1:
            raise ValueError("lost_track_buffer must be >= 1.")
        if not 0.0 < self.minimum_matching_threshold <= 1.0:
            raise ValueError(
                "minimum_matching_threshold must be in (0, 1]."
            )
        if self.frame_rate < 1:
            raise ValueError("frame_rate must be >= 1.")
        if self.minimum_consecutive_frames < 1:
            raise ValueError("minimum_consecutive_frames must be >= 1.")
