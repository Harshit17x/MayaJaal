import numpy as np

from app.pipeline.postprocessor import (
    Postprocessor,
    PostprocessorConfig,
    Detection,
    COCO_CLASSES,
)

print("=== POSTPROCESSOR DECODER TEST ===")
print()

passed = 0
total = 6

# -------------------------------------------------------------
# Test 1: YOLOv8 format decoding [1, 4 + C, N]
# -------------------------------------------------------------
try:
    config = PostprocessorConfig(conf_threshold=0.25, iou_threshold=0.45)
    postprocessor = Postprocessor(config)

    # 80 classes + 4 box coordinates = 84 features, 5 anchors
    yolov8_output = np.zeros((1, 84, 5), dtype=np.float32)

    # Anchor 0: person (class 0) at center (100, 100) with width 50, height 80, conf 0.9
    yolov8_output[0, 0, 0] = 100.0  # cx
    yolov8_output[0, 1, 0] = 100.0  # cy
    yolov8_output[0, 2, 0] = 50.0   # w
    yolov8_output[0, 3, 0] = 80.0   # h
    yolov8_output[0, 4, 0] = 0.9    # class 0 score

    # Anchor 1: car (class 2) at center (300, 200) with width 120, height 90, conf 0.85
    yolov8_output[0, 0, 1] = 300.0  # cx
    yolov8_output[0, 1, 1] = 200.0  # cy
    yolov8_output[0, 2, 1] = 120.0  # w
    yolov8_output[0, 3, 1] = 90.0   # h
    yolov8_output[0, 6, 1] = 0.85   # class 2 score (index 4 + 2 = 6)

    # Anchor 2: low confidence noise (conf 0.1) -> should be filtered out
    yolov8_output[0, 0, 2] = 50.0
    yolov8_output[0, 1, 2] = 50.0
    yolov8_output[0, 2, 2] = 20.0
    yolov8_output[0, 3, 2] = 20.0
    yolov8_output[0, 4, 2] = 0.1

    detections = postprocessor.decode([yolov8_output])

    print("1. YOLOv8 format decoding: SUCCESS")
    print(f"   Detections count: {len(detections)}")
    for d in detections:
        print(f"   - {d['class_name']}: box={d['box']}, conf={d['confidence']}")

    assert len(detections) == 2, f"Expected 2 detections, got {len(detections)}"
    assert detections[0]["class_name"] == "person"
    assert detections[1]["class_name"] == "car"
    passed += 1

except Exception as exc:
    print(f"1. YOLOv8 format decoding: FAILED ({exc})")

print()

# -------------------------------------------------------------
# Test 2: Bounding box coordinate conversion [cx, cy, w, h] -> [x1, y1, x2, y2]
# -------------------------------------------------------------
try:
    # From Anchor 0 above: cx=100, cy=100, w=50, h=80
    # x1 = 100 - 25 = 75
    # y1 = 100 - 40 = 60
    # x2 = 100 + 25 = 125
    # y2 = 100 + 40 = 140
    person_box = detections[0]["box"]
    expected_box = [75.0, 60.0, 125.0, 140.0]

    np.testing.assert_allclose(person_box, expected_box, rtol=1e-3)
    print("2. Coordinate conversion: SUCCESS")
    print(f"   Decoded box: {person_box} matches expected {expected_box}")
    passed += 1

except Exception as exc:
    print(f"2. Coordinate conversion: FAILED ({exc})")

print()

# -------------------------------------------------------------
# Test 3: Coordinate rescaling to original image resolution
# -------------------------------------------------------------
try:
    # Model input is 640x640, original CCTV frame is 1920x1080
    rescaled_detections = postprocessor.decode(
        outputs=[yolov8_output],
        model_input_size=(640, 640),
        original_image_size=(1920, 1080),
    )

    # Scale factors: sx = 1920/640 = 3.0, sy = 1080/640 = 1.6875
    # person x1: 75 * 3.0 = 225.0, y1: 60 * 1.6875 = 101.25
    scaled_person_box = rescaled_detections[0]["box"]
    print("3. Coordinate rescaling: SUCCESS")
    print(f"   Original 640x640 box: {person_box}")
    print(f"   Rescaled 1920x1080 box: {scaled_person_box}")
    assert scaled_person_box[0] == 225.0
    passed += 1

