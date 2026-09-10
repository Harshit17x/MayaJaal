# Graph Report - MayaJaal  (2026-09-10)

## Corpus Check
- 134 files · ~597,944 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1054 nodes · 1699 edges · 82 communities (50 shown, 12 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 44 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d923f1a9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useAuth
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
- RTSPStream
- faces.py
- FaceService
- AlertService
- inference_service.py
- alerts.py
- alertsStore.ts
- convert_video_to_h264
- ONNXEngineError
- scripts
- HFInference
- api.ts
- 34. Recommended Final Model Integration Process
- app_current.py
- root_app.py
- ModelManagerError
- Settings
- react
- lucide-react
- middleware.ts
- postcss.config.mjs
- next-env.d.ts
- anpr.py
- facial-recognition/page.tsx
- 37. Troubleshooting
- 39. Development Notes
- 2. Current Project Status
- rules/graphify.md
- workflows/graphify.md
- 45. Repository
- FastAPI
- api/models.py
- inference.py
- test_alerts_and_scanner.py
- test_facial_recognition.py
- unexpected_exception_handler
- get
- test_cameras_security.py
- alerts/page.tsx
- delete
- Response
- StreamingResponse
- UploadFile
- Exception

## God Nodes (most connected - your core abstractions)
1. `lucide-react` - 26 edges
2. `ModelManager` - 22 edges
3. `react` - 22 edges
4. `ONNXEngine` - 21 edges
5. `ByteTrackerWrapper` - 19 edges
6. `useAlerts()` - 17 edges
7. `RTSPStream` - 17 edges
8. `get()` - 17 edges
9. `FaceService` - 16 edges
10. `PreprocessingError` - 16 edges

## Surprising Connections (you probably didn't know these)
- `get_snapshot()` --references--> `get()`  [EXTRACTED]
  backend/app/api/stream.py → anpr/app.py
- `validate_stream()` --references--> `get()`  [EXTRACTED]
  backend/app/api/stream.py → anpr/app.py
- `model_status()` --references--> `get()`  [EXTRACTED]
  backend/app/api/models.py → anpr/app.py
- `get_records()` --references--> `get()`  [EXTRACTED]
  backend/app/api/anpr.py → anpr/app.py
- `stream_anpr()` --references--> `get()`  [EXTRACTED]
  backend/app/api/anpr.py → anpr/app.py

## Import Cycles
- None detected.

## Communities (82 total, 12 thin omitted)

### Community 0 - "useAuth"
Cohesion: 0.24
Nodes (8): LoginFormCard(), EmblemIndia(), HeroSection(), LandingNavbar(), DEMO_OPERATORS, getStoredOperator(), OperatorUser, useAuth()

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
Cohesion: 0.08
Nodes (36): CameraCreateRequest, CameraUpdateRequest, create_camera(), delete_camera(), _ensure_data_file(), get_camera(), get_cameras(), HealthStats (+28 more)

### Community 8 - "VideoLoader"
Cohesion: 0.12
Nodes (15): InvalidVideoError, Any, Path, Return useful video metadata., Read the next frame with orientation correction. Returns: (True, frame) when…, Raised when a video file does not exist., Release the video capture resource., Raised when a video format is not supported. (+7 more)

### Community 9 - "tracking.py"
Cohesion: 0.11
Nodes (23): api_route, _build_tracker_config(), _create_preprocessor(), get_annotated_frame(), get_annotated_video(), _get_model_input_size(), Any, delete (+15 more)

### Community 10 - "stream.py"
Cohesion: 0.13
Nodes (23): create_standby_frame(), draw_bounding_boxes(), draw_tactical_hud(), get_snapshot(), is_host_reachable(), is_rtsp_host_reachable(), normalize_stream_url(), open_video_source() (+15 more)

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

### Community 18 - "RTSPStream"
Cohesion: 0.11
Nodes (19): Run ByteTrack tracking on a live RTSP stream. The tracker is **stateful**:…, rtsp_tracking(), InvalidRTSPUrlError, Any, Exception, Open the stream (RTSP or HTTP IP Webcam) with candidate fallbacks and bounded…, Base exception for RTSP stream errors., Read one frame from the RTSP stream. (+11 more)

### Community 19 - "faces.py"
Cohesion: 0.07
Nodes (41): add_face_sample(), decode_image_input(), delete_person(), face_websocket_stream(), _generate_face_stream(), get_face_engine_status(), get_face_thumbnail(), get_recent_face_events() (+33 more)

### Community 20 - "FaceService"
Cohesion: 0.12
Nodes (15): calibrate_match_confidence(), compute_iou(), FaceService, Any, ndarray, Compute Intersection over Union (IoU) between two bounding boxes [x1, y1, x2,…, Update classification and threat metadata for an enrolled person without re-…, Enroll a new person or add a sample if person already exists. Performs quality… (+7 more)

### Community 21 - "AlertService"
Cohesion: 0.10
Nodes (13): AbstractEventLoop, AlertBroadcaster, AlertService, Any, WebSocket, Create a new alert record, persist it, update camera status, and broadcast to…, Mark camera node status as 'alert' in cameras.json., Thread-safe WebSocket broadcaster for real-time security alerts. (+5 more)

### Community 22 - "inference_service.py"
Cohesion: 0.21
Nodes (10): InferenceResourceError, InferenceServiceError, Any, Exception, ndarray, Base exception for inference service errors., Raised when inference resources are unavailable., Run inference using a loaded model. Returns a JSON-serializable structure with… (+2 more)

### Community 23 - "alerts.py"
Cohesion: 0.10
Nodes (30): acknowledge_alert(), AlertCreateRequest, alerts_websocket_endpoint(), clear_alerts(), create_alert(), dispatch_qrt(), get_alert_snapshot(), get_scanner_status() (+22 more)

### Community 24 - "alertsStore.ts"
Cohesion: 0.13
Nodes (20): AlertsPage(), NavItem, OperatorLayout(), TacticalThreatToast(), MetricCard(), MetricCardProps, MetricsRow(), AlertListener (+12 more)

### Community 25 - "convert_video_to_h264"
Cohesion: 0.22
Nodes (10): convert_video_to_h264(), draw_tracked_boxes(), find_ffmpeg_executable(), Any, ndarray, Path, Server-side bounding box and track ID annotator. Draws tactical bounding boxes,…, Locate the FFmpeg executable reliably across system paths, Python scripts,… (+2 more)

### Community 26 - "ONNXEngineError"
Cohesion: 0.25
Nodes (7): ONNXEngineError, ONNXInferenceError, Exception, ndarray, Run inference using a NumPy array. Preprocessing is intentionally kept outside…, Base exception for ONNX engine errors., Raised when inference fails.

### Community 27 - "scripts"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, dev, graphify:report, graphify:update, lint (+2 more)

### Community 29 - "api.ts"
Cohesion: 0.13
Nodes (23): ApiError, request(), StreamValidationResult, BackendStatusState, QrtDispatchRecord, AnprRecord, AnprScanResponse, AnprVideoResponse (+15 more)

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

### Community 35 - "react"
Cohesion: 0.20
Nodes (10): CLASS_COLORS, DetectionCanvas(), DetectionCanvasProps, buildStreamUrl(), LiveWorkspace(), alertsStore, Detection, VideoFrameResult (+2 more)

### Community 36 - "lucide-react"
Cohesion: 0.11
Nodes (8): GisMapPage(), CameraFeedStrip(), cameras, RecentAlerts(), SystemStatus(), ConnectionStatus(), useBackendStatus(), lucide-react

### Community 60 - "anpr.py"
Cohesion: 0.14
Nodes (16): add_to_watchlist(), get_records(), delete, post, StreamingResponse, UploadFile, Add a license plate to the real-time interception watchlist., Remove a vehicle license plate from the watchlist. (+8 more)

### Community 61 - "facial-recognition/page.tsx"
Cohesion: 0.31
Nodes (7): EnrolledPerson, FaceDetection, FaceEngineStatus, FaceEvent, FaceScanResponse, RegisterFaceResponse, ThreatLevel

### Community 62 - "37. Troubleshooting"
Cohesion: 0.33
Nodes (6): 37. Troubleshooting, Image inference fails, Model not found, `pip.exe` is blocked, RTSP connection failure, Server is not responding

### Community 63 - "39. Development Notes"
Cohesion: 0.33
Nodes (6): 39. Development Notes, API layer, Core layer, Inference layer, Pipeline layer, Utility layer

### Community 64 - "2. Current Project Status"
Cohesion: 0.40
Nodes (5): 1. Project Overview, 2. Current Project Status, Completed, Pending, SIH26187 – AI-Based Intelligent Video Analytics Inference Engine

### Community 68 - "FastAPI"
Cohesion: 0.18
Nodes (9): websocket, websocket_endpoint(), health(), Any, Return backend health, device config, and execution providers., lifespan(), get, root() (+1 more)

### Community 69 - "api/models.py"
Cohesion: 0.20
Nodes (10): load_model(), model_status(), ModelLoadRequest, BaseModel, delete, post, Return the current model manager status., Load and cache an ONNX model. (+2 more)

### Community 70 - "inference.py"
Cohesion: 0.21
Nodes (15): create_preprocessor(), get_model_input_size(), image_inference(), post, UploadFile, Run bounded inference on frames from an uploaded video., Get the preferred (width, height) resolution for a model. Defaults to (640,…, Create the preprocessing pipeline with model-specific input resolution. (+7 more)

### Community 71 - "test_alerts_and_scanner.py"
Cohesion: 0.18
Nodes (10): Test multi-camera suspect trajectory reconstruction and QRT team dispatch., Ensure user's custom threat detection model best.onnx is 100% untouched., Test AlertService creation, filtering, acknowledgement, and ring buffer., Test ContinuousFaceScanner status and start/stop controls., Test the REST API endpoints in alerts_router using FastAPI TestClient., test_alert_service_lifecycle(), test_alerts_api_endpoints(), test_continuous_face_scanner_telemetry() (+2 more)

### Community 72 - "test_facial_recognition.py"
Cohesion: 0.22
Nodes (8): Ensure user's custom threat detection model best.onnx is 100% untouched., Verify YuNet and SFace models are properly initialized and database is loaded., Test the REST API endpoints using FastAPI TestClient., Test suspect classification, threat levels, and PATCH metadata updates., test_face_api_endpoints(), test_face_service_initialization(), test_model_preservation(), test_suspect_classification()

### Community 73 - "unexpected_exception_handler"
Cohesion: 0.38
Nodes (7): unexpected_exception_handler(), validation_exception_handler(), Exception, exception_handler, JSONResponse, Request, RequestValidationError

### Community 74 - "get"
Cohesion: 0.15
Nodes (15): get(), get_plate_snapshot(), get_processed_video(), get_watchlist(), Response, Serve a cropped license plate snapshot image., Serve a processed ANPR video file., Get the current tactical watchlist / BOLO vehicle list. (+7 more)

### Community 75 - "test_cameras_security.py"
Cohesion: 0.67
Nodes (3): test_stream_target_rejects_addresses_outside_camera_network(), test_stream_target_uses_allowlisted_resolved_address(), MonkeyPatch

### Community 76 - "alerts/page.tsx"
Cohesion: 0.26
Nodes (9): SuspectTrajectoryModal(), SuspectTrajectoryModalProps, api, AlertFilter, AlertItem, AlertSeverity, ScannerStatus, SuspectTrajectory (+1 more)

## Knowledge Gaps
- **174 isolated node(s):** `NavItem`, `SuspectTrajectoryModalProps`, `CameraCardProps`, `CameraGridProps`, `INITIAL_ALERTS` (+169 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 523 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ONNXEngine` connect `ONNXEngine` to `ModelManagerError`, `ONNXEngineError`, `ModelManager`, `ANPRPipeline`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `RTSPStream` connect `RTSPStream` to `tracking.py`, `inference.py`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `ANPRPipeline` connect `ANPRPipeline` to `ONNXEngine`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `ModelManager` (e.g. with `InferenceService` and `ONNXEngine`) actually correct?**
  _`ModelManager` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `ONNXEngine` (e.g. with `ModelManager` and `ANPRPipeline`) actually correct?**
  _`ONNXEngine` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `ByteTrackerWrapper` (e.g. with `video_tracking()` and `SessionInfo`) actually correct?**
  _`ByteTrackerWrapper` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `NavItem`, `SuspectTrajectoryModalProps`, `CameraCardProps` to the rest of the system?**
  _174 weakly-connected nodes found - possible documentation gaps or missing edges._