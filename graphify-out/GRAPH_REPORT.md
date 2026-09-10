# Graph Report - MayaJaal  (2026-09-10)

## Corpus Check
- 135 files · ~602,139 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1066 nodes · 1742 edges · 85 communities (53 shown, 13 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 46 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cc39cb70`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useAuth
- ByteTrackerWrapper
- frontend/package.json
- ResourceManager
- camerasStore.ts
- ONNXEngine
- ANPRPipeline
- cameras.py
- VideoLoader
- tracking.py
- PreprocessingError
- useBackendStatus.ts
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
- alert.ts
- draw_tracked_boxes
- ONNXModelError
- scripts
- HFInference
- liveworkspace.tsx
- 34. Recommended Final Model Integration Process
- app_current.py
- root_app.py
- ModelManagerError
- Settings
- logging.py
- lucide-react
- middleware.ts
- postcss.config.mjs
- next-env.d.ts
- inference.py
- anpr.py
- api.ts
- 37. Troubleshooting
- 39. Development Notes
- 2. Current Project Status
- rules/graphify.md
- workflows/graphify.md
- 45. Repository
- RTSPError
- api/models.py
- alerts_websocket_endpoint
- test_alerts_and_scanner.py
- test_facial_recognition.py
- FastAPI
- reset_rtsp_session
- test_cameras_security.py
- alertsStore.ts
- get_annotated_frame
- get
- BaseModel
- delete
- patch
- post
- UploadFile
- websocket

## God Nodes (most connected - your core abstractions)
1. `lucide-react` - 26 edges
2. `ModelManager` - 22 edges
3. `react` - 22 edges
4. `ONNXEngine` - 21 edges
5. `get()` - 19 edges
6. `ByteTrackerWrapper` - 18 edges
7. `RTSPStream` - 17 edges
8. `useAlerts()` - 17 edges
9. `FaceService` - 16 edges
10. `PreprocessingError` - 16 edges

## Surprising Connections (you probably didn't know these)
- `root()` --references--> `get()`  [EXTRACTED]
  backend/app/main.py → anpr/app.py
- `get_scanner_status()` --references--> `get()`  [EXTRACTED]
  backend/app/api/alerts.py → anpr/app.py
- `get_suspect_trajectory()` --references--> `get()`  [EXTRACTED]
  backend/app/api/alerts.py → anpr/app.py
- `list_alerts()` --references--> `get()`  [EXTRACTED]
  backend/app/api/alerts.py → anpr/app.py
- `get_records()` --references--> `get()`  [EXTRACTED]
  backend/app/api/anpr.py → anpr/app.py

## Import Cycles
- None detected.

## Communities (85 total, 13 thin omitted)

### Community 0 - "useAuth"
Cohesion: 0.24
Nodes (8): LoginFormCard(), EmblemIndia(), HeroSection(), LandingNavbar(), DEMO_OPERATORS, getStoredOperator(), OperatorUser, useAuth()

### Community 1 - "ByteTrackerWrapper"
Cohesion: 0.06
Nodes (28): ByteTracker configuration. Maps to the supervision ByteTrack constructor…, Immutable configuration for ByteTrackerWrapper. Attributes:…, TrackerConfig, ByteTrack multi-object tracking package. Provides stateful, per-session object…, Any, Data models for tracking output. TrackedObject extends a raw Detection with a…, Snapshot of a tracked object within a single video frame. Attributes: track_id:…, Return a JSON-serialisable representation. (+20 more)

### Community 2 - "frontend/package.json"
Cohesion: 0.04
Nodes (42): nextConfig, dependencies, clsx, lucide-react, maplibre-gl, next, react, react-dom (+34 more)

### Community 3 - "ResourceManager"
Cohesion: 0.13
Nodes (12): Exception, Context manager for safe inference execution. Example: with…, Base exception for resource manager errors., Return current resource usage., Return whether an inference slot is currently available., Controls concurrent inference execution. Designed for a CPU-first system where…, Acquire an inference slot. Returns: True if a slot was acquired. False if the…, Release an inference slot. (+4 more)

### Community 4 - "camerasStore.ts"
Cohesion: 0.08
Nodes (34): AnprPage(), CAMERA_TYPES, CamerasPage(), COORDINATE_PRESETS, SECTORS, BorderMap(), BorderMapProps, DEMO_ALERT (+26 more)

### Community 5 - "ONNXEngine"
Cohesion: 0.13
Nodes (12): ONNXEngine, Any, Path, Create the ONNX Runtime session., Extract embedded model metadata, class labels, and input image size., Return information about model inputs., Return information about model outputs., Return useful information about the loaded model. (+4 more)

### Community 6 - "ANPRPipeline"
Cohesion: 0.12
Nodes (16): ANPRPipeline, Any, ndarray, Path, Find license plate text and its bounding box directly within a vehicle crop., End-to-end ANPR Pipeline using ONNX models on GPU: 1. Vehicle detection via…, Resize with padding (letterbox) to square tensor for YOLOv8., Decode YOLOv8 [1, num_classes + 4, 8400] output tensor with NMS. (+8 more)

### Community 7 - "cameras.py"
Cohesion: 0.13
Nodes (28): CameraCreateRequest, CameraUpdateRequest, create_camera(), delete_camera(), _ensure_data_file(), get_camera(), get_cameras(), HealthStats (+20 more)

### Community 8 - "VideoLoader"
Cohesion: 0.12
Nodes (15): InvalidVideoError, Any, Path, Return useful video metadata., Read the next frame with orientation correction. Returns: (True, frame) when…, Raised when a video file does not exist., Release the video capture resource., Raised when a video format is not supported. (+7 more)

### Community 9 - "tracking.py"
Cohesion: 0.18
Nodes (17): _build_tracker_config(), _create_preprocessor(), _get_model_input_size(), Any, post, UploadFile, /api/tracking — ByteTrack multi-object tracking endpoints. Endpoints ---------…, Run ByteTrack multi-object tracking on an uploaded video. A **fresh** tracker… (+9 more)

### Community 10 - "PreprocessingError"
Cohesion: 0.15
Nodes (16): InvalidFrameError, InvalidTargetSizeError, PreprocessingError, Preprocessor, Exception, ndarray, Validate an OpenCV frame., Base exception for preprocessing errors. (+8 more)

### Community 11 - "useBackendStatus.ts"
Cohesion: 0.21
Nodes (9): MetricCard(), MetricCardProps, MetricsRow(), SystemStatus(), ConnectionStatus(), BackendStatusState, useBackendStatus(), HealthResponse (+1 more)

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
Cohesion: 0.16
Nodes (10): Any, Open the stream (RTSP or HTTP IP Webcam) with candidate fallbacks and bounded…, Read one frame from the RTSP stream., Attempt bounded reconnection attempts. Returns: True if reconnection succeeds.…, Raised when an RTSP stream cannot be opened., Return current RTSP stream status., Release the RTSP capture resource., Safe RTSP stream reader for CCTV cameras. Features: - RTSP URL validation -… (+2 more)

### Community 19 - "faces.py"
Cohesion: 0.07
Nodes (41): add_face_sample(), decode_image_input(), delete_person(), face_websocket_stream(), _generate_face_stream(), get_face_engine_status(), get_face_thumbnail(), get_recent_face_events() (+33 more)

### Community 20 - "FaceService"
Cohesion: 0.11
Nodes (17): calibrate_match_confidence(), compute_iou(), enhance_aligned_face(), FaceService, Any, ndarray, Compute Intersection over Union (IoU) between two bounding boxes [x1, y1, x2,…, Update classification and threat metadata for an enrolled person without re-… (+9 more)

### Community 21 - "AlertService"
Cohesion: 0.10
Nodes (13): AbstractEventLoop, AlertBroadcaster, AlertService, Any, WebSocket, Create a new alert record, persist it, update camera status, and broadcast to…, Mark camera node status as 'alert' in cameras.json., Thread-safe WebSocket broadcaster for real-time security alerts. (+5 more)

### Community 22 - "inference_service.py"
Cohesion: 0.21
Nodes (10): InferenceResourceError, InferenceServiceError, Any, Exception, ndarray, Base exception for inference service errors., Raised when inference resources are unavailable., Run inference using a loaded model. Returns a JSON-serializable structure with… (+2 more)

### Community 23 - "alerts.py"
Cohesion: 0.13
Nodes (24): acknowledge_alert(), AlertCreateRequest, clear_alerts(), create_alert(), dispatch_qrt(), get_scanner_status(), get_suspect_trajectory(), list_alerts() (+16 more)

### Community 24 - "alert.ts"
Cohesion: 0.29
Nodes (6): AlertFilter, AlertItem, QrtDispatchRecord, ScannerStatus, SuspectTrajectory, SuspectWaypoint

### Community 25 - "draw_tracked_boxes"
Cohesion: 0.16
Nodes (12): convert_video_to_h264(), draw_tracked_boxes(), find_ffmpeg_executable(), Any, ndarray, Path, Server-side bounding box and track ID annotator. Draws tactical bounding boxes,…, Locate the FFmpeg executable reliably across system paths, Python scripts,… (+4 more)

### Community 26 - "ONNXModelError"
Cohesion: 0.21
Nodes (9): ONNXEngineError, ONNXInferenceError, ONNXModelError, Exception, ndarray, Run inference using a NumPy array. Preprocessing is intentionally kept outside…, Base exception for ONNX engine errors., Raised when an ONNX model cannot be loaded or is invalid. (+1 more)

### Community 27 - "scripts"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, dev, graphify:report, graphify:update, lint (+2 more)

### Community 29 - "liveworkspace.tsx"
Cohesion: 0.10
Nodes (23): CLASS_COLORS, DetectionCanvas(), DetectionCanvasProps, buildStreamUrl(), LiveWorkspace(), alertsStore, normalizeConfidence(), Detection (+15 more)

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

### Community 35 - "logging.py"
Cohesion: 0.07
Nodes (35): create_standby_frame(), draw_bounding_boxes(), draw_tactical_hud(), get_live_stream(), get_snapshot(), is_host_reachable(), is_rtsp_host_reachable(), normalize_stream_url() (+27 more)

### Community 36 - "lucide-react"
Cohesion: 0.11
Nodes (15): AlertsPage(), GisMapPage(), NavItem, OperatorLayout(), TacticalThreatToast(), CameraFeedStrip(), cameras, RecentAlerts() (+7 more)

### Community 59 - "inference.py"
Cohesion: 0.21
Nodes (15): create_preprocessor(), get_model_input_size(), image_inference(), post, UploadFile, Run bounded inference on frames from an uploaded video., Get the preferred (width, height) resolution for a model. Defaults to (640,…, Create the preprocessing pipeline with model-specific input resolution. (+7 more)

### Community 60 - "anpr.py"
Cohesion: 0.12
Nodes (18): add_to_watchlist(), get_records(), get_watchlist(), delete, post, StreamingResponse, UploadFile, Add a license plate to the real-time interception watchlist. (+10 more)

### Community 61 - "api.ts"
Cohesion: 0.18
Nodes (16): RTSP_PRESETS, api, ApiError, request(), StreamValidationResult, AnprRecord, AnprScanResponse, AnprVideoResponse (+8 more)

### Community 62 - "37. Troubleshooting"
Cohesion: 0.33
Nodes (6): 37. Troubleshooting, Image inference fails, Model not found, `pip.exe` is blocked, RTSP connection failure, Server is not responding

### Community 63 - "39. Development Notes"
Cohesion: 0.33
Nodes (6): 39. Development Notes, API layer, Core layer, Inference layer, Pipeline layer, Utility layer

### Community 64 - "2. Current Project Status"
Cohesion: 0.40
Nodes (5): 1. Project Overview, 2. Current Project Status, Completed, Pending, SIH26187 – AI-Based Intelligent Video Analytics Inference Engine

### Community 68 - "RTSPError"
Cohesion: 0.27
Nodes (7): InvalidRTSPUrlError, Exception, Base exception for RTSP stream errors., Raised when an RTSP URL is invalid., Raised when a frame cannot be read from the stream., RTSPError, RTSPReadError

### Community 69 - "api/models.py"
Cohesion: 0.20
Nodes (10): load_model(), model_status(), ModelLoadRequest, BaseModel, delete, post, Return the current model manager status., Load and cache an ONNX model. (+2 more)

### Community 70 - "alerts_websocket_endpoint"
Cohesion: 0.67
Nodes (3): alerts_websocket_endpoint(), websocket, WebSocket endpoint for real-time security alerts and suspect sightings. Clients…

### Community 71 - "test_alerts_and_scanner.py"
Cohesion: 0.15
Nodes (12): cleanup_test_data(), Test multi-camera suspect trajectory reconstruction and QRT team dispatch., Ensure user's custom threat detection model best.onnx is 100% untouched., Clear all test alerts and restore camera statuses to 'online' so no dummy data…, Test AlertService creation, filtering, acknowledgement, and ring buffer., Test ContinuousFaceScanner status and start/stop controls., Test the REST API endpoints in alerts_router using FastAPI TestClient., test_alert_service_lifecycle() (+4 more)

### Community 72 - "test_facial_recognition.py"
Cohesion: 0.22
Nodes (8): Ensure user's custom threat detection model best.onnx is 100% untouched., Verify YuNet and SFace models are properly initialized and database is loaded., Test the REST API endpoints using FastAPI TestClient., Test suspect classification, threat levels, and PATCH metadata updates., test_face_api_endpoints(), test_face_service_initialization(), test_model_preservation(), test_suspect_classification()

### Community 73 - "FastAPI"
Cohesion: 0.16
Nodes (14): websocket, websocket_endpoint(), lifespan(), Exception, root(), unexpected_exception_handler(), validation_exception_handler(), Configure application-wide logging. Logs are written to both: - the console - a… (+6 more)

### Community 74 - "reset_rtsp_session"
Cohesion: 0.67
Nodes (3): delete, Reset and remove the ByteTracker session for the given ``camera_id``. After…, reset_rtsp_session()

### Community 75 - "test_cameras_security.py"
Cohesion: 0.67
Nodes (3): test_stream_target_rejects_addresses_outside_camera_network(), test_stream_target_uses_allowlisted_resolved_address(), MonkeyPatch

### Community 76 - "alertsStore.ts"
Cohesion: 0.22
Nodes (12): AlertListener, ConnectionListener, connectionListeners, getAlertsWsUrl(), INITIAL_ALERTS, initWebSocket(), listeners, memoryAlerts (+4 more)

### Community 77 - "get_annotated_frame"
Cohesion: 0.40
Nodes (5): api_route, get_annotated_frame(), get_annotated_video(), Serve a server-annotated ByteTrack video with burned-in bounding boxes (H.264…, Serve a single server-annotated JPEG frame from tracked video.

### Community 78 - "get"
Cohesion: 0.14
Nodes (15): get(), get_alert_snapshot(), Serve forensic snapshot JPEG image for an alert., get_plate_snapshot(), get_processed_video(), Response, Serve a cropped license plate snapshot image., Serve a processed ANPR video file. (+7 more)

## Knowledge Gaps
- **176 isolated node(s):** `OperatorUser`, `MetricCardProps`, `DayData`, `OutpostItem`, `CategoryStat` (+171 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 527 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ANPRPipeline` connect `ANPRPipeline` to `logging.py`, `ONNXEngine`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `ONNXEngine` connect `ONNXEngine` to `ModelManagerError`, `logging.py`, `ANPRPipeline`, `ModelManager`, `ONNXModelError`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `ModelManager` (e.g. with `InferenceService` and `ONNXEngine`) actually correct?**
  _`ModelManager` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `ONNXEngine` (e.g. with `ModelManager` and `ANPRPipeline`) actually correct?**
  _`ONNXEngine` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `OperatorUser`, `MetricCardProps`, `DayData` to the rest of the system?**
  _176 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ByteTrackerWrapper` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `frontend/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._