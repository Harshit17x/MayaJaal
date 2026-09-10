from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
import threading
import time
from typing import Any, Generator, Optional
import uuid

import cv2
import numpy as np

from app.core.config import settings

logger = logging.getLogger("SIH26187.FaceService")


def compute_iou(boxA: list[float], boxB: list[float]) -> float:
    """Compute Intersection over Union (IoU) between two bounding boxes [x1, y1, x2, y2]."""
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    interW = max(0.0, xB - xA)
    interH = max(0.0, yB - yA)
    interArea = interW * interH

    boxAArea = max(1.0, (boxA[2] - boxA[0]) * (boxA[3] - boxA[1]))
    boxBArea = max(1.0, (boxB[2] - boxB[0]) * (boxB[3] - boxB[1]))

    return interArea / float(boxAArea + boxBArea - interArea)


def calibrate_match_confidence(cosine_score: float, threshold: float = 0.40) -> float:
    """
    Calibrate raw SFace cosine similarity (-1.0 to 1.0) into an intuitive, human-friendly
    confidence percentage (0% to 100%).
    
    In SFace:
      - c < 0.20: Non-match (noise / random face) -> 0% - 15%
      - c < threshold: Unrecognized / below threshold -> 15% - 49%
      - c = threshold: Standard decision boundary -> 50%
      - c = 0.48: Solid match -> 75%
      - c = 0.55: High confidence match -> 88%
      - c >= 0.65: Near identical / verified match -> 96% - 99.5%
    """
    c = float(cosine_score)
    th = float(threshold)
    if c <= 0.0:
        return 0.0
    elif c <= 0.20:
        val = (c / 0.20) * 15.0
    elif c < th:
        val = 15.0 + ((c - 0.20) / max(0.01, th - 0.20)) * 34.0
    elif c <= 0.50:
        val = 50.0 + ((c - th) / max(0.01, 0.50 - th)) * 35.0
    elif c <= 0.65:
        val = 85.0 + ((c - 0.50) / (0.65 - 0.50)) * 11.0
    else:
        val = 96.0 + min(1.0, (c - 0.65) / 0.20) * 3.5

    return round(float(np.clip(val, 0.0, 99.9)), 1)


