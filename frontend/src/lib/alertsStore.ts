"use client";

import { useState, useEffect } from "react";
import { AlertItem, AlertSeverity } from "@/types/alert";

const INITIAL_ALERTS: AlertItem[] = [];

import { api } from "@/lib/api";

type AlertListener = (alerts: AlertItem[]) => void;
type ConnectionListener = (connected: boolean) => void;

const listeners = new Set<AlertListener>();
const connectionListeners = new Set<ConnectionListener>();

let memoryAlerts: AlertItem[] = [...INITIAL_ALERTS];
let wsClient: WebSocket | null = null;
let isConnected = false;
let initialized = false;

function notify() {
  listeners.forEach((listener) => listener([...memoryAlerts]));
}

function notifyConnection(status: boolean) {
  isConnected = status;
  connectionListeners.forEach((listener) => listener(status));
}

function getAlertsWsUrl(): string {
  if (typeof window === "undefined") return "ws://localhost:8000/api/alerts/ws";
  const httpUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
    `${window.location.protocol}//${window.location.hostname}:8000`;
  const wsProto = httpUrl.startsWith("https") ? "wss" : "ws";
  const host = httpUrl.replace(/^https?:\/\//, "");
  return `${wsProto}://${host}/api/alerts/ws`;
}

function playAlertChime(threatLevel?: string) {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const isUrgent = threatLevel === "CRITICAL" || threatLevel === "HIGH";
    osc.type = isUrgent ? "sawtooth" : "sine";
    osc.frequency.setValueAtTime(isUrgent ? 880 : 587, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(isUrgent ? 440 : 293, ctx.currentTime + 0.28);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // AudioContext blocked until operator interaction
  }
}

function initWebSocket() {
  if (typeof window === "undefined") return;
  if (wsClient && (wsClient.readyState === WebSocket.OPEN || wsClient.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    const wsUrl = getAlertsWsUrl();
    wsClient = new WebSocket(wsUrl);

    wsClient.onopen = () => {
      notifyConnection(true);
    };

    wsClient.onmessage = (evt) => {
      try {
        const payload = JSON.parse(evt.data);
        if (payload.type === "NEW_ALERT" && payload.alert) {
          const incoming = payload.alert as AlertItem;
          // Avoid duplicate by ID
          const existingIdx = memoryAlerts.findIndex((a) => a.id === incoming.id);
          if (existingIdx === -1) {
            memoryAlerts = [incoming, ...memoryAlerts];
            playAlertChime(incoming.threatLevel || (incoming.severity as string));
            notify();
          }
        } else if (payload.type === "ACKNOWLEDGE_ALERT" && payload.alertId) {
          memoryAlerts = memoryAlerts.map((a) =>
            a.id === payload.alertId ? { ...a, acknowledged: true } : a
          );
          notify();
        } else if (payload.type === "CLEAR_ALERTS") {
          memoryAlerts = [];
          notify();
        }
      } catch (err) {
        console.debug("Failed to parse alerts WebSocket payload", err);
      }
    };

    wsClient.onclose = () => {
      notifyConnection(false);
      wsClient = null;
      // Auto-reconnect after 3 seconds
      setTimeout(initWebSocket, 3000);
    };

    wsClient.onerror = () => {
      notifyConnection(false);
    };
  } catch (err) {
    console.debug("Error initializing alerts WebSocket", err);
  }
}

async function syncWithBackend() {
  try {
    const backendAlerts = await api.getAlerts();
    if (Array.isArray(backendAlerts)) {
      memoryAlerts = backendAlerts;
      notify();
    }
  } catch (err) {
    console.debug("Could not fetch alerts from backend, using current memory", err);
  }
}

export const alertsStore = {
  getAlerts(): AlertItem[] {
    return memoryAlerts;
  },

  isConnected(): boolean {
    return isConnected;
  },

  async refresh() {
    await syncWithBackend();
  },

  addAlert(alert: Omit<AlertItem, "id" | "time" | "timestamp" | "acknowledged"> & Partial<AlertItem>): AlertItem {
    const newAlert: AlertItem = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      time: "Just now",
      timestamp: Date.now(),
      acknowledged: false,
      ...alert,
    };

    memoryAlerts = [newAlert, ...memoryAlerts];
    notify();
    return newAlert;
  },

  async acknowledgeAlert(id: string) {
    memoryAlerts = memoryAlerts.map((a) =>
      a.id === id ? { ...a, acknowledged: true } : a
    );
    notify();

    try {
      await api.acknowledgeAlert(id);
    } catch (err) {
      console.debug("Error acknowledging alert on backend:", err);
    }
  },

  async clearAll() {
    memoryAlerts = [];
    notify();

    try {
      await api.clearAlerts();
    } catch (err) {
      console.debug("Error clearing alerts on backend:", err);
    }
  },

  resetDefaults() {
    memoryAlerts = [...INITIAL_ALERTS];
    notify();
  },
};

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>(memoryAlerts);
  const [connected, setConnected] = useState<boolean>(isConnected);

  useEffect(() => {
    if (!initialized && typeof window !== "undefined") {
      initialized = true;
      initWebSocket();
      syncWithBackend();
    }

    const handleUpdate = (updated: AlertItem[]) => setAlerts(updated);
    const handleConn = (status: boolean) => setConnected(status);

    listeners.add(handleUpdate);
    connectionListeners.add(handleConn);

    return () => {
      listeners.delete(handleUpdate);
      connectionListeners.delete(handleConn);
    };
  }, []);

  const unacknowledged = alerts.filter((a) => !a.acknowledged);
  const peopleCount = alerts.filter(
    (a) => a.className?.toLowerCase() === "person" || a.className?.toLowerCase() === "suspect"
  ).length;
  const vehicleCount = alerts.filter((a) =>
    ["car", "truck", "bus", "motorcycle"].includes(
      a.className?.toLowerCase() || ""
    )
  ).length;
  const suspectsCount = alerts.filter(
    (a) => Boolean(a.suspectName) || a.className?.toLowerCase() === "suspect"
  ).length;

  return {
    alerts,
    connected,
    unacknowledgedCount: unacknowledged.length,
    highSeverityCount: alerts.filter((a) => a.severity === "High").length,
    peopleCount,
    vehicleCount,
    suspectsCount,
    addAlert: alertsStore.addAlert,
    acknowledgeAlert: alertsStore.acknowledgeAlert,
    clearAll: alertsStore.clearAll,
    refresh: alertsStore.refresh,
  };
}
