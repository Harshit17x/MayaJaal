# Graph Report - MayaJaal  (2026-09-11)

## Corpus Check
- 140 files · ~642,913 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1142 nodes · 1871 edges · 87 communities (60 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `47617990`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useAuth
- ByteTrackerWrapper
- frontend/package.json
- anpr.py
- BorderMap.tsx
- logging.py
- ANPRPipeline
- cameras.py
- VideoLoader
- tracking.py
- PreprocessingError
- alertsStore.ts
- ModelManager
- ResourceManager
- load_image
- compilerOptions
- README.md
- AnalyticsDashboard.tsx
- RTSPStream
- faces.py
- FaceService
- AlertService
- get_plate_snapshot
- stream.py
- react
- draw_tracked_boxes
- Postprocessor
- scripts
- HFInference
- liveworkspace.tsx
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
- inference.py
- alerts.py
- api.ts
- 37. Troubleshooting
- 39. Development Notes
- 2. Current Project Status
- rules/graphify.md
- workflows/graphify.md
- 45. Repository
- get
- api/models.py
- inference_service.py
- test_alerts_and_scanner.py
- test_facial_recognition.py
- FastAPI
- reset_global_traces
- test_cameras_security.py
- RTSPError
- useBackendStatus.ts
- PostprocessorConfig
- ReIDService
- acknowledge_alert
- test_reid_and_global_tracking.py
- unexpected_exception_handler
- health
- alerts_websocket_endpoint
- stream_anpr
- Exception

## God Nodes (most connected - your core abstractions)
1. `get()` - 28 edges
2. `lucide-react` - 26 edges
3. `ModelManager` - 22 edges
4. `react` - 22 edges
5. `ONNXEngine` - 21 edges
6. `ByteTrackerWrapper` - 19 edges
7. `useAlerts()` - 19 edges
8. `RTSPStream` - 17 edges
9. `PreprocessingError` - 16 edges
10. `FaceService` - 16 edges

## Surprising Connections (you probably didn't know these)
- `inference_status()` --references--> `get()`  [EXTRACTED]
  backend/app/api/inference.py → anpr/app.py
- `get_face_engine_status()` --references--> `get()`  [EXTRACTED]
  backend/app/api/faces.py → anpr/app.py
- `get_face_thumbnail()` --references--> `get()`  [EXTRACTED]
  backend/app/api/faces.py → anpr/app.py
- `get_recent_face_events()` --references--> `get()`  [EXTRACTED]
  backend/app/api/faces.py → anpr/app.py
- `get_scanner_status()` --references--> `get()`  [EXTRACTED]
  backend/app/api/alerts.py → anpr/app.py

## Import Cycles
- None detected.

## Communities (87 total, 8 thin omitted)

### Community 0 - "useAuth"
Cohesion: 0.24
Nodes (8): LoginFormCard(), EmblemIndia(), HeroSection(), LandingNavbar(), DEMO_OPERATORS, getStoredOperator(), OperatorUser, useAuth()

### Community 1 - "ByteTrackerWrapper"
Cohesion: 0.05
Nodes (31): ByteTracker configuration. Maps to the supervision ByteTrack constructor…, Immutable configuration for ByteTrackerWrapper. Attributes:…, TrackerConfig, ByteTrack multi-object tracking package. Provides stateful, per-session object…, Any, Data models for tracking output. TrackedObject extends a raw Detection with a…, Snapshot of a tracked object within a single video frame. Attributes: track_id:…, Return a JSON-serialisable representation. (+23 more)

### Community 2 - "frontend/package.json"
Cohesion: 0.04
Nodes (42): nextConfig, dependencies, clsx, lucide-react, maplibre-gl, next, react, react-dom (+34 more)

### Community 3 - "anpr.py"
Cohesion: 0.21
Nodes (11): add_to_watchlist(), delete, post, UploadFile, Add a license plate to the real-time interception watchlist., Remove a vehicle license plate from the watchlist., Scan an uploaded static image for vehicles, license plates, and text., Process an uploaded video clip, tracking and recording unique license plates. (+3 more)

### Community 4 - "BorderMap.tsx"
Cohesion: 0.06
Nodes (40): AnprPage(), CAMERA_TYPES, CamerasPage(), COORDINATE_PRESETS, SECTORS, BorderMap(), BorderMapProps, DEMO_ALERT (+32 more)

### Community 5 - "logging.py"
Cohesion: 0.08
Nodes (23): ONNXEngine, ONNXEngineError, ONNXInferenceError, ONNXModelError, Any, Exception, ndarray, Path (+15 more)

### Community 6 - "ANPRPipeline"
Cohesion: 0.12
Nodes (16): ANPRPipeline, Any, ndarray, Path, Find license plate text and its bounding box directly within a vehicle crop., End-to-end ANPR Pipeline using ONNX models on GPU: 1. Vehicle detection via…, Resize with padding (letterbox) to square tensor for YOLOv8., Decode YOLOv8 [1, num_classes + 4, 8400] output tensor with NMS. (+8 more)

### Community 7 - "cameras.py"
Cohesion: 0.13
Nodes (28): CameraCreateRequest, CameraUpdateRequest, create_camera(), delete_camera(), _ensure_data_file(), get_camera(), get_cameras(), HealthStats (+20 more)

### Community 8 - "VideoLoader"
Cohesion: 0.11
Nodes (18): InvalidVideoError, Any, Exception, Path, Return useful video metadata., Read the next frame with orientation correction. Returns: (True, frame) when…, Base exception for video loading errors., Raised when a video file does not exist. (+10 more)

### Community 9 - "tracking.py"
Cohesion: 0.13
Nodes (21): api_route, _build_tracker_config(), _create_preprocessor(), get_annotated_frame(), get_annotated_video(), _get_model_input_size(), list_global_traces(), Any (+13 more)

### Community 10 - "PreprocessingError"
Cohesion: 0.15
Nodes (16): InvalidFrameError, InvalidTargetSizeError, PreprocessingError, Preprocessor, Exception, ndarray, Validate an OpenCV frame., Base exception for preprocessing errors. (+8 more)

### Community 11 - "alertsStore.ts"
Cohesion: 0.22
Nodes (12): AlertListener, ConnectionListener, connectionListeners, getAlertsWsUrl(), INITIAL_ALERTS, initWebSocket(), listeners, memoryAlerts (+4 more)

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

### Community 18 - "RTSPStream"
Cohesion: 0.16
Nodes (10): Any, Open the stream (RTSP or HTTP IP Webcam) with candidate fallbacks and bounded…, Read one frame from the RTSP stream., Attempt bounded reconnection attempts. Returns: True if reconnection succeeds.…, Raised when an RTSP stream cannot be opened., Return current RTSP stream status., Release the RTSP capture resource., Safe RTSP stream reader for CCTV cameras. Features: - RTSP URL validation -… (+2 more)

### Community 19 - "faces.py"
Cohesion: 0.06
Nodes (40): add_face_sample(), decode_image_input(), delete_person(), face_websocket_stream(), _generate_face_stream(), get_face_engine_status(), get_face_thumbnail(), get_recent_face_events() (+32 more)

### Community 20 - "FaceService"
Cohesion: 0.11
Nodes (17): calibrate_match_confidence(), compute_iou(), enhance_aligned_face(), FaceService, Any, ndarray, Compute Intersection over Union (IoU) between two bounding boxes [x1, y1, x2,…, Update classification and threat metadata for an enrolled person without re-… (+9 more)

### Community 21 - "AlertService"
Cohesion: 0.10
Nodes (13): AbstractEventLoop, AlertBroadcaster, AlertService, Any, WebSocket, Create a new alert record, persist it, update camera status, and broadcast to…, Mark camera node status as 'alert' in cameras.json., Thread-safe WebSocket broadcaster for real-time security alerts. (+5 more)

### Community 22 - "get_plate_snapshot"
Cohesion: 0.40
Nodes (5): get_plate_snapshot(), get_processed_video(), Response, Serve a cropped license plate snapshot image., Serve a processed ANPR video file.

### Community 23 - "stream.py"
Cohesion: 0.07
Nodes (34): create_standby_frame(), draw_bounding_boxes(), draw_tactical_hud(), get_live_stream(), get_snapshot(), is_host_reachable(), is_rtsp_host_reachable(), normalize_stream_url() (+26 more)

### Community 24 - "react"
Cohesion: 0.14
Nodes (20): AlertsPage(), GisMapPage(), NavItem, OperatorLayout(), TacticalThreatToast(), RecentAlerts(), SuspectTrajectoryModal(), SuspectTrajectoryModalProps (+12 more)

### Community 25 - "draw_tracked_boxes"
Cohesion: 0.16
Nodes (12): convert_video_to_h264(), draw_tracked_boxes(), find_ffmpeg_executable(), Any, ndarray, Path, Server-side bounding box and track ID annotator. Draws tactical bounding boxes,…, Locate the FFmpeg executable reliably across system paths, Python scripts,… (+4 more)

### Community 26 - "Postprocessor"
Cohesion: 0.17
Nodes (13): Detection, Postprocessor, Any, ndarray, Decode standard YOLOv8/v9/v11 output with shape [1, 4 + C, N]. Row 0..3 are cx,…, Decode YOLOv5/v7 [1, N, 5 + C] or transposed YOLOv8 [1, N, 4 + C]., Decode pre-NMS / End-to-End detections [1, N, 6] -> [x1, y1, x2, y2, conf,…, Convert cx, cy, w, h boxes to x, y, w, h for cv2.dnn.NMSBoxes, execute NMS, and… (+5 more)

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

### Community 35 - "GlobalTraceManager"
Cohesion: 0.10
Nodes (14): calc_haversine_km(), GlobalTrace, GlobalTraceManager, Any, ndarray, Update the aggregated appearance feature using Exponential Moving Average…, Convert GlobalTrace into JSON-serializable representation., Central Thread-Safe Manager for Cross-Camera Multi-Target Multi-Camera Tracking… (+6 more)

### Community 36 - "lucide-react"
Cohesion: 0.14
Nodes (3): CameraFeedStrip(), cameras, lucide-react

### Community 59 - "inference.py"
Cohesion: 0.22
Nodes (14): create_preprocessor(), get_model_input_size(), image_inference(), inference_status(), post, UploadFile, Run bounded inference on frames from an uploaded video., Get the preferred (width, height) resolution for a model. Defaults to (640,… (+6 more)

### Community 60 - "alerts.py"
Cohesion: 0.17
Nodes (19): AlertCreateRequest, clear_alerts(), create_alert(), dispatch_qrt(), get_scanner_status(), get_suspect_trajectory(), Any, BaseModel (+11 more)

### Community 61 - "api.ts"
Cohesion: 0.20
Nodes (14): ApiError, request(), StreamValidationResult, AnprRecord, AnprScanResponse, AnprVideoResponse, WatchlistEntry, EnrolledPerson (+6 more)

### Community 62 - "37. Troubleshooting"
Cohesion: 0.33
Nodes (6): 37. Troubleshooting, Image inference fails, Model not found, `pip.exe` is blocked, RTSP connection failure, Server is not responding

### Community 63 - "39. Development Notes"
Cohesion: 0.33
Nodes (6): 39. Development Notes, API layer, Core layer, Inference layer, Pipeline layer, Utility layer

### Community 64 - "2. Current Project Status"
Cohesion: 0.40
Nodes (5): 1. Project Overview, 2. Current Project Status, Completed, Pending, SIH26187 – AI-Based Intelligent Video Analytics Inference Engine

### Community 68 - "get"
Cohesion: 0.17
Nodes (13): get(), get_alert_snapshot(), list_alerts(), Serve forensic snapshot JPEG image for an alert., Retrieve security and suspect sighting alerts with optional filtering., get_records(), get_watchlist(), Retrieve history of recently captured vehicle license plate detections. (+5 more)

### Community 69 - "api/models.py"
Cohesion: 0.20
Nodes (10): load_model(), model_status(), ModelLoadRequest, BaseModel, delete, post, Return the current model manager status., Load and cache an ONNX model. (+2 more)

### Community 70 - "inference_service.py"
Cohesion: 0.21
Nodes (10): InferenceResourceError, InferenceServiceError, Any, Exception, ndarray, Base exception for inference service errors., Raised when inference resources are unavailable., Run inference using a loaded model. Returns a JSON-serializable structure with… (+2 more)

### Community 71 - "test_alerts_and_scanner.py"
Cohesion: 0.15
Nodes (12): cleanup_test_data(), Test multi-camera suspect trajectory reconstruction and QRT team dispatch., Ensure user's custom threat detection model best.onnx is 100% untouched., Clear all test alerts and restore camera statuses to 'online' so no dummy data…, Test AlertService creation, filtering, acknowledgement, and ring buffer., Test ContinuousFaceScanner status and start/stop controls., Test the REST API endpoints in alerts_router using FastAPI TestClient., test_alert_service_lifecycle() (+4 more)

### Community 72 - "test_facial_recognition.py"
Cohesion: 0.22
Nodes (8): Ensure user's custom threat detection model best.onnx is 100% untouched., Verify YuNet and SFace models are properly initialized and database is loaded., Test the REST API endpoints using FastAPI TestClient., Test suspect classification, threat levels, and PATCH metadata updates., test_face_api_endpoints(), test_face_service_initialization(), test_model_preservation(), test_suspect_classification()

### Community 73 - "FastAPI"
Cohesion: 0.29
Nodes (6): websocket, websocket_endpoint(), lifespan(), root(), FastAPI, get

### Community 74 - "reset_global_traces"
Cohesion: 0.40
Nodes (5): delete, Reset and remove the ByteTracker session for the given ``camera_id``. After…, Clear and reset all global cross-camera trace records., reset_global_traces(), reset_rtsp_session()

### Community 75 - "test_cameras_security.py"
Cohesion: 0.67
Nodes (3): test_stream_target_rejects_addresses_outside_camera_network(), test_stream_target_uses_allowlisted_resolved_address(), MonkeyPatch

### Community 76 - "RTSPError"
Cohesion: 0.27
Nodes (7): InvalidRTSPUrlError, Exception, Base exception for RTSP stream errors., Raised when an RTSP URL is invalid., Raised when a frame cannot be read from the stream., RTSPError, RTSPReadError

### Community 77 - "useBackendStatus.ts"
Cohesion: 0.21
Nodes (9): MetricCard(), MetricCardProps, MetricsRow(), SystemStatus(), ConnectionStatus(), BackendStatusState, useBackendStatus(), HealthResponse (+1 more)

### Community 78 - "PostprocessorConfig"
Cohesion: 0.29
Nodes (5): PostprocessorConfig, PostprocessorError, Exception, Base exception for postprocessing errors., Configuration for bounding box decoding and NMS.

### Community 79 - "ReIDService"
Cohesion: 0.18
Nodes (9): ndarray, Extract a single 512-D L2-normalized feature vector from a person crop., Extract 512-D L2-normalized feature vectors for a list of crops. Handles batch…, Robust spatial color histogram descriptor (512-D normalized vector) used as…, Compute cosine similarity between two normalized 512-D vectors in range [-1.0,…, Person Re-Identification Service for MAATRIX. Extracts 512-dimensional…, Verify model presence, attempt download if missing, and initialize ONNX session., Preprocess a single BGR crop into (3, 256, 128) float32 normalized tensor. (+1 more)

### Community 80 - "acknowledge_alert"
Cohesion: 0.67
Nodes (3): acknowledge_alert(), patch, Acknowledge a specific alert by ID.

### Community 81 - "test_reid_and_global_tracking.py"
Cohesion: 0.18
Nodes (10): Verify that when a trace is recognized as an enrolled suspect on Cam 1, Cam 2…, Verify ReID feature extractor returns 512-D L2-normalized float32 vectors., Verify REST endpoints /api/tracking/global/traces., Verify same person yields high similarity (>0.85) and different person yields…, Verify that when a person moves from Camera 1 to Camera 2, their Global Trace…, test_cross_camera_global_tracking(), test_global_trace_rest_api(), test_reid_service_extraction() (+2 more)

### Community 82 - "unexpected_exception_handler"
Cohesion: 0.38
Nodes (7): unexpected_exception_handler(), validation_exception_handler(), Exception, exception_handler, JSONResponse, Request, RequestValidationError

### Community 83 - "health"
Cohesion: 0.50
Nodes (3): health(), Any, Return backend health, device config, and execution providers.

### Community 84 - "alerts_websocket_endpoint"
Cohesion: 0.67
Nodes (3): alerts_websocket_endpoint(), websocket, WebSocket endpoint for real-time security alerts and suspect sightings. Clients…

### Community 85 - "stream_anpr"
Cohesion: 0.67
Nodes (3): StreamingResponse, Live MJPEG stream with real-time green plate reticles and vehicle…, stream_anpr()

## Knowledge Gaps
- **178 isolated node(s):** `DEMO_ALERT`, `NeighborBorder`, `NEIGHBOR_BORDERS`, `BorderMapProps`, `TrajectoryWaypoint` (+173 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 553 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ModelManager` connect `ModelManager` to `ModelManagerError`, `logging.py`, `ResourceManager`, `inference_service.py`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `Preprocessor` connect `PreprocessingError` to `tracking.py`, `inference.py`, `stream.py`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `ModelManager` (e.g. with `InferenceService` and `ONNXEngine`) actually correct?**
  _`ModelManager` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `ONNXEngine` (e.g. with `ModelManager` and `ANPRPipeline`) actually correct?**
  _`ONNXEngine` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `DEMO_ALERT`, `NeighborBorder`, `NEIGHBOR_BORDERS` to the rest of the system?**
  _178 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ByteTrackerWrapper` be split into smaller, more focused modules?**
  _Cohesion score 0.054426705370101594 - nodes in this community are weakly interconnected._
- **Should `frontend/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._