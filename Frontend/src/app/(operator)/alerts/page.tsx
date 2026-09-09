"use client";

import { useState } from "react";
import { useAlerts } from "@/lib/alertsStore";
import { AlertSeverity } from "@/types/alert";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCheck,
  Filter,
  Search,
  Check,
  RefreshCw,
  BellRing,
} from "lucide-react";

export default function AlertsPage() {
  const { alerts, unacknowledgedCount, highSeverityCount, acknowledgeAlert } =
    useAlerts();

  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "All">(
    "All"
  );
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Acknowledged">(
    "All"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAlerts = alerts.filter((alert) => {
    if (severityFilter !== "All" && alert.severity !== severityFilter) {
      return false;
    }
    if (statusFilter === "Pending" && alert.acknowledged) return false;
    if (statusFilter === "Acknowledged" && !alert.acknowledged) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = alert.title.toLowerCase().includes(q);
      const matchLoc = alert.location.toLowerCase().includes(q);
      const matchClass = alert.className?.toLowerCase().includes(q);
      if (!matchTitle && !matchLoc && !matchClass) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1c2022] flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-emerald-800" />
            Tactical Alert Command
          </h1>
          <p className="text-xs md:text-sm font-medium text-slate-500 mt-0.5">
            Real-time security triggers, automated geofence breaches, and AI detections.
          </p>
        </div>

        {/* Quick Stats Banner */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200/80 text-xs flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span className="font-semibold text-rose-800">
              {highSeverityCount} High Priority
            </span>
          </div>
          <div className="px-3.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200/80 text-xs flex items-center gap-2">
            <BellRing className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-semibold text-amber-800">
              {unacknowledgedCount} Unacknowledged
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search alerts, cameras, objects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
          />
        </div>

        {/* Severity Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Severity:
          </span>
          {(["All", "High", "Medium", "Low"] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                severityFilter === sev
                  ? "bg-[#1c5436] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {(["All", "Pending", "Acknowledged"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === st
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Alert List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">
            Recorded Threat Stream ({filteredAlerts.length})
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Auto-synchronized with Edge Inference
          </span>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium">No matching alerts found</p>
            <p className="text-xs text-slate-400 mt-1">
              Adjust filters or run an inference session to register new security triggers.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  alert.acknowledged
                    ? "bg-slate-50/50 opacity-75"
                    : "hover:bg-slate-50"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        alert.severity === "High"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : alert.severity === "Medium"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {alert.title}
                    </h3>
                    {alert.acknowledged && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCheck className="w-3 h-3" /> Acknowledged
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">
                      {alert.location}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-400">
                      {alert.time}
                    </span>
                    {alert.className && (
                      <>
                        <span>•</span>
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          Class: {alert.className}
                        </span>
                      </>
                    )}
                    {alert.confidence && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium">
                          Confidence: {Math.round(alert.confidence * 100)}%
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!alert.acknowledged ? (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Acknowledge
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">
                      Resolved
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
