export type CameraStatus = "online" | "offline" | "degraded" | "alert";

export type CameraType =
  | "Optical 4K"
  | "Thermal FLIR"
  | "Night Vision / IR"
  | "ANPR Dedicated"
  | "PTZ 360"
  | "Panoramic";

export interface CameraHealthStats {
  bitrate: string;
  latencyMs: number;
  packetLoss: string;
}

export interface Camera {
  id: string;
  name: string;
  sector: string;
  location: string;
  status: CameraStatus;
  type?: CameraType | string;
  ipAddress?: string;
  port?: number;
  streamUrl?: string;
  isRtsp?: boolean;
  latitude: number;
  longitude: number;
  coordinates?: [number, number]; // [longitude, latitude]
  modelAssigned?: string;
  resolution?: string;
  fps?: number;
  confThreshold?: number;
  iouThreshold?: number;
  isRecording?: boolean;
  alertTriggerEnabled?: boolean;
  lastActive?: string;
  healthStats?: CameraHealthStats;
}

export interface CameraFeed {
  cameraId: string;
  cameraName: string;
  feedUrl: string;
  isLive: boolean;
  currentAlertCount: number;
}

export interface CreateCameraInput {
  id?: string;
  name: string;
  sector: string;
  location: string;
  status?: CameraStatus;
  type?: CameraType | string;
  ipAddress?: string;
  port?: number;
  streamUrl?: string;
  isRtsp?: boolean;
  latitude: number;
  longitude: number;
  modelAssigned?: string;
  resolution?: string;
  fps?: number;
  confThreshold?: number;
  iouThreshold?: number;
  isRecording?: boolean;
  alertTriggerEnabled?: boolean;
}

export interface UpdateCameraInput {
  name?: string;
  sector?: string;
  location?: string;
  status?: CameraStatus;
  type?: CameraType | string;
  ipAddress?: string;
  port?: number;
  streamUrl?: string;
  isRtsp?: boolean;
  latitude?: number;
  longitude?: number;
  modelAssigned?: string;
  resolution?: string;
  fps?: number;
  confThreshold?: number;
  iouThreshold?: number;
  isRecording?: boolean;
  alertTriggerEnabled?: boolean;
}

export interface StreamTestResult {
  reachable: boolean;
  status: "online" | "unreachable" | "error";
  latencyMs: number;
  host?: string;
  port?: number;
  message: string;
  protocol?: string;
  supportedCodecs?: string[];
}
