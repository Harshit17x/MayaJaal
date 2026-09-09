"""
ByteTrack multi-object tracking package.

Provides stateful, per-session object tracking on top of the existing
ONNX inference + postprocessor pipeline.

Exports:
    ByteTrackerWrapper  – frame-by-frame tracker that consumes Postprocessor output
    TrackedObject       – single-frame snapshot of a tracked object with persistent ID
    TrackerConfig       – immutable config dataclass for ByteTracker hyper-parameters
    TrackerSessionStore – thread-safe store mapping camera_id → ByteTrackerWrapper
"""
from __future__ import annotations

from app.tracking.models import TrackedObject
from app.tracking.config import TrackerConfig
from app.tracking.tracker import ByteTrackerWrapper
from app.tracking.session_store import TrackerSessionStore

__all__ = [
    "ByteTrackerWrapper",
    "TrackedObject",
    "TrackerConfig",
    "TrackerSessionStore",
]
