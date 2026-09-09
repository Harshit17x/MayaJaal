import numpy as np
from app.core.resource_manager import ResourceManager
from app.inference.inference_service import InferenceService
from app.inference.model_manager import ModelManager

print("=== INFERENCE SERVICE DETECTION INTEGRATION TEST ===")
print()

model_manager = ModelManager(max_models=2)
resource_manager = ResourceManager(max_concurrent_inference=2)
service = InferenceService(model_manager=model_manager, resource_manager=resource_manager)

# Load existing test model
model_manager.load_model("test_model", "models/test_model.onnx")

# Predict with fallback
res = service.predict(
    model_name="test_model",
    input_data=np.array([[1.0, 2.0, 3.0, 4.0]], dtype=np.float32),
    postprocess=True,
    conf_threshold=0.25,
)

print("Inference result keys:", list(res.keys()))
print("Detections count:", res["detections_count"])
print("Detections:", res["detections"])
print("Status:", res["status"])

assert res["status"] == "success"
assert res["detections_count"] == 0
assert res["detections"] == []
assert len(res["outputs"]) == 1

model_manager.unload_all()
print()
print("INTEGRATION TEST: SUCCESS")
