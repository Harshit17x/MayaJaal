import {
  HealthResponse,
  InferenceResponse,
  InferenceStatusResponse,
  ModelStatusResponse,
  RTSPInferenceResponse,
  RTSPTrackingResponse,
  TrackingVideoResponse,
  VideoInferenceResponse,
} from "@/types/backend";
import {
  Camera,
  CreateCameraInput,
  UpdateCameraInput,
  StreamTestResult,
} from "@/types/camera";

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000";

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BACKEND_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      let errorDetail = "";
      try {
        const errorJson = await res.json();
        errorDetail =
          errorJson.message || errorJson.detail || JSON.stringify(errorJson);
      } catch {
        errorDetail = await res.text();
      }
      throw new ApiError(
        `API ${options.method || "GET"} ${endpoint} failed (${res.status}): ${errorDetail}`,
        res.status,
        errorDetail
      );
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw new ApiError(
      `Network error contacting backend at ${url}: ${message}`
    );
  }
}

export interface StreamValidationResult {
  reachable: boolean;
  status: "ready" | "online" | "unreachable";
  protocol: string;
  target_url: string;
  resolved_url: string;
  host?: string;
  port?: number;
  latency_ms: number;
  message: string;
  is_ip_webcam: boolean;
  candidates?: string[];
}

