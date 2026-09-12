export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  device_configured: string;
  gpu_available: boolean;
  available_providers: string[];
}

export interface ModelTensorInfo {
  name: string;
  shape: (number | string | null)[];
  type: string;
}

export interface ModelMetadata {
  model_name: string;
  model_path: string;
  file_size_bytes: number;
  input_names: string[];
  output_names: string[];
  inputs: ModelTensorInfo[];
  outputs: ModelTensorInfo[];
}

export interface ModelStatusResponse {
  max_models: number;
  loaded_count: number;
  available_slots: number;
  loaded_models: string[];
  models: Record<string, ModelMetadata>;
}

export interface ResourceStatus {
  max_concurrent_inference: number;
  active_inference: number;
  available_slots: number;
}

export interface InferenceStatusResponse {
  status: string;
  resource_manager: ResourceStatus;
  models: ModelStatusResponse;
}

export interface Detection {
  box: [number, number, number, number]; // [x1, y1, x2, y2]
  confidence: number;
  class_id: number;
  class_name: string;
  track_id?: number;
  is_threat?: boolean;
  threat_level?: string;
  suspect_name?: string;
  category?: string;
}

export interface SuspectSummary {
  name: string;
  threat_level: string;
  frame_index: number;
  confidence: number;
  category?: string;
}

export type TrackedObject = Detection & { track_id: number };

export interface OutputTensorMetadata {
  index: number;
  type: string;
  shape?: number[];
  dtype?: string;
}

export interface InferenceResponse {
  model_name: string;
  status: string;
  latency_seconds?: number;
  inference_time_ms?: number;
  outputs?: OutputTensorMetadata[];
  detections: Detection[];
  raw_outputs?: unknown;
}

export interface VideoMetadata {
  filename?: string;
  fps?: number;
  frame_count?: number;
  width?: number;
  height?: number;
  duration_seconds?: number;
}

export interface VideoFrameResult {
  frame_index: number;
  timestamp_seconds?: number;
  inference?: {
    model_name?: string;
    status?: string;
    inference_time_ms?: number;
    detections: Detection[];
  };
  detections?: Detection[];
  tracked_objects?: Detection[];
  detections_count?: number;
  tracks_count?: number;
  annotated_frame_url?: string;
}

export type VideoFrameInference = VideoFrameResult;

export interface VideoInferenceResponse {
  model_name: string;
  status: string;
  video?: VideoMetadata;
  frames_requested?: number;
  frames_processed?: number;
  total_frames_processed?: number;
  duration_seconds?: number;
  fps?: number;
  results?: VideoFrameResult[];
  frame_results?: VideoFrameResult[];
  suspects_detected?: SuspectSummary[];
}

export interface TrackingVideoResponse {
  model_name: string;
  status: string;
  video?: VideoMetadata;
  video_id?: string;
  frames_requested?: number;
  frames_processed?: number;
  annotated_video_url?: string;
  suspects_detected?: SuspectSummary[];
  results: VideoFrameResult[];
  tracker_config?: Record<string, unknown>;
}

export interface RTSPInferenceResponse {
  model_name: string;
  status: string;
  rtsp_url: string;
  frames_sampled: number;
  frame_results: VideoFrameInference[];
}

export interface RTSPTrackingResponse {
  model_name: string;
  status: string;
  camera_id?: string;
  rtsp_url: string;
  frames_requested?: number;
  frames_processed?: number;
  tracker_frame_index?: number;
  results: VideoFrameResult[];
}
