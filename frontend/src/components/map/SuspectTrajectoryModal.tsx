"use client";

import { useState, useEffect } from "react";
import { SuspectTrajectory, SuspectWaypoint } from "@/types/alert";
import { api } from "@/lib/api";
import {
  MapPin,
  Navigation,
  Clock,
  ShieldAlert,
  Send,
  X,
  Radio,
  ArrowDown,
  Check,
  Eye,
  Camera,
} from "lucide-react";

interface SuspectTrajectoryModalProps {
  suspectName: string;
  onClose: () => void;
  onFocusCoordinates?: (lat: number, lng: number) => void;
}

export function SuspectTrajectoryModal({
  suspectName,
  onClose,
  onFocusCoordinates,
}: SuspectTrajectoryModalProps) {
  const [trajectory, setTrajectory] = useState<SuspectTrajectory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // QRT dispatch state
  const [dispatchUnit, setDispatchUnit] = useState("QRT Strike Alpha-1");
  const [dispatching, setDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  useEffect(() => {
    async function loadTrajectory() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getSuspectTrajectory(suspectName);
        setTrajectory(data);
      } catch (err) {
        setError("Failed to load trajectory telemetry from backend.");
      } finally {
        setLoading(false);
      }
    }
    if (suspectName) {
      loadTrajectory();
    }
  }, [suspectName]);

  const handleDispatchQRT = async () => {
    if (!trajectory || trajectory.waypoints.length === 0) return;
    const latestWaypoint = trajectory.waypoints[trajectory.waypoints.length - 1];
    setDispatching(true);
    try {
      await api.dispatchQrt(
        latestWaypoint.alert_id,
        dispatchUnit,
        `Intercept dispatch for suspect ${suspectName} at ${latestWaypoint.location}`
      );
      setDispatchSuccess(true);
      setTimeout(() => setDispatchSuccess(false), 3000);
    } catch (err) {
      console.error("QRT dispatch failed", err);
    } finally {
      setDispatching(false);
    }
  };

  const backendBase =
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000";

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-white animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-700 flex items-center justify-center text-rose-400">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-wide">
                  Suspect Movement Trajectory
                </h3>
                {trajectory?.threat_level && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-700 text-white tracking-wider">
                    {trajectory.threat_level}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Target: <span className="text-rose-400 font-bold">{suspectName}</span>
                {trajectory?.category ? ` • ${trajectory.category}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry Stats Strip */}
        {trajectory && trajectory.found && (
          <div className="grid grid-cols-3 gap-2 px-5 py-3 bg-slate-900/60 border-b border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 font-mono text-[10px] uppercase block">
                Sightings Count
              </span>
              <span className="font-bold text-white text-sm">
                {trajectory.total_sightings} camera nodes
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-mono text-[10px] uppercase block">
                Total Path Distance
              </span>
              <span className="font-bold text-emerald-400 text-sm">
                {trajectory.total_distance_km} km
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-mono text-[10px] uppercase block">
                Last Known Outpost
              </span>
              <span className="font-bold text-rose-300 text-sm truncate block">
                {trajectory.last_location}
              </span>
            </div>
          </div>
        )}

        {/* Body / Waypoints Timeline */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Radio className="w-8 h-8 animate-spin text-rose-500" />
              <p className="text-xs font-mono">Reconstructing multi-camera timeline...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-200">
              {error}
            </div>
          ) : !trajectory || trajectory.waypoints.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-semibold">No recorded sightings yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Keep the Continuous Face Scanner active to log suspect sightings across camera feeds.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-700">
              {trajectory.waypoints.map((wp, idx) => {
                const isLast = idx === trajectory.waypoints.length - 1;
                const snapshotUrl = wp.snapshot_url
                  ? wp.snapshot_url.startsWith("http")
                    ? wp.snapshot_url
                    : `${backendBase}${wp.snapshot_url}`
                  : null;

                return (
                  <div key={wp.alert_id} className="relative group">
                    {/* Node Dot */}
                    <div
                      className={`absolute -left-[29px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                        isLast
                          ? "bg-rose-600 border-white text-white shadow-lg animate-pulse"
                          : "bg-slate-800 border-slate-600 text-slate-300"
                      }`}
                    >
                      {wp.step}
                    </div>

                    {/* Card */}
                    <div
                      className={`p-4 rounded-xl border transition-all ${
                        isLast
                          ? "bg-rose-950/30 border-rose-700/80 ring-1 ring-rose-500/30"
                          : "bg-slate-800/60 border-slate-700/60 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                              <Camera className="w-3 h-3" />
                              {wp.camera_name}
                            </span>
                            {isLast && (
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white tracking-wider uppercase">
                                Current Sighting
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-slate-200 mt-0.5">
                            {wp.location}
                          </h4>
                          <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-2">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {wp.time_str} • Conf: {Math.round(wp.confidence * 100)}%
                          </p>
                          {wp.delta_km > 0 && (
                            <p className="text-[11px] text-amber-300 font-mono mt-1 flex items-center gap-1">
                              <ArrowDown className="w-3 h-3" /> Transited {wp.delta_km} km in{" "}
                              {wp.elapsed_minutes} mins
                            </p>
                          )}
                        </div>

                        {/* Snapshot thumbnail if available */}
                        {snapshotUrl && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={snapshotUrl}
                            alt="Waypoint snapshot"
                            className="w-14 h-14 rounded-lg object-cover border border-slate-600 shrink-0 bg-black"
                          />
                        )}
                      </div>

                      {/* Waypoint Coordinates Action */}
                      <div className="mt-3 pt-2.5 border-t border-slate-700/50 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-mono text-[11px]">
                          GPS: {wp.latitude.toFixed(4)}, {wp.longitude.toFixed(4)}
                        </span>
                        {onFocusCoordinates && (
                          <button
                            type="button"
                            onClick={() => onFocusCoordinates(wp.latitude, wp.longitude)}
                            className="px-2.5 py-1 rounded-md bg-slate-700 hover:bg-emerald-700 text-slate-200 hover:text-white font-semibold flex items-center gap-1 transition-colors"
                          >
                            <MapPin className="w-3 h-3 text-rose-400" /> Focus on Map
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with QRT Deployment Action */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">
              Deploy Intercept Unit:
            </span>
            <select
              value={dispatchUnit}
              onChange={(e) => setDispatchUnit(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              <option value="QRT Strike Alpha-1">QRT Strike Alpha-1 (RS Pura Outpost)</option>
              <option value="QRT Strike Bravo-2">QRT Strike Bravo-2 (Suchetgarh Octroi)</option>
              <option value="QRT Charlie-3 Rapid">QRT Charlie-3 (Riverine Island Patrol)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleDispatchQRT}
            disabled={dispatching || !trajectory || trajectory.waypoints.length === 0}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-40"
          >
            {dispatchSuccess ? (
              <>
                <Check className="w-4 h-4" /> QRT Intercept Deployed!
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Deploy QRT Team Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
