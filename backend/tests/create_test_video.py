import cv2
import numpy as np
from pathlib import Path

video_path = Path("temp") / "test_video.mp4"
video_path.parent.mkdir(parents=True, exist_ok=True)

width = 640
height = 480
fps = 20
duration_seconds = 5
total_frames = fps * duration_seconds

fourcc = cv2.VideoWriter_fourcc(*"mp4v")

writer = cv2.VideoWriter(
    str(video_path),
    fourcc,
    fps,
    (width, height),
)

if not writer.isOpened():
    raise RuntimeError("Could not create test video.")

for frame_number in range(total_frames):
    frame = np.zeros(
        (height, width, 3),
        dtype=np.uint8,
    )

    x = 50 + (frame_number * 5) % 500

    cv2.rectangle(
        frame,
        (x, 180),
        (x + 80, 300),
        (255, 255, 255),
        -1,
    )

    cv2.putText(
        frame,
        f"SIH26187 FRAME {frame_number}",
        (100, 100),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.0,
        (255, 255, 255),
        2,
    )

    writer.write(frame)

writer.release()

if not video_path.exists():
    raise RuntimeError("Test video was not created.")

print("SUCCESS: Test video created.")
print("Path:", video_path)
print("Size:", video_path.stat().st_size, "bytes")
print("Frames:", total_frames)
print("FPS:", fps)
print("Resolution:", f"{width}x{height}")
print("Duration:", duration_seconds, "seconds")
