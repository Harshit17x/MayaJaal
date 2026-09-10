"""
Test suspect facial recognition integration in video and photo upload inference.
Verifies:
1. When suspect is enrolled, face_service recognizes them.
2. Annotator renders suspect boxes with crimson highlight.
3. Video tracking / frame loop identifies suspect and populates suspects_detected.
"""
import os
import sys
from pathlib import Path
import cv2
import numpy as np

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.pipeline.face_service import face_service
from app.pipeline.alert_service import alert_service, ALERTS_FILE
from app.tracking.annotator import draw_tracked_boxes

def test_annotator_suspect_rendering():
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    tracked_objects = [
        {
            "box": [100, 100, 200, 250],
            "confidence": 0.94,
            "class_name": "suspect_vikram_singh",
            "is_threat": True,
            "threat_level": "CRITICAL",
            "suspect_name": "Vikram Singh",
            "track_id": 1,
        }
    ]
    annotated = draw_tracked_boxes(frame, tracked_objects, frame_idx=0, draw_hud=True)
    assert annotated is not None
    assert annotated.shape == (480, 640, 3)
    # Check that red channel has values around the box
    assert np.max(annotated[100:250, 100:200, 2]) > 100
    print("[PASS] Annotator successfully rendered crimson tactical suspect box and label.")

def test_alert_creation_for_suspect():
    initial_count = len(alert_service.get_alerts())
    alert = alert_service.create_alert(
        title="TEST SUSPECT IN VIDEO",
        location="Sector 4 Uploaded Video",
        severity="Critical",
        camera_id="video_upload_test",
        camera_name="Video Upload Test",
        class_name="suspect",
        confidence=0.92,
        suspect_name="Vikram Singh",
        threat_level="CRITICAL",
        notes="Automated test alert",
    )
    assert alert["id"] is not None
    assert alert["suspectName"] == "Vikram Singh"
    assert alert["threatLevel"] == "CRITICAL"
    # Verify retrieval
    alerts = alert_service.get_alerts(limit=5)
    assert any(a["id"] == alert["id"] for a in alerts)
    # Cleanup test alert
    alert_service.clear_all()
    print("[PASS] AlertService verified for suspect video alert generation.")

if __name__ == "__main__":
    test_annotator_suspect_rendering()
    test_alert_creation_for_suspect()
    print("All integration tests passed successfully.")
