"use client";

import { useBackendStatus } from "@/lib/hooks/useBackendStatus";
import { RefreshCw } from "lucide-react";

export function ConnectionStatus() {
  const { isOnline, isLoading, latencyMs, health, refetch } = useBackendStatus(6000);

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600">
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
        </span>
        <span className="font-medium">Connecting to AI Engine...</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-xs text-rose-700 shadow-xs">
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
        <span className="font-semibold">Backend Offline</span>
        <button
          onClick={() => refetch()}
          title="Retry connection"
          className="ml-1 p-0.5 hover:bg-rose-100 rounded text-rose-600 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
    );
  }

  const providerLabel = health?.gpu_available ? "CUDA GPU" : "CPU Engine";

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-900 shadow-xs">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-semibold text-emerald-800">AI Engine Online</span>
      </div>
      <span className="text-emerald-300">•</span>
      <span className="text-emerald-700 font-medium">
        {providerLabel}
        {latencyMs !== null && ` (${latencyMs}ms)`}
      </span>
      <button
        onClick={() => refetch()}
        title="Refresh connection status"
        className="ml-1 p-0.5 hover:bg-emerald-100 rounded text-emerald-600 transition-colors"
      >
        <RefreshCw className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}

export default ConnectionStatus;
