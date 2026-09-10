# Graph Report - MayaJaal  (2026-09-10)

## Corpus Check
- 127 files · ~582,986 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 939 nodes · 1494 edges · 70 communities (38 shown, 12 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `41b94b28`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- lucide-react
- ByteTrackerWrapper
- frontend/package.json
- logging.py
- camerasStore.ts
- ONNXEngine
- ANPRPipeline
- cameras.py
- VideoLoader
- tracking.py
- stream.py
- PreprocessingError
- ModelManager
- Postprocessor
- load_image
- compilerOptions
- README.md
- AnalyticsDashboard.tsx
- inference.py
- faces.py
- FaceService
- video_inference
- inference_service.py
- FastAPI
- delete
- convert_video_to_h264
- post
- scripts
- HFInference
- ONNXEngineError
- 34. Recommended Final Model Integration Process
- app_current.py
- root_app.py
- ModelManagerError
- Settings
- UploadFile
- Exception
- middleware.ts
- postcss.config.mjs
- next-env.d.ts
- .connect
- api.ts
- 37. Troubleshooting
- 39. Development Notes
- 2. Current Project Status
- rules/graphify.md
- workflows/graphify.md
- 45. Repository
- Any
- get_annotated_frame

## God Nodes (most connected - your core abstractions)
1. `lucide-react` - 24 edges
2. `ModelManager` - 22 edges
3. `ONNXEngine` - 21 edges
4. `react` - 20 edges
5. `ByteTrackerWrapper` - 18 edges
6. `RTSPStream` - 17 edges
7. `PreprocessingError` - 16 edges
8. `VideoLoader` - 16 edges
9. `compilerOptions` - 16 edges
10. `FaceService` - 15 edges

## Surprising Connections (you probably didn't know these)
- `inference_status()` --references--> `get()`  [EXTRACTED]
  backend/app/api/inference.py → anpr/app.py
- `health()` --references--> `get()`  [EXTRACTED]
  backend/app/api/health.py → anpr/app.py
- `model_status()` --references--> `get()`  [EXTRACTED]
  backend/app/api/models.py → anpr/app.py
- `stream_generator()` --calls--> `PreprocessingConfig`  [INFERRED]
  backend/app/api/stream.py → backend/app/pipeline/preprocessor.py
- `stream_generator()` --calls--> `Preprocessor`  [INFERRED]
  backend/app/api/stream.py → backend/app/pipeline/preprocessor.py

## Import Cycles
- None detected.

## Communities (70 total, 12 thin omitted)

### Community 0 - "lucide-react"
Cohesion: 0.05
Nodes (37): LoginFormCard(), AlertsPage(), NavItem, OperatorLayout(), CameraFeedStrip(), cameras, MetricCard(), MetricCardProps (+29 more)

### Community 1 - "ByteTrackerWrapper"
Cohesion: 0.06
Nodes (28): ByteTracker configuration. Maps to the supervision ByteTrack constructor…, Immutable configuration for ByteTrackerWrapper. Attributes:…, TrackerConfig, ByteTrack multi-object tracking package. Provides stateful, per-session object…, Any, Data models for tracking output. TrackedObject extends a raw Detection with a…, Snapshot of a tracked object within a single video frame. Attributes: track_id:…, Return a JSON-serialisable representation. (+20 more)

### Community 2 - "frontend/package.json"
Cohesion: 0.04
Nodes (42): nextConfig, dependencies, clsx, lucide-react, maplibre-gl, next, react, react-dom (+34 more)

### Community 3 - "logging.py"
Cohesion: 0.11
Nodes (14): Exception, Context manager for safe inference execution. Example: with…, Base exception for resource manager errors., Return current resource usage., Return whether an inference slot is currently available., Controls concurrent inference execution. Designed for a CPU-first system where…, Acquire an inference slot. Returns: True if a slot was acquired. False if the…, Release an inference slot. (+6 more)

### Community 4 - "camerasStore.ts"
Cohesion: 0.08
Nodes (34): AnprPage(), CAMERA_TYPES, CamerasPage(), COORDINATE_PRESETS, SECTORS, BorderMap(), BorderMapProps, DEMO_ALERT (+26 more)

### Community 5 - "ONNXEngine"
Cohesion: 0.13
Nodes (14): ONNXEngine, ONNXModelError, Any, Path, Create the ONNX Runtime session., Extract embedded model metadata, class labels, and input image size., Return information about model inputs., Return information about model outputs. (+6 more)

### Community 6 - "ANPRPipeline"
Cohesion: 0.11
Nodes (16): ANPRPipeline, Any, ndarray, Path, Find license plate text and its bounding box directly within a vehicle crop., End-to-end ANPR Pipeline using ONNX models on GPU: 1. Vehicle detection via…, Resize with padding (letterbox) to square tensor for YOLOv8., Decode YOLOv8 [1, num_classes + 4, 8400] output tensor with NMS. (+8 more)

### Community 7 - "cameras.py"
Cohesion: 0.06
Nodes (54): get(), add_to_watchlist(), get_plate_snapshot(), get_processed_video(), get_records(), get_watchlist(), delete, post (+46 more)

### Community 8 - "VideoLoader"
Cohesion: 0.11
Nodes (18): InvalidVideoError, Any, Exception, Path, Return useful video metadata., Read the next frame with orientation correction. Returns: (True, frame) when…, Base exception for video loading errors., Raised when a video file does not exist. (+10 more)

### Community 9 - "tracking.py"
Cohesion: 0.14
Nodes (20): _build_tracker_config(), _create_preprocessor(), _get_model_input_size(), Any, delete, post, UploadFile, /api/tracking — ByteTrack multi-object tracking endpoints. Endpoints ---------… (+12 more)

### Community 10 - "stream.py"
Cohesion: 0.12
Nodes (27): create_standby_frame(), draw_bounding_boxes(), draw_tactical_hud(), get_live_stream(), get_snapshot(), is_host_reachable(), is_rtsp_host_reachable(), normalize_stream_url() (+19 more)

### Community 11 - "PreprocessingError"
Cohesion: 0.15
Nodes (16): InvalidFrameError, InvalidTargetSizeError, PreprocessingError, Preprocessor, Exception, ndarray, Validate an OpenCV frame., Base exception for preprocessing errors. (+8 more)

### Community 12 - "ModelManager"
Cohesion: 0.14
Nodes (9): ModelManager, Any, Return a loaded model., Check whether a model is currently loaded., Return names of all loaded models., Return the status of all loaded models., Unload all models safely., Run inference using a named cached model. (+1 more)

### Community 13 - "Postprocessor"
Cohesion: 0.12
Nodes (18): Detection, Postprocessor, PostprocessorConfig, PostprocessorError, Any, Exception, ndarray, Decode standard YOLOv8/v9/v11 output with shape [1, 4 + C, N]. Row 0..3 are cx,… (+10 more)

### Community 14 - "load_image"
Cohesion: 0.18
Nodes (15): ImageFileNotFoundError, ImageLoaderError, InvalidImageError, load_image(), Exception, ndarray, Path, Base exception for image loading errors. (+7 more)

### Community 15 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 16 - "README.md"
Cohesion: 0.05
Nodes (39): 10. Health Check, 11. Runtime Status, 12. Model Management, 13. Adding an ONNX Model, 14. Loading an ONNX Model, 15. Checking Loaded Models, 16. Unloading a Model, 17. ONNX Model Inspection (+31 more)

### Community 17 - "AnalyticsDashboard.tsx"
Cohesion: 0.14
Nodes (11): ActivityOverviewChart(), DayData, WEEK_DATA, AnalyticsDashboard(), CameraOutpostGrid(), OutpostItem, OUTPOSTS, CATEGORIES (+3 more)

### Community 18 - "inference.py"
Cohesion: 0.14
Nodes (18): inference_status(), Run bounded inference on an RTSP CCTV stream. The endpoint processes a limited…, Return inference service and resource status., rtsp_inference(), InvalidRTSPUrlError, Any, Exception, Base exception for RTSP stream errors. (+10 more)

### Community 19 - "faces.py"
Cohesion: 0.09
Nodes (33): add_face_sample(), decode_image_input(), delete_person(), _generate_face_stream(), get_face_engine_status(), get_face_thumbnail(), get_recent_face_events(), list_enrolled_faces() (+25 more)

### Community 20 - "FaceService"
Cohesion: 0.13
Nodes (14): Any, calibrate_match_confidence(), compute_iou(), FaceService, ndarray, Enroll a new person or add a sample if person already exists. Performs quality…, Compute Intersection over Union (IoU) between two bounding boxes [x1, y1, x2,…, Add an additional angle or lighting sample to a specific person ID. (+6 more)

### Community 21 - "video_inference"
Cohesion: 0.27
Nodes (10): create_preprocessor(), get_model_input_size(), image_inference(), post, UploadFile, Run bounded inference on frames from an uploaded video., Get the preferred (width, height) resolution for a model. Defaults to (640,…, Create the preprocessing pipeline with model-specific input resolution. (+2 more)

### Community 22 - "inference_service.py"
Cohesion: 0.21
Nodes (10): InferenceResourceError, InferenceServiceError, Any, Exception, ndarray, Base exception for inference service errors., Raised when inference resources are unavailable., Run inference using a loaded model. Returns a JSON-serializable structure with… (+2 more)

### Community 23 - "FastAPI"
Cohesion: 0.06
Nodes (35): websocket_endpoint(), health(), Any, Return backend health, device config, and execution providers., load_model(), model_status(), ModelLoadRequest, BaseModel (+27 more)

### Community 25 - "convert_video_to_h264"
Cohesion: 0.22
Nodes (10): convert_video_to_h264(), draw_tracked_boxes(), find_ffmpeg_executable(), Any, ndarray, Path, Server-side bounding box and track ID annotator. Draws tactical bounding boxes,…, Locate the FFmpeg executable reliably across system paths, Python scripts,… (+2 more)

### Community 27 - "scripts"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, dev, graphify:report, graphify:update, lint (+2 more)

### Community 29 - "ONNXEngineError"
Cohesion: 0.25
Nodes (7): ONNXEngineError, ONNXInferenceError, Exception, ndarray, Run inference using a NumPy array. Preprocessing is intentionally kept outside…, Base exception for ONNX engine errors., Raised when inference fails.

### Community 30 - "34. Recommended Final Model Integration Process"
Cohesion: 0.15
Nodes (13): 34. Recommended Final Model Integration Process, Step 1, Step 10, Step 11, Step 12, Step 2, Step 3, Step 4 (+5 more)

### Community 31 - "app_current.py"
Cohesion: 0.70
Nodes (4): predict_image(), predict_video(), predict_webcam(), process_frame()

### Community 32 - "root_app.py"
Cohesion: 0.70
Nodes (4): predict_image(), predict_video(), predict_webcam(), process_frame()

### Community 33 - "ModelManagerError"
Cohesion: 0.22
Nodes (8): ModelAlreadyLoadedError, ModelManagerError, Exception, Path, Base exception for model manager errors., Unload one model and release its ONNX session., Raised when attempting to load an already loaded model., Load an ONNX model into the cache. A model is loaded only once. If loading…

### Community 34 - "Settings"
Cohesion: 0.50
Nodes (3): Central configuration for the SIH26187 inference backend., Settings, BaseSettings

### Community 60 - ".connect"
Cohesion: 0.33
Nodes (3): Open the stream (RTSP or HTTP IP Webcam) with candidate fallbacks and bounded…, Attempt bounded reconnection attempts. Returns: True if reconnection succeeds.…, Release the RTSP capture resource.

### Community 61 - "api.ts"
Cohesion: 0.10
Nodes (31): api, ApiError, request(), StreamValidationResult, BackendStatusState, AnprRecord, AnprScanResponse, AnprVideoResponse (+23 more)

### Community 62 - "37. Troubleshooting"
Cohesion: 0.33
Nodes (6): 37. Troubleshooting, Image inference fails, Model not found, `pip.exe` is blocked, RTSP connection failure, Server is not responding

### Community 63 - "39. Development Notes"
Cohesion: 0.33
Nodes (6): 39. Development Notes, API layer, Core layer, Inference layer, Pipeline layer, Utility layer

### Community 64 - "2. Current Project Status"
Cohesion: 0.40
Nodes (5): 1. Project Overview, 2. Current Project Status, Completed, Pending, SIH26187 – AI-Based Intelligent Video Analytics Inference Engine

### Community 70 - "get_annotated_frame"
Cohesion: 0.40
Nodes (5): api_route, get_annotated_frame(), get_annotated_video(), Serve a server-annotated ByteTrack video with burned-in bounding boxes (H.264…, Serve a single server-annotated JPEG frame from tracked video.

## Knowledge Gaps
- **169 isolated node(s):** `graphify`, `Workflow: graphify`, `NavItem`, `StreamValidationResult`, `name` (+164 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 477 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ONNXEngine` connect `ONNXEngine` to `ModelManagerError`, `ModelManager`, `ONNXEngineError`, `ANPRPipeline`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `ModelManager` connect `ModelManager` to `ModelManagerError`, `logging.py`, `ONNXEngine`, `inference_service.py`, `ONNXEngineError`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `ANPRPipeline` connect `ANPRPipeline` to `ONNXEngine`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `ModelManager` (e.g. with `InferenceService` and `ONNXEngine`) actually correct?**
  _`ModelManager` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `ONNXEngine` (e.g. with `ModelManager` and `ANPRPipeline`) actually correct?**
  _`ONNXEngine` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `ByteTrackerWrapper` (e.g. with `stream_generator()` and `video_tracking()`) actually correct?**
  _`ByteTrackerWrapper` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `graphify`, `Workflow: graphify`, `NavItem` to the rest of the system?**
  _169 weakly-connected nodes found - possible documentation gaps or missing edges._