from app.pipeline.image_loader import load_image, ImageFileNotFoundError

path = "temp/this_image_does_not_exist.jpg"

print("Testing missing image...")

try:
    load_image(path)
    print("ERROR: missing image was accepted")

except ImageFileNotFoundError as exc:
    print("Missing image rejected: SUCCESS")
    print("Error:", exc)

except Exception as exc:
    print("ERROR: unexpected exception")
    print("Type:", type(exc).__name__)
    print("Error:", exc)
