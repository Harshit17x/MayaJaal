import numpy as np

from app.core.resource_manager import ResourceManager
from app.inference.inference_service import (
    InferenceService,
    InferenceServiceError,
)
from app.inference.model_manager import (
    ModelManager,
    ModelNotFoundError,
)


print("=== INFERENCE SERVICE TEST ===")
print()

model_manager = ModelManager(
    max_models=4,
    intra_op_threads=2,
    inter_op_threads=1,
)

resource_manager = ResourceManager(
    max_concurrent_inference=2,
)

service = InferenceService(
    model_manager=model_manager,
    resource_manager=resource_manager,
    inference_timeout_seconds=30,
)

passed = 0
total = 4

# 1. Load test model
try:
    result = model_manager.load_model(
        model_name="test_model",
        model_path="models/test_model.onnx",
    )

    print("1. Model loading: SUCCESS")
    print("   Model:", result["model_name"])
    passed += 1

except Exception as exc:
    print("1. Model loading: FAILED")
    print("   Error:", type(exc).__name__, exc)

print()

# 2. Successful inference
try:
    input_data = np.array(
        [[1.0, -2.0, 3.0, -4.0]],
        dtype=np.float32,
    )

    result = service.predict(
        model_name="test_model",
        input_data=input_data,
        input_name="input",
    )

    print("2. Successful inference: SUCCESS")
    print("   Status:", result["status"])
    print("   Latency:", result["latency_seconds"], "seconds")
    print("   Input:", result["input"])
    print("   Outputs:", result["outputs"])
    passed += 1

except Exception as exc:
    print("2. Successful inference: FAILED")
    print("   Error:", type(exc).__name__, exc)

print()

# 3. Missing model handling
try:
    service.predict(
        model_name="does_not_exist",
        input_data=np.ones(
            (1, 4),
            dtype=np.float32,
        ),
        input_name="input",
    )

    print("3. Missing model handling: FAILED")

except ModelNotFoundError as exc:
    print("3. Missing model handling: SUCCESS")
    print("   Error:", exc)
    passed += 1

print()

# 4. Invalid input handling
try:
    service.predict(
        model_name="test_model",
        input_data=np.array([]),
        input_name="input",
    )

    print("4. Invalid input handling: FAILED")

except InferenceServiceError as exc:
    print("4. Invalid input handling: SUCCESS")
    print("   Error:", exc)
    passed += 1

print()

print("=== RESULT ===")
print(f"Passed: {passed}/{total}")

model_manager.unload_all()

if passed == total:
    print("ALL INFERENCE SERVICE TESTS: SUCCESS")
else:
    print("INFERENCE SERVICE TESTS: FAILED")
