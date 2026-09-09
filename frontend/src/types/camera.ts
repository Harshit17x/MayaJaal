export type CameraStatus = "online" | "offline" | "degraded" | "alert";

export interface Camera {
  id: string;
  name: string;
  sector: string;
  location: string;
  status: CameraStatus;
  streamUrl?: string;
  isRtsp?: boolean;
  modelAssigned?: string;
  coordinates?: [number, number]; // [longitude, latitude]
  lastActive?: string;
  resolution?: string;
  fps?: number;
}

export interface CameraFeed {
  cameraId: string;
  cameraName: string;
  feedUrl: string;
  isLive: boolean;
  currentAlertCount: number;
}
