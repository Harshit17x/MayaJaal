from pathlib import Path

from app.pipeline.image_loader import (
    load_image,
    UnsupportedImageError,
)

path = Path("temp") / "unsupported_image.txt"
path.write_text(
    "This is a text file, not an image.",
    encoding="utf-8",
)

print("Testing unsupported image format...")

try:
    load_image(path)
    print("ERROR: unsupported format was accepted")

except UnsupportedImageError as exc:
    print("Unsupported format rejected: SUCCESS")
    print("Error:", exc)

except Exception as exc:
    print("ERROR: unexpected exception")
    print("Type:", type(exc).__name__)
    print("Error:", exc)
