from app.pipeline.image_loader import load_image, InvalidImageError

path = "temp/corrupt_image.jpg"

print("Testing corrupt image...")

try:
    load_image(path)
    print("ERROR: corrupt image was accepted")

except InvalidImageError as exc:
    print("Corrupt image rejected: SUCCESS")
    print("Error:", exc)

except Exception as exc:
    print("ERROR: unexpected exception")
    print("Type:", type(exc).__name__)
    print("Error:", exc)
