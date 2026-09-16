# Graph Report - MayaJaal  (2026-09-17)

## Corpus Check
- 136 files · ~1,991,714 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1294 nodes · 2181 edges · 74 communities (57 shown, 7 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 48 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4f1ebbaf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- authStore.ts
- ByteTrackerWrapper
- frontend/package.json
- liveworkspace.tsx
- BorderMap.tsx
- ONNXEngine
- tracking.py
- cameras.py
- VideoLoader
- draw_tracked_boxes
- RTSPStream
- Preprocessor
- ModelManager
- ResourceManager
- load_image
- compilerOptions
- README.md
- AnalyticsDashboard.tsx
- lucide-react
- faces.py
- FaceService
- AlertService
- api.ts
- inference.py
- get_global_trace_trajectory
- anpr.py
- scripts
- MayaJaal (मायाजाल)
- alertsStore.ts
- 34. Recommended Final Model Integration Process
- Postprocessor
- stream.py
- facial-recognition/page.tsx
- Settings
- GlobalTraceManager
- ModelManagerError
- get_annotated_frame
- postcss.config.mjs
- next-env.d.ts
- GeofenceEngine
- reset_global_traces
- inference_status
- auth.py
- inference_service.py
- test_reid_and_global_tracking.py
- alerts.py
- FastAPI
- 37. Troubleshooting
- 39. Development Notes
- 2. Current Project Status
- rules/graphify.md
- workflows/graphify.md
- 45. Repository
- src/middleware.ts
- api/models.py
- test_alerts_and_scanner.py
- geofences.py
- test_cameras_security.py
- logging.py
- react
- ReIDService
- test_facial_recognition.py
- unexpected_exception_handler
- quantize_model.py

## God Nodes (most connected - your core abstractions)
1. `lucide-react` - 29 edges
2. `useAlerts()` - 24 edges
3. `react` - 23 edges
4. `ModelManager` - 22 edges
5. `ONNXEngine` - 21 edges
6. `Postprocessor` - 20 edges
7. `Preprocessor` - 19 edges
8. `ByteTrackerWrapper` - 19 edges
9. `GeofenceEngine` - 18 edges
10. `PreprocessingError` - 18 edges

## Surprising Connections (you probably didn't know these)
- `image_inference()` --uses--> `PreprocessingError`  [INFERRED]
  backend/app/api/inference.py → backend/app/pipeline/preprocessor.py
- `video_inference()` --uses--> `PreprocessingError`  [INFERRED]
  backend/app/api/inference.py → backend/app/pipeline/preprocessor.py
- `video_inference()` --uses--> `VideoLoader`  [INFERRED]
  backend/app/api/inference.py → backend/app/pipeline/video_loader.py
- `video_inference()` --uses--> `VideoLoaderError`  [INFERRED]
  backend/app/api/inference.py → backend/app/pipeline/video_loader.py
- `rtsp_inference()` --uses--> `PreprocessingError`  [INFERRED]
  backend/app/api/inference.py → backend/app/pipeline/preprocessor.py

## Import Cycles
- None detected.

## Communities (74 total, 7 thin omitted)

### Community 0 - "authStore.ts"
Cohesion: 0.13
Nodes (20): LoginFormCard(), OperatorLayout(), EmblemIndia(), HeroSection(), LandingNavbar(), AUTH_COOKIE_NAME, AUTH_EVENT_NAME, AUTH_STORAGE_KEY (+12 more)

### Community 1 - "ByteTrackerWrapper"
Cohesion: 0.06
Nodes (28): ByteTracker configuration. Maps to the supervision ByteTrack constructor…, Immutable configuration for ByteTrackerWrapper. Attributes:…, TrackerConfig, ByteTrack multi-object tracking package. Provides stateful, per-session object…, Any, Data models for tracking output. TrackedObject extends a raw Detection with a…, Snapshot of a tracked object within a single video frame. Attributes: track_id:…, Return a JSON-serialisable representation. (+20 more)

### Community 2 - "frontend/package.json"
Cohesion: 0.04
Nodes (42): nextConfig, dependencies, clsx, lucide-react, maplibre-gl, next, react, react-dom (+34 more)

### Community 3 - "liveworkspace.tsx"
Cohesion: 0.09
Nodes (29): SystemStatus(), ConnectionStatus(), CLASS_COLORS, DetectionCanvas(), DetectionCanvasProps, buildStreamUrl(), LiveWorkspace(), alertsStore (+21 more)

### Community 4 - "BorderMap.tsx"
Cohesion: 0.05
Nodes (42): CAMERA_TYPES, CamerasPage(), COORDINATE_PRESETS, SECTORS, GeofencesPage(), BorderMap(), BorderMapProps, DEMO_ALERT (+34 more)

### Community 5 - "ONNXEngine"
Cohesion: 0.13
Nodes (12): ONNXEngine, Any, Path, Create the ONNX Runtime session., Extract embedded model metadata, class labels, and input image size., Return information about model inputs., Return information about model outputs., Return useful information about the loaded model. (+4 more)

### Community 6 - "tracking.py"
Cohesion: 0.14
Nodes (22): _build_tracker_config(), _create_preprocessor(), _get_model_input_size(), Any, post, UploadFile, /api/tracking — ByteTrack multi-object tracking endpoints. Endpoints ---------…, Run ByteTrack multi-object tracking on an uploaded video using ONNX batching (2… (+14 more)

### Community 7 - "cameras.py"
Cohesion: 0.09
Nodes (34): CameraCreateRequest, CameraUpdateRequest, create_camera(), delete_camera(), _ensure_data_file(), get_camera(), get_cameras(), HealthStats (+26 more)

### Community 8 - "VideoLoader"
Cohesion: 0.11
Nodes (18): InvalidVideoError, Any, Exception, Path, Return useful video metadata., Read the next frame with orientation correction. Returns: (True, frame) when…, Base exception for video loading errors., Raised when a video file does not exist. (+10 more)

### Community 9 - "draw_tracked_boxes"
Cohesion: 0.16
Nodes (12): convert_video_to_h264(), draw_tracked_boxes(), find_ffmpeg_executable(), Any, ndarray, Path, Server-side bounding box and track ID annotator. Draws tactical bounding boxes,…, Locate the FFmpeg executable reliably across system paths, Python scripts,… (+4 more)

### Community 10 - "RTSPStream"
Cohesion: 0.15
Nodes (10): Any, Open the stream (RTSP or HTTP IP Webcam) with candidate fallbacks and bounded…, Read one frame from the RTSP stream., Attempt bounded reconnection attempts. Returns: True if reconnection succeeds.…, Raised when an RTSP stream cannot be opened., Return current RTSP stream status., Release the RTSP capture resource., Safe RTSP stream reader for CCTV cameras. Features: - RTSP URL validation -… (+2 more)

### Community 11 - "Preprocessor"
Cohesion: 0.14
Nodes (18): InvalidFrameError, InvalidTargetSizeError, PreprocessingError, Preprocessor, Exception, ndarray, Validate an OpenCV frame., Base exception for preprocessing errors. (+10 more)

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

### Community 18 - "lucide-react"
Cohesion: 0.10
Nodes (18): AlertsPage(), TacticalThreatToast(), CameraFeedStrip(), cameras, RecentAlerts(), SuspectTrajectoryModal(), SuspectTrajectoryModalProps, api (+10 more)

### Community 19 - "faces.py"
Cohesion: 0.07
Nodes (41): add_face_sample(), decode_image_input(), delete_person(), face_websocket_stream(), _generate_face_stream(), get_face_engine_status(), get_face_thumbnail(), get_recent_face_events() (+33 more)

### Community 20 - "FaceService"
Cohesion: 0.11
Nodes (17): calibrate_match_confidence(), compute_iou(), enhance_aligned_face(), FaceService, Any, ndarray, Compute Intersection over Union (IoU) between two bounding boxes [x1, y1, x2,…, Update classification and threat metadata for an enrolled person without re-… (+9 more)

### Community 21 - "AlertService"
Cohesion: 0.09
Nodes (15): AbstractEventLoop, AlertBroadcaster, AlertService, Any, WebSocket, No-op: Incident records are stored persistently on the frontend., Create a new alert record, persist it, update camera status, and broadcast to…, Mark camera node status as 'alert' in cameras.json. (+7 more)

### Community 22 - "api.ts"
Cohesion: 0.14
Nodes (20): AnprPage(), COLOR_PRESETS, FeedViewMode, ToolMode, ApiError, request(), StreamValidationResult, AnprRecord (+12 more)

### Community 23 - "inference.py"
Cohesion: 0.21
Nodes (18): batch_inference(), create_preprocessor(), get_model_input_size(), image_inference(), post, UploadFile, Run inference on a single uploaded image., Run ONNX batch inference on multiple uploaded images in parallel chunks of 2 to… (+10 more)

### Community 25 - "get_global_trace_trajectory"
Cohesion: 0.29
Nodes (7): get_global_trace_trajectory(), list_global_traces(), list_rtsp_sessions(), get, List all active per-camera ByteTracker sessions., List all active cross-camera person traces with recent sightings and trajectory…, Retrieve full chronological GPS multi-camera trajectory for a specific Global…

### Community 26 - "anpr.py"
Cohesion: 0.11
Nodes (24): add_to_watchlist(), get_plate_snapshot(), get_processed_video(), get_records(), get_watchlist(), delete, get, post (+16 more)

### Community 27 - "scripts"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, dev, graphify:report, graphify:update, lint (+2 more)

### Community 28 - "MayaJaal (मायाजाल)"
Cohesion: 0.12
Nodes (16): 10. Contributors & Acknowledgments, 1. Overview, 2. Key Capabilities & System Modules, 3. High-Level Architecture, 4. AI Models Specification, 5. Repository Structure, 6. Installation & Setup Guide, 7. Key REST API Endpoints (+8 more)

### Community 29 - "alertsStore.ts"
Cohesion: 0.13
Nodes (20): GisMapPage(), MetricCard(), MetricCardProps, MetricsRow(), AlertListener, ConnectionListener, connectionListeners, getAlertsWsUrl() (+12 more)

### Community 30 - "34. Recommended Final Model Integration Process"
Cohesion: 0.15
Nodes (13): 34. Recommended Final Model Integration Process, Step 1, Step 10, Step 11, Step 12, Step 2, Step 3, Step 4 (+5 more)

### Community 31 - "Postprocessor"
Cohesion: 0.10
Nodes (22): Detection, Postprocessor, PostprocessorConfig, PostprocessorError, Any, Exception, ndarray, Decode output tensors into a list of detection lists (one list per frame in the… (+14 more)

### Community 32 - "stream.py"
Cohesion: 0.06
Nodes (45): create_standby_frame(), draw_bounding_boxes(), draw_tactical_hud(), get_live_stream(), get_snapshot(), is_host_reachable(), is_rtsp_host_reachable(), normalize_stream_url() (+37 more)

### Community 33 - "facial-recognition/page.tsx"
Cohesion: 0.31
Nodes (7): EnrolledPerson, FaceDetection, FaceEngineStatus, FaceEvent, FaceScanResponse, RegisterFaceResponse, ThreatLevel

### Community 34 - "Settings"
Cohesion: 0.50
Nodes (3): Central configuration for the SIH26187 inference backend., Settings, BaseSettings

### Community 35 - "GlobalTraceManager"
Cohesion: 0.10
Nodes (14): calc_haversine_km(), GlobalTrace, GlobalTraceManager, Any, ndarray, Update the aggregated appearance feature using Exponential Moving Average…, Convert GlobalTrace into JSON-serializable representation., Central Thread-Safe Manager for Cross-Camera Multi-Target Multi-Camera Tracking… (+6 more)

### Community 36 - "ModelManagerError"
Cohesion: 0.22
Nodes (8): ModelAlreadyLoadedError, ModelManagerError, Exception, Path, Base exception for model manager errors., Unload one model and release its ONNX session., Raised when attempting to load an already loaded model., Load an ONNX model into the cache. A model is loaded only once. If loading…

### Community 37 - "get_annotated_frame"
Cohesion: 0.40
Nodes (5): api_route, get_annotated_frame(), get_annotated_video(), Serve a server-annotated ByteTrack video with burned-in bounding boxes (H.264…, Serve a single server-annotated JPEG frame from tracked video.

### Community 41 - "GeofenceEngine"
Cohesion: 0.09
Nodes (19): ccw(), check_tripwire_crossing(), compute_footpoint(), GeofenceEngine, is_point_in_polygon(), Any, ndarray, Virtual Geofencing & Directional Tripwire Engine. Provides mathematical… (+11 more)

### Community 43 - "reset_global_traces"
Cohesion: 0.40
Nodes (5): delete, Reset and remove the ByteTracker session for the given ``camera_id``. After…, Clear and reset all global cross-camera trace records., reset_global_traces(), reset_rtsp_session()

### Community 44 - "inference_status"
Cohesion: 0.67
Nodes (3): inference_status(), get, Return inference service and resource status.

### Community 46 - "auth.py"
Cohesion: 0.18
Nodes (17): create_token(), get_roster(), login(), LoginRequest, logout(), Any, BaseModel, get (+9 more)

### Community 47 - "inference_service.py"
Cohesion: 0.21
Nodes (10): InferenceResourceError, InferenceServiceError, Any, Exception, ndarray, Base exception for inference service errors., Raised when inference resources are unavailable., Run inference using a loaded model, supporting both single-frame and batch… (+2 more)

### Community 59 - "test_reid_and_global_tracking.py"
Cohesion: 0.18
Nodes (10): Verify that when a trace is recognized as an enrolled suspect on Cam 1, Cam 2…, Verify ReID feature extractor returns 512-D L2-normalized float32 vectors., Verify REST endpoints /api/tracking/global/traces., Verify same person yields high similarity (>0.85) and different person yields…, Verify that when a person moves from Camera 1 to Camera 2, their Global Trace…, test_cross_camera_global_tracking(), test_global_trace_rest_api(), test_reid_service_extraction() (+2 more)

### Community 60 - "alerts.py"
Cohesion: 0.10
Nodes (30): acknowledge_alert(), AlertCreateRequest, alerts_websocket_endpoint(), clear_alerts(), create_alert(), dispatch_qrt(), get_alert_snapshot(), get_scanner_status() (+22 more)

### Community 61 - "FastAPI"
Cohesion: 0.14
Nodes (13): health(), Any, get, Return backend health, device config, and execution providers., lifespan(), get, root(), get_logger() (+5 more)

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

### Community 74 - "geofences.py"
Cohesion: 0.11
Nodes (31): create_tripwire(), create_zone(), delete_tripwire(), delete_zone(), evaluate_geofences(), EvaluateRequest, EvaluateTrackItem, get_geofences() (+23 more)

### Community 75 - "test_cameras_security.py"
Cohesion: 0.67
Nodes (3): test_stream_target_rejects_addresses_outside_camera_network(), test_stream_target_uses_allowlisted_resolved_address(), MonkeyPatch

### Community 76 - "logging.py"
Cohesion: 0.21
Nodes (9): ONNXEngineError, ONNXInferenceError, ONNXModelError, Exception, ndarray, Run inference using a NumPy array. Preprocessing is intentionally kept outside…, Base exception for ONNX engine errors., Raised when an ONNX model cannot be loaded or is invalid. (+1 more)

### Community 78 - "react"
Cohesion: 0.29
Nodes (4): DutyShiftCountdown(), NavItem, getRemainingShiftTime(), react

### Community 79 - "ReIDService"
Cohesion: 0.18
Nodes (9): ndarray, Extract a single 512-D L2-normalized feature vector from a person crop., Extract 512-D L2-normalized feature vectors for a list of crops. Handles batch…, Robust spatial color histogram descriptor (512-D normalized vector) used as…, Compute cosine similarity between two normalized 512-D vectors in range [-1.0,…, Person Re-Identification Service for MAATRIX. Extracts 512-dimensional…, Verify model presence, attempt download if missing, and initialize ONNX session., Preprocess a single BGR crop into (3, 256, 128) float32 normalized tensor. (+1 more)

### Community 81 - "test_facial_recognition.py"
Cohesion: 0.22
Nodes (8): Ensure user's custom threat detection model best.onnx is 100% untouched., Verify YuNet and SFace models are properly initialized and database is loaded., Test the REST API endpoints using FastAPI TestClient., Test suspect classification, threat levels, and PATCH metadata updates., test_face_api_endpoints(), test_face_service_initialization(), test_model_preservation(), test_suspect_classification()

### Community 85 - "unexpected_exception_handler"
Cohesion: 0.38
Nodes (7): Exception, unexpected_exception_handler(), validation_exception_handler(), exception_handler, JSONResponse, Request, RequestValidationError

## Knowledge Gaps
- **204 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `dev` (+199 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 617 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Postprocessor` connect `Postprocessor` to `inference.py`, `ResourceManager`, `inference_service.py`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `ANPRPipeline` connect `stream.py` to `ONNXEngine`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `ModelManager` (e.g. with `InferenceService` and `ONNXEngine`) actually correct?**
  _`ModelManager` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `ONNXEngine` (e.g. with `ModelManager` and `ANPRPipeline`) actually correct?**
  _`ONNXEngine` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _204 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `authStore.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1349206349206349 - nodes in this community are weakly interconnected._
- **Should `ByteTrackerWrapper` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._