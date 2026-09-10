"use client";

import { useState } from "react";
import { useAlerts } from "@/lib/alertsStore";
import { AlertItem } from "@/types/alert";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { formatConfidence } from "@/lib/utils";
import {
  ShieldAlert,
  Radio,
  Eye,
  MapPin,
  X,
  Send,
  Check,
} from "lucide-react";

export function TacticalThreatToast() {
  const { alerts, acknowledgeAlert } = useAlerts();
  const router = useRouter();

  // Track toasts that have been dismissed by the operator in this browser session
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [dispatchingAlertId, setDispatchingAlertId] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState("QRT Alpha-1");
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  // Find unacknowledged suspect alerts that haven't been dismissed, deduplicated by suspect identity
  const activeSuspectAlerts: AlertItem[] = [];
  const seenSuspects = new Set<string>();

  for (const alert of alerts) {
    if (
      !alert.acknowledged &&
      (Boolean(alert.suspectName) || alert.className === "suspect") &&
      !dismissedIds.has(alert.id)
    ) {
      const suspectKey = (alert.suspectName || alert.title).trim().toLowerCase();
      if (!seenSuspects.has(suspectKey)) {
        seenSuspects.add(suspectKey);
        activeSuspectAlerts.push(alert);
        if (activeSuspectAlerts.length >= 2) break; // Show at most 2 distinct suspect banners
      }
    }
  }

  const handleDismiss = (id: string, suspectName?: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      if (suspectName) {
        alerts
          .filter((a) => a.suspectName?.toLowerCase() === suspectName.toLowerCase())
          .forEach((a) => next.add(a.id));
      }
      return next;
    });
  };

  const handleAcknowledge = (id: string, suspectName?: string) => {
    handleDismiss(id, suspectName);
    acknowledgeAlert(id);
    if (suspectName) {
      alerts
        .filter(
          (a) =>
            !a.acknowledged &&
            a.suspectName?.toLowerCase() === suspectName.toLowerCase() &&
            a.id !== id
        )
        .forEach((a) => acknowledgeAlert(a.id));
    }
  };

  const handleQuickDispatch = async (alertId: string) => {
    try {
      await api.dispatchQrt(alertId, selectedUnit, "Urgent intercept response via Tactical HUD");
      setDispatchSuccess(alertId);
      setTimeout(() => {
        setDispatchingAlertId(null);
        setDispatchSuccess(null);
        handleDismiss(alertId);
      }, 1500);
    } catch (err) {
      console.error("Failed to dispatch QRT", err);
    }
  };

  if (activeSuspectAlerts.length === 0) return null;

  const backendBase =
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000";

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {activeSuspectAlerts.map((alert) => {
        const snapshotUrl = alert.snapshotUrl
          ? alert.snapshotUrl.startsWith("http")
            ? alert.snapshotUrl
            : `${backendBase}${alert.snapshotUrl}`
          : null;

        const isDispatching = dispatchingAlertId === alert.id;

        return (
          <div
            key={alert.id}
            className="pointer-events-auto bg-white/98 backdrop-blur-md text-slate-900 rounded-2xl border border-rose-200 shadow-2xl shadow-rose-950/15 p-4 animate-in slide-in-from-right-8 duration-300 ring-1 ring-rose-500/20 relative overflow-hidden"
          >
            {/* Tactical top beacon line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500" />

            {/* Header pill */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[10px] font-extrabold uppercase tracking-wider text-rose-700 font-mono">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  SUSPECT SIGHTING
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white uppercase tracking-wider font-mono">
                  {alert.threatLevel || "CRITICAL"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDismiss(alert.id, alert.suspectName)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Content */}
            <div className="py-3 flex items-start gap-3.5">
              {snapshotUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={snapshotUrl}
                  alt={alert.suspectName || "Suspect"}
                  className="w-14 h-14 rounded-xl object-cover border border-rose-200 shrink-0 bg-slate-100 shadow-2xs"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0 text-rose-600 shadow-2xs">
                  <ShieldAlert className="w-7 h-7" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-extrabold text-slate-900 tracking-tight truncate">
                  {alert.suspectName || alert.title}
                </h4>
                <p className="text-xs text-slate-600 font-medium truncate mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  {alert.location}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px] font-mono">
                  <span className="text-slate-400">{alert.time}</span>
                  {alert.confidence && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {formatConfidence(alert.confidence)} match
                      </span>
                    </>
                  )}
                  {alert.category && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 truncate">
                        {alert.category}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Dispatch Drawer if opened */}
            {isDispatching ? (
              <div className="mt-2 pt-2.5 border-t border-slate-100 space-y-2 animate-in fade-in duration-150 bg-rose-50/40 p-2.5 rounded-xl border border-rose-100">
                <div className="text-[11px] font-bold text-rose-800 flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-rose-600 animate-spin" /> Deploy Quick Reaction Team (QRT):
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 text-slate-800 flex-1 focus:outline-none focus:ring-1 focus:ring-rose-500 shadow-2xs font-medium"
                  >
                    <option value="QRT Alpha-1">QRT Alpha-1 (Sector BOP Alpha)</option>
                    <option value="QRT Bravo-2">QRT Bravo-2 (Octroi Gate)</option>
                    <option value="QRT Charlie-3">QRT Charlie-3 (Riverine Island)</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleQuickDispatch(alert.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1e4b38] hover:bg-[#163a2b] text-white flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
                  >
                    {dispatchSuccess === alert.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Dispatched!
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" /> Dispatch
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Actions Bar */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    handleDismiss(alert.id, alert.suspectName);
                    router.push(`/live?camera=${alert.cameraId || ""}`);
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-700" /> Live Feed
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDismiss(alert.id, alert.suspectName);
                    router.push(`/gis-map?focus=${alert.cameraId || ""}`);
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-600" /> GIS Map
                </button>
                {!isDispatching && (
                  <button
                    type="button"
                    onClick={() => setDispatchingAlertId(alert.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1e4b38] hover:bg-[#163a2b] text-white flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Send className="w-3 h-3" /> QRT
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleAcknowledge(alert.id, alert.suspectName)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 hover:bg-emerald-50 border border-emerald-200/80 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Ack
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TacticalThreatToast;
