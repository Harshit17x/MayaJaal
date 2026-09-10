"use client";

import { useState, useEffect } from "react";
import { useAlerts } from "@/lib/alertsStore";
import { AlertItem } from "@/types/alert";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Radio,
  Eye,
  MapPin,
  X,
  Send,
  Check,
  AlertTriangle,
} from "lucide-react";

export function TacticalThreatToast() {
  const { alerts, acknowledgeAlert } = useAlerts();
  const router = useRouter();

  // Track toasts that have been dismissed by the operator in this browser session
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [dispatchingAlertId, setDispatchingAlertId] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState("QRT Alpha-1");
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  // Find unacknowledged suspect alerts that haven't been dismissed
  const activeSuspectAlerts = alerts
    .filter(
      (a) =>
        !a.acknowledged &&
        (Boolean(a.suspectName) || a.className === "suspect") &&
        !dismissedIds.has(a.id)
    )
    .slice(0, 2); // Show at most 2 concurrent toast banners

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  const handleAcknowledge = (id: string) => {
    handleDismiss(id);
    acknowledgeAlert(id);
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
            className="pointer-events-auto bg-slate-950/95 backdrop-blur-md text-white rounded-2xl border-2 border-rose-600/90 shadow-2xl p-4 animate-in slide-in-from-right-8 duration-300 ring-4 ring-rose-950/40"
          >
            {/* Header pill */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span className="text-[11px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5 font-mono">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  SUSPECT SIGHTING • {alert.threatLevel || "CRITICAL"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDismiss(alert.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
                  className="w-16 h-16 rounded-xl object-cover border-2 border-rose-500/70 shrink-0 bg-black"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-rose-950/60 border border-rose-800 flex items-center justify-center shrink-0 text-rose-400">
                  <ShieldAlert className="w-8 h-8" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-black text-white tracking-wide truncate">
                  {alert.suspectName || alert.title}
                </h4>
                <p className="text-xs text-rose-200/80 font-medium truncate mt-0.5">
                  {alert.location}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400 font-mono">
                  <span>{alert.time}</span>
                  {alert.confidence && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">
                        {Math.round(alert.confidence * 100)}% match
                      </span>
                    </>
                  )}
                  {alert.category && (
                    <>
                      <span>•</span>
                      <span className="text-rose-300 truncate">{alert.category}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Dispatch Drawer if opened */}
            {isDispatching ? (
              <div className="mt-2 pt-2.5 border-t border-slate-800 space-y-2 animate-in fade-in duration-150">
                <div className="text-[11px] font-semibold text-rose-300 flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-rose-400 animate-spin" /> Deploy Quick Reaction Team (QRT):
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-white flex-1 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="QRT Alpha-1">QRT Alpha-1 (Sector BOP Alpha)</option>
                    <option value="QRT Bravo-2">QRT Bravo-2 (Octroi Gate)</option>
                    <option value="QRT Charlie-3">QRT Charlie-3 (Riverine Island)</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleQuickDispatch(alert.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1 transition-colors"
                  >
                    {dispatchSuccess === alert.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Dispatched!
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
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    handleDismiss(alert.id);
                    router.push(`/live?camera=${alert.cameraId || ""}`);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3 h-3 text-emerald-400" /> Live Feed
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDismiss(alert.id);
                    router.push(`/gis-map?focus=${alert.cameraId || ""}`);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition-colors"
                >
                  <MapPin className="w-3 h-3 text-rose-400" /> GIS Map
                </button>
                {!isDispatching && (
                  <button
                    type="button"
                    onClick={() => setDispatchingAlertId(alert.id)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-200 flex items-center gap-1 transition-colors"
                  >
                    <Send className="w-3 h-3" /> QRT
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleAcknowledge(alert.id)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-400 hover:bg-emerald-950/40 transition-colors flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Ack
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
