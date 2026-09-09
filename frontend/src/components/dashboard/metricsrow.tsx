"use client";

import {
  Camera,
  AlertTriangle,
  Users,
  Car,
  Wifi,
} from "lucide-react";
import { MetricCard } from "./metriccard";
import { useAlerts } from "@/lib/alertsStore";
import { useBackendStatus } from "@/lib/hooks/useBackendStatus";

export function MetricsRow() {
  const { unacknowledgedCount, peopleCount, vehicleCount } = useAlerts();
  const { isOnline, latencyMs } = useBackendStatus();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* 1. Active Cameras */}
      <MetricCard
        icon={Camera}
        value="12"
        label="Active Cameras"
        isAlert={false}
      />

      {/* 2. Active Alerts (dynamic based on unacknowledged alerts) */}
      <MetricCard
        icon={AlertTriangle}
        value={unacknowledgedCount.toString()}
        label="Active Alerts"
        isAlert={unacknowledgedCount > 0}
      />

      {/* 3. People Detected */}
      <MetricCard
        icon={Users}
        value={(14 + peopleCount).toString()}
        label="People Detected"
        isAlert={false}
      />

      {/* 4. Vehicles Detected */}
      <MetricCard
        icon={Car}
        value={(5 + vehicleCount).toString()}
        label="Vehicles Detected"
        isAlert={false}
      />

      {/* 5. BOP Connectivity */}
      <MetricCard
        icon={Wifi}
        value={isOnline ? (latencyMs ? `${latencyMs}ms` : "Online") : "Offline"}
        label={isOnline ? "BOP Link Active" : "BOP Link Down"}
        isAlert={!isOnline}
      />
    </div>
  );
}

export default MetricsRow;
