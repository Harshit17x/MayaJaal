export type AlertSeverity = "High" | "Medium" | "Low";

export interface QrtDispatchRecord {
  unit: string;
  notes?: string;
  dispatched_at: number;
  status: "Dispatched" | "Arrived" | "Resolved";
}

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
  box?: [number, number, number, number] | number[];
  snapshotUrl?: string;
  suspectName?: string;
  threatLevel?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | string;
  category?: string;
  notes?: string;
  qrt_dispatch?: QrtDispatchRecord;
}

export interface AlertFilter {
  severity?: AlertSeverity | "All";
  search?: string;
  acknowledged?: boolean;
}

export interface ScannerStatus {
  running: boolean;
  worker_count: number;
  active_camera_ids: string[];
  total_scans: number;
  suspect_detections: number;
  last_scan_time: string;
  sampling_interval_sec: number;
  debounce_cooldown_sec: number;
}

export interface SuspectWaypoint {
  step: number;
  alert_id: string;
  camera_id: string;
  camera_name: string;
  location: string;
  sector: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  time_str: string;
  threat_level: string;
  confidence: number;
  snapshot_url?: string;
  delta_km: number;
  elapsed_minutes: number;
}

export interface SuspectTrajectory {
  suspect_name: string;
  found: boolean;
  threat_level?: string;
  category?: string;
  total_sightings: number;
  total_distance_km: number;
  first_seen?: string;
  last_seen?: string;
  last_location?: string;
  waypoints: SuspectWaypoint[];
}


