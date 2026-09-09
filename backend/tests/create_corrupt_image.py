from pathlib import Path

corrupt_path = Path("temp") / "corrupt_image.jpg"

corrupt_path.write_bytes(
    b"This is not a real JPEG image."
)

print("Corrupt test file created:", corrupt_path)
print("File exists:", corrupt_path.exists())
print("File size:", corrupt_path.stat().st_size, "bytes")
