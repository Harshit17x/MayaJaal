"use client";

import { useState, useEffect } from "react";
import { AlertItem, AlertSeverity } from "@/types/alert";

const INITIAL_ALERTS: AlertItem[] = [
  {
    id: "alert-1",
    title: "Person Crossing Geofence",
    location: "Camera 02 — Eastern Gate",
    time: "2 mins ago",
    timestamp: Date.now() - 2 * 60 * 1000,
    severity: "High",
    className: "person",
    confidence: 0.94,
    cameraName: "Camera 02",
    acknowledged: false,
  },
  {
    id: "alert-2",
    title: "Vehicle at Unauthorised Hour",
    location: "Camera 01 — North Perimeter",
    time: "14 mins ago",
    timestamp: Date.now() - 14 * 60 * 1000,
    severity: "Medium",
    className: "car",
    confidence: 0.88,
    cameraName: "Camera 01",
    acknowledged: false,
  },
  {
    id: "alert-3",
    title: "Group Movement Detected",
    location: "Camera 04 — Southern Trail",
    time: "28 mins ago",
    timestamp: Date.now() - 28 * 60 * 1000,
    severity: "Medium",
    className: "person",
    confidence: 0.82,
    cameraName: "Camera 04",
    acknowledged: false,
  },
  {
    id: "alert-4",
    title: "Suspicious Loitering",
    location: "Camera 03 — Watch Tower",
    time: "45 mins ago",
    timestamp: Date.now() - 45 * 60 * 1000,
    severity: "Low",
    className: "person",
    confidence: 0.76,
    cameraName: "Camera 03",
    acknowledged: true,
  },
];

type AlertListener = (alerts: AlertItem[]) => void;
const listeners = new Set<AlertListener>();

let memoryAlerts: AlertItem[] = [...INITIAL_ALERTS];

function notify() {
  listeners.forEach((listener) => listener([...memoryAlerts]));
}

export const alertsStore = {
  getAlerts(): AlertItem[] {
    return memoryAlerts;
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

  acknowledgeAlert(id: string) {
    memoryAlerts = memoryAlerts.map((a) =>
      a.id === id ? { ...a, acknowledged: true } : a
    );
    notify();
  },

  clearAll() {
    memoryAlerts = [];
    notify();
  },

  resetDefaults() {
    memoryAlerts = [...INITIAL_ALERTS];
    notify();
  },
};

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>(memoryAlerts);

  useEffect(() => {
    const handleUpdate = (updated: AlertItem[]) => setAlerts(updated);
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const unacknowledged = alerts.filter((a) => !a.acknowledged);
  const peopleCount = alerts.filter(
    (a) => a.className?.toLowerCase() === "person"
  ).length;
  const vehicleCount = alerts.filter((a) =>
    ["car", "truck", "bus", "motorcycle"].includes(
      a.className?.toLowerCase() || ""
    )
  ).length;

  return {
    alerts,
    unacknowledgedCount: unacknowledged.length,
    highSeverityCount: alerts.filter((a) => a.severity === "High").length,
    peopleCount,
    vehicleCount,
    addAlert: alertsStore.addAlert,
    acknowledgeAlert: alertsStore.acknowledgeAlert,
    clearAll: alertsStore.clearAll,
  };
}
