"""
Server-side bounding box and track ID annotator.

Draws tactical bounding boxes, corner brackets, and ID badges directly
onto video frames using OpenCV with sub-millisecond per-frame overhead.
Converts annotated videos to faststart H.264 MP4 for instant browser playback.
"""
from __future__ import annotations

import logging
import shutil
import subprocess
from pathlib import Path
from typing import Any

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# Tactical Threat Color Palette (BGR for OpenCV)
CLASS_COLORS: dict[str, tuple[int, int, int]] = {
    "firearm": (50, 50, 240),       # High threat - Red
    "explosive": (30, 30, 220),     # Extreme threat - Dark Crimson
    "melee_weapon": (80, 50, 240),  # Threat - Rose
    "blunt_weapon": (200, 80, 160), # Threat - Purple
    "fire_smoke": (20, 140, 255),   # Hazard - Orange
    "person": (80, 210, 60),        # Target - Emerald green
    "car": (240, 180, 50),          # Sky blue
    "truck": (220, 130, 40),        # Deep blue
    "bus": (230, 100, 90),          # Indigo
    "motorcycle": (200, 180, 20),   # Cyan
    "bicycle": (160, 180, 20),      # Teal
    "dog": (30, 160, 240),          # Amber
    "horse": (20, 120, 220),        # Dark amber
    "backpack": (160, 70, 230),     # Pink
    "suitcase": (180, 70, 170),     # Purple
    "default": (60, 200, 80),       # Light green
}
DEFAULT_COLOR = (60, 200, 80)


def draw_tracked_boxes(
    frame: np.ndarray,
    tracked_objects: list[dict[str, Any]],
    frame_idx: int | None = None,
    draw_hud: bool = True,
) -> np.ndarray:
    """
    Annotate a video frame in-place with tactical bounding boxes and track ID badges.

    Args:
        frame: OpenCV BGR image (H, W, 3).
        tracked_objects: List of dicts with:
            - 'box': [x1, y1, x2, y2]
            - 'confidence': float
            - 'class_name': str
            - 'track_id': optional int
        frame_idx: Optional frame index to display in HUD.
        draw_hud: Whether to draw tactical HUD bar.

    Returns:
        Annotated frame (same numpy array modified).
    """
    h, w = frame.shape[:2]
    overlay = frame.copy()

    for obj in tracked_objects:
        box = obj.get("box", [])
        if len(box) < 4:
            continue

        x1, y1, x2, y2 = [int(v) for v in box]
        x1 = max(0, min(w - 1, x1))
        y1 = max(0, min(h - 1, y1))
        x2 = max(0, min(w - 1, x2))
        y2 = max(0, min(h - 1, y2))
        bw = x2 - x1
        bh = y2 - y1

        if bw <= 0 or bh <= 0:
            continue

        cls_name = str(obj.get("class_name", "object")).lower()
        conf = float(obj.get("confidence", 0.0))
        track_id = obj.get("track_id")
        color = CLASS_COLORS.get(cls_name, DEFAULT_COLOR)

        # 1. Semi-transparent box fill
        cv2.rectangle(overlay, (x1, y1), (x2, y2), color, -1)

        # 2. Outer box stroke
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

        # 3. High-contrast corner brackets (white)
        corner_len = min(16, max(6, bw // 4, bh // 4))
        white = (255, 255, 255)
        # Top-left
        cv2.line(frame, (x1, y1), (x1 + corner_len, y1), white, 3)
        cv2.line(frame, (x1, y1), (x1, y1 + corner_len), white, 3)
        # Top-right
        cv2.line(frame, (x2, y1), (x2 - corner_len, y1), white, 3)
        cv2.line(frame, (x2, y1), (x2, y1 + corner_len), white, 3)
        # Bottom-left
        cv2.line(frame, (x1, y2), (x1 + corner_len, y2), white, 3)
        cv2.line(frame, (x1, y2), (x1, y2 - corner_len), white, 3)
        # Bottom-right
        cv2.line(frame, (x2, y2), (x2 - corner_len, y2), white, 3)
        cv2.line(frame, (x2, y2), (x2, y2 - corner_len), white, 3)

        # 4. Badge pill above box
        id_part = f"ID #{track_id} | " if track_id is not None else ""
        label = f"{id_part}{cls_name.upper()} {int(conf * 100)}%"
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.46
        thickness = 1
        (lw, lh), _ = cv2.getTextSize(label, font, font_scale, thickness)
        badge_h = lh + 10
        badge_w = lw + 12
        badge_y1 = max(0, y1 - badge_h)
        badge_y2 = badge_y1 + badge_h
        badge_x2 = min(w, x1 + badge_w)

        # Fill badge background with solid class color
        cv2.rectangle(frame, (x1, badge_y1), (badge_x2, badge_y2), color, -1)
        # Tactical border for badge if tracked
        if track_id is not None:
            cv2.rectangle(frame, (x1, badge_y1), (badge_x2, badge_y2), white, 1)

        # Badge text in white
        cv2.putText(
            frame,
            label,
            (x1 + 6, badge_y2 - 5),
            font,
            font_scale,
            white,
            thickness,
            cv2.LINE_AA,
        )

    # Blend 15% tinted fill into original frame
    cv2.addWeighted(overlay, 0.15, frame, 0.85, 0, frame)

    # 5. Tactical Top HUD Overlay
    if draw_hud:
        hud_bg = frame[:34, :]
        hud_overlay = hud_bg.copy()
        cv2.rectangle(hud_overlay, (0, 0), (w, 34), (15, 20, 25), -1)
        cv2.addWeighted(hud_overlay, 0.75, hud_bg, 0.25, 0, hud_bg)

        # Status dot (green)
        cv2.circle(frame, (16, 17), 5, (60, 220, 80), -1)

        # HUD Text
        frame_str = f"FRAME #{frame_idx:04d}" if frame_idx is not None else "LIVE"
        hud_text = f"BYTETRACK MOT • {frame_str} • TARGETS: {len(tracked_objects)}"
        cv2.putText(
            frame,
            hud_text,
            (30, 22),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.44,
            (230, 240, 240),
            1,
            cv2.LINE_AA,
        )

    return frame


def convert_video_to_h264(raw_mp4_path: Path, output_mp4_path: Path) -> bool:
    """
    Convert an OpenCV-encoded MP4 to browser-compatible H.264 MP4 with faststart.
    """
    try:
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i", str(raw_mp4_path),
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-pix_fmt", "yuv420p",
                "-movflags", "+faststart",
                str(output_mp4_path),
            ],
            capture_output=True,
            timeout=90,
            check=True,
        )
        return True
    except Exception as exc:
        logger.warning("FFmpeg H.264 conversion failed: %s. Using raw MP4 fallback.", exc)
        try:
            shutil.copyfile(raw_mp4_path, output_mp4_path)
            return True
        except Exception:
            return False
