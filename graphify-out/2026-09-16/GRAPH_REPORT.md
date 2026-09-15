# Graph Report - MayaJaal  (2026-09-16)

## Corpus Check
- 140 files · ~2,000,896 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1379 nodes · 2333 edges · 81 communities (62 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 50 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6a2c2b72`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- authStore.ts
- ByteTrackerWrapper
- frontend/package.json
- inference.py
- BorderMap.tsx
- ONNXEngine
- logging.py
- cameras.py
- VideoLoader
- tracking.py
- RTSPStream
- Preprocessor
- Any
- ModelManager
- load_image
- compilerOptions
- README.md
- lucide-react
- react
- faces.py
- FaceService
- AlertService
- liveworkspace.tsx
- thermal.py
- ThermalFusionService
- anpr.py
- scripts
- MayaJaal (मायाजाल)
- alertsStore.ts
- 34. Recommended Final Model Integration Process
- Postprocessor
- ANPRPipeline
- api.ts
- Settings
- GlobalTraceManager
- ModelManagerError
- middleware.ts
- postcss.config.mjs
- next-env.d.ts
- GeofenceEngine
- geofences/page.tsx
- ContinuousFaceScanner
- draw_tracked_boxes
- ResourceManagerError
- .predict
- PostprocessorConfig
- RTSPError
- get_annotated_frame
- get_global_trace_trajectory
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
- reset_global_traces
- test_alerts_and_scanner.py
- convert_video_to_h264
- health
- geofences.py
- test_cameras_security.py
- gis-map/page.tsx
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
6. `Preprocessor` - 21 edges
7. `Postprocessor` - 20 edges
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

## Communities (81 total, 9 thin omitted)

### Community 0 - "authStore.ts"
Cohesion: 0.13
Nodes (22): LoginFormCard(), NavItem, OperatorLayout(), EmblemIndia(), HeroSection(), LandingNavbar(), AUTH_COOKIE_NAME, AUTH_EVENT_NAME (+14 more)

### Community 1 - "ByteTrackerWrapper"
Cohesion: 0.06
Nodes (28): ByteTracker configuration. Maps to the supervision ByteTrack constructor…, Immutable configuration for ByteTrackerWrapper. Attributes:…, TrackerConfig, ByteTrack multi-object tracking package. Provides stateful, per-session object…, Any, Data models for tracking output. TrackedObject extends a raw Detection with a…, Snapshot of a tracked object within a single video frame. Attributes: track_id:…, Return a JSON-serialisable representation. (+20 more)

### Community 2 - "frontend/package.json"
Cohesion: 0.04
Nodes (42): nextConfig, dependencies, clsx, lucide-react, maplibre-gl, next, react, react-dom (+34 more)

### Community 3 - "inference.py"
Cohesion: 0.17
Nodes (21): batch_inference(), create_preprocessor(), get_model_input_size(), image_inference(), inference_status(), get, post, UploadFile (+13 more)

### Community 4 - "BorderMap.tsx"
Cohesion: 0.05
Nodes (44): AnprPage(), CAMERA_TYPES, CamerasPage(), COORDINATE_PRESETS, SECTORS, BorderMap(), BorderMapProps, DEMO_ALERT (+36 more)

### Community 5 - "ONNXEngine"
Cohesion: 0.09
Nodes (21): ONNXEngine, ONNXEngineError, ONNXInferenceError, ONNXModelError, Any, Exception, ndarray, Path (+13 more)

### Community 6 - "logging.py"
Cohesion: 0.10
Nodes (27): create_standby_frame(), draw_bounding_boxes(), draw_tactical_hud(), get_live_stream(), get_snapshot(), is_host_reachable(), is_rtsp_host_reachable(), normalize_stream_url() (+19 more)

### Community 7 - "cameras.py"
Cohesion: 0.15
Nodes (26): CameraCreateRequest, CameraUpdateRequest, create_camera(), delete_camera(), _ensure_data_file(), get_camera(), get_cameras(), HealthStats (+18 more)

### Community 8 - "VideoLoader"
Cohesion: 0.11
Nodes (18): InvalidVideoError, Any, Exception, Path, Return useful video metadata., Read the next frame with orientation correction. Returns: (True, frame) when…, Base exception for video loading errors., Raised when a video file does not exist. (+10 more)

### Community 9 - "tracking.py"
Cohesion: 0.20
Nodes (15): _build_tracker_config(), _create_preprocessor(), _get_model_input_size(), Any, post, UploadFile, /api/tracking — ByteTrack multi-object tracking endpoints. Endpoints ---------…, Run ByteTrack multi-object tracking on an uploaded video using ONNX batching (2… (+7 more)

### Community 10 - "RTSPStream"
Cohesion: 0.16
Nodes (10): Any, Open the stream (RTSP or HTTP IP Webcam) with candidate fallbacks and bounded…, Read one frame from the RTSP stream., Attempt bounded reconnection attempts. Returns: True if reconnection succeeds.…, Raised when an RTSP stream cannot be opened., Return current RTSP stream status., Release the RTSP capture resource., Safe RTSP stream reader for CCTV cameras. Features: - RTSP URL validation -… (+2 more)

### Community 11 - "Preprocessor"
Cohesion: 0.14
Nodes (18): InvalidFrameError, InvalidTargetSizeError, PreprocessingError, Preprocessor, Exception, ndarray, Validate an OpenCV frame., Base exception for preprocessing errors. (+10 more)

### Community 12 - "Any"
Cohesion: 0.33
Nodes (3): Any, Return the status of all loaded models., Unload all models safely.

### Community 13 - "ModelManager"
Cohesion: 0.13
Nodes (10): Return current resource usage., Return whether an inference slot is currently available., Controls concurrent inference execution. Designed for a CPU-first system where…, ResourceManager, InferenceService, High-level inference service. Connects: ModelManager + ResourceManager + ONNX…, ModelManager, Check whether a model is currently loaded. (+2 more)

### Community 14 - "load_image"
Cohesion: 0.18
Nodes (15): ImageFileNotFoundError, ImageLoaderError, InvalidImageError, load_image(), Exception, ndarray, Path, Base exception for image loading errors. (+7 more)

### Community 15 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 16 - "README.md"
Cohesion: 0.05
Nodes (39): 10. Health Check, 11. Runtime Status, 12. Model Management, 13. Adding an ONNX Model, 14. Loading an ONNX Model, 15. Checking Loaded Models, 16. Unloading a Model, 17. ONNX Model Inspection (+31 more)

### Community 17 - "lucide-react"
Cohesion: 0.09
Nodes (12): ActivityOverviewChart(), DayData, WEEK_DATA, AnalyticsDashboard(), CameraOutpostGrid(), OutpostItem, OUTPOSTS, CATEGORIES (+4 more)

### Community 19 - "faces.py"
Cohesion: 0.07
Nodes (41): add_face_sample(), decode_image_input(), delete_person(), face_websocket_stream(), _generate_face_stream(), get_face_engine_status(), get_face_thumbnail(), get_recent_face_events() (+33 more)

### Community 20 - "FaceService"
Cohesion: 0.11
Nodes (17): calibrate_match_confidence(), compute_iou(), enhance_aligned_face(), FaceService, Any, ndarray, Compute Intersection over Union (IoU) between two bounding boxes [x1, y1, x2,…, Update classification and threat metadata for an enrolled person without re-… (+9 more)

### Community 21 - "AlertService"
Cohesion: 0.06
Nodes (32): AbstractEventLoop, create_token(), get_roster(), login(), LoginRequest, logout(), Any, BaseModel (+24 more)

### Community 22 - "liveworkspace.tsx"
Cohesion: 0.09
Nodes (30): SystemStatus(), ConnectionStatus(), CLASS_COLORS, DetectionCanvas(), DetectionCanvasProps, buildStreamUrl(), getThermalVideoFilter(), LiveWorkspace() (+22 more)

### Community 23 - "thermal.py"
Cohesion: 0.12
Nodes (25): _decode_image_upload(), fuse_dual_spectrum_images(), get_available_palettes(), get_spot_temperature(), get_thermal_video(), PaletteInfo, process_thermal_video(), Any (+17 more)

### Community 25 - "ThermalFusionService"
Cohesion: 0.06
Nodes (31): FusedTarget, Any, ndarray, RadiometricCalibration, Builds a tactical P43 Green Phosphor NVG LUT with high mid-range contrast., Builds a tactical Amber Phosphor LUT (low eye fatigue in dark TOC)., Applies radiometric color palette to an input frame (BGR). Runs in < 1.5ms via…, Extracts structural contours (fences, camouflage outlines, weapon shapes,… (+23 more)

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
Cohesion: 0.14
Nodes (17): Detection, Postprocessor, Any, ndarray, Decode output tensors into a list of detection lists (one list per frame in the…, Decode single-frame YOLOv8/v9/v11 output [4 + C, N]., Decode standard YOLOv8/v9/v11 output with shape [1, 4 + C, N] or [4 + C, N]., Decode single-frame YOLOv5/v7 [N, 5 + C] or transposed YOLOv8 [N, 4 + C]. (+9 more)

### Community 32 - "ANPRPipeline"
Cohesion: 0.12
Nodes (18): ANPRPipeline, Any, ndarray, Path, Generator yielding MJPEG multipart stream with real-time ANPR overlays (EasyOCR…, Find license plate text and its bounding box directly within a vehicle crop., End-to-end ANPR Pipeline using ONNX models on GPU: 1. Vehicle detection via…, Resize with padding (letterbox) to square tensor for YOLOv8. (+10 more)

### Community 33 - "api.ts"
Cohesion: 0.20
Nodes (14): ApiError, request(), StreamValidationResult, AnprRecord, AnprScanResponse, AnprVideoResponse, WatchlistEntry, EnrolledPerson (+6 more)

### Community 34 - "Settings"
Cohesion: 0.50
Nodes (3): Central configuration for the SIH26187 inference backend., Settings, BaseSettings

### Community 35 - "GlobalTraceManager"
Cohesion: 0.10
Nodes (14): calc_haversine_km(), GlobalTrace, GlobalTraceManager, Any, ndarray, Update the aggregated appearance feature using Exponential Moving Average…, Convert GlobalTrace into JSON-serializable representation., Central Thread-Safe Manager for Cross-Camera Multi-Target Multi-Camera Tracking… (+6 more)

### Community 36 - "ModelManagerError"
Cohesion: 0.15
Nodes (12): ModelAlreadyLoadedError, ModelManagerError, ModelNotFoundError, Exception, Path, Return a loaded model., Base exception for model manager errors., Unload one model and release its ONNX session. (+4 more)

### Community 41 - "GeofenceEngine"
Cohesion: 0.09
Nodes (19): ccw(), check_tripwire_crossing(), compute_footpoint(), GeofenceEngine, is_point_in_polygon(), Any, ndarray, Virtual Geofencing & Directional Tripwire Engine. Provides mathematical… (+11 more)

### Community 43 - "geofences/page.tsx"
Cohesion: 0.17
Nodes (13): COLOR_PRESETS, FeedViewMode, GeofencesPage(), ToolMode, CreateTripwirePayload, CreateZonePayload, DirectionalTripwire, GeofenceBreachEvent (+5 more)

### Community 44 - "ContinuousFaceScanner"
Cohesion: 0.19
Nodes (8): ContinuousFaceScanner, Any, Return operational telemetry for the feed scanner., Dedicated worker loop for an individual camera stream., Continuous Multi-Feed Background Video Scanner for MAATRIX. Monitors registered…, Start continuous scanning across all active camera feeds., Gracefully stop all camera feed scanner worker threads., Event

### Community 45 - "draw_tracked_boxes"
Cohesion: 0.29
Nodes (6): draw_tracked_boxes(), Any, ndarray, Annotate a video frame in-place with tactical bounding boxes and track ID…, Test suspect facial recognition integration in video and photo upload…, test_annotator_suspect_rendering()

### Community 46 - "ResourceManagerError"
Cohesion: 0.22
Nodes (6): Exception, Context manager for safe inference execution. Example: with…, Base exception for resource manager errors., Acquire an inference slot. Returns: True if a slot was acquired. False if the…, Release an inference slot., ResourceManagerError

### Community 47 - ".predict"
Cohesion: 0.25
Nodes (8): InferenceResourceError, InferenceServiceError, Any, Exception, ndarray, Base exception for inference service errors., Raised when inference resources are unavailable., Run inference using a loaded model, supporting both single-frame and batch…

### Community 48 - "PostprocessorConfig"
Cohesion: 0.29
Nodes (5): PostprocessorConfig, PostprocessorError, Exception, Base exception for postprocessing errors., Configuration for bounding box decoding and NMS.

### Community 49 - "RTSPError"
Cohesion: 0.27
Nodes (7): InvalidRTSPUrlError, Exception, Base exception for RTSP stream errors., Raised when an RTSP URL is invalid., Raised when a frame cannot be read from the stream., RTSPError, RTSPReadError

### Community 50 - "get_annotated_frame"
Cohesion: 0.40
Nodes (5): get_annotated_frame(), get_annotated_video(), api_route, Serve a server-annotated ByteTrack video with burned-in bounding boxes (H.264…, Serve a single server-annotated JPEG frame from tracked video.

### Community 51 - "get_global_trace_trajectory"
Cohesion: 0.29
Nodes (7): get_global_trace_trajectory(), list_global_traces(), list_rtsp_sessions(), get, List all active per-camera ByteTracker sessions., List all active cross-camera person traces with recent sightings and trajectory…, Retrieve full chronological GPS multi-camera trajectory for a specific Global…

### Community 59 - "test_reid_and_global_tracking.py"
Cohesion: 0.18
Nodes (10): Verify that when a trace is recognized as an enrolled suspect on Cam 1, Cam 2…, Verify ReID feature extractor returns 512-D L2-normalized float32 vectors., Verify REST endpoints /api/tracking/global/traces., Verify same person yields high similarity (>0.85) and different person yields…, Verify that when a person moves from Camera 1 to Camera 2, their Global Trace…, test_cross_camera_global_tracking(), test_global_trace_rest_api(), test_reid_service_extraction() (+2 more)

### Community 60 - "alerts.py"
Cohesion: 0.10
Nodes (30): acknowledge_alert(), AlertCreateRequest, alerts_websocket_endpoint(), clear_alerts(), create_alert(), dispatch_qrt(), get_alert_snapshot(), get_scanner_status() (+22 more)

### Community 61 - "FastAPI"
Cohesion: 0.22
Nodes (9): lifespan(), get, root(), get_logger(), Configure application-wide logging. Logs are written to both: - the console - a…, Return a logger for a specific application module., setup_logging(), FastAPI (+1 more)

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

### Community 70 - "reset_global_traces"
Cohesion: 0.40
Nodes (5): delete, Reset and remove the ByteTracker session for the given ``camera_id``. After…, Clear and reset all global cross-camera trace records., reset_global_traces(), reset_rtsp_session()

### Community 71 - "test_alerts_and_scanner.py"
Cohesion: 0.15
Nodes (12): cleanup_test_data(), Test multi-camera suspect trajectory reconstruction and QRT team dispatch., Ensure user's custom threat detection model best.onnx is 100% untouched., Clear all test alerts and restore camera statuses to 'online' so no dummy data…, Test AlertService creation, filtering, acknowledgement, and ring buffer., Test ContinuousFaceScanner status and start/stop controls., Test the REST API endpoints in alerts_router using FastAPI TestClient., test_alert_service_lifecycle() (+4 more)

### Community 72 - "convert_video_to_h264"
Cohesion: 0.38
Nodes (6): convert_video_to_h264(), find_ffmpeg_executable(), Path, Server-side bounding box and track ID annotator. Draws tactical bounding boxes,…, Locate the FFmpeg executable reliably across system paths, Python scripts,…, Convert an OpenCV-encoded MP4 to browser-compatible H.264 MP4 with faststart.

### Community 73 - "health"
Cohesion: 0.40
Nodes (4): health(), Any, get, Return backend health, device config, and execution providers.

### Community 74 - "geofences.py"
Cohesion: 0.11
Nodes (31): create_tripwire(), create_zone(), delete_tripwire(), delete_zone(), evaluate_geofences(), EvaluateRequest, EvaluateTrackItem, get_geofences() (+23 more)

### Community 75 - "test_cameras_security.py"
Cohesion: 0.67
Nodes (3): test_stream_target_rejects_addresses_outside_camera_network(), test_stream_target_uses_allowlisted_resolved_address(), MonkeyPatch

### Community 78 - "gis-map/page.tsx"
Cohesion: 0.15
Nodes (17): AlertsPage(), TacticalThreatToast(), CameraFeedStrip(), cameras, RecentAlerts(), SuspectTrajectoryModal(), SuspectTrajectoryModalProps, api (+9 more)

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
- **206 isolated node(s):** `config`, `nextConfig`, `name`, `version`, `private` (+201 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 654 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ANPRPipeline` connect `ANPRPipeline` to `ONNXEngine`, `logging.py`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `ONNXEngine` connect `ONNXEngine` to `ANPRPipeline`, `ModelManagerError`, `ModelManager`, `logging.py`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `ModelManager` (e.g. with `InferenceService` and `ONNXEngine`) actually correct?**
  _`ModelManager` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `ONNXEngine` (e.g. with `ModelManager` and `ANPRPipeline`) actually correct?**
  _`ONNXEngine` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `config`, `nextConfig`, `name` to the rest of the system?**
  _206 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `authStore.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12688172043010754 - nodes in this community are weakly interconnected._
- **Should `ByteTrackerWrapper` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._