class FaceService:
    """
    Production-grade facial recognition service for MayaJaal.
    Leverages OpenCV DNN YuNet (detection) and SFace (128-D cosine embedding recognition).
    Thread-safe and optimized for real-time video streams and REST APIs.
    """

    def __init__(self) -> None:
        self.models_dir = settings.model_directory
        self.data_dir = settings.model_directory.parent / "app" / "data" / "faces"
        self.thumbnails_dir = self.data_dir / "thumbnails"
        self.db_file = self.data_dir / "known_faces.json"

        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.thumbnails_dir.mkdir(parents=True, exist_ok=True)

        self.yunet_path = self.models_dir / "face_detection_yunet.onnx"
        self.sface_path = self.models_dir / "face_recognition_sface.onnx"

        self.detector: Optional[cv2.FaceDetectorYN] = None
        self.recognizer: Optional[cv2.FaceRecognizerSF] = None
        self.lock = threading.Lock()

        # In-memory known persons list
        self.known_persons: list[dict[str, Any]] = []

        # Recent detection logs for live operational dashboard
        self.recent_events: list[dict[str, Any]] = []
        self.max_events: int = 50

        # Temporal tracking history to eliminate video jitter and momentary false alerts
        self.tracks: dict[int, dict[str, Any]] = {}
        self.next_track_id: int = 1

        self._init_models()
        self.load_database()

    def _init_models(self) -> None:
        try:
            if not self.yunet_path.exists() or not self.sface_path.exists():
                logger.warning(
                    "Face models missing in models directory: YuNet=%s, SFace=%s",
                    self.yunet_path.exists(),
                    self.sface_path.exists(),
                )
                return

            self.detector = cv2.FaceDetectorYN.create(
                str(self.yunet_path),
                "",
                (320, 320),
                score_threshold=0.58,
                nms_threshold=0.3,
                top_k=5000,
            )
            self.recognizer = cv2.FaceRecognizerSF.create(str(self.sface_path), "")
            logger.info("FaceService initialized successfully with YuNet and SFace models.")
        except Exception as exc:
            logger.exception("Error initializing OpenCV Face models: %s", exc)

    def load_database(self) -> None:
        with self.lock:
            self.known_persons = []
            if not self.db_file.exists():
                with open(self.db_file, "w", encoding="utf-8") as f:
                    json.dump([], f)
                return

            try:
                with open(self.db_file, "r", encoding="utf-8") as f:
                    records = json.load(f)

                for r in records:
                    features_np: list[np.ndarray] = []
                    raw_features = r.get("features", [])
                    if isinstance(raw_features, list) and len(raw_features) > 0:
                        for item in raw_features:
                            if isinstance(item, list) and len(item) == 128:
                                features_np.append(np.array(item, dtype=np.float32).reshape(1, 128))

                    # Backward compatibility fallback: single "feature"
                    single_feat = r.get("feature", [])
                    if len(features_np) == 0 and isinstance(single_feat, list) and len(single_feat) == 128:
                        features_np.append(np.array(single_feat, dtype=np.float32).reshape(1, 128))

                    person_id = r.get("id")
                    thumb_name = f"{person_id}.jpg"
                    image_url = f"/api/faces/thumbnail/{thumb_name}"

                    if features_np:
                        self.known_persons.append({
                            "id": person_id,
                            "name": r.get("name", "Unknown"),
                            "image_url": image_url,
                            "created_at": r.get("created_at", ""),
                            "features": features_np,
                            "feature": features_np[0],
                        })
                logger.info("Loaded %d enrolled persons into FaceService.", len(self.known_persons))
            except Exception as exc:
                logger.exception("Error loading face database from %s: %s", self.db_file, exc)

    def _save_database(self) -> None:
        records = []
        for p in self.known_persons:
            feats_list = [f.flatten().tolist() for f in p.get("features", [p["feature"]])]
            records.append({
                "id": p["id"],
                "name": p["name"],
                "image_url": p["image_url"],
                "created_at": p["created_at"],
                "features": feats_list,
                "feature": feats_list[0] if feats_list else [],
            })
        with open(self.db_file, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2)

    def list_persons(self) -> list[dict[str, Any]]:
        with self.lock:
            return [
                {
                    "id": p["id"],
                    "name": p["name"],
                    "image_url": p["image_url"],
                    "created_at": p["created_at"],
                    "sample_count": len(p.get("features", [1])),
                }
                for p in self.known_persons
            ]

    def register_face(self, image_bgr: np.ndarray, name: str) -> dict[str, Any]:
        """
        Enroll a new person or add a sample if person already exists.
        Performs quality gating:
          - Face size >= 65x65 px
          - YuNet confidence >= 0.65
          - Sharpness check to prevent enrolling blurry images
        """
        name = name.strip()
        if not name:
            return {"success": False, "error": "Name cannot be blank"}
        if image_bgr is None or image_bgr.size == 0:
            return {"success": False, "error": "Invalid image data"}
        if self.detector is None or self.recognizer is None:
            return {"success": False, "error": "Face detection models are not initialized"}

        h, w = image_bgr.shape[:2]
        with self.lock:
            self.detector.setInputSize((w, h))
            _, faces = self.detector.detect(image_bgr)

        if faces is None or len(faces) == 0:
            return {
                "success": False,
                "error": "No face detected in this image. Please ensure good lighting and face the camera directly.",
            }

        # Select largest face by bounding box area (w * h)
        best_face = max(faces, key=lambda f: f[2] * f[3])
        fw, fh = float(best_face[2]), float(best_face[3])
        det_conf = float(best_face[14])

        # Quality check 1: minimum face dimensions
        if fw < 65 or fh < 65:
            return {
                "success": False,
                "error": f"Face is too small ({int(fw)}x{int(fh)} px). Minimum 65x65 px required.",
            }

        # Quality check 2: detection confidence
        if det_conf < 0.65:
            return {
                "success": False,
                "error": f"Face detection confidence is low ({int(det_conf * 100)}%). Please face the camera directly in clear light.",
            }

        with self.lock:
            aligned_face = self.recognizer.alignCrop(image_bgr, best_face)
            feature = self.recognizer.feature(aligned_face)  # Shape: (1, 128)

        # Quality check 3: blur check via Laplacian variance
        gray_aligned = cv2.cvtColor(aligned_face, cv2.COLOR_BGR2GRAY)
        lap_var = cv2.Laplacian(gray_aligned, cv2.CV_64F).var()
        if lap_var < 20.0:
            return {
                "success": False,
                "error": "Image is too blurry. Please hold steady and recapture in good lighting.",
            }

        with self.lock:
            existing = next((p for p in self.known_persons if p["name"].lower() == name.lower()), None)

            if existing:
                # Add sample embedding to existing profile (cap at 10 samples)
                if "features" not in existing:
                    existing["features"] = [existing["feature"]]
                if len(existing["features"]) < 10:
                    existing["features"].append(feature)
                else:
                    existing["features"][0] = feature

                # Update thumbnail to latest capture
                thumb_path = self.thumbnails_dir / f"{existing['id']}.jpg"
                cv2.imwrite(str(thumb_path), aligned_face)
                existing["feature"] = existing["features"][0]
                self._save_database()

                return {
                    "success": True,
                    "person": {
                        "id": existing["id"],
                        "name": existing["name"],
                        "image_url": existing["image_url"],
                        "created_at": existing["created_at"],
                        "sample_count": len(existing["features"]),
                    },
                    "message": f"Added new sample to existing profile for {existing['name']}! (Total samples: {len(existing['features'])})",
                }
            else:
                person_id = f"person_{int(time.time())}_{uuid.uuid4().hex[:6]}"
                thumb_filename = f"{person_id}.jpg"
                thumb_path = self.thumbnails_dir / thumb_filename

                cv2.imwrite(str(thumb_path), aligned_face)

                new_record = {
                    "id": person_id,
                    "name": name,
                    "image_url": f"/api/faces/thumbnail/{thumb_filename}",
                    "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "features": [feature],
                    "feature": feature,
                }

                self.known_persons.append(new_record)
                self._save_database()

                return {
                    "success": True,
                    "person": {
                        "id": new_record["id"],
                        "name": new_record["name"],
                        "image_url": new_record["image_url"],
                        "created_at": new_record["created_at"],
                        "sample_count": 1,
                    },
                    "message": f"Successfully enrolled face profile for {name}!",
                }

    def add_sample(self, person_id: str, image_bgr: np.ndarray) -> dict[str, Any]:
        """Add an additional angle or lighting sample to a specific person ID."""
        with self.lock:
            person = next((p for p in self.known_persons if p["id"] == person_id), None)
            if not person:
                return {"success": False, "error": "Person ID not found"}
            name = person["name"]

        return self.register_face(image_bgr, name)

    def delete_person(self, person_id: str) -> dict[str, Any]:
        """Delete an enrolled person and remove their thumbnail."""
        with self.lock:
            prev_len = len(self.known_persons)
            self.known_persons = [p for p in self.known_persons if p["id"] != person_id]
            if len(self.known_persons) < prev_len:
                self._save_database()
                thumb_path = self.thumbnails_dir / f"{person_id}.jpg"
                if thumb_path.exists():
                    try:
                        thumb_path.unlink()
                    except Exception:
                        pass
                return {"success": True, "message": "Person removed from face database"}
            return {"success": False, "error": "Person ID not found"}

    def detect_and_recognize(
        self,
        image_bgr: np.ndarray,
        min_match_score: float = 0.40,
        min_face_size: int = 40,
        det_score_thresh: float = 0.58,
        use_temporal_smoothing: bool = True,
    ) -> list[dict[str, Any]]:
        """
        Detect faces in image_bgr and match against enrolled persons.
        Features:
          - Rejects tiny noise (< min_face_size px)
          - Filters out low confidence detector artifacts (< det_score_thresh)
          - Dual-metric verification: Cosine similarity >= min_match_score AND L2 distance <= 1.128
          - Exclusive 1-to-1 identity assignment per frame
          - Multi-embedding matching per person
          - Human-calibrated confidence percentage (0-100%)
          - Temporal identity smoothing across video frames
        """
        if image_bgr is None or image_bgr.size == 0 or self.detector is None or self.recognizer is None:
            return []

        h, w = image_bgr.shape[:2]

        with self.lock:
            self.detector.setInputSize((w, h))
            _, faces = self.detector.detect(image_bgr)
            known_list = list(self.known_persons)

        if faces is None or len(faces) == 0:
            if use_temporal_smoothing:
                self._age_tracks()
            return []

        now = time.time()
        raw_detections: list[dict[str, Any]] = []

        for face in faces:
            x, y, fw, fh = float(face[0]), float(face[1]), float(face[2]), float(face[3])
            det_conf = float(face[14])

            # Filter 1: Detector confidence
            if det_conf < det_score_thresh:
                continue

            # Filter 2: Minimum size
            if fw < min_face_size or fh < min_face_size:
                continue

            # Filter 3: Aspect ratio check
            aspect = fh / max(1.0, fw)
            if aspect < 0.5 or aspect > 2.0:
                continue

            # Clamp coordinates
            x1 = max(0.0, min(x, float(w - 1)))
            y1 = max(0.0, min(y, float(h - 1)))
            x2 = max(0.0, min(x + fw, float(w)))
            y2 = max(0.0, min(y + fh, float(h)))

            # Align and match under lock
            with self.lock:
                aligned_face = self.recognizer.alignCrop(image_bgr, face)
                feat = self.recognizer.feature(aligned_face)

                best_name = "Unknown"
                best_score = -1.0
                best_l2 = 999.0
                is_known = False

                for p in known_list:
                    p_features = p.get("features", [p["feature"]])
                    p_best_score = -1.0
                    p_best_l2 = 999.0
                    for k_feat in p_features:
                        cos = float(self.recognizer.match(feat, k_feat, cv2.FaceRecognizerSF_FR_COSINE))
                        l2 = float(self.recognizer.match(feat, k_feat, cv2.FaceRecognizerSF_FR_NORM_L2))
                        if cos > p_best_score:
                            p_best_score = cos
                            p_best_l2 = l2

                    if p_best_score > best_score:
                        best_score = p_best_score
                        best_l2 = p_best_l2
                        if p_best_score >= min_match_score and p_best_l2 <= 1.128:
                            best_name = p["name"]
                            is_known = True

            calibrated_conf = calibrate_match_confidence(max(0.0, best_score), threshold=min_match_score)

            raw_detections.append({
                "name": best_name,
                "is_known": is_known,
                "confidence": round(det_conf, 4),
                "match_score": round(max(0.0, best_score), 4),
                "l2_distance": round(best_l2, 4),
                "calibrated_conf": calibrated_conf,
                "bbox": [round(x1, 2), round(y1, 2), round(x2, 2), round(y2, 2)],
                "type": "face",
                "class_name": f"Face: {best_name}" if is_known else "Face: Unknown",
                "is_threat": False,
            })

        # Exclusive 1-to-1 Identity Assignment:
        claimed_identities = set()
        for det in sorted(raw_detections, key=lambda d: d["match_score"], reverse=True):
            if det["is_known"]:
                if det["name"] not in claimed_identities:
                    claimed_identities.add(det["name"])
                else:
                    det["is_known"] = False
                    det["name"] = "Unknown"
                    det["class_name"] = "Face: Unknown"
                    det["calibrated_conf"] = calibrate_match_confidence(
                        min(det["match_score"], min_match_score * 0.85),
                        threshold=min_match_score,
                    )

        if not use_temporal_smoothing:
            self._log_events(raw_detections)
            return raw_detections

        smoothed_results = self._apply_temporal_smoothing(raw_detections, now, min_match_score)
        self._log_events(smoothed_results)
        return smoothed_results

    def _apply_temporal_smoothing(
        self,
        current_detections: list[dict[str, Any]],
        now: float,
        min_match_score: float,
    ) -> list[dict[str, Any]]:
        self._age_tracks(now)
        matched_track_ids = set()
        final_results = []

        for det in current_detections:
            det_box = det["bbox"]
            best_iou = 0.0
            best_tid = None

            for tid, track in self.tracks.items():
                if tid in matched_track_ids:
                    continue
                iou = compute_iou(det_box, track["bbox"])
                if iou > best_iou and iou >= 0.30:
                    best_iou = iou
                    best_tid = tid

            if best_tid is not None:
                matched_track_ids.add(best_tid)
                track = self.tracks[best_tid]
                track["bbox"] = det_box
                track["last_seen"] = now

                track["history"].append({
                    "name": det["name"],
                    "is_known": det["is_known"],
                    "score": det["match_score"],
                    "calibrated": det["calibrated_conf"],
                })
                if len(track["history"]) > 5:
                    track["history"].pop(0)

                known_votes = [h for h in track["history"] if h["is_known"]]
                if len(known_votes) >= 3 or (len(known_votes) >= 2 and len(track["history"]) <= 3):
                    names = [h["name"] for h in known_votes]
                    stabilized_name = max(set(names), key=names.count)
                    avg_score = max(h["score"] for h in known_votes)
                    avg_calibrated = max(h["calibrated"] for h in known_votes)

                    det["name"] = stabilized_name
                    det["is_known"] = True
                    det["match_score"] = round(avg_score, 4)
                    det["calibrated_conf"] = round(avg_calibrated, 1)
                    det["class_name"] = f"Face: {stabilized_name}"
                else:
                    det["name"] = "Unknown"
                    det["is_known"] = False
                    det["class_name"] = "Face: Unknown"
            else:
                tid = self.next_track_id
                self.next_track_id += 1
                self.tracks[tid] = {
                    "bbox": det_box,
                    "history": [{
                        "name": det["name"],
                        "is_known": det["is_known"],
                        "score": det["match_score"],
                        "calibrated": det["calibrated_conf"],
                    }],
                    "last_seen": now,
                }

            final_results.append(det)

        smoothed_claimed = set()
        for det in sorted(final_results, key=lambda d: d["match_score"], reverse=True):
            if det["is_known"]:
                if det["name"] not in smoothed_claimed:
                    smoothed_claimed.add(det["name"])
                else:
                    det["is_known"] = False
                    det["name"] = "Unknown"
                    det["class_name"] = "Face: Unknown"

        return final_results

    def _age_tracks(self, now: Optional[float] = None) -> None:
        if now is None:
            now = time.time()
        expired = [tid for tid, t in self.tracks.items() if now - t["last_seen"] > 1.2]
        for tid in expired:
            del self.tracks[tid]

    def _log_events(self, detections: list[dict[str, Any]]) -> None:
        """Keep a ring buffer of recent detection events for the frontend operations center."""
        now_str = datetime.now().strftime("%H:%M:%S")
        for det in detections:
            event = {
                "id": f"face_evt_{int(time.time() * 1000)}_{uuid.uuid4().hex[:4]}",
                "name": det["name"],
                "is_known": det["is_known"],
                "calibrated_conf": det["calibrated_conf"],
                "timestamp": now_str,
                "bbox": det["bbox"],
            }
            # Avoid logging consecutive duplicate events within 2 seconds
            if self.recent_events:
                last = self.recent_events[0]
                if last["name"] == event["name"] and last["is_known"] == event["is_known"]:
                    continue

            self.recent_events.insert(0, event)
            if len(self.recent_events) > self.max_events:
                self.recent_events.pop()

    def draw_faces(self, image_bgr: np.ndarray, face_detections: list[dict[str, Any]]) -> np.ndarray:
        """
        Draw high-visibility tactical bounding boxes and names directly onto image_bgr.
        Shows calibrated confidence percentage (e.g. 92%) rather than raw cosine distance.
        """
        annotated = image_bgr.copy()
        for f in face_detections:
            x1, y1, x2, y2 = [int(v) for v in f["bbox"]]
            is_known = f.get("is_known", False)
            name = f.get("name", "Unknown")
            calibrated_conf = f.get("calibrated_conf", 0.0)

            # Color: Vibrant emerald green for recognized person, Amber for unknown
            color = (0, 230, 115) if is_known else (0, 165, 255)

            # Bounding box
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

            # Corner accents
            corner_len = max(6, min(18, int(min(x2 - x1, y2 - y1) * 0.22)))
            cv2.line(annotated, (x1, y1), (x1 + corner_len, y1), color, 3)
            cv2.line(annotated, (x1, y1), (x1, y1 + corner_len), color, 3)
            cv2.line(annotated, (x2, y1), (x2 - corner_len, y1), color, 3)
            cv2.line(annotated, (x2, y1), (x2, y1 + corner_len), color, 3)
            cv2.line(annotated, (x1, y2), (x1 + corner_len, y2), color, 3)
            cv2.line(annotated, (x1, y2), (x1, y2 - corner_len), color, 3)
            cv2.line(annotated, (x2, y2), (x2 - corner_len, y2), color, 3)
            cv2.line(annotated, (x2, y2), (x2, y2 - corner_len), color, 3)

            # High-visibility tag
            label_text = f"{name} {calibrated_conf:.0f}%" if is_known else f"Unknown ({calibrated_conf:.0f}%)"
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.5
            thickness = 1
            (tw, th), baseline = cv2.getTextSize(label_text, font, font_scale, thickness)

            tag_y1 = max(0, y1 - th - 10)
            tag_y2 = y1
            tag_x2 = min(annotated.shape[1], x1 + tw + 12)

            cv2.rectangle(annotated, (x1, tag_y1), (tag_x2, tag_y2), (20, 24, 28), -1)
            cv2.rectangle(annotated, (x1, tag_y1), (tag_x2, tag_y2), color, 1)
            cv2.putText(
                annotated,
                label_text,
                (x1 + 6, tag_y2 - 5),
                font,
                font_scale,
                color,
                thickness,
                cv2.LINE_AA,
            )

        return annotated


face_service = FaceService()
