export interface AnprRecord {
  id: string;
  plateNumber: string;
  vehicleType: string;
  confidence: number;
  timestamp: string;
  snapshotUrl: string;
  isWatchlisted: boolean;
  watchlistReason?: string;
  cameraId?: string;
  location?: string;
  box?: [number, number, number, number];
}

export interface AnprScanResponse {
  status: "success" | "error";
  annotatedImageUrl?: string;
  records: AnprRecord[];
  extractedPlates: string[];
  processingTimeMs: number;
  platesDetected: number;
  vehiclesDetected: number;
  message?: string;
}

export interface AnprVideoResponse {
  status: "success" | "error";
  videoUrl?: string;
  records: AnprRecord[];
  extractedPlates: string[];
  totalFrames: number;
  processingTimeMs: number;
  message?: string;
}

export interface WatchlistEntry {
  id: string;
  plateNumber: string;
  reason: string;
  severity: "critical" | "high" | "medium";
  vehicleType?: string;
  ownerName?: string;
  addedAt: string;
  notes?: string;
}
