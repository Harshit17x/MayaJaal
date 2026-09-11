# Graph Report - MayaJaal  (2026-09-11)

## Corpus Check
- 145 files · ~1,352,207 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1232 nodes · 2034 edges · 93 communities (63 shown, 12 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ad8c468b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useAuth
- ByteTrackerWrapper
- frontend/package.json
- geofences/page.tsx
- BorderMap.tsx
- ONNXEngine
- ANPRPipeline
- cameras.py
- VideoLoader
- tracking.py
- inference.py
- PreprocessingError
- ModelManager
- ResourceManager
- load_image
- compilerOptions
- README.md
- AnalyticsDashboard.tsx
- alert.ts
- faces.py
- FaceService
- AlertService
- RTSPStream
- logging.py
- liveworkspace.tsx
- anpr.py
- Postprocessor
- scripts
- HFInference
- draw_tracked_boxes
- 34. Recommended Final Model Integration Process
- app_current.py
- root_app.py
- ModelManagerError
- Settings
- GlobalTraceManager
- lucide-react
- middleware.ts
- postcss.config.mjs
- next-env.d.ts
- GeofenceEngine
- test_reid_and_global_tracking.py
- alerts.py
- api.ts
- 37. Troubleshooting
- 39. Development Notes
- 2. Current Project Status
- rules/graphify.md
- workflows/graphify.md
- 45. Repository
- acknowledge_alert
- api/models.py
- inference_service.py
- test_alerts_and_scanner.py
- alerts_websocket_endpoint
- get
- geofences.py
- test_cameras_security.py
- alertsStore.ts
- facial-recognition/page.tsx
- ONNXModelError
- ReIDService
- FastAPI
- test_facial_recognition.py
- scan_image
- health
- test_stream
- unexpected_exception_handler
- get_annotated_frame
- quantize_model.py
- reset_global_traces
- ndarray
- Response
- StreamingResponse
- Any

## God Nodes (most connected - your core abstractions)
1. `lucide-react` - 29 edges
2. `get()` - 27 edges
3. `react` - 23 edges
4. `ModelManager` - 22 edges
5. `ONNXEngine` - 21 edges
6. `useAlerts()` - 21 edges
7. `ByteTrackerWrapper` - 18 edges
8. `GeofenceEngine` - 17 edges
9. `RTSPStream` - 17 edges
10. `PreprocessingError` - 16 edges

## Surprising Connections (you probably didn't know these)
- `root()` --references--> `get()`  [EXTRACTED]
  backend/app/main.py → anpr/app.py
- `get_face_engine_status()` --references--> `get()`  [EXTRACTED]
  backend/app/api/faces.py → anpr/app.py
- `get_face_thumbnail()` --references--> `get()`  [EXTRACTED]
  backend/app/api/faces.py → anpr/app.py
- `get_recent_face_events()` --references--> `get()`  [EXTRACTED]
  backend/app/api/faces.py → anpr/app.py
- `list_enrolled_faces()` --references--> `get()`  [EXTRACTED]
  backend/app/api/faces.py → anpr/app.py

## Import Cycles
- None detected.

## Communities (93 total, 12 thin omitted)

### Community 0 - "useAuth"
Cohesion: 0.24
Nodes (8): LoginFormCard(), EmblemIndia(), HeroSection(), LandingNavbar(), DEMO_OPERATORS, getStoredOperator(), OperatorUser, useAuth()

### Community 1 - "ByteTrackerWrapper"
Cohesion: 0.05
Nodes (31): ByteTracker configuration. Maps to the supervision ByteTrack constructor…, Immutable configuration for ByteTrackerWrapper. Attributes:…, TrackerConfig, ByteTrack multi-object tracking package. Provides stateful, per-session object…, Any, Data models for tracking output. TrackedObject extends a raw Detection with a…, Snapshot of a tracked object within a single video frame. Attributes: track_id:…, Return a JSON-serialisable representation. (+23 more)

### Community 2 - "frontend/package.json"
Cohesion: 0.04
Nodes (42): nextConfig, dependencies, clsx, lucide-react, maplibre-gl, next, react, react-dom (+34 more)

### Community 3 - "geofences/page.tsx"
Cohesion: 0.17
Nodes (13): COLOR_PRESETS, FeedViewMode, GeofencesPage(), ToolMode, CreateTripwirePayload, CreateZonePayload, DirectionalTripwire, GeofenceBreachEvent (+5 more)

### Community 4 - "BorderMap.tsx"
Cohesion: 0.06
Nodes (41): CAMERA_TYPES, CamerasPage(), COORDINATE_PRESETS, SECTORS, BorderMap(), BorderMapProps, DEMO_ALERT, escapeHtml() (+33 more)

### Community 5 - "ONNXEngine"
Cohesion: 0.13
Nodes (12): ONNXEngine, Any, Path, Create the ONNX Runtime session., Extract embedded model metadata, class labels, and input image size., Return information about model inputs., Return information about model outputs., Return useful information about the loaded model. (+4 more)

### Community 6 - "ANPRPipeline"
Cohesion: 0.12
Nodes (16): ANPRPipeline, Any, ndarray, Path, Find license plate text and its bounding box directly within a vehicle crop., End-to-end ANPR Pipeline using ONNX models on GPU: 1. Vehicle detection via…, Resize with padding (letterbox) to square tensor for YOLOv8., Decode YOLOv8 [1, num_classes + 4, 8400] output tensor with NMS. (+8 more)

### Community 7 - "cameras.py"
Cohesion: 0.22
Nodes (17): create_camera(), delete_camera(), _ensure_data_file(), get_camera(), get_cameras(), _load_cameras(), _load_default_cameras_from_file(), Any (+9 more)

### Community 8 - "VideoLoader"
Cohesion: 0.11
Nodes (18): InvalidVideoError, Any, Exception, Path, Return useful video metadata., Read the next frame with orientation correction. Returns: (True, frame) when…, Base exception for video loading errors., Raised when a video file does not exist. (+10 more)

### Community 9 - "tracking.py"
Cohesion: 0.13
Nodes (20): _build_tracker_config(), _create_preprocessor(), get_global_trace_trajectory(), _get_model_input_size(), list_global_traces(), list_rtsp_sessions(), Any, post (+12 more)

### Community 10 - "inference.py"
Cohesion: 0.14
Nodes (21): create_preprocessor(), get_model_input_size(), image_inference(), inference_status(), post, UploadFile, Run bounded inference on frames from an uploaded video., Get the preferred (width, height) resolution for a model. Defaults to (640,… (+13 more)

### Community 11 - "PreprocessingError"
Cohesion: 0.15
Nodes (16): InvalidFrameError, InvalidTargetSizeError, PreprocessingError, Preprocessor, Exception, ndarray, Validate an OpenCV frame., Base exception for preprocessing errors. (+8 more)

### Community 12 - "ModelManager"
Cohesion: 0.14
Nodes (9): ModelManager, Any, Return a loaded model., Check whether a model is currently loaded., Return names of all loaded models., Return the status of all loaded models., Unload all models safely., Run inference using a named cached model. (+1 more)

### Community 13 - "ResourceManager"
Cohesion: 0.13
Nodes (12): Exception, Context manager for safe inference execution. Example: with…, Base exception for resource manager errors., Return current resource usage., Return whether an inference slot is currently available., Controls concurrent inference execution. Designed for a CPU-first system where…, Acquire an inference slot. Returns: True if a slot was acquired. False if the…, Release an inference slot. (+4 more)

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

### Community 18 - "alert.ts"
Cohesion: 0.18
Nodes (9): RecentAlerts(), AlertFilter, AlertItem, AlertSeverity, GlobalTraceItem, QrtDispatchRecord, ScannerStatus, SuspectTrajectory (+1 more)

### Community 19 - "faces.py"
Cohesion: 0.06
Nodes (40): add_face_sample(), decode_image_input(), delete_person(), face_websocket_stream(), _generate_face_stream(), get_face_engine_status(), get_face_thumbnail(), get_recent_face_events() (+32 more)

### Community 20 - "FaceService"
Cohesion: 0.11
Nodes (17): calibrate_match_confidence(), compute_iou(), enhance_aligned_face(), FaceService, Any, ndarray, Compute Intersection over Union (IoU) between two bounding boxes [x1, y1, x2,…, Update classification and threat metadata for an enrolled person without re-… (+9 more)

### Community 21 - "AlertService"
Cohesion: 0.10
Nodes (13): AbstractEventLoop, AlertBroadcaster, AlertService, Any, WebSocket, Create a new alert record, persist it, update camera status, and broadcast to…, Mark camera node status as 'alert' in cameras.json., Thread-safe WebSocket broadcaster for real-time security alerts. (+5 more)

### Community 22 - "RTSPStream"
Cohesion: 0.16
Nodes (10): Any, Open the stream (RTSP or HTTP IP Webcam) with candidate fallbacks and bounded…, Read one frame from the RTSP stream., Attempt bounded reconnection attempts. Returns: True if reconnection succeeds.…, Raised when an RTSP stream cannot be opened., Return current RTSP stream status., Release the RTSP capture resource., Safe RTSP stream reader for CCTV cameras. Features: - RTSP URL validation -… (+2 more)

### Community 23 - "logging.py"
Cohesion: 0.07
Nodes (35): create_standby_frame(), draw_bounding_boxes(), draw_tactical_hud(), get_live_stream(), get_snapshot(), is_host_reachable(), is_rtsp_host_reachable(), normalize_stream_url() (+27 more)

### Community 24 - "liveworkspace.tsx"
Cohesion: 0.21
Nodes (14): AlertsPage(), SuspectTrajectoryModal(), SuspectTrajectoryModalProps, CLASS_COLORS, DetectionCanvas(), DetectionCanvasProps, buildStreamUrl(), LiveWorkspace() (+6 more)

### Community 25 - "anpr.py"
Cohesion: 0.13
Nodes (15): get_plate_snapshot(), get_processed_video(), get_records(), get_watchlist(), delete, Response, StreamingResponse, Remove a vehicle license plate from the watchlist. (+7 more)

### Community 26 - "Postprocessor"
Cohesion: 0.12
Nodes (18): Detection, Postprocessor, PostprocessorConfig, PostprocessorError, Any, Exception, ndarray, Decode standard YOLOv8/v9/v11 output with shape [1, 4 + C, N]. Row 0..3 are cx,… (+10 more)

### Community 27 - "scripts"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, dev, graphify:report, graphify:update, lint (+2 more)

### Community 29 - "draw_tracked_boxes"
Cohesion: 0.16
Nodes (12): convert_video_to_h264(), draw_tracked_boxes(), find_ffmpeg_executable(), Any, ndarray, Path, Server-side bounding box and track ID annotator. Draws tactical bounding boxes,…, Locate the FFmpeg executable reliably across system paths, Python scripts,… (+4 more)

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

### Community 35 - "GlobalTraceManager"
Cohesion: 0.10
Nodes (14): calc_haversine_km(), GlobalTrace, GlobalTraceManager, Any, ndarray, Update the aggregated appearance feature using Exponential Moving Average…, Convert GlobalTrace into JSON-serializable representation., Central Thread-Safe Manager for Cross-Camera Multi-Target Multi-Camera Tracking… (+6 more)

### Community 36 - "lucide-react"
Cohesion: 0.13
Nodes (6): CameraFeedStrip(), cameras, SystemStatus(), ConnectionStatus(), useBackendStatus(), lucide-react

### Community 41 - "GeofenceEngine"
Cohesion: 0.10
Nodes (17): Any, ccw(), check_tripwire_crossing(), compute_footpoint(), GeofenceEngine, is_point_in_polygon(), Virtual Geofencing & Directional Tripwire Engine. Provides mathematical…, Computes the bottom-center anchor point (ground contact) of a bounding box.… (+9 more)

### Community 59 - "test_reid_and_global_tracking.py"
Cohesion: 0.18
Nodes (10): Verify that when a trace is recognized as an enrolled suspect on Cam 1, Cam 2…, Verify ReID feature extractor returns 512-D L2-normalized float32 vectors., Verify REST endpoints /api/tracking/global/traces., Verify same person yields high similarity (>0.85) and different person yields…, Verify that when a person moves from Camera 1 to Camera 2, their Global Trace…, test_cross_camera_global_tracking(), test_global_trace_rest_api(), test_reid_service_extraction() (+2 more)

### Community 60 - "alerts.py"
Cohesion: 0.19
Nodes (17): AlertCreateRequest, clear_alerts(), create_alert(), dispatch_qrt(), get_scanner_status(), Any, BaseModel, post (+9 more)

### Community 61 - "api.ts"
Cohesion: 0.12
Nodes (24): AnprPage(), ApiError, request(), StreamValidationResult, BackendStatusState, AnprRecord, AnprScanResponse, AnprVideoResponse (+16 more)

### Community 62 - "37. Troubleshooting"
Cohesion: 0.33
Nodes (6): 37. Troubleshooting, Image inference fails, Model not found, `pip.exe` is blocked, RTSP connection failure, Server is not responding

### Community 63 - "39. Development Notes"
Cohesion: 0.33
Nodes (6): 39. Development Notes, API layer, Core layer, Inference layer, Pipeline layer, Utility layer

### Community 64 - "2. Current Project Status"
Cohesion: 0.40
Nodes (5): 1. Project Overview, 2. Current Project Status, Completed, Pending, SIH26187 – AI-Based Intelligent Video Analytics Inference Engine

### Community 68 - "acknowledge_alert"
Cohesion: 0.67
Nodes (3): acknowledge_alert(), patch, Acknowledge a specific alert by ID.

### Community 69 - "api/models.py"
Cohesion: 0.20
Nodes (10): load_model(), model_status(), ModelLoadRequest, BaseModel, delete, post, Return the current model manager status., Load and cache an ONNX model. (+2 more)

### Community 70 - "inference_service.py"
Cohesion: 0.21
Nodes (10): InferenceResourceError, InferenceServiceError, Any, Exception, ndarray, Base exception for inference service errors., Raised when inference resources are unavailable., Run inference using a loaded model. Returns a JSON-serializable structure with… (+2 more)

### Community 71 - "test_alerts_and_scanner.py"
Cohesion: 0.15
Nodes (12): cleanup_test_data(), Test multi-camera suspect trajectory reconstruction and QRT team dispatch., Ensure user's custom threat detection model best.onnx is 100% untouched., Clear all test alerts and restore camera statuses to 'online' so no dummy data…, Test AlertService creation, filtering, acknowledgement, and ring buffer., Test ContinuousFaceScanner status and start/stop controls., Test the REST API endpoints in alerts_router using FastAPI TestClient., test_alert_service_lifecycle() (+4 more)

### Community 72 - "alerts_websocket_endpoint"
Cohesion: 0.67
Nodes (3): alerts_websocket_endpoint(), websocket, WebSocket endpoint for real-time security alerts and suspect sightings. Clients…

### Community 73 - "get"
Cohesion: 0.22
Nodes (9): get(), websocket, websocket_endpoint(), get_alert_snapshot(), get_suspect_trajectory(), list_alerts(), Serve forensic snapshot JPEG image for an alert., Retrieve security and suspect sighting alerts with optional filtering. (+1 more)

### Community 74 - "geofences.py"
Cohesion: 0.11
Nodes (30): create_tripwire(), create_zone(), delete_tripwire(), delete_zone(), evaluate_geofences(), EvaluateRequest, EvaluateTrackItem, get_geofences() (+22 more)

### Community 75 - "test_cameras_security.py"
Cohesion: 0.67
Nodes (3): test_stream_target_rejects_addresses_outside_camera_network(), test_stream_target_uses_allowlisted_resolved_address(), MonkeyPatch

### Community 76 - "alertsStore.ts"
Cohesion: 0.11
Nodes (22): GisMapPage(), NavItem, OperatorLayout(), TacticalThreatToast(), MetricCard(), MetricCardProps, MetricsRow(), AlertListener (+14 more)

### Community 77 - "facial-recognition/page.tsx"
Cohesion: 0.31
Nodes (7): EnrolledPerson, FaceDetection, FaceEngineStatus, FaceEvent, FaceScanResponse, RegisterFaceResponse, ThreatLevel

### Community 78 - "ONNXModelError"
Cohesion: 0.21
Nodes (9): ONNXEngineError, ONNXInferenceError, ONNXModelError, Exception, ndarray, Run inference using a NumPy array. Preprocessing is intentionally kept outside…, Base exception for ONNX engine errors., Raised when an ONNX model cannot be loaded or is invalid. (+1 more)

### Community 79 - "ReIDService"
Cohesion: 0.18
Nodes (9): ndarray, Extract a single 512-D L2-normalized feature vector from a person crop., Extract 512-D L2-normalized feature vectors for a list of crops. Handles batch…, Robust spatial color histogram descriptor (512-D normalized vector) used as…, Compute cosine similarity between two normalized 512-D vectors in range [-1.0,…, Person Re-Identification Service for MAATRIX. Extracts 512-dimensional…, Verify model presence, attempt download if missing, and initialize ONNX session., Preprocess a single BGR crop into (3, 256, 128) float32 normalized tensor. (+1 more)

### Community 80 - "FastAPI"
Cohesion: 0.25
Nodes (8): lifespan(), root(), get_logger(), Configure application-wide logging. Logs are written to both: - the console - a…, Return a logger for a specific application module., setup_logging(), FastAPI, Logger

### Community 81 - "test_facial_recognition.py"
Cohesion: 0.22
Nodes (8): Ensure user's custom threat detection model best.onnx is 100% untouched., Verify YuNet and SFace models are properly initialized and database is loaded., Test the REST API endpoints using FastAPI TestClient., Test suspect classification, threat levels, and PATCH metadata updates., test_face_api_endpoints(), test_face_service_initialization(), test_model_preservation(), test_suspect_classification()

### Community 82 - "scan_image"
Cohesion: 0.29
Nodes (8): add_to_watchlist(), post, UploadFile, Add a license plate to the real-time interception watchlist., Scan an uploaded static image for vehicles, license plates, and text., Process an uploaded video clip, tracking and recording unique license plates., scan_image(), scan_video()

### Community 83 - "health"
Cohesion: 0.50
Nodes (3): health(), Any, Return backend health, device config, and execution providers.

### Community 84 - "test_stream"
Cohesion: 0.25
Nodes (8): CameraCreateRequest, CameraUpdateRequest, HealthStats, BaseModel, post, Ping and test RTSP connection reachability and stream handshaking. Validates…, test_stream(), TestStreamRequest

### Community 85 - "unexpected_exception_handler"
Cohesion: 0.38
Nodes (7): Exception, unexpected_exception_handler(), validation_exception_handler(), exception_handler, JSONResponse, Request, RequestValidationError

### Community 86 - "get_annotated_frame"
Cohesion: 0.40
Nodes (5): api_route, get_annotated_frame(), get_annotated_video(), Serve a server-annotated ByteTrack video with burned-in bounding boxes (H.264…, Serve a single server-annotated JPEG frame from tracked video.

### Community 88 - "reset_global_traces"
Cohesion: 0.40
Nodes (5): delete, Reset and remove the ByteTracker session for the given ``camera_id``. After…, Clear and reset all global cross-camera trace records., reset_global_traces(), reset_rtsp_session()

## Knowledge Gaps
- **182 isolated node(s):** `ToolMode`, `FeedViewMode`, `COLOR_PRESETS`, `NavItem`, `OperatorUser` (+177 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 580 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ONNXEngine` connect `ONNXEngine` to `ModelManagerError`, `ANPRPipeline`, `ModelManager`, `ONNXModelError`, `logging.py`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `VideoLoader` connect `VideoLoader` to `tracking.py`, `inference.py`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `ModelManager` (e.g. with `InferenceService` and `ONNXEngine`) actually correct?**
  _`ModelManager` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `ONNXEngine` (e.g. with `ModelManager` and `ANPRPipeline`) actually correct?**
  _`ONNXEngine` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ToolMode`, `FeedViewMode`, `COLOR_PRESETS` to the rest of the system?**
  _182 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ByteTrackerWrapper` be split into smaller, more focused modules?**
  _Cohesion score 0.054426705370101594 - nodes in this community are weakly interconnected._
- **Should `frontend/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._