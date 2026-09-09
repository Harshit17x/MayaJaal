"use client";

import { Server, HardDrive, Wifi, Cpu, Layers } from "lucide-react";
import { useBackendStatus } from "@/lib/hooks/useBackendStatus";

export function SystemStatus() {
  const { isOnline, health, inferenceStatus, loadedModels, activeSlots, maxSlots } =
    useBackendStatus(8000);

  const statusItems = [
    {
      label: "Edge Server",
      value: isOnline ? "Healthy (v" + (health?.version || "1.0.0") + ")" : "Offline / Unreachable",
      isGreen: isOnline,
      icon: Server,
    },
    {
      label: "Inference Engine",
      value: isOnline
        ? `${health?.gpu_available ? "CUDA Accelerated" : "CPU"} (${activeSlots}/${maxSlots} slots)`
        : "Engine Inactive",
      isGreen: isOnline,
      icon: Cpu,
    },
    {
      label: "Network / Gateway",
      value: isOnline ? "Online (REST API Active)" : "Backend Disconnected",
      isGreen: isOnline,
      icon: Wifi,
    },
    {
      label: "Active AI Models",
      value: isOnline
        ? loadedModels.length > 0
          ? `${loadedModels.length} Loaded (${loadedModels.join(", ")})`
          : "0 Loaded (Ready to load)"
        : "Models Offline",
      isGreen: isOnline && loadedModels.length > 0,
      icon: Layers,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5">
      {/* Title with live subtitle */}
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-base font-semibold text-slate-900">
          System & Hardware Status
        </h2>
        <span className="text-xs text-slate-500 font-mono">
          SIH26187 Edge Node
        </span>
      </div>

      {/* 4 Compact Status Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {statusItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/60 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs text-slate-500 font-medium block truncate">
                    {item.label}
                  </span>
                  <span className="text-sm font-semibold text-slate-800 block truncate" title={item.value}>
                    {item.value}
                  </span>
                </div>
              </div>

              {/* Status Dot / Indicator */}
              <div className="flex items-center flex-shrink-0">
                {item.isGreen ? (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                ) : (
                  <span className="inline-flex rounded-full h-2.5 w-2.5 bg-rose-400"></span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SystemStatus;
