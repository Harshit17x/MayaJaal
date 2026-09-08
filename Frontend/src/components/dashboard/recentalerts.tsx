interface AlertItem {
  id: string;
  title: string;
  location: string;
  time: string;
  severity: "High" | "Medium" | "Low";
}

const recentAlertsData: AlertItem[] = [
  {
    id: "alert-1",
    title: "Person Crossing Geofence",
    location: "Camera 02 — Eastern Gate",
    time: "2 mins ago",
    severity: "High",
  },
  {
    id: "alert-2",
    title: "Vehicle at Unauthorised Hour",
    location: "Camera 01 — North Perimeter",
    time: "14 mins ago",
    severity: "Medium",
  },
  {
    id: "alert-3",
    title: "Group Movement",
    location: "Camera 04 — Southern Trail",
    time: "28 mins ago",
    severity: "Medium",
  },
  {
    id: "alert-4",
    title: "Suspicious Loitering",
    location: "Camera 03 — Watch Tower",
    time: "45 mins ago",
    severity: "Low",
  },
];

function SeverityBadge({ severity }: { severity: "High" | "Medium" | "Low" }) {
  if (severity === "High") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        High
      </span>
    );
  }
  if (severity === "Medium") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        Medium
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      Low
    </span>
  );
}

export function RecentAlerts() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-900">Recent Alerts</h2>
        <span className="text-xs font-medium text-slate-500">Live Queue</span>
      </div>

      {/* Alert Rows */}
      <div className="divide-y divide-slate-100">
        {recentAlertsData.map((alert) => (
          <div
            key={alert.id}
            className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 rounded-md px-1 transition-colors"
          >
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-800 truncate">
                {alert.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
                <span>{alert.location}</span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-[11px]">{alert.time}</span>
              </p>
            </div>
            <div className="flex-shrink-0">
              <SeverityBadge severity={alert.severity} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentAlerts;
