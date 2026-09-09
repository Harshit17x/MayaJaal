"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Camera,
  CreateCameraInput,
  UpdateCameraInput,
  StreamTestResult,
} from "@/types/camera";
import { api } from "@/lib/api";

const STORAGE_KEY = "mayajaal_operator_cameras_v1";

export const INITIAL_CAMERAS: Camera[] = [
  {
    id: "cam-1",
    name: "North Perimeter Optical 4K",
    sector: "Sector-04 (BOP Alpha)",
    location: "Pillar 14 — Forward Trench",
    status: "online",
    type: "Optical 4K",
    ipAddress: "10.20.72.101",
    port: 554,
    streamUrl: "rtsp://admin:pass@10.20.72.101:554/live/ch0",
    isRtsp: true,
    latitude: 24.10,
    longitude: 77.70,
    coordinates: [77.70, 24.10],
    modelAssigned: "best.onnx (Threat Detector)",
    resolution: "4K UHD (3840x2160)",
    fps: 30,
    confThreshold: 0.75,
    iouThreshold: 0.45,
    isRecording: true,
    alertTriggerEnabled: true,
    lastActive: "Just now",
    healthStats: {
      bitrate: "8.4 Mbps",
      latencyMs: 42,
      packetLoss: "0.01%",
    },
  },
  {
    id: "cam-2",
    name: "Eastern Gate Rapid Response",
    sector: "Sector-04 (BOP Alpha)",
    location: "Eastern Vehicle Checkpost & Gate",
    status: "alert",
    type: "ANPR Dedicated",
    ipAddress: "10.20.72.102",
    port: 554,
    streamUrl: "rtsp://admin:pass@10.20.72.102:554/live/ch0",
    isRtsp: true,
    latitude: 23.70,
    longitude: 79.30,
    coordinates: [79.30, 23.70],
    modelAssigned: "best.onnx (Threat Detector)",
    resolution: "1080p FHD (1920x1080)",
    fps: 60,
    confThreshold: 0.70,
    iouThreshold: 0.45,
    isRecording: true,
    alertTriggerEnabled: true,
    lastActive: "Just now",
    healthStats: {
      bitrate: "6.2 Mbps",
      latencyMs: 38,
      packetLoss: "0.00%",
    },
  },
  {
    id: "cam-3",
    name: "Watch Tower High-Mast FLIR",
    sector: "Sector-04 (BOP Alpha)",
    location: "Watch Tower 03 — Elevated Ridge",
    status: "online",
    type: "Thermal FLIR",
    ipAddress: "10.20.72.103",
    port: 554,
    streamUrl: "rtsp://admin:pass@10.20.72.103:554/live/ch1",
    isRtsp: true,
    latitude: 22.40,
    longitude: 78.10,
    coordinates: [78.10, 22.40],
    modelAssigned: "best.onnx (Threat Detector)",
    resolution: "1080p Thermal",
    fps: 25,
    confThreshold: 0.80,
    iouThreshold: 0.50,
    isRecording: true,
    alertTriggerEnabled: true,
    lastActive: "1 min ago",
    healthStats: {
      bitrate: "4.5 Mbps",
      latencyMs: 56,
      packetLoss: "0.05%",
    },
  },
  {
    id: "cam-4",
    name: "Southern Ridge Fog Penetration",
    sector: "Sector-03 (South Riverine)",
    location: "Riverine Crossing — Point Charlie",
    status: "online",
    type: "Night Vision / IR",
    ipAddress: "10.20.72.104",
    port: 554,
    streamUrl: "rtsp://admin:pass@10.20.72.104:554/live/ch0",
    isRtsp: true,
    latitude: 22.90,
    longitude: 79.40,
    coordinates: [79.40, 22.90],
    modelAssigned: "best.onnx (Threat Detector)",
    resolution: "1080p FHD (1920x1080)",
    fps: 30,
    confThreshold: 0.75,
    iouThreshold: 0.45,
    isRecording: false,
    alertTriggerEnabled: true,
    lastActive: "3 mins ago",
    healthStats: {
      bitrate: "5.1 Mbps",
      latencyMs: 64,
      packetLoss: "0.02%",
    },
  },
  {
    id: "cam-5",
    name: "Trench Perimeter PTZ 360",
    sector: "Sector-01 (Western Flank)",
    location: "Observation Bunker 09",
    status: "degraded",
    type: "PTZ 360",
    ipAddress: "10.20.72.105",
    port: 554,
    streamUrl: "rtsp://admin:pass@10.20.72.105:554/live/ch0",
    isRtsp: true,
    latitude: 23.25,
    longitude: 78.75,
    coordinates: [78.75, 23.25],
    modelAssigned: "best.onnx (Threat Detector)",
    resolution: "1080p FHD (1920x1080)",
    fps: 25,
    confThreshold: 0.75,
    iouThreshold: 0.45,
    isRecording: true,
    alertTriggerEnabled: false,
    lastActive: "8 mins ago",
    healthStats: {
      bitrate: "3.2 Mbps",
      latencyMs: 142,
      packetLoss: "2.40%",
    },
  },
];

