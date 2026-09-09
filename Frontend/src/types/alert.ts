export type AlertSeverity = "High" | "Medium" | "Low";

export interface AlertItem {
  id: string;
  title: string;
  location: string;
  time: string;
  timestamp: number;
  severity: AlertSeverity;
  cameraId?: string;
  cameraName?: string;
  className?: string;
  confidence?: number;
  acknowledged?: boolean;
  box?: [number, number, number, number];
  snapshotUrl?: string;
}

export interface AlertFilter {
  severity?: AlertSeverity | "All";
  search?: string;
  acknowledged?: boolean;
}