export const api = {
  /**
   * Health and Provider status
   */
  async getHealth(): Promise<HealthResponse> {
    return request<HealthResponse>("/api/health");
  },

  /**
   * Model Manager status and loaded models
   */
  async getModels(): Promise<ModelStatusResponse> {
    return request<ModelStatusResponse>("/api/models");
  },

  /**
   * Load an ONNX model file located in backend models directory
   */
  async loadModel(
    modelName: string,
    modelFile: string
  ): Promise<{ model_name: string; status: string; model_info: unknown }> {
    return request("/api/models/load", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model_name: modelName,
        model_file: modelFile,
      }),
    });
  },

  /**
   * Unload a model by name
   */
  async unloadModel(
    modelName: string
  ): Promise<{ model_name: string; status: string }> {
    return request(`/api/models/${encodeURIComponent(modelName)}`, {
      method: "DELETE",
    });
  },

  /**
   * Inference and resource slot status
   */
  async getInferenceStatus(): Promise<InferenceStatusResponse> {
    return request<InferenceStatusResponse>("/api/inference/status");
  },

  /**
   * Run object detection inference on a single image file
   */
  async runImageInference(params: {
    file: File | Blob;
    modelName: string;
    confThreshold?: number;
    iouThreshold?: number;
    postprocess?: boolean;
  }): Promise<InferenceResponse> {
    const formData = new FormData();
    formData.append("file", params.file);
    formData.append("model_name", params.modelName);
    formData.append(
      "conf_threshold",
      (params.confThreshold ?? 0.25).toString()
    );
    formData.append(
      "iou_threshold",
      (params.iouThreshold ?? 0.45).toString()
    );
    formData.append(
      "postprocess",
      (params.postprocess ?? true).toString()
    );

    return request<InferenceResponse>("/api/inference/image", {
      method: "POST",
      body: formData,
    });
  },

  /**
   * Run inference on an uploaded video file
   */
  async runVideoInference(params: {
    file: File | Blob;
    modelName: string;
    confThreshold?: number;
    iouThreshold?: number;
    frameStride?: number;
    maxFrames?: number;
    postprocess?: boolean;
  }): Promise<VideoInferenceResponse> {
    const formData = new FormData();
    formData.append("file", params.file);
    formData.append("model_name", params.modelName);
    if (params.confThreshold !== undefined)
      formData.append("conf_threshold", params.confThreshold.toString());
    if (params.iouThreshold !== undefined)
      formData.append("iou_threshold", params.iouThreshold.toString());
    if (params.frameStride !== undefined)
      formData.append("frame_stride", params.frameStride.toString());
    if (params.maxFrames !== undefined)
      formData.append("max_frames", params.maxFrames.toString());
    if (params.postprocess !== undefined)
      formData.append("postprocess", params.postprocess.toString());

    return request<VideoInferenceResponse>("/api/inference/video", {
      method: "POST",
      body: formData,
    });
  },

  /**
   * Run sampled inference on an RTSP stream URL
   */
  async runRtspInference(params: {
    rtspUrl: string;
    modelName: string;
    confThreshold?: number;
    iouThreshold?: number;
    maxFrames?: number;
  }): Promise<RTSPInferenceResponse> {
    const formData = new FormData();
    formData.append("rtsp_url", params.rtspUrl);
    formData.append("model_name", params.modelName);
    if (params.confThreshold !== undefined)
      formData.append("conf_threshold", params.confThreshold.toString());
    if (params.iouThreshold !== undefined)
      formData.append("iou_threshold", params.iouThreshold.toString());
    if (params.maxFrames !== undefined)
      formData.append("max_frames", params.maxFrames.toString());

    return request<RTSPInferenceResponse>("/api/inference/rtsp", {
      method: "POST",
      body: formData,
    });
  },

  /**
   * Run ByteTrack multi-object tracking on an uploaded video file
   */
  async runVideoTracking(params: {
    file: File | Blob;
    modelName: string;
    confThreshold?: number;
    iouThreshold?: number;
    maxFrames?: number;
    activationThreshold?: number;
    lostTrackBuffer?: number;
    matchingThreshold?: number;
  }): Promise<TrackingVideoResponse> {
    const formData = new FormData();
    formData.append("file", params.file);
    formData.append("model_name", params.modelName);
    if (params.confThreshold !== undefined)
      formData.append("conf_threshold", params.confThreshold.toString());
    if (params.iouThreshold !== undefined)
      formData.append("iou_threshold", params.iouThreshold.toString());
    if (params.maxFrames !== undefined)
      formData.append("max_frames", params.maxFrames.toString());
    if (params.activationThreshold !== undefined)
      formData.append("activation_threshold", params.activationThreshold.toString());
    if (params.lostTrackBuffer !== undefined)
      formData.append("lost_track_buffer", params.lostTrackBuffer.toString());
    if (params.matchingThreshold !== undefined)
      formData.append("matching_threshold", params.matchingThreshold.toString());

    return request<TrackingVideoResponse>("/api/tracking/video", {
      method: "POST",
      body: formData,
    });
  },

  /**
   * Run ByteTrack tracking on an RTSP stream with persistent camera tracking state
   */
  async runRtspTracking(params: {
    rtspUrl: string;
    cameraId?: string;
    modelName: string;
    confThreshold?: number;
    iouThreshold?: number;
    maxFrames?: number;
  }): Promise<RTSPTrackingResponse> {
    const formData = new FormData();
    formData.append("rtsp_url", params.rtspUrl);
    formData.append("model_name", params.modelName);
    if (params.cameraId) formData.append("camera_id", params.cameraId);
    if (params.confThreshold !== undefined)
      formData.append("conf_threshold", params.confThreshold.toString());
    if (params.iouThreshold !== undefined)
      formData.append("iou_threshold", params.iouThreshold.toString());
    if (params.maxFrames !== undefined)
      formData.append("max_frames", params.maxFrames.toString());

    return request<RTSPTrackingResponse>("/api/tracking/rtsp", {
      method: "POST",
      body: formData,
    });
  },

  /**
   * Cameras Management API
   */
  async getCameras(filters?: { sector?: string; status?: string }): Promise<Camera[]> {
    const params = new URLSearchParams();
    if (filters?.sector) params.append("sector", filters.sector);
    if (filters?.status) params.append("status", filters.status);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return request<Camera[]>(`/api/cameras${qs}`);
  },

  async getCamera(id: string): Promise<Camera> {
    return request<Camera>(`/api/cameras/${encodeURIComponent(id)}`);
  },

  async createCamera(input: CreateCameraInput): Promise<Camera> {
    return request<Camera>("/api/cameras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  async updateCamera(id: string, input: UpdateCameraInput): Promise<Camera> {
    return request<Camera>(`/api/cameras/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  async deleteCamera(id: string): Promise<{ status: string; message: string; deleted_id: string }> {
    return request(`/api/cameras/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },

  async testStream(params: { streamUrl?: string; ipAddress?: string; port?: number }): Promise<StreamTestResult> {
    return request<StreamTestResult>("/api/cameras/test-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  },

  /**
   * Validate stream reachability, protocol, and candidate endpoints
   */
  async validateStream(streamUrl: string): Promise<StreamValidationResult> {
    const params = new URLSearchParams({ stream_url: streamUrl });
    return request<StreamValidationResult>(`/api/stream/validate?${params.toString()}`);
  },
};

