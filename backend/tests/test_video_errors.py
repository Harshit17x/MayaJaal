from pathlib import Path

from app.pipeline.video_loader import (
    VideoLoader,
    VideoFileNotFoundError,
    UnsupportedVideoError,
    InvalidVideoError,
)

temp = Path("temp")
temp.mkdir(parents=True, exist_ok=True)

print("=== VIDEO ERROR HANDLING TEST ===")
print()

tests_passed = 0
tests_total = 4

# 1. Missing video
try:
    VideoLoader(temp / "does_not_exist.mp4")
    print("1. Missing video: FAILED")
except VideoFileNotFoundError as exc:
    print("1. Missing video: SUCCESS")
    print("   Error:", exc)
    tests_passed += 1
except Exception as exc:
    print("1. Missing video: FAILED")
    print("   Unexpected:", type(exc).__name__, exc)

print()

# 2. Unsupported extension
unsupported = temp / "unsupported_video.txt"
unsupported.write_text("not a video", encoding="utf-8")

try:
    VideoLoader(unsupported)
    print("2. Unsupported format: FAILED")
except UnsupportedVideoError as exc:
    print("2. Unsupported format: SUCCESS")
    print("   Error:", exc)
    tests_passed += 1
except Exception as exc:
    print("2. Unsupported format: FAILED")
    print("   Unexpected:", type(exc).__name__, exc)

print()

# 3. Empty video
empty_video = temp / "empty_video.mp4"
empty_video.write_bytes(b"")

try:
    VideoLoader(empty_video)
    print("3. Empty video: FAILED")
except InvalidVideoError as exc:
    print("3. Empty video: SUCCESS")
    print("   Error:", exc)
    tests_passed += 1
except Exception as exc:
    print("3. Empty video: FAILED")
    print("   Unexpected:", type(exc).__name__, exc)

print()

# 4. Corrupt video
corrupt_video = temp / "corrupt_video.mp4"
corrupt_video.write_bytes(
    b"This is not a valid MP4 video file."
)

try:
    VideoLoader(corrupt_video)
    print("4. Corrupt video: FAILED")
except InvalidVideoError as exc:
    print("4. Corrupt video: SUCCESS")
    print("   Error:", exc)
    tests_passed += 1
except Exception as exc:
    print("4. Corrupt video: FAILED")
    print("   Unexpected:", type(exc).__name__, exc)

print()
print("=== RESULT ===")
print(f"Passed: {tests_passed}/{tests_total}")

if tests_passed == tests_total:
    print("ALL VIDEO ERROR TESTS: SUCCESS")
else:
    print("VIDEO ERROR TESTS: FAILED")
