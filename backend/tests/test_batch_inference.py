"""
Test suite for ONNX Batched Inference (2 to 8 frames at once).
Validates:
1. Preprocessor batch processing ([B, 3, H, W])
2. Postprocessor batch decoding across End-to-End and YOLOv8 models
3. InferenceService predict_batch with models/best.onnx for batch sizes 2, 4, and 8
"""

import sys
import time
from pathlib import Path
import numpy as np

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.pipeline.preprocessor import Preprocessor, PreprocessingConfig
from app.pipeline.postprocessor import Postprocessor, PostprocessorConfig
from app.inference.model_manager import ModelManager
from app.core.resource_manager import ResourceManager
from app.inference.inference_service import InferenceService


def test_batch_preprocessor():
    print("--- Testing Preprocessor Batch Processing ---")
    config = PreprocessingConfig(target_width=640, target_height=640)
    preprocessor = Preprocessor(config)

    for b in [2, 4, 8]:
        frames = [np.random.randint(0, 256, (480, 640, 3), dtype=np.uint8) for _ in range(b)]
        batch_tensor = preprocessor.process_batch(frames)
        assert batch_tensor.shape == (b, 3, 640, 640), f"Expected {(b, 3, 640, 640)}, got {batch_tensor.shape}"
        assert batch_tensor.dtype == np.float32, f"Expected float32, got {batch_tensor.dtype}"
        print(f"  [OK] Batch size {b}: output shape {batch_tensor.shape}")


def test_batch_postprocessor():
    print("\n--- Testing Postprocessor Batch Decoding ---")
    postprocessor = Postprocessor(PostprocessorConfig(conf_threshold=0.25, iou_threshold=0.45))

    # Test 1: End-to-End format [B, 300, 6]
    for b in [2, 4, 8]:
        dummy_e2e = np.zeros((b, 300, 6), dtype=np.float32)
        # Put 1 detection in frame 0 and 2 detections in frame 1
        dummy_e2e[0, 0] = [10, 10, 100, 100, 0.85, 0]
        if b > 1:
            dummy_e2e[1, 0] = [50, 50, 150, 150, 0.90, 0]
            dummy_e2e[1, 1] = [200, 200, 300, 300, 0.75, 1]

        orig_sizes = [(1920, 1080) for _ in range(b)]
        decoded = postprocessor.decode_batch(
            outputs=[dummy_e2e],
            model_input_size=(640, 640),
            original_image_sizes=orig_sizes,
        )
        assert len(decoded) == b, f"Expected {b} frame results, got {len(decoded)}"
        assert len(decoded[0]) == 1, f"Expected 1 detection in frame 0, got {len(decoded[0])}"
        if b > 1:
            assert len(decoded[1]) == 2, f"Expected 2 detections in frame 1, got {len(decoded[1])}"
        print(f"  [OK] End-to-End decode batch size {b}: {len(decoded)} frame results")

    # Test 2: YOLOv8 format [B, 4 + C, 8400]
    for b in [2, 4, 8]:
        num_classes = 80
        num_anchors = 8400
        dummy_yolo = np.zeros((b, 4 + num_classes, num_anchors), dtype=np.float32)
        # Put high confidence detection at anchor 10 in frame 0
        dummy_yolo[0, 0, 10] = 320.0  # cx
        dummy_yolo[0, 1, 10] = 320.0  # cy
        dummy_yolo[0, 2, 10] = 100.0  # w
        dummy_yolo[0, 3, 10] = 100.0  # h
        dummy_yolo[0, 4, 10] = 0.95   # class 0 score

        orig_sizes = [(1280, 720) for _ in range(b)]
        decoded = postprocessor.decode_batch(
            outputs=[dummy_yolo],
            model_input_size=(640, 640),
            original_image_sizes=orig_sizes,
        )
        assert len(decoded) == b, f"Expected {b} frame results, got {len(decoded)}"
        assert len(decoded[0]) >= 1, f"Expected at least 1 detection in frame 0, got {len(decoded[0])}"
        print(f"  [OK] YOLOv8 decode batch size {b}: {len(decoded)} frame results")


def test_live_onnx_model_batch_inference():
    print("\n--- Testing Live ONNX Model Batched Inference ---")
    model_path = backend_dir / "models" / "best.onnx"
    if not model_path.exists():
        print(f"  [SKIP] Model not found at {model_path}")
        return

    resource_mgr = ResourceManager(max_concurrent_inference=8)
    model_mgr = ModelManager()
    model_mgr.load_model("best", model_path)
    inference_svc = InferenceService(model_manager=model_mgr, resource_manager=resource_mgr)

    preprocessor = Preprocessor(PreprocessingConfig(target_width=640, target_height=640))

    for b in [2, 4, 8]:
        frames = [np.random.randint(0, 256, (720, 1280, 3), dtype=np.uint8) for _ in range(b)]
        batch_tensor = preprocessor.process_batch(frames)

        t0 = time.perf_counter()
        result = inference_svc.predict_batch(
            model_name="best",
            input_data=batch_tensor,
            postprocess=True,
            original_image_sizes=[(1280, 720) for _ in range(b)],
        )
        dt = (time.perf_counter() - t0) * 1000

        assert result["status"] == "success"
        assert result["batch_size"] == b
        assert len(result["batch_detections"]) == b
        per_frame = dt / b
        print(f"  [OK] Batch {b} frames: total {dt:.1f}ms, per-frame {per_frame:.1f}ms, result batch size {result['batch_size']}")


if __name__ == "__main__":
    test_batch_preprocessor()
    test_batch_postprocessor()
    test_live_onnx_model_batch_inference()
    print("\n=== ALL ONNX BATCH INFERENCE TESTS PASSED ===")
