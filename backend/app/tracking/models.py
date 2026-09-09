"""
Data models for tracking output.

TrackedObject extends a raw Detection with a persistent track_id and
lifecycle state assigned by ByteTracker.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal


TrackState = Literal["confirmed", "tentative", "lost"]


@dataclass
class TrackedObject:
    """
    Snapshot of a tracked object within a single video frame.

    Attributes:
        track_id:   Unique, persistent integer ID assigned by ByteTracker.
                    Stable across frames for the lifetime of the track.
        box:        Bounding box [x1, y1, x2, y2] in original image coordinates.
        confidence: Detection confidence score in [0, 1].
        class_id:   Integer class index (matches COCO / model labels).
        class_name: Human-readable class label (e.g. "person", "car").
        state:      Track lifecycle state.
                    - "confirmed"  → seen ≥ min_consecutive_frames, stable.
                    - "tentative"  → newly created, not yet confirmed.
                    - "lost"       → not matched in current frame (carried forward).
    """

    track_id: int
    box: list[float]        # [x1, y1, x2, y2]
    confidence: float
    class_id: int
    class_name: str
    state: TrackState = "confirmed"

    def to_dict(self) -> dict[str, Any]:
        """Return a JSON-serialisable representation."""
        return {
            "track_id": self.track_id,
            "box": [round(v, 2) for v in self.box],
            "confidence": round(self.confidence, 4),
            "class_id": self.class_id,
            "class_name": self.class_name,
            "state": self.state,
        }
