from __future__ import annotations

import logging
from dataclasses import asdict, dataclass
from typing import Any

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# Standard 80 COCO classes common to YOLOv5, YOLOv8, YOLOv11 and general surveillance detectors
COCO_CLASSES: list[str] = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck",
    "boat", "traffic light", "fire hydrant", "stop sign", "parking meter", "bench",
    "bird", "cat", "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra",
    "giraffe", "backpack", "umbrella", "handbag", "tie", "suitcase", "frisbee",
    "skis", "snowboard", "sports ball", "kite", "baseball bat", "baseball glove",
    "skateboard", "surfboard", "tennis racket", "bottle", "wine glass", "cup",
    "fork", "knife", "spoon", "bowl", "banana", "apple", "sandwich", "orange",
    "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair", "couch",
    "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse",
    "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink",
    "refrigerator", "book", "clock", "vase", "scissors", "teddy bear",
    "hair drier", "toothbrush"
]


class PostprocessorError(Exception):
    """Base exception for postprocessing errors."""


@dataclass
class Detection:
    """
    Structured object detection representation.
    """
    box: list[float]  # [x1, y1, x2, y2]
    confidence: float
    class_id: int
    class_name: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "box": [round(coord, 2) for coord in self.box],
            "confidence": round(self.confidence, 4),
            "class_id": self.class_id,
            "class_name": self.class_name,
        }


@dataclass(frozen=True)
class PostprocessorConfig:
    """
    Configuration for bounding box decoding and NMS.
    """
    conf_threshold: float = 0.25
    iou_threshold: float = 0.45
    max_detections: int = 300
    class_labels: list[str] | None = None


