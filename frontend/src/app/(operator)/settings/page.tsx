"use client";

import { Settings as SettingsIcon, Sliders, Bell, Lock, Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200/80">
        <div className="w-10 h-10 rounded-xl bg-[#143724] text-white flex items-center justify-center shadow-xs">
          <SettingsIcon className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            System Settings
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
            Surveillance parameters, ONNX inference thresholds, and outpost notifications.
          </p>
        </div>
      </div>

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
