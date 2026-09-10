import hashlib
from pathlib import Path
import sys

backend_dir = Path(__file__).resolve().parents[1]
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import numpy as np
import cv2
from fastapi.testclient import TestClient

from app.main import app
from app.pipeline.face_service import face_service
from app.core.config import settings


def test_model_preservation():
    """Ensure user's custom threat detection model best.onnx is 100% untouched."""
    best_model_path = settings.model_directory / "best.onnx"
    assert best_model_path.exists(), "best.onnx must exist in models directory"
    
    # Hash check
    h = hashlib.sha256()
    with open(best_model_path, "rb") as f:
        h.update(f.read())
    computed_hash = h.hexdigest().upper()
    expected_hash = "869AE7F47600FD861D916470D406074BE4F101ED68ED193BBD7AED51F943CA48"
    assert computed_hash == expected_hash, f"best.onnx hash mismatch! Expected {expected_hash}, got {computed_hash}"
    print("[PASS] User's best.onnx model is completely unmodified and intact.")


def test_face_service_initialization():
    """Verify YuNet and SFace models are properly initialized and database is loaded."""
    assert face_service.detector is not None, "YuNet detector must be initialized"
    assert face_service.recognizer is not None, "SFace recognizer must be initialized"
    
    persons = face_service.list_persons()
    assert len(persons) >= 1, "Should have at least 1 enrolled person (Hariom)"
    assert any(p["name"].lower() == "hariom" for p in persons), "Hariom must be present in enrolled persons"
    print(f"[PASS] FaceService initialized successfully with {len(persons)} enrolled person(s).")


def test_face_api_endpoints():
    """Test the REST API endpoints using FastAPI TestClient."""
    client = TestClient(app)
    
    # 1. GET /api/faces
    resp = client.get("/api/faces")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("success") is True
    assert data.get("count") >= 1
    print("[PASS] GET /api/faces returned 200 OK with enrolled persons.")

    # 2. GET /api/faces/status
    resp = client.get("/api/faces/status")
    assert resp.status_code == 200
    status_data = resp.json()
    assert status_data.get("status") == "ready"
    assert status_data.get("detector_loaded") is True
    assert status_data.get("recognizer_loaded") is True
    print("[PASS] GET /api/faces/status returned 200 OK (status=ready).")

    # 3. GET /api/faces/thumbnail/{filename}
    thumb_path = face_service.thumbnails_dir / "person_1788701662_e0faf3.jpg"
    if thumb_path.exists():
        resp = client.get("/api/faces/thumbnail/person_1788701662_e0faf3.jpg")
        assert resp.status_code == 200
        assert resp.headers.get("content-type") == "image/jpeg"
        print("[PASS] GET /api/faces/thumbnail serving image/jpeg successfully.")

    # 4. POST /api/faces/scan with synthetic frame
    dummy_img = np.zeros((320, 320, 3), dtype=np.uint8)
    _, buf = cv2.imencode(".jpg", dummy_img)
    files = {"file": ("test.jpg", buf.tobytes(), "image/jpeg")}
    resp = client.post("/api/faces/scan", files=files)
    assert resp.status_code == 200
    scan_data = resp.json()
    assert scan_data.get("success") is True
    assert "faces" in scan_data
    print("[PASS] POST /api/faces/scan executed successfully.")


if __name__ == "__main__":
    print("Running Facial Recognition Integration Tests...")
    test_model_preservation()
    test_face_service_initialization()
    test_face_api_endpoints()
    print("ALL TESTS PASSED!")
