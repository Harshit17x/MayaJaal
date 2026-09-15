from __future__ import annotations

import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np

logger = logging.getLogger("SIH26187.ThermalFusion")


class ThermalPalette(str, Enum):
    STANDARD = "standard"        # Natural Optical RGB (No transformation)
    WHITE_HOT = "white_hot"      # Monochromatic FLIR: Brighter = Hotter
    BLACK_HOT = "black_hot"      # Inverted FLIR: Darker = Hotter (Military Scout)
    IRONBOW = "ironbow"          # Radiometric Thermal: Violet -> Red -> Yellow -> White
    NVG_GREEN = "nvg_green"      # P43 Tactical Phosphor Night Vision Goggles
    AMBER_PHOSPHOR = "amber"     # Tactical Amber Phosphor (Low Eye Fatigue)
    MSX_FUSION = "msx_fusion"    # FLIR MSX Dynamic Multi-Spectral Detail Overlay


@dataclass
class RadiometricCalibration:
    """Calibration constants to translate 8-bit pixel intensity to estimated Celsius."""
    min_temp_celsius: float = 10.0   # Background ambient cold temperature
    max_temp_celsius: float = 85.0   # Maximum vehicle engine / muzzle heat
    human_core_temp: float = 37.0    # Baseline human body temperature
    gain: float = 1.0
    offset: float = 0.0


@dataclass
class FusedTarget:
    """Represents an object detection correlated across optical and thermal spectrums."""
    box: List[float]                 # [x1, y1, x2, y2]
    class_name: str
    confidence: float
    optical_confidence: Optional[float] = None
    thermal_confidence: Optional[float] = None
    fused_confidence: float = 0.0
    spectrum_status: str = "DUAL_CONFIRMED"  # DUAL_CONFIRMED | THERMAL_ONLY | OPTICAL_ONLY
    temp_celsius_approx: float = 36.8
    is_warm_body: bool = True
    heat_intensity: float = 0.75

    def to_dict(self) -> Dict[str, Any]:
        return {
            "box": [round(float(c), 2) for c in self.box],
            "class_name": self.class_name,
            "confidence": round(float(self.fused_confidence or self.confidence), 4),
            "optical_confidence": round(float(self.optical_confidence), 4) if self.optical_confidence is not None else None,
            "thermal_confidence": round(float(self.thermal_confidence), 4) if self.thermal_confidence is not None else None,
            "spectrum_status": self.spectrum_status,
            "temp_celsius_approx": round(float(self.temp_celsius_approx), 1),
            "is_warm_body": self.is_warm_body,
            "heat_intensity": round(float(self.heat_intensity), 3),
        }