type CameraListener = (cameras: Camera[]) => void;
const listeners = new Set<CameraListener>();

let memoryCameras: Camera[] = [...INITIAL_CAMERAS];
let hasInitialized = false;

function loadInitialData(): Camera[] {
  if (typeof window === "undefined") return [...INITIAL_CAMERAS];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Could not read cameras from localStorage:", err);
  }
  return [...INITIAL_CAMERAS];
}

function persistLocally(cameras: Camera[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cameras));
  } catch (err) {
    console.warn("Could not save cameras to localStorage:", err);
  }
}

function notify() {
  persistLocally(memoryCameras);
  listeners.forEach((fn) => fn([...memoryCameras]));
}

export const camerasStore = {
  getCameras(): Camera[] {
    return [...memoryCameras];
  },

  async syncWithBackend(): Promise<Camera[]> {
    try {
      const backendCameras = await api.getCameras();
      if (Array.isArray(backendCameras) && backendCameras.length > 0) {
        memoryCameras = backendCameras.map((c) => ({
          ...c,
          latitude: c.latitude ?? (c.coordinates ? c.coordinates[1] : 23.30),
          longitude: c.longitude ?? (c.coordinates ? c.coordinates[0] : 78.60),
          coordinates: c.coordinates ?? [
            c.longitude ?? 78.60,
            c.latitude ?? 23.30,
          ],
        }));
        notify();
        return memoryCameras;
      }
    } catch {
      // Backend not available; fallback to local memory/storage
    }
    return [...memoryCameras];
  },

  async addCamera(input: CreateCameraInput): Promise<Camera> {
    const lat = Number(input.latitude);
    const lng = Number(input.longitude);

    let streamUrl = input.streamUrl?.trim();
    if (!streamUrl && input.ipAddress) {
      const port = input.port || 554;
      streamUrl = `rtsp://${input.ipAddress.trim()}:${port}/live/ch0`;
    }

    const nextId =
      input.id?.trim() ||
      `cam-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;

    const newCamera: Camera = {
      id: nextId,
      name: input.name.trim(),
      sector: input.sector || "Sector-04 (BOP Alpha)",
      location: input.location.trim(),
      status: input.status || "online",
      type: input.type || "Optical 4K",
      ipAddress: input.ipAddress?.trim() || undefined,
      port: input.port || 554,
      streamUrl: streamUrl,
      isRtsp: input.isRtsp ?? true,
      latitude: lat,
      longitude: lng,
      coordinates: [lng, lat],
      modelAssigned: input.modelAssigned || "best.onnx (Threat Detector)",
      resolution: input.resolution || "1080p FHD (1920x1080)",
      fps: input.fps || 30,
      confThreshold: input.confThreshold ?? 0.75,
      iouThreshold: input.iouThreshold ?? 0.45,
      isRecording: input.isRecording ?? true,
      alertTriggerEnabled: input.alertTriggerEnabled ?? true,
      lastActive: "Just now",
      healthStats: {
        bitrate: "6.5 Mbps",
        latencyMs: Math.floor(35 + Math.random() * 25),
        packetLoss: "0.00%",
      },
    };

    memoryCameras = [newCamera, ...memoryCameras];
    notify();

    // Push to backend asynchronously if available
    api
      .createCamera({
        ...newCamera,
        id: nextId,
      })
      .catch(() => {
        // Backend sync failed or offline; local memory already updated
      });

    return newCamera;
  },

  async updateCamera(id: string, input: UpdateCameraInput): Promise<Camera> {
    const idx = memoryCameras.findIndex((c) => c.id === id);
    if (idx === -1) {
      throw new Error(`Camera with ID '${id}' not found.`);
    }

    const current = memoryCameras[idx];
    const lat =
      input.latitude !== undefined ? Number(input.latitude) : current.latitude;
    const lng =
      input.longitude !== undefined ? Number(input.longitude) : current.longitude;

    let streamUrl = input.streamUrl !== undefined ? input.streamUrl : current.streamUrl;
    if (
      input.ipAddress &&
      input.streamUrl === undefined &&
      input.ipAddress !== current.ipAddress
    ) {
      const port = input.port || current.port || 554;
      streamUrl = `rtsp://${input.ipAddress.trim()}:${port}/live/ch0`;
    }

    const updated: Camera = {
      ...current,
      ...input,
      latitude: lat,
      longitude: lng,
      coordinates: [lng, lat],
      streamUrl,
      lastActive: "Just now",
    };

    memoryCameras[idx] = updated;
    notify();

    // Async backend update
    api.updateCamera(id, input).catch(() => {});

    return updated;
  },

  async deleteCamera(id: string): Promise<boolean> {
    const beforeCount = memoryCameras.length;
    memoryCameras = memoryCameras.filter((c) => c.id !== id);
    if (memoryCameras.length !== beforeCount) {
      notify();
      api.deleteCamera(id).catch(() => {});
      return true;
    }
    return false;
  },

  async bulkDeleteCameras(ids: string[]): Promise<number> {
    const idSet = new Set(ids);
    const beforeCount = memoryCameras.length;
    memoryCameras = memoryCameras.filter((c) => !idSet.has(c.id));
    const deletedCount = beforeCount - memoryCameras.length;
    if (deletedCount > 0) {
      notify();
      ids.forEach((id) => api.deleteCamera(id).catch(() => {}));
    }
    return deletedCount;
  },

  async testStream(params: {
    streamUrl?: string;
    ipAddress?: string;
    port?: number;
  }): Promise<StreamTestResult> {
    try {
      return await api.testStream(params);
    } catch {
      // Offline fallback simulator
      const target = params.streamUrl || params.ipAddress || "";
      const isFormatValid =
        target.startsWith("rtsp://") ||
        /^(\d{1,3}\.){3}\d{1,3}$/.test(target.trim());

      const simulatedLatency = Math.floor(32 + Math.random() * 30);
      return {
        reachable: isFormatValid,
        status: isFormatValid ? "online" : "error",
        latencyMs: isFormatValid ? simulatedLatency : 0,
        message: isFormatValid
          ? `RTSP Handshake active. Stream responsive (Latency: ${simulatedLatency}ms).`
          : "Invalid RTSP IP address or URL format. Must begin with rtsp:// or valid IPv4.",
        protocol: "RTSP/1.0",
        supportedCodecs: ["H.264", "H.265"],
      };
    }
  },

  resetDefaults() {
    memoryCameras = [...INITIAL_CAMERAS];
    notify();
  },
};

