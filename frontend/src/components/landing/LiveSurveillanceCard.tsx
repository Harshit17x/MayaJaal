"use client";

import Image from "next/image";
import { Camera, AlertTriangle, Circle, Plus, Minus } from "lucide-react";

export function LiveSurveillanceCard() {
  return (
    <div className="relative w-full max-w-[480px] bg-white/85 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/70 overflow-hidden select-none transition-transform duration-500 hover:shadow-emerald-950/10">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-800 tracking-wide">
            Live Surveillance
          </span>
        </div>
        <span className="text-[11px] font-mono font-medium text-slate-500">
          08 Sep 2026 | 14:32 IST
        </span>
      </div>

      {/* Map Graphic Canvas */}
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-inner border border-slate-200/80 bg-[#425048]">
        {/* Shaded Topographic Satellite Relief Background */}
        <Image
          src="/images/tactical-map-relief.jpg"
          alt="Tactical Border Relief Map"
          fill
          sizes="480px"
          className="object-cover brightness-95 contrast-110"
        />

        {/* Subtle Green Surveillance Tint Overlay */}
        <div className="absolute inset-0 bg-[#14281e]/25 mix-blend-multiply pointer-events-none" />

        {/* Tactical Border Line Overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          {/* Glowing Border Line */}
          <path
            d="M 20 60 Q 80 110, 140 100 T 260 170 T 360 210 T 460 260"
            fill="none"
            stroke="#bbf7d0"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#glow)"
            opacity="0.95"
          />
          <path
            d="M 20 60 Q 80 110, 140 100 T 260 170 T 360 210 T 460 260"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.9"
          />
        </svg>

        {/* Territory Watermarks */}
        <div className="absolute top-6 right-10 text-[11px] font-bold font-mono tracking-[0.3em] text-white/50 uppercase pointer-events-none">
          CHINA
        </div>
        <div className="absolute top-[48%] left-8 text-[11px] font-bold font-mono tracking-[0.3em] text-white/50 uppercase pointer-events-none">
          INDIA
        </div>
        <div className="absolute bottom-10 right-10 text-[11px] font-bold font-mono tracking-[0.3em] text-white/50 uppercase pointer-events-none">
          NEPAL
        </div>

        {/* 1. Camera Marker 01 */}
        <div className="absolute top-[18%] left-[24%] -translate-x-1/2 -translate-y-1/2">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-40"></span>
            <div className="relative w-6 h-6 rounded-full bg-emerald-800 border-2 border-emerald-300 text-white flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <Camera className="w-3 h-3 text-emerald-200" />
            </div>
          </div>
        </div>

        {/* 2. Camera Marker 02 */}
        <div className="absolute top-[44%] left-[45%] -translate-x-1/2 -translate-y-1/2">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-40"></span>
            <div className="relative w-6 h-6 rounded-full bg-emerald-800 border-2 border-emerald-300 text-white flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <Camera className="w-3 h-3 text-emerald-200" />
            </div>
          </div>
        </div>

        {/* 3. Camera Marker 03 */}
        <div className="absolute top-[68%] left-[64%] -translate-x-1/2 -translate-y-1/2">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-40"></span>
            <div className="relative w-6 h-6 rounded-full bg-emerald-800 border-2 border-emerald-300 text-white flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <Camera className="w-3 h-3 text-emerald-200" />
            </div>
          </div>
        </div>

        {/* Red Alert Marker with concentric radar rings */}
        <div className="absolute top-[43%] left-[72%] -translate-x-1/2 -translate-y-1/2">
          <div className="relative flex items-center justify-center">
            {/* Outer radar pulse */}
            <div className="absolute w-16 h-16 rounded-full bg-rose-500/25 animate-pulse" />
            <div className="absolute w-10 h-10 rounded-full border border-rose-400/60 animate-ping" />
            {/* Inner Red Alert Badge */}
            <div className="relative w-7 h-7 rounded-full bg-rose-600 border-2 border-white text-white flex items-center justify-center shadow-lg shadow-rose-900/60">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Map Zoom Controls on Right */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col rounded-lg bg-white/90 backdrop-blur-sm border border-slate-200/90 shadow-md divide-y divide-slate-200 overflow-hidden text-slate-700">
          <button
            type="button"
            aria-label="Zoom in"
            className="p-1.5 hover:bg-slate-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            className="p-1.5 hover:bg-slate-100 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom Legend Pill */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-lg border border-slate-200/80 text-[11px] font-semibold text-slate-700">
          <div className="flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-emerald-600" />
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Alert</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle className="w-3.5 h-3.5 text-slate-400" />
            <span>Offline</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveSurveillanceCard;
