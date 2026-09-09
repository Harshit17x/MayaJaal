import cv2
import numpy as np
from pathlib import Path

image_path = Path("temp") / "test_image.jpg"
image_path.parent.mkdir(parents=True, exist_ok=True)

image = np.zeros((480, 640, 3), dtype=np.uint8)

cv2.rectangle(
    image,
    (100, 100),
    (540, 380),
    (255, 255, 255),
    -1,
)

cv2.putText(
    image,
    "SIH26187 TEST",
    (150, 250),
    cv2.FONT_HERSHEY_SIMPLEX,
    1.5,
    (0, 0, 0),
    3,
)

success = cv2.imwrite(str(image_path), image)

print("Image created:", image_path)
print("Write successful:", success)
print("File exists:", image_path.exists())
print("File size:", image_path.stat().st_size, "bytes")
