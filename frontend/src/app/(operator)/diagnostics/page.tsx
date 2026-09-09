"use client";

import { Activity, Cpu, HardDrive, Wifi, Server, CheckCircle2 } from "lucide-react";

export default function DiagnosticsPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200/80">
        <div className="w-10 h-10 rounded-xl bg-[#143724] text-white flex items-center justify-center shadow-xs">
          <Activity className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hardware & Network Diagnostics
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
            Real-time inference CPU load, mesh link latency, and RTSP stream health.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">CPU Usage</span>
            <Cpu className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-slate-900">18.4%</div>
          <p className="text-xs text-slate-400 mt-1">4-Core ONNX Runtime Bounded</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Memory</span>
            <HardDrive className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-slate-900">1.2 GB</div>
          <p className="text-xs text-slate-400 mt-1">Model cache active</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Mesh Latency</span>
            <Wifi className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-emerald-700">14 ms</div>
          <p className="text-xs text-slate-400 mt-1">12/12 Nodes Synchronized</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Inference FPS</span>
            <Server className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-slate-900">30.2 FPS</div>
          <p className="text-xs text-slate-400 mt-1">Continuous live evaluation</p>
        </div>
      </div>
    </div>
  );
}
