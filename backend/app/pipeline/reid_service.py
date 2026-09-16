from __future__ import annotations

import logging
from pathlib import Path
import threading
import time
import urllib.request
from typing import Optional

import cv2
import numpy as np

try:
    import onnxruntime as ort
except ImportError:
    ort = None

from app.core.config import settings

logger = logging.getLogger("SIH26187.ReIDService")

HF_MODEL_URL = "https://huggingface.co/anriha/osnet_x0_25_msmt17/resolve/main/osnet_x0_25_msmt17.onnx"
DEFAULT_MODEL_NAME = "osnet_x0_25_msmt17.onnx"


class ReIDService:
    """
    Person Re-Identification Service for MAATRIX.
    Extracts 512-dimensional appearance feature embeddings from full-body person crops
    using the lightweight OSNet-x0.25 model (trained on MSMT17).

    Features:
      - Thread-safe ONNX Runtime execution
      - Batch padding for fixed-batch or dynamic-batch ONNX graphs
      - Automated model download if missing
      - Offline heuristic descriptor fallback (Color + Texture) if ONNX runtime/model unavailable
      - L2-normalized 512-D embeddings ready for fast Cosine Similarity
    """

    def __init__(self, model_filename: str = DEFAULT_MODEL_NAME) -> None:
        self.models_dir = settings.model_directory
        self.models_dir.mkdir(parents=True, exist_ok=True)
        self.model_path = self.models_dir / model_filename

        self.session: Optional[ort.InferenceSession] = None
        self.input_name: Optional[str] = None
        self.output_name: Optional[str] = None
        self.batch_size: int = 16
        self.input_height: int = 256
        self.input_width: int = 128

        self.mean = np.array([0.485, 0.456, 0.406], dtype=np.float32).reshape(1, 1, 3)
        self.std = np.array([0.229, 0.224, 0.225], dtype=np.float32).reshape(1, 1, 3)

        self.lock = threading.Lock()
        self._ensure_model_and_load()

    def _ensure_model_and_load(self) -> None:
        """Verify model presence, attempt download if missing, and initialize ONNX session."""
        if not self.model_path.exists() or self.model_path.stat().st_size == 0:
            logger.info("ReID model not found locally at %s. Attempting download from HuggingFace...", self.model_path)
            try:
                req = urllib.request.Request(HF_MODEL_URL, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=30) as resp, open(self.model_path, "wb") as out_f:
                    out_f.write(resp.read())
                logger.info("Successfully downloaded OSNet ReID model (%d bytes).", self.model_path.stat().st_size)
            except Exception as dl_err:
                logger.warning("Could not download ReID model from %s: %s", HF_MODEL_URL, dl_err)

        if self.model_path.exists() and ort is not None:
            try:
                opts = ort.SessionOptions()
                opts.intra_op_num_threads = 2
                opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
                # Persist optimized graph to skip re-optimization on restarts
                optimized_path = self.model_path.with_suffix(".optimized.onnx")
                opts.optimized_model_filepath = str(optimized_path)
                opts.enable_mem_pattern = True
                opts.enable_mem_reuse = True
                opts.enable_cpu_mem_arena = True
                # Prefer CUDA when available, fall back to CPU
                _available = ort.get_available_providers()
                _providers = (
                    [("CUDAExecutionProvider", {"device_id": 0, "arena_extend_strategy": "kNextPowerOfTwo"}),
                     ("CPUExecutionProvider", {})]
                    if "CUDAExecutionProvider" in _available
                    else ["CPUExecutionProvider"]
                )
                self.session = ort.InferenceSession(str(self.model_path), sess_options=opts, providers=_providers)
                inputs = self.session.get_inputs()
                outputs = self.session.get_outputs()
                self.input_name = inputs[0].name
                self.output_name = outputs[0].name
                shape = inputs[0].shape
                if len(shape) == 4 and isinstance(shape[0], int) and shape[0] > 0:
                    self.batch_size = shape[0]
                logger.info(
                    "ReIDService initialized with OSNet model: input=%s %s, output=%s, batch_size=%d",
                    self.input_name,
                    shape,
                    self.output_name,
                    self.batch_size,
                )
            except Exception as load_err:
                logger.exception("Failed to initialize ONNX session for ReID model %s: %s", self.model_path, load_err)
                self.session = None
        else:
            logger.warning("ReIDService operating in heuristic fallback mode (ONNX model or runtime unavailable).")

    def preprocess_crop(self, crop_bgr: np.ndarray) -> Optional[np.ndarray]:
        """Preprocess a single BGR crop into (3, 256, 128) float32 normalized tensor."""
        if crop_bgr is None or crop_bgr.size == 0:
            return None
        h, w = crop_bgr.shape[:2]
        if h < 10 or w < 5:
            return None

        # Resize to (128, 256)
        resized = cv2.resize(crop_bgr, (self.input_width, self.input_height), interpolation=cv2.INTER_LINEAR)
        # BGR -> RGB
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
        # Normalize
        normalized = (rgb - self.mean) / self.std
        # HWC -> CHW
        chw = normalized.transpose(2, 0, 1)
        return chw

    def extract_crop(self, crop_bgr: np.ndarray) -> Optional[np.ndarray]:
        """Extract a single 512-D L2-normalized feature vector from a person crop."""
        res = self.extract_batch([crop_bgr])
        return res[0] if res else None

    def extract_batch(self, crops_bgr: list[np.ndarray]) -> list[Optional[np.ndarray]]:
        """
        Extract 512-D L2-normalized feature vectors for a list of crops.
        Handles batch padding up to self.batch_size.
        """
        if not crops_bgr:
            return []

        processed_indices = []
        tensors = []

        for idx, crop in enumerate(crops_bgr):
            chw = self.preprocess_crop(crop)
            if chw is not None:
                processed_indices.append(idx)
                tensors.append(chw)

        results: list[Optional[np.ndarray]] = [None] * len(crops_bgr)
        if not tensors:
            return results

        # If ONNX session is available, execute in chunks of self.batch_size
        if self.session is not None and self.input_name is not None:
            try:
                for i in range(0, len(tensors), self.batch_size):
                    chunk_tensors = tensors[i : i + self.batch_size]
                    actual_count = len(chunk_tensors)
                    batch_array = np.zeros((self.batch_size, 3, self.input_height, self.input_width), dtype=np.float32)
                    for j, t in enumerate(chunk_tensors):
                        batch_array[j] = t

                    with self.lock:
                        out = self.session.run([self.output_name], {self.input_name: batch_array})[0]

                    for j in range(actual_count):
                        vec = out[j].astype(np.float32)
                        norm = float(np.linalg.norm(vec))
                        if norm > 1e-6:
                            vec = vec / norm
                        orig_idx = processed_indices[i + j]
                        results[orig_idx] = vec

                return results
            except Exception as exc:
                logger.exception("Error during ONNX ReID feature extraction: %s", exc)

        # Fallback to heuristic spatial color/texture descriptor if ONNX execution failed
        for orig_idx, crop in zip(processed_indices, [crops_bgr[i] for i in processed_indices]):
            results[orig_idx] = self._extract_heuristic_descriptor(crop)

        return results

    def _extract_heuristic_descriptor(self, crop_bgr: np.ndarray) -> np.ndarray:
        """
        Robust spatial color histogram descriptor (512-D normalized vector)
        used as zero-dependency fallback when neural network is offline.
        Divides the person into 4 vertical body zones (Head, Torso, Legs, Feet)
        and computes HSV color histograms.
        """
        resized = cv2.resize(crop_bgr, (64, 128))
        hsv = cv2.cvtColor(resized, cv2.COLOR_BGR2HSV)
        features = []

        # 4 vertical stripes
        stripe_h = 32
        for s in range(4):
            stripe = hsv[s * stripe_h : (s + 1) * stripe_h, :]
            # 16 H bins, 4 S bins, 2 V bins = 128 bins per stripe -> 4 * 128 = 512 dimensions!
            hist = cv2.calcHist([stripe], [0, 1, 2], None, [16, 4, 2], [0, 180, 0, 256, 0, 256])
            hist = hist.flatten()
            norm = np.linalg.norm(hist)
            if norm > 1e-6:
                hist = hist / norm
            features.extend(hist)

        vec = np.array(features, dtype=np.float32)
        v_norm = float(np.linalg.norm(vec))
        if v_norm > 1e-6:
            vec = vec / v_norm
        return vec

    @staticmethod
    def compute_similarity(feat1: np.ndarray, feat2: np.ndarray) -> float:
        """Compute cosine similarity between two normalized 512-D vectors in range [-1.0, 1.0]."""
        if feat1 is None or feat2 is None or feat1.shape != feat2.shape:
            return 0.0
        # Since vectors are L2-normalized, cosine similarity is dot product
        sim = float(np.dot(feat1, feat2))
        return max(-1.0, min(1.0, sim))


reid_service = ReIDService()