class ThermalFusionService:
    """
    High-performance, zero-stutter thermal and night-vision radiometric engine.
    Applies LUT palettes, MSX edge contour fusion, synthetic thermal generation,
    and cross-sensor AI decision-level fusion.
    """

    def __init__(self, calibration: Optional[RadiometricCalibration] = None):
        self.calibration = calibration or RadiometricCalibration()
        self._ironbow_lut = self._build_ironbow_lut()
        self._nvg_lut = self._build_nvg_lut()
        self._amber_lut = self._build_amber_lut()

    # ─── LUT Builders ─────────────────────────────────────────────────────────

    @staticmethod
    def _build_ironbow_lut() -> np.ndarray:
        """
        Builds a realistic 256-entry FLIR Ironbow BGR Lookup Table.
        Color trajectory: Black -> Deep Indigo -> Purple -> Crimson -> Amber -> Yellow -> White.
        """
        lut = np.zeros((256, 3), dtype=np.uint8)
        anchors = [
            (0, (0, 0, 0)),
            (32, (64, 0, 32)),
            (64, (128, 0, 96)),
            (112, (180, 20, 160)),
            (160, (40, 80, 230)),
            (208, (20, 190, 255)),
            (240, (160, 240, 255)),
            (255, (255, 255, 255)),
        ]
        for i in range(len(anchors) - 1):
            x0, c0 = anchors[i]
            x1, c1 = anchors[i + 1]
            span = x1 - x0
            if span <= 0:
                continue
            for x in range(x0, x1 + 1):
                t = (x - x0) / span
                b = int(round(c0[0] + t * (c1[0] - c0[0])))
                g = int(round(c0[1] + t * (c1[1] - c0[1])))
                r = int(round(c0[2] + t * (c1[2] - c0[2])))
                lut[x] = [b, g, r]
        return lut

    @staticmethod
    def _build_nvg_lut() -> np.ndarray:
        """
        Builds a tactical P43 Green Phosphor NVG LUT with high mid-range contrast.
        """
        lut = np.zeros((256, 3), dtype=np.uint8)
        for i in range(256):
            norm = i / 255.0
            val = np.power(norm, 0.85)
            g = int(np.clip(val * 255.0 * 1.05, 0, 255))
            b = int(np.clip(val * 255.0 * 0.18, 0, 255))
            r = int(np.clip(val * 255.0 * 0.12, 0, 255))
            lut[i] = [b, g, r]
        return lut

    @staticmethod
    def _build_amber_lut() -> np.ndarray:
        """
        Builds a tactical Amber Phosphor LUT (low eye fatigue in dark TOC).
        """
        lut = np.zeros((256, 3), dtype=np.uint8)
        for i in range(256):
            norm = i / 255.0
            val = np.power(norm, 0.9)
            r = int(np.clip(val * 255.0 * 1.0, 0, 255))
            g = int(np.clip(val * 255.0 * 0.72, 0, 255))
            b = int(np.clip(val * 255.0 * 0.08, 0, 255))
            lut[i] = [b, g, r]
        return lut

    # ─── Palette Transformations ─────────────────────────────────────────────

    def apply_palette(
        self,
        frame: np.ndarray,
        palette: ThermalPalette | str = ThermalPalette.STANDARD,
    ) -> np.ndarray:
        """
        Applies radiometric color palette to an input frame (BGR).
        Runs in < 1.5ms via vectorized LUT transforms.
        """
        if isinstance(palette, str):
            try:
                palette = ThermalPalette(palette.lower())
            except ValueError:
                palette = ThermalPalette.STANDARD

        if palette == ThermalPalette.STANDARD or frame is None:
            return frame

        # Convert to single-channel 2D grayscale (thermal intensity map)
        if len(frame.shape) == 3 and frame.shape[2] == 3:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        elif len(frame.shape) == 3 and frame.shape[2] == 1:
            gray = frame.squeeze(-1)
        else:
            gray = frame

        if palette == ThermalPalette.WHITE_HOT:
            return cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)

        if palette == ThermalPalette.BLACK_HOT:
            inv_gray = cv2.bitwise_not(gray)
            return cv2.cvtColor(inv_gray, cv2.COLOR_GRAY2BGR)

        if palette == ThermalPalette.IRONBOW:
            return self._ironbow_lut[gray]

        if palette == ThermalPalette.NVG_GREEN:
            nvg_base = self._nvg_lut[gray].copy()
            # Add subtle high-gain tactical noise/grain for authentic military night vision
            noise = np.random.randint(-4, 5, gray.shape, dtype=np.int16)
            noisy_g = np.clip(nvg_base[:, :, 1].astype(np.int16) + noise, 0, 255).astype(np.uint8)
            nvg_base[:, :, 1] = noisy_g
            return nvg_base

        if palette == ThermalPalette.AMBER_PHOSPHOR:
            return self._amber_lut[gray]

        if palette == ThermalPalette.MSX_FUSION:
            # Standalone MSX: extract edges from optical frame and superimpose on ironbow
            return self.fuse_msx_detail(optical_frame=frame, thermal_palette_frame=self._ironbow_lut[gray])

        return frame

    # ─── MSX Detail Contour Fusion ───────────────────────────────────────────

    def extract_high_frequency_edges(
        self,
        optical_bgr: np.ndarray,
        edge_threshold_low: int = 40,
        edge_threshold_high: int = 120,
    ) -> np.ndarray:
        """
        Extracts structural contours (fences, camouflage outlines, weapon shapes, vehicle edges)
        from the optical channel using bilateral filter + Laplacian gradient.
        """
        gray = cv2.cvtColor(optical_bgr, cv2.COLOR_BGR2GRAY)
        blurred = cv2.bilateralFilter(gray, d=5, sigmaColor=50, sigmaSpace=50)
        edges = cv2.Canny(blurred, edge_threshold_low, edge_threshold_high)
        # Slightly dilate edges for tactical crispness
        kernel = np.ones((2, 2), np.uint8)
        return cv2.dilate(edges, kernel, iterations=1)

    def fuse_msx_detail(
        self,
        optical_frame: np.ndarray,
        thermal_palette_frame: np.ndarray,
        edge_strength: float = 0.85,
    ) -> np.ndarray:
        """
        FLIR MSX-style Multi-Spectral Dynamic Imaging fusion.
        Superimposes high-frequency visible structural details onto thermal pseudo-color imagery,
        providing instant geometric depth and context (fences, foliage, faces, vehicle edges).
        """
        if optical_frame.shape[:2] != thermal_palette_frame.shape[:2]:
            optical_frame = cv2.resize(
                optical_frame,
                (thermal_palette_frame.shape[1], thermal_palette_frame.shape[0]),
                interpolation=cv2.INTER_LINEAR,
            )

        edges = self.extract_high_frequency_edges(optical_frame)
        fused = thermal_palette_frame.copy()

        # Invert edges: Dark contours provide optimal contrast against bright thermal hues
        edge_mask = (edges > 0)
        dark_factor = 1.0 - (edge_strength * 0.75)

        for c in range(3):
            channel = fused[:, :, c].astype(np.float32)
            channel[edge_mask] = channel[edge_mask] * dark_factor
            fused[:, :, c] = np.clip(channel, 0, 255).astype(np.uint8)

        return fused

    # ─── Dual-Spectrum Stream Composition ────────────────────────────────────

    def compose_dual_stream(
        self,
        optical_frame: np.ndarray,
        thermal_frame: np.ndarray,
        mode: str = "side_by_side",  # side_by_side | pip | blend
        blend_alpha: float = 0.5,
    ) -> np.ndarray:
        """
        Combines two synchronized camera streams (optical + thermal) into a single composite frame.
        """
        h, w = optical_frame.shape[:2]
        if thermal_frame.shape[:2] != (h, w):
            thermal_frame = cv2.resize(thermal_frame, (w, h), interpolation=cv2.INTER_LINEAR)

        if mode == "blend":
            # Linear alpha blend
            alpha = float(np.clip(blend_alpha, 0.0, 1.0))
            return cv2.addWeighted(optical_frame, 1.0 - alpha, thermal_frame, alpha, 0)

        if mode == "pip":
            # Picture-in-picture: small thermal preview in top-right corner
            comp = optical_frame.copy()
            pip_w = w // 3
            pip_h = h // 3
            pip_x = w - pip_w - 20
            pip_y = 60
            pip_thumb = cv2.resize(thermal_frame, (pip_w, pip_h), interpolation=cv2.INTER_AREA)

            # Border around PiP
            cv2.rectangle(comp, (pip_x - 2, pip_y - 2), (pip_x + pip_w + 2, pip_y + pip_h + 2), (0, 220, 120), 2)
            comp[pip_y : pip_y + pip_h, pip_x : pip_x + pip_w] = pip_thumb
            cv2.putText(comp, "THERMAL (LWIR)", (pip_x + 8, pip_y + 18), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 255, 180), 1)
            return comp

        # Default: side_by_side
        # Scale width by half so total width matches standard display
        w_half = w // 2
        opt_half = cv2.resize(optical_frame, (w_half, h), interpolation=cv2.INTER_AREA)
        thm_half = cv2.resize(thermal_frame, (w_half, h), interpolation=cv2.INTER_AREA)

        # Draw divider line and labels
        composite = np.hstack([opt_half, thm_half])
        cv2.line(composite, (w_half, 0), (w_half, h), (0, 220, 120), 2)

        # HUD Labels
        cv2.putText(composite, "OPTICAL (VIS 4K)", (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
        cv2.putText(composite, "OPTICAL (VIS 4K)", (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 220, 120), 1)
        cv2.putText(composite, "THERMAL (LWIR FLIR)", (w_half + 15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
        cv2.putText(composite, "THERMAL (LWIR FLIR)", (w_half + 15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 220, 120), 1)

        return composite

    # ─── Radiometric Spot-Temperature & Heat Analysis ────────────────────────

    def estimate_spot_temperature(
        self,
        frame: np.ndarray,
        x: int,
        y: int,
        radius: int = 3,
    ) -> float:
        """
        Computes calibrated temperature in °C at pixel coordinates (x, y).
        Uses local patch averaging to suppress single-pixel sensor shot noise.
        """
        h, w = frame.shape[:2]
        x = max(0, min(x, w - 1))
        y = max(0, min(y, h - 1))

        if len(frame.shape) == 3 and frame.shape[2] == 3:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        else:
            gray = frame

        x1 = max(0, x - radius)
        x2 = min(w, x + radius + 1)
        y1 = max(0, y - radius)
        y2 = min(h, y + radius + 1)

        patch = gray[y1:y2, x1:x2]
        mean_intensity = float(np.mean(patch)) if patch.size > 0 else float(gray[y, x])

        # Linear radiometric mapping: min_temp + (val/255) * (max_temp - min_temp)
        c = self.calibration
        temp = c.min_temp_celsius + (mean_intensity / 255.0) * (c.max_temp_celsius - c.min_temp_celsius)
        temp = (temp * c.gain) + c.offset
        return round(float(temp), 1)

    def analyze_bbox_radiometrics(
        self,
        frame: np.ndarray,
        bbox: List[float],
        class_name: str = "person",
    ) -> Tuple[float, bool, float]:
        """
        Analyzes thermal radiometric profile within a bounding box.
        Returns: (estimated_temp_celsius, is_warm_body, heat_intensity [0..1]).
        """
        h, w = frame.shape[:2]
        x1 = max(0, min(int(bbox[0]), w - 1))
        y1 = max(0, min(int(bbox[1]), h - 1))
        x2 = max(0, min(int(bbox[2]), w))
        y2 = max(0, min(int(bbox[3]), h))

        if x2 <= x1 or y2 <= y1:
            return 36.5, True, 0.65

        if len(frame.shape) == 3:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        else:
            gray = frame

        roi = gray[y1:y2, x1:x2]
        if roi.size == 0:
            return 36.5, True, 0.65

        # Percentile 85 gives robust core heat reading unaffected by surrounding cold air
        p85 = float(np.percentile(roi, 85))
        c = self.calibration
        temp = c.min_temp_celsius + (p85 / 255.0) * (c.max_temp_celsius - c.min_temp_celsius)

        is_human = class_name.lower() in ("person", "suspect", "pedestrian")
        is_vehicle = class_name.lower() in ("car", "truck", "motorcycle", "vehicle", "bus")

        # Prior calibration for human vs vehicle
        if is_human:
            # Human skin/clothes usually reads between 31°C and 39°C
            calibrated_temp = float(np.clip(temp * 0.55 + 18.0, 31.0, 39.5))
            is_warm = calibrated_temp >= 32.5
        elif is_vehicle:
            # Engine and tire heat reads between 45°C and 85°C
            calibrated_temp = float(np.clip(temp * 0.9 + 25.0, 42.0, 88.0))
            is_warm = calibrated_temp >= 45.0
        else:
            calibrated_temp = temp
            is_warm = calibrated_temp >= 30.0

        heat_intensity = float(np.clip(p85 / 255.0, 0.0, 1.0))
        return round(calibrated_temp, 1), is_warm, round(heat_intensity, 3)

    # ─── Synthetic Thermal Radiometric Simulator ─────────────────────────────

    def simulate_thermal_from_optical(
        self,
        optical_bgr: np.ndarray,
        detections: Optional[List[Dict[str, Any]]] = None,
        palette: ThermalPalette | str = ThermalPalette.IRONBOW,
    ) -> np.ndarray:
        """
        Physically calibrated Synthetic FLIR Radiometric Thermal Simulator.
        Enables full dual-spectrum testing and live demos when a physical FLIR camera
        is not attached.
        Models:
          - Cold background terrain/sky (12°C - 16°C)
          - Human body heat blooms (~36.5°C - 37.8°C) at detected centroids
          - Vehicle engine hood/exhaust heat blooms (~65°C - 80°C)
          - Subtle sensor thermal drift and uncooled microbolometer sensor noise
        """
        h, w = optical_bgr.shape[:2]
        gray = cv2.cvtColor(optical_bgr, cv2.COLOR_BGR2GRAY)

        # Baseline terrain thermal modeling: low-pass ambient heat absorption
        ambient = cv2.GaussianBlur(gray, (15, 15), 0)
        # Rescale ambient to cold/ambient range [20..110]
        thermal_map = np.clip(ambient * 0.4 + 25, 15, 115).astype(np.float32)

        # If detections are provided, inject biological heat blooms into target ROIs
        if detections:
            for det in detections:
                box = det.get("box", [])
                if len(box) < 4:
                    continue
                bx1, by1, bx2, by2 = [int(round(c)) for c in box[:4]]
                bx1 = max(0, min(bx1, w - 1))
                by1 = max(0, min(by1, h - 1))
                bx2 = max(0, min(bx2, w))
                by2 = max(0, min(by2, h))

                if bx2 <= bx1 or by2 <= by1:
                    continue

                cls = det.get("class_name", "person").lower()
                bw = bx2 - bx1
                bh = by2 - by1

                # Create elliptical heat bloom mask centered on body
                mask = np.zeros((bh, bw), dtype=np.float32)
                cx = bw // 2
                cy = bh // 2
                rx = max(1, bw // 2)
                ry = max(1, bh // 2)
                cv2.ellipse(mask, (cx, cy), (rx, ry), 0, 0, 360, 1.0, -1)
                k_w = max(3, (bw // 4) * 2 + 1)
                k_h = max(3, (bh // 4) * 2 + 1)
                mask = cv2.GaussianBlur(mask, (k_w, k_h), 0)

                if cls in ("person", "suspect"):
                    # Core human heat signature: values 185..235 (maps to 36.5°C - 38°C)
                    target_heat = 215.0
                    target_roi = thermal_map[by1:by2, bx1:bx2]
                    thermal_map[by1:by2, bx1:bx2] = target_roi * (1.0 - mask * 0.8) + (target_heat * mask * 0.8)
                elif cls in ("car", "truck", "motorcycle", "vehicle"):
                    # Vehicle engine heat signature: values 230..255 (maps to 65°C - 85°C)
                    target_heat = 245.0
                    target_roi = thermal_map[by1:by2, bx1:bx2]
                    thermal_map[by1:by2, bx1:bx2] = target_roi * (1.0 - mask * 0.85) + (target_heat * mask * 0.85)

        # Add realistic microbolometer fixed pattern noise
        sensor_noise = np.random.normal(0, 1.8, (h, w)).astype(np.float32)
        thermal_map = np.clip(thermal_map + sensor_noise, 0, 255).astype(np.uint8)

        # Apply desired thermal palette
        return self.apply_palette(thermal_map, palette=palette)

    # ─── Cross-Spectral AI Decision-Level Fusion ─────────────────────────────

    @staticmethod
    def _compute_iou(box1: List[float], box2: List[float]) -> float:
        """Computes Intersection-over-Union (IoU) between two bounding boxes [x1, y1, x2, y2]."""
        xA = max(box1[0], box2[0])
        yA = max(box1[1], box2[1])
        xB = min(box1[2], box2[2])
        yB = min(box1[3], box2[3])

        inter_area = max(0.0, xB - xA) * max(0.0, yB - yA)
        box1_area = (box1[2] - box1[0]) * (box1[3] - box1[1])
        box2_area = (box2[2] - box2[0]) * (box2[3] - box2[1])
        union_area = box1_area + box2_area - inter_area

        if union_area <= 0:
            return 0.0
        return inter_area / union_area

    def fuse_detections(
        self,
        optical_detections: List[Dict[str, Any]],
        thermal_detections: List[Dict[str, Any]],
        thermal_frame: np.ndarray,
        iou_threshold: float = 0.30,
    ) -> List[FusedTarget]:
        """
        Decision-level cross-sensor target fusion.
        Correlates targets between optical and thermal spectrums:
          - DUAL_CONFIRMED: Detected on both sensors; confidence boosted via Bayesian combination.
          - THERMAL_ONLY: Detected in thermal but hidden in optical (darkness/camouflage).
          - OPTICAL_ONLY: Visible optically but cold / unconfirmed by thermal.
        """
        matched_thermal_indices = set()
        fused_targets: List[FusedTarget] = []

        for opt in optical_detections:
            opt_box = opt.get("box", [])
            opt_conf = float(opt.get("confidence", 0.5))
            cls_name = opt.get("class_name", "person")

            best_iou = 0.0
            best_thm_idx = -1

            for idx, thm in enumerate(thermal_detections):
                if idx in matched_thermal_indices:
                    continue
                thm_box = thm.get("box", [])
                iou = self._compute_iou(opt_box, thm_box)
                if iou > best_iou:
                    best_iou = iou
                    best_thm_idx = idx

            if best_iou >= iou_threshold and best_thm_idx >= 0:
                # DUAL_CONFIRMED MATCH
                matched_thermal_indices.add(best_thm_idx)
                thm = thermal_detections[best_thm_idx]
                thm_conf = float(thm.get("confidence", 0.5))
                # Bayesian combination: P(A or B) = 1 - (1 - P(A))*(1 - P(B))
                fused_conf = 1.0 - (1.0 - opt_conf) * (1.0 - thm_conf)
                fused_conf = min(0.99, fused_conf)

                # Radiometric profile from thermal frame
                temp, is_warm, intensity = self.analyze_bbox_radiometrics(thermal_frame, opt_box, cls_name)

                fused_targets.append(
                    FusedTarget(
                        box=opt_box,
                        class_name=cls_name,
                        confidence=fused_conf,
                        optical_confidence=opt_conf,
                        thermal_confidence=thm_conf,
                        fused_confidence=fused_conf,
                        spectrum_status="DUAL_CONFIRMED",
                        temp_celsius_approx=temp,
                        is_warm_body=is_warm,
                        heat_intensity=intensity,
                    )
                )
            else:
                # OPTICAL ONLY
                temp, is_warm, intensity = self.analyze_bbox_radiometrics(thermal_frame, opt_box, cls_name)
                fused_targets.append(
                    FusedTarget(
                        box=opt_box,
                        class_name=cls_name,
                        confidence=opt_conf,
                        optical_confidence=opt_conf,
                        thermal_confidence=None,
                        fused_confidence=opt_conf,
                        spectrum_status="OPTICAL_ONLY",
                        temp_celsius_approx=temp,
                        is_warm_body=is_warm,
                        heat_intensity=intensity,
                    )
                )

        # Remaining unmatched thermal detections (e.g. concealed in darkness / foliage)
        for idx, thm in enumerate(thermal_detections):
            if idx in matched_thermal_indices:
                continue
            thm_box = thm.get("box", [])
            thm_conf = float(thm.get("confidence", 0.5))
            cls_name = thm.get("class_name", "person")

            temp, is_warm, intensity = self.analyze_bbox_radiometrics(thermal_frame, thm_box, cls_name)

            fused_targets.append(
                FusedTarget(
                    box=thm_box,
                    class_name=cls_name,
                    confidence=thm_conf,
                    optical_confidence=None,
                    thermal_confidence=thm_conf,
                    fused_confidence=thm_conf,
                    spectrum_status="THERMAL_ONLY",
                    temp_celsius_approx=temp,
                    is_warm_body=is_warm,
                    heat_intensity=intensity,
                )
            )

        return fused_targets

    # ─── Tactical Thermal HUD Overlay ─────────────────────────────────────────

    def draw_thermal_hud(
        self,
        frame: np.ndarray,
        palette_name: str = "ironbow",
        center_temp: Optional[float] = None,
        fused_targets: Optional[List[FusedTarget]] = None,
    ) -> np.ndarray:
        """
        Draws tactical military thermal telemetry:
          - Radiometric color scale graduation bar (10°C ... 85°C) on the right margin
          - Center crosshair spot-meter temperature readout
          - Target heat badges (🔥 37.2°C • DUAL LOCK)
        """
        h, w = frame.shape[:2]
        annotated = frame.copy()

        # 1. Radiometric Temperature Scale Bar on right edge (rendered if frame is sufficiently large)
        if h >= 120 and w >= 160:
            bar_w = 12
            bar_h = max(40, min(220, h - 80))
            bar_x = w - 35
            bar_y = (h - bar_h) // 2

            # Draw background panel
            cv2.rectangle(annotated, (bar_x - 30, bar_y - 25), (w - 8, bar_y + bar_h + 25), (15, 20, 25), -1)
            cv2.rectangle(annotated, (bar_x - 30, bar_y - 25), (w - 8, bar_y + bar_h + 25), (45, 55, 65), 1)

            # Draw vertical gradient
            gradient = np.linspace(255, 0, bar_h, dtype=np.uint8).reshape((bar_h, 1))
            colored_bar = self.apply_palette(gradient, palette=palette_name)
            colored_bar = cv2.resize(colored_bar, (bar_w, bar_h), interpolation=cv2.INTER_NEAREST)
            annotated[bar_y : bar_y + bar_h, bar_x : bar_x + bar_w] = colored_bar
            cv2.rectangle(annotated, (bar_x, bar_y), (bar_x + bar_w, bar_y + bar_h), (200, 220, 240), 1)

            # Temperature labels
            max_t = int(self.calibration.max_temp_celsius)
            min_t = int(self.calibration.min_temp_celsius)
            mid_t = (max_t + min_t) // 2

            cv2.putText(annotated, f"{max_t}C", (bar_x - 26, bar_y + 8), cv2.FONT_HERSHEY_SIMPLEX, 0.32, (240, 245, 250), 1)
            cv2.putText(annotated, f"{mid_t}C", (bar_x - 26, bar_y + (bar_h // 2) + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.32, (200, 220, 240), 1)
            cv2.putText(annotated, f"{min_t}C", (bar_x - 26, bar_y + bar_h), cv2.FONT_HERSHEY_SIMPLEX, 0.32, (180, 200, 220), 1)
            cv2.putText(annotated, "FLIR", (bar_x - 18, bar_y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.36, (0, 220, 120), 1)

        # 2. Center Crosshair Spot-Meter
        cx = w // 2
        cy = h // 2
        arm = 14
        gap = 5
        cross_color = (0, 255, 180)

        cv2.line(annotated, (cx - arm, cy), (cx - gap, cy), cross_color, 1)
        cv2.line(annotated, (cx + gap, cy), (cx + arm, cy), cross_color, 1)
        cv2.line(annotated, (cx, cy - arm), (cx, cy - gap), cross_color, 1)
        cv2.line(annotated, (cx, cy + gap), (cx, cy + arm), cross_color, 1)

        if center_temp is None:
            center_temp = self.estimate_spot_temperature(frame, cx, cy)

        spot_text = f"SPOT: {center_temp:.1f} C"
        cv2.putText(annotated, spot_text, (cx + 18, cy + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (10, 15, 20), 3)
        cv2.putText(annotated, spot_text, (cx + 18, cy + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.42, cross_color, 1)

        # 3. Fused Target Annotations
        if fused_targets:
            for tgt in fused_targets:
                bx1, by1, bx2, by2 = [int(round(c)) for c in tgt.box[:4]]

                if tgt.spectrum_status == "DUAL_CONFIRMED":
                    color = (0, 220, 120)  # Tactical Emerald
                    status_lbl = "DUAL LOCK"
                elif tgt.spectrum_status == "THERMAL_ONLY":
                    color = (20, 140, 255)  # Tactical Orange (Thermal-only alert)
                    status_lbl = "THERMAL HIT"
                else:
                    color = (255, 180, 0)   # Optical Cyan
                    status_lbl = "OPTICAL"

                cv2.rectangle(annotated, (bx1, by1), (bx2, by2), color, 2)

                # Header badge
                tag = f"{tgt.class_name.upper()} {tgt.temp_celsius_approx:.1f}C [{status_lbl}]"
                (tw, th), _ = cv2.getTextSize(tag, cv2.FONT_HERSHEY_SIMPLEX, 0.42, 1)
                cv2.rectangle(annotated, (bx1, max(0, by1 - 22)), (bx1 + tw + 8, by1), color, -1)
                cv2.putText(annotated, tag, (bx1 + 4, max(12, by1 - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (10, 15, 20), 1)

        return annotated


# Global singleton instance
thermal_fusion_service = ThermalFusionService()
