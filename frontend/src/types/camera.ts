export type CameraStatus = "online" | "offline" | "degraded" | "alert";

export type CameraType =
  | "Optical 4K"
  | "Thermal FLIR"
  | "Night Vision / IR"
  | "ANPR Dedicated"
  | "PTZ 360"
  | "Panoramic"
  | "Dual Spectrum";

export type SpectrumType = "optical" | "thermal" | "dual_spectrum" | "night_vision_ir";

export type ThermalPalette =
  | "standard"
  | "white_hot"
  | "black_hot"
  | "ironbow"
  | "nvg_green"
  | "amber"
  | "msx_fusion";

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
  spectrumType?: SpectrumType | string;
  pairedCameraId?: string;
  defaultPalette?: ThermalPalette | string;
  thermalSensitivity?: string;
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
  spectrumType?: SpectrumType | string;
  pairedCameraId?: string;
  defaultPalette?: ThermalPalette | string;
  thermalSensitivity?: string;
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
  spectrumType?: SpectrumType | string;
  pairedCameraId?: string;
  defaultPalette?: ThermalPalette | string;
  thermalSensitivity?: string;
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
