# Graph Report - MayaJaal  (2026-09-12)

## Corpus Check
- 136 files · ~1,989,273 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1279 nodes · 2072 edges · 79 communities (56 shown, 13 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8ca58be3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- authStore.ts
- ByteTrackerWrapper
- frontend/package.json
- backend.ts
- BorderMap.tsx
- ONNXEngine
- stream.py
- cameras.py
- VideoLoader
- tracking.py
- RTSPStream
- PreprocessingError
- ModelManager
- ResourceManager
- load_image
- compilerOptions
- README.md
- AnalyticsDashboard.tsx
- alert.ts
- logging.py
- FaceService
- AlertService
- draw_tracked_boxes
- inference.py
- Response
- decode_image_input
- scripts
- MayaJaal (मायाजाल)
- alertsStore.ts
- 34. Recommended Final Model Integration Process
- facial-recognition/page.tsx
- ANPRPipeline
- liveworkspace.tsx
- Settings
- GlobalTraceManager
- ModelManagerError
- middleware.ts
- postcss.config.mjs
- next-env.d.ts
- GeofenceEngine
- ONNXModelError
- .get_model_info
- react
- delete
- .predict
- health
- StreamingResponse
- Path
- test_reid_and_global_tracking.py
- alerts.py
- 37. Troubleshooting
- 39. Development Notes
- 2. Current Project Status
- rules/graphify.md
- workflows/graphify.md
- 45. Repository
- src/middleware.ts
- api/models.py
- test_alerts_and_scanner.py
- main.py
- geofences.py
- test_cameras_security.py
- lucide-react
- ReIDService
- auth.py
- test_facial_recognition.py
- api.ts
- unexpected_exception_handler
- quantize_model.py

## God Nodes (most connected - your core abstractions)
1. `lucide-react` - 29 edges
2. `useAlerts()` - 24 edges
3. `react` - 23 edges
4. `ModelManager` - 19 edges
5. `ONNXEngine` - 19 edges
6. `ByteTrackerWrapper` - 18 edges
7. `GeofenceEngine` - 18 edges
8. `PreprocessingError` - 16 edges
9. `FaceService` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `image_inference()` --uses--> `PreprocessingError`  [INFERRED]
  backend/app/api/inference.py → backend/app/pipeline/preprocessor.py
- `video_inference()` --uses--> `PreprocessingError`  [INFERRED]
  backend/app/api/inference.py → backend/app/pipeline/preprocessor.py
- `video_inference()` --calls--> `VideoLoader`  [INFERRED]
  backend/app/api/inference.py → backend/app/pipeline/video_loader.py
- `rtsp_inference()` --uses--> `PreprocessingError`  [INFERRED]
  backend/app/api/inference.py → backend/app/pipeline/preprocessor.py
- `rtsp_inference()` --calls--> `RTSPStream`  [INFERRED]
  backend/app/api/inference.py → backend/app/pipeline/rtsp_loader.py

## Import Cycles
- None detected.

## Communities (79 total, 13 thin omitted)

### Community 0 - "authStore.ts"
Cohesion: 0.13
Nodes (22): LoginFormCard(), NavItem, OperatorLayout(), EmblemIndia(), HeroSection(), LandingNavbar(), AUTH_COOKIE_NAME, AUTH_EVENT_NAME (+14 more)

### Community 1 - "ByteTrackerWrapper"
Cohesion: 0.05
Nodes (30): ByteTracker configuration. Maps to the supervision ByteTrack constructor…, Immutable configuration for ByteTrackerWrapper. Attributes:…, TrackerConfig, ByteTrack multi-object tracking package. Provides stateful, per-session object…, Any, Data models for tracking output. TrackedObject extends a raw Detection with a…, Snapshot of a tracked object within a single video frame. Attributes: track_id:…, Return a JSON-serialisable representation. (+22 more)

### Community 2 - "frontend/package.json"
Cohesion: 0.04
Nodes (42): nextConfig, dependencies, clsx, lucide-react, maplibre-gl, next, react, react-dom (+34 more)

### Community 3 - "backend.ts"
Cohesion: 0.14
Nodes (16): BackendStatusState, HealthResponse, InferenceResponse, InferenceStatusResponse, ModelMetadata, ModelStatusResponse, ModelTensorInfo, OutputTensorMetadata (+8 more)

### Community 4 - "BorderMap.tsx"
Cohesion: 0.06
Nodes (39): AnprPage(), CAMERA_TYPES, CamerasPage(), COORDINATE_PRESETS, SECTORS, BorderMap(), BorderMapProps, DEMO_ALERT (+31 more)

### Community 5 - "ONNXEngine"
Cohesion: 0.17
Nodes (8): ONNXEngine, Path, Create the ONNX Runtime session., Extract embedded model metadata, class labels, and input image size., Release the ONNX Runtime session., Safe, reusable ONNX Runtime inference engine. Designed for: - GPU acceleration…, Validate the ONNX model path before loading., Detect and return preferred execution providers (GPU / CPU).

### Community 6 - "stream.py"
Cohesion: 0.12
Nodes (27): create_standby_frame(), draw_bounding_boxes(), draw_tactical_hud(), get_live_stream(), get_snapshot(), is_host_reachable(), is_rtsp_host_reachable(), normalize_stream_url() (+19 more)

### Community 7 - "cameras.py"
Cohesion: 0.09
Nodes (34): CameraCreateRequest, CameraUpdateRequest, create_camera(), delete_camera(), _ensure_data_file(), get_camera(), get_cameras(), HealthStats (+26 more)

### Community 8 - "VideoLoader"
Cohesion: 0.11
Nodes (18): InvalidVideoError, Any, Exception, Path, Return useful video metadata., Read the next frame with orientation correction. Returns: (True, frame) when…, Base exception for video loading errors., Raised when a video file does not exist. (+10 more)

### Community 9 - "tracking.py"
Cohesion: 0.08
Nodes (32): api_route, _build_tracker_config(), _create_preprocessor(), get_annotated_frame(), get_annotated_video(), get_global_trace_trajectory(), _get_model_input_size(), list_global_traces() (+24 more)

### Community 10 - "RTSPStream"
Cohesion: 0.12
Nodes (17): InvalidRTSPUrlError, Any, Exception, Open the stream (RTSP or HTTP IP Webcam) with candidate fallbacks and bounded…, Base exception for RTSP stream errors., Read one frame from the RTSP stream., Raised when an RTSP URL is invalid., Attempt bounded reconnection attempts. Returns: True if reconnection succeeds.… (+9 more)

### Community 11 - "PreprocessingError"
Cohesion: 0.15
Nodes (16): InvalidFrameError, InvalidTargetSizeError, PreprocessingError, Preprocessor, Exception, ndarray, Validate an OpenCV frame., Base exception for preprocessing errors. (+8 more)

### Community 12 - "ModelManager"
Cohesion: 0.14
Nodes (9): ModelManager, Any, Return a loaded model., Check whether a model is currently loaded., Return names of all loaded models., Return the status of all loaded models., Unload all models safely., Run inference using a named cached model. (+1 more)

### Community 13 - "ResourceManager"
Cohesion: 0.05
Nodes (39): Exception, Context manager for safe inference execution. Example: with…, Base exception for resource manager errors., Return current resource usage., Return whether an inference slot is currently available., Controls concurrent inference execution. Designed for a CPU-first system where…, Acquire an inference slot. Returns: True if a slot was acquired. False if the…, Release an inference slot. (+31 more)

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
Cohesion: 0.17
Nodes (15): AlertsPage(), TacticalThreatToast(), RecentAlerts(), SuspectTrajectoryModal(), SuspectTrajectoryModalProps, api, formatConfidence(), AlertFilter (+7 more)

### Community 19 - "logging.py"
Cohesion: 0.06
Nodes (35): delete, Remove a vehicle license plate from the watchlist., remove_from_watchlist(), delete_person(), face_websocket_stream(), _generate_face_stream(), get_face_engine_status(), get_face_thumbnail() (+27 more)

### Community 20 - "FaceService"
Cohesion: 0.11
Nodes (17): calibrate_match_confidence(), compute_iou(), enhance_aligned_face(), FaceService, Any, ndarray, Compute Intersection over Union (IoU) between two bounding boxes [x1, y1, x2,…, Update classification and threat metadata for an enrolled person without re-… (+9 more)

### Community 21 - "AlertService"
Cohesion: 0.09
Nodes (15): AbstractEventLoop, AlertBroadcaster, AlertService, Any, WebSocket, No-op: Incident records are stored persistently on the frontend., Create a new alert record, persist it, update camera status, and broadcast to…, Mark camera node status as 'alert' in cameras.json. (+7 more)

### Community 22 - "draw_tracked_boxes"
Cohesion: 0.16
Nodes (12): convert_video_to_h264(), draw_tracked_boxes(), find_ffmpeg_executable(), Any, ndarray, Path, Server-side bounding box and track ID annotator. Draws tactical bounding boxes,…, Locate the FFmpeg executable reliably across system paths, Python scripts,… (+4 more)

### Community 23 - "inference.py"
Cohesion: 0.20
Nodes (15): create_preprocessor(), get_model_input_size(), image_inference(), inference_status(), get, post, UploadFile, Run bounded inference on frames from an uploaded video. (+7 more)

### Community 26 - "decode_image_input"
Cohesion: 0.21
Nodes (13): add_face_sample(), decode_image_input(), ndarray, post, UploadFile, Enroll a new person or add an identity profile with name, face image, and…, Add an additional lighting or angle photo sample to an already enrolled…, Perform face detection and identity recognition on a static image. Returns… (+5 more)

### Community 27 - "scripts"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, dev, graphify:report, graphify:update, lint (+2 more)

### Community 28 - "MayaJaal (मायाजाल)"
Cohesion: 0.12
Nodes (16): 10. Contributors & Acknowledgments, 1. Overview, 2. Key Capabilities & System Modules, 3. High-Level Architecture, 4. AI Models Specification, 5. Repository Structure, 6. Installation & Setup Guide, 7. Key REST API Endpoints (+8 more)

### Community 29 - "alertsStore.ts"
Cohesion: 0.13
Nodes (20): GeofencesPage(), MetricCard(), MetricCardProps, MetricsRow(), AlertListener, ConnectionListener, connectionListeners, getAlertsWsUrl() (+12 more)

### Community 30 - "34. Recommended Final Model Integration Process"
Cohesion: 0.15
Nodes (13): 34. Recommended Final Model Integration Process, Step 1, Step 10, Step 11, Step 12, Step 2, Step 3, Step 4 (+5 more)

### Community 31 - "facial-recognition/page.tsx"
Cohesion: 0.31
Nodes (7): EnrolledPerson, FaceDetection, FaceEngineStatus, FaceEvent, FaceScanResponse, RegisterFaceResponse, ThreatLevel

### Community 32 - "ANPRPipeline"
Cohesion: 0.06
Nodes (37): add_to_watchlist(), get_plate_snapshot(), get_processed_video(), get_records(), get_watchlist(), get, post, UploadFile (+29 more)

### Community 33 - "liveworkspace.tsx"
Cohesion: 0.19
Nodes (12): ConnectionStatus(), CLASS_COLORS, DetectionCanvas(), DetectionCanvasProps, buildStreamUrl(), LiveWorkspace(), alertsStore, useBackendStatus() (+4 more)

### Community 34 - "Settings"
Cohesion: 0.50
Nodes (3): Central configuration for the SIH26187 inference backend., Settings, BaseSettings

### Community 35 - "GlobalTraceManager"
Cohesion: 0.10
Nodes (14): calc_haversine_km(), GlobalTrace, GlobalTraceManager, Any, ndarray, Update the aggregated appearance feature using Exponential Moving Average…, Convert GlobalTrace into JSON-serializable representation., Central Thread-Safe Manager for Cross-Camera Multi-Target Multi-Camera Tracking… (+6 more)

### Community 36 - "ModelManagerError"
Cohesion: 0.20
Nodes (10): ModelAlreadyLoadedError, ModelManagerError, ModelNotFoundError, Exception, Path, Base exception for model manager errors., Unload one model and release its ONNX session., Raised when a requested model is not loaded. (+2 more)

### Community 41 - "GeofenceEngine"
Cohesion: 0.09
Nodes (18): ccw(), check_tripwire_crossing(), compute_footpoint(), GeofenceEngine, is_point_in_polygon(), Any, ndarray, Computes the bottom-center anchor point (ground contact) of a bounding box.… (+10 more)

### Community 43 - "ONNXModelError"
Cohesion: 0.31
Nodes (7): ONNXEngineError, ONNXInferenceError, ONNXModelError, Exception, Base exception for ONNX engine errors., Raised when an ONNX model cannot be loaded or is invalid., Raised when inference fails.

### Community 44 - ".get_model_info"
Cohesion: 0.38
Nodes (4): Any, Return information about model inputs., Return information about model outputs., Return useful information about the loaded model.

### Community 45 - "react"
Cohesion: 0.29
Nodes (4): CameraCard(), CameraCardProps, CameraGrid(), react

### Community 48 - "health"
Cohesion: 0.40
Nodes (4): health(), Any, get, Return backend health, device config, and execution providers.

### Community 59 - "test_reid_and_global_tracking.py"
Cohesion: 0.18
Nodes (10): Verify that when a trace is recognized as an enrolled suspect on Cam 1, Cam 2…, Verify ReID feature extractor returns 512-D L2-normalized float32 vectors., Verify REST endpoints /api/tracking/global/traces., Verify same person yields high similarity (>0.85) and different person yields…, Verify that when a person moves from Camera 1 to Camera 2, their Global Trace…, test_cross_camera_global_tracking(), test_global_trace_rest_api(), test_reid_service_extraction() (+2 more)

### Community 60 - "alerts.py"
Cohesion: 0.10
Nodes (30): acknowledge_alert(), AlertCreateRequest, alerts_websocket_endpoint(), clear_alerts(), create_alert(), dispatch_qrt(), get_alert_snapshot(), get_scanner_status() (+22 more)

### Community 62 - "37. Troubleshooting"
Cohesion: 0.33
Nodes (6): 37. Troubleshooting, Image inference fails, Model not found, `pip.exe` is blocked, RTSP connection failure, Server is not responding

### Community 63 - "39. Development Notes"
Cohesion: 0.33
Nodes (6): 39. Development Notes, API layer, Core layer, Inference layer, Pipeline layer, Utility layer

### Community 64 - "2. Current Project Status"
Cohesion: 0.40
Nodes (5): 1. Project Overview, 2. Current Project Status, Completed, Pending, SIH26187 – AI-Based Intelligent Video Analytics Inference Engine

### Community 69 - "api/models.py"
Cohesion: 0.18
Nodes (11): load_model(), model_status(), ModelLoadRequest, BaseModel, delete, get, post, Return the current model manager status. (+3 more)

### Community 71 - "test_alerts_and_scanner.py"
Cohesion: 0.15
Nodes (12): cleanup_test_data(), Test multi-camera suspect trajectory reconstruction and QRT team dispatch., Ensure user's custom threat detection model best.onnx is 100% untouched., Clear all test alerts and restore camera statuses to 'online' so no dummy data…, Test AlertService creation, filtering, acknowledgement, and ring buffer., Test ContinuousFaceScanner status and start/stop controls., Test the REST API endpoints in alerts_router using FastAPI TestClient., test_alert_service_lifecycle() (+4 more)

### Community 73 - "main.py"
Cohesion: 0.22
Nodes (8): lifespan(), get, root(), get_logger(), Configure application-wide logging. Logs are written to both: - the console - a…, Return a logger for a specific application module., setup_logging(), Logger

### Community 74 - "geofences.py"
Cohesion: 0.11
Nodes (31): create_tripwire(), create_zone(), delete_tripwire(), delete_zone(), evaluate_geofences(), EvaluateRequest, EvaluateTrackItem, get_geofences() (+23 more)

### Community 75 - "test_cameras_security.py"
Cohesion: 0.67
Nodes (3): test_stream_target_rejects_addresses_outside_camera_network(), test_stream_target_uses_allowlisted_resolved_address(), MonkeyPatch

### Community 77 - "lucide-react"
Cohesion: 0.13
Nodes (5): GisMapPage(), CameraFeedStrip(), cameras, SystemStatus(), lucide-react

### Community 79 - "ReIDService"
Cohesion: 0.18
Nodes (9): ndarray, Extract a single 512-D L2-normalized feature vector from a person crop., Extract 512-D L2-normalized feature vectors for a list of crops. Handles batch…, Robust spatial color histogram descriptor (512-D normalized vector) used as…, Compute cosine similarity between two normalized 512-D vectors in range [-1.0,…, Person Re-Identification Service for MAATRIX. Extracts 512-dimensional…, Verify model presence, attempt download if missing, and initialize ONNX session., Preprocess a single BGR crop into (3, 256, 128) float32 normalized tensor. (+1 more)

### Community 80 - "auth.py"
Cohesion: 0.18
Nodes (16): create_token(), get_roster(), login(), LoginRequest, logout(), Any, BaseModel, get (+8 more)

### Community 81 - "test_facial_recognition.py"
Cohesion: 0.22
Nodes (8): Ensure user's custom threat detection model best.onnx is 100% untouched., Verify YuNet and SFace models are properly initialized and database is loaded., Test the REST API endpoints using FastAPI TestClient., Test suspect classification, threat levels, and PATCH metadata updates., test_face_api_endpoints(), test_face_service_initialization(), test_model_preservation(), test_suspect_classification()

### Community 83 - "api.ts"
Cohesion: 0.15
Nodes (19): COLOR_PRESETS, FeedViewMode, ToolMode, ApiError, request(), StreamValidationResult, AnprRecord, AnprScanResponse (+11 more)

### Community 85 - "unexpected_exception_handler"
Cohesion: 0.38
Nodes (7): Exception, unexpected_exception_handler(), validation_exception_handler(), exception_handler, JSONResponse, Request, RequestValidationError

## Knowledge Gaps
- **205 isolated node(s):** `StreamValidationResult`, `ModelTensorInfo`, `ModelMetadata`, `ResourceStatus`, `SuspectSummary` (+200 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 614 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_logger()` connect `main.py` to `auth.py`, `logging.py`, `cameras.py`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `authStore.ts`, `liveworkspace.tsx`, `frontend/package.json`, `backend.ts`, `BorderMap.tsx`, `lucide-react`, `AnalyticsDashboard.tsx`, `alert.ts`, `api.ts`, `alertsStore.ts`, `facial-recognition/page.tsx`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `ModelManager` (e.g. with `ONNXEngine` and `ONNXEngineError`) actually correct?**
  _`ModelManager` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `ONNXEngine` (e.g. with `ModelManager` and `._initialize_engines()`) actually correct?**
  _`ONNXEngine` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `StreamValidationResult`, `ModelTensorInfo`, `ModelMetadata` to the rest of the system?**
  _205 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `authStore.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12688172043010754 - nodes in this community are weakly interconnected._
- **Should `ByteTrackerWrapper` be split into smaller, more focused modules?**
  _Cohesion score 0.05411764705882353 - nodes in this community are weakly interconnected._