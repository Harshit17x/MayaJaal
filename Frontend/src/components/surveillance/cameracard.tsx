"use client";

import { useState } from "react";
import { Camera, Radio, Eye } from "lucide-react";

export interface CameraCardProps {
  id?: string;
  name: string;
  location: string;
  sector?: string;
  isOnline?: boolean;
  streamUrl?: string;
  ipAddress?: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export function CameraCard({
  id,
  name,
  location,
  sector,
  isOnline = true,
  streamUrl,
  ipAddress,
  isSelected = false,
  onClick,
}: CameraCardProps) {
  const [imgError, setImgError] = useState(false);
  const targetUrl = streamUrl || (ipAddress ? `rtsp://${ipAddress}:554/live` : "sample");

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border shadow-xs overflow-hidden flex flex-col transition-all cursor-pointer group ${
        isSelected
          ? "border-emerald-600 ring-2 ring-emerald-500/30"
          : "border-slate-200 hover:border-emerald-500/60 hover:shadow-md"
      }`}
    >
      {/* Video preview area with live snapshot */}
      <div className="relative aspect-video w-full bg-[#111618] flex flex-col items-center justify-center text-slate-600 select-none overflow-hidden">
        {!imgError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/api/backend/stream/snapshot?rtsp_url=${encodeURIComponent(targetUrl)}`}
            alt={name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center">
            <Camera className="w-8 h-8 opacity-30 text-slate-400 mb-1" />
            <span className="text-[11px] tracking-wider uppercase opacity-40 font-mono">
              RTSP Standby
            </span>
          </div>
        )}

        {/* Live overlay indicator */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-black/70 backdrop-blur-xs text-[10px] font-mono text-white/90 z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>LIVE</span>
        </div>

        {/* Hover view prompt */}
        <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-xs">
          <Eye className="w-4 h-4" />
          <span>Switch Live Feed</span>
        </div>
      </div>

      {/* Info footer */}
      <div className="p-3.5 flex items-center justify-between gap-3 bg-white">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 truncate flex items-center gap-1.5">
            <span>{name}</span>
            {isSelected && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.2 rounded font-bold">
                ACTIVE
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {sector ? `${sector} • ` : ""}{location}
          </p>
        </div>

        {/* Small green Online badge */}
        {isOnline && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Online
          </span>
        )}
      </div>
    </div>
  );
}

export default CameraCard;
