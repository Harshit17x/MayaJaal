from __future__ import annotations

import sys
from pathlib import Path

# Add backend directory to python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import time
import unittest
import cv2
import numpy as np
from starlette.testclient import TestClient

from app.main import app
from app.pipeline.thermal_fusion_service import (
    FusedTarget,
    RadiometricCalibration,
    ThermalPalette,
    ThermalFusionService,
    thermal_fusion_service,
)


class TestThermalFusion(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)

    def test_thermal_palettes_generation(self):
        """Verify all radiometric palettes transform a sample frame and produce valid 3-channel BGR outputs."""
        h, w = 240, 320
        # Create synthetic optical frame with gradient and bright spots
        sample_bgr = np.zeros((h, w, 3), dtype=np.uint8)
        sample_bgr[:, :] = (30, 40, 50)
        # Bright spot simulating body / vehicle heat
        cv2.circle(sample_bgr, (160, 120), 30, (220, 220, 220), -1)

        palettes = [
            ThermalPalette.WHITE_HOT,
            ThermalPalette.BLACK_HOT,
            ThermalPalette.IRONBOW,
            ThermalPalette.NVG_GREEN,
            ThermalPalette.AMBER_PHOSPHOR,
            ThermalPalette.MSX_FUSION,
        ]

        for p in palettes:
            t0 = time.perf_counter()
            out = thermal_fusion_service.apply_palette(sample_bgr, palette=p)
            dt = (time.perf_counter() - t0) * 1000.0

            self.assertIsNotNone(out, f"Palette {p} produced None")
            self.assertEqual(out.shape, (h, w, 3), f"Palette {p} produced invalid shape: {out.shape}")
            self.assertEqual(out.dtype, np.uint8, f"Palette {p} output dtype should be uint8")
            self.assertLess(dt, 25.0, f"Palette {p} took {dt:.2f}ms which is too slow")

    def test_msx_edge_extraction_and_fusion(self):
        """Verify FLIR MSX detail fusion injects optical physical contours into thermal image."""
        h, w = 200, 300
        optical = np.zeros((h, w, 3), dtype=np.uint8)
        # Draw high-contrast fence grid
        for x in range(0, w, 40):
            cv2.line(optical, (x, 0), (x, h), (255, 255, 255), 2)

        thermal = np.full((h, w, 3), (40, 20, 180), dtype=np.uint8)  # Flat thermal heat tone

        fused = thermal_fusion_service.fuse_msx_detail(optical, thermal)
        self.assertEqual(fused.shape, (h, w, 3))
        # Where edges were present, the pixel values should be modified (darkened contours)
        self.assertFalse(np.array_equal(fused, thermal), "MSX fusion should modify pixels at optical edge locations")

    def test_radiometric_temperature_estimation(self):
        """Verify spot temperature calculation and human body radiometric analysis."""
        frame = np.full((200, 200, 3), 100, dtype=np.uint8)
        # Center spot at pixel intensity 215 (simulating core human body)
        cv2.circle(frame, (100, 100), 10, (215, 215, 215), -1)

        spot_temp = thermal_fusion_service.estimate_spot_temperature(frame, 100, 100)
        self.assertTrue(34.0 <= spot_temp <= 85.0, f"Spot temp {spot_temp}°C outside realistic bounds")

        temp, is_warm, intensity = thermal_fusion_service.analyze_bbox_radiometrics(
            frame, [90, 90, 110, 110], class_name="person"
        )
        self.assertTrue(is_warm)
        self.assertTrue(32.0 <= temp <= 39.5, f"Calibrated human temp {temp}°C should be within body range")

    def test_synthetic_thermal_simulator(self):
        """Verify that optical frame can be transformed into simulated FLIR radiometric image."""
        optical = np.full((300, 400, 3), 50, dtype=np.uint8)
        detections = [{"box": [150, 100, 250, 250], "class_name": "person", "confidence": 0.88}]

        simulated = thermal_fusion_service.simulate_thermal_from_optical(
            optical, detections=detections, palette=ThermalPalette.IRONBOW
        )
        self.assertEqual(simulated.shape, (300, 400, 3))
        self.assertEqual(simulated.dtype, np.uint8)

    def test_cross_spectral_decision_fusion(self):
        """Verify Bayesian confidence boosting and status assignment in cross-spectral target fusion."""
        h, w = 300, 300
        dummy_thermal = np.full((h, w, 3), 120, dtype=np.uint8)

        opt_dets = [
            {"box": [50.0, 50.0, 120.0, 180.0], "class_name": "person", "confidence": 0.60},
            {"box": [200.0, 20.0, 280.0, 100.0], "class_name": "car", "confidence": 0.70},
        ]

        thm_dets = [
            {"box": [52.0, 48.0, 122.0, 178.0], "class_name": "person", "confidence": 0.80},
            {"box": [10.0, 200.0, 80.0, 280.0], "class_name": "person", "confidence": 0.75},
        ]

        fused = thermal_fusion_service.fuse_detections(opt_dets, thm_dets, dummy_thermal, iou_threshold=0.30)

        # 3 targets: 1 DUAL_CONFIRMED, 1 OPTICAL_ONLY (car), 1 THERMAL_ONLY (hidden person)
        self.assertEqual(len(fused), 3)

        statuses = {t.spectrum_status for t in fused}
        self.assertIn("DUAL_CONFIRMED", statuses)
        self.assertIn("OPTICAL_ONLY", statuses)
        self.assertIn("THERMAL_ONLY", statuses)

        # Find the DUAL_CONFIRMED target and check confidence boost:
        # P = 1 - (1 - 0.60)*(1 - 0.80) = 1 - 0.40 * 0.20 = 0.92
        dual_target = next(t for t in fused if t.spectrum_status == "DUAL_CONFIRMED")
        self.assertGreaterEqual(dual_target.fused_confidence, 0.90)

    def test_thermal_api_endpoints(self):
        """Test FastAPI thermal REST endpoints."""
        # 1. GET /api/thermal/palettes
        res = self.client.get("/api/thermal/palettes")
        self.assertEqual(res.status_code, 200)
        palettes = res.json()
        self.assertGreaterEqual(len(palettes), 6)
        palette_ids = [p["id"] for p in palettes]
        self.assertIn("ironbow", palette_ids)
        self.assertIn("white_hot", palette_ids)
        self.assertIn("nvg_green", palette_ids)

        # 2. GET /api/thermal/spot-temp
        res_temp = self.client.get("/api/thermal/spot-temp?intensity=200")
        self.assertEqual(res_temp.status_code, 200)
        data = res_temp.json()
        self.assertIn("temp_celsius", data)
        self.assertGreater(data["temp_celsius"], 0)

        # 3. POST /api/thermal/fuse-images
        dummy_img = np.zeros((100, 100, 3), dtype=np.uint8)
        _, encoded = cv2.imencode(".jpg", dummy_img)
        files = {"optical_file": ("test.jpg", encoded.tobytes(), "image/jpeg")}
        data_form = {"palette": "ironbow", "fusion_mode": "msx"}

        fuse_res = self.client.post("/api/thermal/fuse-images", files=files, data=data_form)
        self.assertEqual(fuse_res.status_code, 200)
        fuse_data = fuse_res.json()
        self.assertEqual(fuse_data["status"], "success")
        self.assertIn("fused_image_base64", fuse_data)
        self.assertIn("radiometrics", fuse_data)


if __name__ == "__main__":
    unittest.main()
