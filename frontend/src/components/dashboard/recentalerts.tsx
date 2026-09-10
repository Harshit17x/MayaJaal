"use client";

import { useAlerts } from "@/lib/alertsStore";
import { AlertSeverity } from "@/types/alert";
import { Check, ShieldAlert } from "lucide-react";
import { formatConfidence } from "@/lib/utils";
import Link from "next/link";

function SeverityBadge({ severity, isSuspect }: { severity: AlertSeverity; isSuspect?: boolean }) {
  if (isSuspect) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white shadow-xs">
        🚨 Suspect
      </span>
    );
  }
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
  const { alerts, acknowledgeAlert } = useAlerts();

  // Display top 4 most recent alerts
  const displayAlerts = alerts.slice(0, 4);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between h-full min-h-[380px]">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-800" />
            <h2 className="text-base font-semibold text-slate-900">Recent Alerts</h2>
          </div>
          <Link
            href="/alerts"
            className="text-xs font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
          >
            View All ({alerts.length})
          </Link>
        </div>

        {/* Alert Rows */}
        <div className="divide-y divide-slate-100 mt-1">
          {displayAlerts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No active security alerts recorded.
            </div>
          ) : (
            displayAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`py-3 flex items-center justify-between gap-3 rounded-md px-1 transition-colors ${
                  alert.acknowledged
                    ? "opacity-60 bg-slate-50/40"
                    : "hover:bg-slate-50/70"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-800 truncate">
                      {alert.title}
                    </h3>
                    {alert.acknowledged && (
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                        Ack
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
                    <span>{alert.location}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-[11px]">{alert.time}</span>
                    {alert.confidence && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-emerald-700 font-medium font-mono text-[11px]">
                          {formatConfidence(alert.confidence)} conf
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <SeverityBadge
                    severity={alert.severity}
                    isSuspect={Boolean(alert.suspectName) || alert.className === "suspect"}
                  />
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      title="Acknowledge Alert"
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Autonomous Edge Dispatch</span>
        <span className="font-mono">SIH26187 Rules Engine</span>
      </div>
    </div>
  );
}

export default RecentAlerts;
