"use client";

import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Sliders,
  Bell,
  Radio,
  Play,
  Square,
  RefreshCw,
  Activity,
  Cpu,
  ShieldCheck,
  Camera,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { ScannerStatus } from "@/types/alert";

export default function SettingsPage() {
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus | null>(null);
  const [scannerToggling, setScannerToggling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchScannerStatus = async () => {
    try {
      const st = await api.getScannerStatus();
      setScannerStatus(st);
      setErrorMessage(null);
    } catch (err: unknown) {
      // Backend scanner not yet responding or offline
    }
  };

  useEffect(() => {
    fetchScannerStatus();
    const interval = setInterval(fetchScannerStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleScanner = async () => {
    if (scannerToggling) return;
    setScannerToggling(true);
    setErrorMessage(null);
    try {
      if (scannerStatus?.running) {
        await api.stopScanner();
      } else {
        await api.startScanner();
      }
      await fetchScannerStatus();
    } catch (err: unknown) {
      console.error("Failed to toggle continuous scanner", err);
      setErrorMessage("Failed to toggle scanner daemon. Ensure backend service is reachable.");
    } finally {
      setScannerToggling(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchScannerStatus();
    setRefreshing(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#143724] text-white flex items-center justify-center shadow-xs">
            <SettingsIcon className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              System Settings
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
              Surveillance parameters, continuous background daemons, and inference thresholds.
            </p>
          </div>
        </div>

        <button
          onClick={handleManualRefresh}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          title="Refresh Settings & Status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Autonomous Continuous Multi-Feed Suspect Scanner Banner & Control */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl p-5 shadow-sm border border-slate-700 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-lg flex items-center justify-center border ${
                scannerStatus?.running
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                  : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
            >
              <Radio className={`w-5 h-5 ${scannerStatus?.running ? "animate-spin" : ""}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold tracking-wide">
                  Continuous Multi-Feed Suspect Scanner
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                    scannerStatus?.running
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-slate-700 text-slate-300 border border-slate-600"
                  }`}
                >
                  {scannerStatus?.running ? "ACTIVE DAEMON" : "PAUSED"}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-1">
                {scannerStatus?.running
                  ? `Scanning ${scannerStatus.worker_count} active feeds • ${scannerStatus.total_scans} checks • ${scannerStatus.suspect_detections} suspect matches`
                  : "Scanner is idle. Start scanner to continuously monitor feeds against enrolled suspects."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={handleToggleScanner}
              disabled={scannerToggling}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer ${
                scannerStatus?.running
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              } disabled:opacity-50`}
            >
              {scannerToggling ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Updating...
                </>
              ) : scannerStatus?.running ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" /> Stop Scanner
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" /> Start Scanner
                </>
              )}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Telemetry Breakdown Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-700/60 text-xs">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
            <div className="text-slate-400 text-[11px] font-medium flex items-center gap-1.5 mb-1">
              <Camera className="w-3 h-3 text-slate-400" />
              Active Feed Workers
            </div>
            <div className="font-semibold text-white font-mono text-sm">
              {scannerStatus?.worker_count ?? 0} Feeds
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
            <div className="text-slate-400 text-[11px] font-medium flex items-center gap-1.5 mb-1">
              <Activity className="w-3 h-3 text-slate-400" />
              Total Scans
            </div>
            <div className="font-semibold text-white font-mono text-sm">
              {scannerStatus?.total_scans ?? 0} Cycles
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
            <div className="text-slate-400 text-[11px] font-medium flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Suspect Detections
            </div>
            <div className="font-semibold text-white font-mono text-sm">
              {scannerStatus?.suspect_detections ?? 0} Hits
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
            <div className="text-slate-400 text-[11px] font-medium flex items-center gap-1.5 mb-1">
              <Clock className="w-3 h-3 text-slate-400" />
              Scan Cadence
            </div>
            <div className="font-semibold text-white font-mono text-sm">
              {scannerStatus?.sampling_interval_sec ?? 2.0}s / {scannerStatus?.debounce_cooldown_sec ?? 30}s
            </div>
          </div>
        </div>

        {/* Monitored Camera List if Available */}
        {scannerStatus?.active_camera_ids && scannerStatus.active_camera_ids.length > 0 && (
          <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-slate-400" />
              Monitored Cameras:
            </span>
            {scannerStatus.active_camera_ids.map((camId) => (
              <span
                key={camId}
                className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-300 font-mono text-[11px]"
              >
                {camId}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Additional Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <Sliders className="w-4 h-4 text-emerald-700" />
            <span>Detection Sensitivity</span>
          </div>
          <p className="text-xs text-slate-500">
            Set confidence score cutoff for human and vehicle classification triggers.
          </p>
          <div className="pt-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Minimum Confidence Threshold: 75%
            </label>
            <input
              type="range"
              min="50"
              max="95"
              defaultValue="75"
              className="w-full accent-emerald-700 cursor-pointer"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <Bell className="w-4 h-4 text-amber-600" />
            <span>Tactical Alerts</span>
          </div>
          <p className="text-xs text-slate-500">
            Automated siren and notification triggers on high-severity geofence breaches.
          </p>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-medium text-slate-700">Audio Alarm on High Priority</span>
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-emerald-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