class Postprocessor:
    """
    Decodes raw model output tensors into structured bounding boxes.

    Supported architectures:
    - YOLOv8 / YOLOv9 / YOLOv11: Shape [1, 4 + num_classes, num_anchors] or [1, num_anchors, 4 + num_classes]
    - YOLOv5 / YOLOv7: Shape [1, num_anchors, 5 + num_classes]
    - End-to-End / Pre-NMS: Shape [1, num_anchors, 6] ([x1, y1, x2, y2, score, class_id])
    """

    def __init__(self, config: PostprocessorConfig | None = None) -> None:
        self.config = config or PostprocessorConfig()
        self.class_labels = self.config.class_labels or COCO_CLASSES

    def get_class_name(self, class_id: int) -> str:
        """Return the label for a class index or a fallback name."""
        if 0 <= class_id < len(self.class_labels):
            return self.class_labels[class_id]
        return f"class_{class_id}"

    def decode(
        self,
        outputs: list[np.ndarray],
        model_input_size: tuple[int, int] | None = None,
        original_image_size: tuple[int, int] | None = None,
    ) -> list[dict[str, Any]]:
        """
        Decode output tensors into a list of detection dictionaries.

        Args:
            outputs: Raw output tensors from ONNXEngine.
            model_input_size: (width, height) of the model's preprocessed input tensor.
            original_image_size: (width, height) of the source image/frame before resizing.

        Returns:
            List of detection dicts with keys [box, confidence, class_id, class_name].
        """
        if not outputs or not isinstance(outputs[0], np.ndarray):
            return []

        primary_output = outputs[0]

        # Only 2D or 3D tensors are candidates for detection outputs
        if primary_output.ndim not in (2, 3):
            return []

        detections: list[Detection] = []
        num_classes = len(self.class_labels)

        try:
            # Check 1: Pre-NMS / End-to-End shape [1, N, 6] ([x1, y1, x2, y2, score, class_id])
            if primary_output.ndim == 3 and primary_output.shape[-1] == 6:
                detections = self._decode_end2end(primary_output)

            # Check 2: 2D Pre-NMS shape [N, 6]
            elif primary_output.ndim == 2 and primary_output.shape[1] == 6:
                detections = self._decode_end2end(np.expand_dims(primary_output, axis=0))

            # Check 3: 3D bounding box detection tensors [1, D1, D2]
            elif primary_output.ndim == 3:
                _, d1, d2 = primary_output.shape

                # YOLOv8 format with features in dimension 1: [1, 4 + C, N]
                # Matches if d1 equals 4+C, or d1 matches 84, or d2 is large anchor grid
                if (
                    d1 in (4 + num_classes, 84)
                    or (d2 > 500 and d1 < d2 and d1 >= 5)
                    or (d1 >= 5 and d2 < 50 and d1 > d2)
                ):
                    detections = self._decode_yolov8(primary_output)

                # YOLOv5 format with features in dimension 2: [1, N, 5 + C]
                # Or transposed YOLOv8 [1, N, 4 + C]
                elif (
                    d2 in (5 + num_classes, 4 + num_classes, 85, 84)
                    or (d1 > 500 and d2 < d1 and d2 >= 5)
                    or (d2 >= 5 and d1 < 50 and d2 >= d1)
                ):
                    detections = self._decode_yolo_transposed(primary_output)

        except Exception as exc:
            logger.warning("Failed to decode detection tensor: %s", exc)
            return []

        # Scale coordinates back to original image dimensions if provided
        if original_image_size and model_input_size and detections:
            detections = self._rescale_boxes(
                detections=detections,
                model_size=model_input_size,
                orig_size=original_image_size,
            )

        return [d.to_dict() for d in detections]

    def _decode_yolov8(self, output: np.ndarray) -> list[Detection]:
        """
        Decode standard YOLOv8/v9/v11 output with shape [1, 4 + C, N].
        Row 0..3 are cx, cy, w, h.
        Row 4..end are class probabilities.
        """
        # Squeeze batch dimension: [4 + C, N] -> transpose to [N, 4 + C]
        data = np.squeeze(output, axis=0).T  # [N, 4 + C]

        boxes = data[:, :4]  # [N, 4] -> cx, cy, w, h
        scores = data[:, 4:]  # [N, C]

        class_ids = np.argmax(scores, axis=1)
        confidences = np.max(scores, axis=1)

        # Filter by confidence threshold
        mask = confidences >= self.config.conf_threshold
        if not np.any(mask):
            return []

        filtered_boxes = boxes[mask]
        filtered_confs = confidences[mask]
        filtered_classes = class_ids[mask]

        return self._apply_nms(
            boxes_cxcywh=filtered_boxes,
            confidences=filtered_confs,
            class_ids=filtered_classes,
        )

    def _decode_yolo_transposed(self, output: np.ndarray) -> list[Detection]:
        """
        Decode YOLOv5/v7 [1, N, 5 + C] or transposed YOLOv8 [1, N, 4 + C].
        """
        data = np.squeeze(output, axis=0)  # [N, 4 + C or 5 + C]
        num_features = data.shape[1]

        # Check for YOLOv5 format (box=4, obj_conf=1, class_scores=C)
        if num_features >= 6:
            # Evaluate if index 4 represents objectness score (between 0 and 1)
            boxes = data[:, :4]
            obj_conf = data[:, 4]
            class_scores = data[:, 5:]

            class_ids = np.argmax(class_scores, axis=1)
            confs = obj_conf * np.max(class_scores, axis=1)
        else:
            boxes = data[:, :4]
            class_scores = data[:, 4:]
            class_ids = np.argmax(class_scores, axis=1)
            confs = np.max(class_scores, axis=1)

        mask = confs >= self.config.conf_threshold
        if not np.any(mask):
            return []

        return self._apply_nms(
            boxes_cxcywh=boxes[mask],
            confidences=confs[mask],
            class_ids=class_ids[mask],
        )

    def _decode_end2end(self, output: np.ndarray) -> list[Detection]:
        """
        Decode pre-NMS / End-to-End detections [1, N, 6] -> [x1, y1, x2, y2, conf, class_id].
        """
        data = np.squeeze(output, axis=0)
        detections: list[Detection] = []

        for row in data:
            conf = float(row[4])
            if conf < self.config.conf_threshold:
                continue

            x1, y1, x2, y2 = float(row[0]), float(row[1]), float(row[2]), float(row[3])
            class_id = int(row[5])

            detections.append(
                Detection(
                    box=[x1, y1, x2, y2],
                    confidence=conf,
                    class_id=class_id,
                    class_name=self.get_class_name(class_id),
                )
            )

        return detections[: self.config.max_detections]

    def _apply_nms(
        self,
        boxes_cxcywh: np.ndarray,
        confidences: np.ndarray,
        class_ids: np.ndarray,
    ) -> list[Detection]:
        """
        Convert cx, cy, w, h boxes to x, y, w, h for cv2.dnn.NMSBoxes,
        execute NMS, and return surviving Detection objects with [x1, y1, x2, y2].
        """
        # Convert cx, cy, w, h -> top-left x, top-left y, w, h for OpenCV
        cx = boxes_cxcywh[:, 0]
        cy = boxes_cxcywh[:, 1]
        w = boxes_cxcywh[:, 2]
        h = boxes_cxcywh[:, 3]

        x = cx - (w / 2.0)
        y = cy - (h / 2.0)

        # cv2.dnn.NMSBoxes expects list of [x, y, w, h]
        cv_boxes = [[float(bx), float(by), float(bw), float(bh)] for bx, by, bw, bh in zip(x, y, w, h)]
        cv_scores = [float(c) for c in confidences]

        indices = cv2.dnn.NMSBoxes(
            bboxes=cv_boxes,
            scores=cv_scores,
            score_threshold=self.config.conf_threshold,
            nms_threshold=self.config.iou_threshold,
        )

        if len(indices) == 0:
            return []

        # Handle different OpenCV return shapes for indices (1D or 2D)
        if isinstance(indices, np.ndarray):
            selected_indices = indices.flatten()
        else:
            selected_indices = [idx[0] if isinstance(idx, (list, tuple, np.ndarray)) else idx for idx in indices]

        detections: list[Detection] = []
        for idx in selected_indices[: self.config.max_detections]:
            bx, by, bw, bh = cv_boxes[idx]
            x1 = max(0.0, bx)
            y1 = max(0.0, by)
            x2 = max(0.0, bx + bw)
            y2 = max(0.0, by + bh)
            cid = int(class_ids[idx])

            detections.append(
                Detection(
                    box=[x1, y1, x2, y2],
                    confidence=cv_scores[idx],
                    class_id=cid,
                    class_name=self.get_class_name(cid),
                )
            )

        return detections

    @staticmethod
    def _rescale_boxes(
        detections: list[Detection],
        model_size: tuple[int, int],  # (width, height)
        orig_size: tuple[int, int],   # (width, height)
    ) -> list[Detection]:
        """
        Rescale bounding boxes from model input dimensions to original frame dimensions.
        """
        m_w, m_h = model_size
        o_w, o_h = orig_size

        if m_w <= 0 or m_h <= 0 or o_w <= 0 or o_h <= 0:
            return detections

        scale_x = o_w / float(m_w)
        scale_y = o_h / float(m_h)

        rescaled: list[Detection] = []
        for det in detections:
            x1, y1, x2, y2 = det.box
            rescaled_box = [
                max(0.0, min(float(o_w), x1 * scale_x)),
                max(0.0, min(float(o_h), y1 * scale_y)),
                max(0.0, min(float(o_w), x2 * scale_x)),
                max(0.0, min(float(o_h), y2 * scale_y)),
            ]
            rescaled.append(
                Detection(
                    box=rescaled_box,
                    confidence=det.confidence,
                    class_id=det.class_id,
                    class_name=det.class_name,
                )
            )

        return rescaled
