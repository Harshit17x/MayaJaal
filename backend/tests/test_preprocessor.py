import numpy as np

from app.pipeline.preprocessor import (
    Preprocessor,
    PreprocessingConfig,
    InvalidFrameError,
    InvalidTargetSizeError,
    PreprocessingError,
)

print("=== PREPROCESSING COMPLETE TEST ===")
print()

passed = 0
total = 6

# Valid configuration
try:
    config = PreprocessingConfig(
        target_width=224,
        target_height=224,
        convert_bgr_to_rgb=True,
        normalize=False,
        channel_first=True,
        add_batch_dimension=True,
    )

    preprocessor = Preprocessor(config)

    frame = np.zeros(
        (480, 640, 3),
        dtype=np.uint8,
    )

    tensor = preprocessor.process(frame)

    print("1. Valid frame processing: SUCCESS")
    print("   Input shape:", frame.shape)
    print("   Output shape:", tensor.shape)
    print("   Output dtype:", tensor.dtype)

    if tensor.shape == (1, 3, 224, 224):
        print("   Tensor shape verification: SUCCESS")
        passed += 1
    else:
        print("   Tensor shape verification: FAILED")

except Exception as exc:
    print("1. Valid frame processing: FAILED")
    print("   Error:", type(exc).__name__, exc)

print()

# Empty frame
try:
    preprocessor.process(
        np.empty((0, 0, 3), dtype=np.uint8)
    )
    print("2. Empty frame rejection: FAILED")
except InvalidFrameError as exc:
    print("2. Empty frame rejection: SUCCESS")
    print("   Error:", exc)
    passed += 1

print()

# Wrong dimensions
try:
    preprocessor.process(
        np.zeros((480, 640), dtype=np.uint8)
    )
    print("3. Invalid dimensions rejection: FAILED")
except InvalidFrameError as exc:
    print("3. Invalid dimensions rejection: SUCCESS")
    print("   Error:", exc)
    passed += 1

print()

# Wrong channel count
try:
    preprocessor.process(
        np.zeros((480, 640, 4), dtype=np.uint8)
    )
    print("4. Invalid channel rejection: FAILED")
except InvalidFrameError as exc:
    print("4. Invalid channel rejection: SUCCESS")
    print("   Error:", exc)
    passed += 1

print()

# Invalid target size
try:
    Preprocessor(
        PreprocessingConfig(
            target_width=0,
            target_height=224,
        )
    )
    print("5. Invalid target size rejection: FAILED")
except InvalidTargetSizeError as exc:
    print("5. Invalid target size rejection: SUCCESS")
    print("   Error:", exc)
    passed += 1

print()

# Invalid normalization configuration
try:
    Preprocessor(
        PreprocessingConfig(
            target_width=224,
            target_height=224,
            normalize=True,
            std=(1.0, 0.0, 1.0),
        )
    )
    print("6. Invalid normalization rejection: FAILED")
except PreprocessingError as exc:
    print("6. Invalid normalization rejection: SUCCESS")
    print("   Error:", exc)
    passed += 1

print()
print("=== RESULT ===")
print(f"Passed: {passed}/{total}")

if passed == total:
    print("ALL PREPROCESSING TESTS: SUCCESS")
else:
    print("PREPROCESSING TESTS: FAILED")