except Exception as exc:
    print(f"3. Coordinate rescaling: FAILED ({exc})")

print()

# -------------------------------------------------------------
# Test 4: YOLOv5 format decoding [1, N, 5 + C]
# -------------------------------------------------------------
try:
    # 5 anchors, 5 + 80 = 85 features
    yolov5_output = np.zeros((1, 5, 85), dtype=np.float32)

    # Anchor 0: person (class 0), obj_conf = 0.95, class_conf = 0.9 -> total = 0.855
    yolov5_output[0, 0, 0] = 50.0   # cx
    yolov5_output[0, 0, 1] = 50.0   # cy
    yolov5_output[0, 0, 2] = 30.0   # w
    yolov5_output[0, 0, 3] = 60.0   # h
    yolov5_output[0, 0, 4] = 0.95   # objectness
    yolov5_output[0, 0, 5] = 0.9    # class 0 probability

    yolo5_dets = postprocessor.decode([yolov5_output])

    print("4. YOLOv5 format decoding: SUCCESS")
    print(f"   Detections count: {len(yolo5_dets)}")
    assert len(yolo5_dets) == 1
    assert yolo5_dets[0]["class_name"] == "person"
    assert np.isclose(yolo5_dets[0]["confidence"], 0.855, atol=1e-2)
    passed += 1

except Exception as exc:
    print(f"4. YOLOv5 format decoding: FAILED ({exc})")

print()

# -------------------------------------------------------------
# Test 5: NMS deduplication of overlapping duplicate boxes
# -------------------------------------------------------------
try:
    # Two overlapping boxes for the same object
    nms_output = np.zeros((1, 84, 2), dtype=np.float32)
    # Box 1: high confidence 0.95
    nms_output[0, :4, 0] = [100.0, 100.0, 50.0, 50.0]
    nms_output[0, 4, 0] = 0.95

    # Box 2: slightly shifted, lower confidence 0.80 (IoU > 0.8)
    nms_output[0, :4, 1] = [102.0, 101.0, 49.0, 51.0]
    nms_output[0, 4, 1] = 0.80

    nms_dets = postprocessor.decode([nms_output])
    print("5. NMS deduplication: SUCCESS")
    print(f"   Boxes before NMS: 2 -> Boxes after NMS: {len(nms_dets)}")
    assert len(nms_dets) == 1, f"NMS should suppress duplicate, got {len(nms_dets)}"
    assert nms_dets[0]["confidence"] == 0.95
    passed += 1

except Exception as exc:
    print(f"5. NMS deduplication: FAILED ({exc})")

print()

# -------------------------------------------------------------
# Test 6: Fallback on non-detection models (backward compatibility)
# -------------------------------------------------------------
try:
    # Simple 1D or 2D tensor (like test_model output [1, 4])
    non_det_output = np.array([[1.0, 2.0, 3.0, 4.0]], dtype=np.float32)

    fallback_dets = postprocessor.decode([non_det_output])
    print("6. Fallback on non-detection output: SUCCESS")
    print(f"   Detections returned: {fallback_dets}")
    assert fallback_dets == [], "Non-detection tensor should return empty detections list"
    passed += 1

except Exception as exc:
    print(f"6. Fallback on non-detection output: FAILED ({exc})")

print()
print("=== RESULT ===")
print(f"Passed: {passed}/{total}")

if passed == total:
    print("ALL POSTPROCESSOR TESTS: SUCCESS")
else:
    print("SOME TESTS FAILED")