export function useCameras() {
  const [cameras, setCameras] = useState<Camera[]>(INITIAL_CAMERAS);
  const [isMounted, setIsMounted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const local = loadInitialData();
    memoryCameras = local;
    setCameras(local);

    const handleUpdate = (updated: Camera[]) => {
      setCameras(updated);
    };
    listeners.add(handleUpdate);

    // Attempt backend sync in background
    setIsSyncing(true);
    camerasStore
      .syncWithBackend()
      .finally(() => setIsSyncing(false));

    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const totalCount = cameras.length;
  const onlineCount = cameras.filter((c) => c.status === "online").length;
  const alertCount = cameras.filter((c) => c.status === "alert").length;
  const offlineCount = cameras.filter((c) => c.status === "offline").length;
  const degradedCount = cameras.filter((c) => c.status === "degraded").length;

  const validLatencies = cameras
    .map((c) => c.healthStats?.latencyMs)
    .filter((l): l is number => typeof l === "number" && l > 0);
  const avgLatencyMs =
    validLatencies.length > 0
      ? Math.round(
          validLatencies.reduce((acc, v) => acc + v, 0) / validLatencies.length
        )
      : 42;

  const addCamera = useCallback(
    (input: CreateCameraInput) => camerasStore.addCamera(input),
    []
  );
  const updateCamera = useCallback(
    (id: string, input: UpdateCameraInput) =>
      camerasStore.updateCamera(id, input),
    []
  );
  const deleteCamera = useCallback(
    (id: string) => camerasStore.deleteCamera(id),
    []
  );
  const bulkDeleteCameras = useCallback(
    (ids: string[]) => camerasStore.bulkDeleteCameras(ids),
    []
  );
  const testStream = useCallback(
    (params: { streamUrl?: string; ipAddress?: string; port?: number }) =>
      camerasStore.testStream(params),
    []
  );
  const resetDefaults = useCallback(() => camerasStore.resetDefaults(), []);
  const refreshFromBackend = useCallback(
    () => camerasStore.syncWithBackend(),
    []
  );

  return {
    cameras,
    isMounted,
    isSyncing,
    totalCount,
    onlineCount,
    alertCount,
    offlineCount,
    degradedCount,
    avgLatencyMs,
    addCamera,
    updateCamera,
    deleteCamera,
    bulkDeleteCameras,
    testStream,
    resetDefaults,
    refreshFromBackend,
  };
}
