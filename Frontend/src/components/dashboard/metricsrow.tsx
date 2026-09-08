import {
  Camera,
  AlertTriangle,
  Users,
  Car,
  Wifi,
} from "lucide-react";
import { MetricCard } from "./metriccard";

export function MetricsRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* 1. 12 — Active Cameras */}
      <MetricCard
        icon={Camera}
        value="12"
        label="Active Cameras"
        isAlert={false}
      />

      {/* 2. 3 — Active Alerts (subtle pale-red background) */}
      <MetricCard
        icon={AlertTriangle}
        value="3"
        label="Active Alerts"
        isAlert={true}
      />

      {/* 3. 18 — People Detected */}
      <MetricCard
        icon={Users}
        value="18"
        label="People Detected"
        isAlert={false}
      />

      {/* 4. 7 — Vehicles Detected */}
      <MetricCard
        icon={Car}
        value="7"
        label="Vehicles Detected"
        isAlert={false}
      />

      {/* 5. Online — BOP Connectivity */}
      <MetricCard
        icon={Wifi}
        value="Online"
        label="BOP Connectivity"
        isAlert={false}
      />
    </div>
  );
}

export default MetricsRow;
