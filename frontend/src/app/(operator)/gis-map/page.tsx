"use client";

import { useState } from "react";
import { BorderMap } from "@/components/map/BorderMap";
import { RecentAlerts } from "@/components/dashboard/recentalerts";
import { SystemStatus } from "@/components/dashboard/systemstatus";
import { CameraFeedStrip } from "@/components/dashboard/camerafeedstrip";
import {
  Map as MapIcon,
  Layers,
  Crosshair,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Radio,
} from "lucide-react";

export default function GisMapPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeLayer, setActiveLayer] = useState<"hybrid" | "satellite" | "terrain" | "roadmap">("hybrid");

  return (
    <div className="space-y-6 pb-12">
      {/* GIS Portal Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#143724] text-white flex items-center justify-center shadow-xs">
              <MapIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
                Tactical GIS Surveillance Map
              </h1>
              <p className="text-xs md:text-sm font-medium text-slate-500 mt-0.5">
                Real-time geospatial camera nodes, perimeter geofences, and alert coordinates.
              </p>
            </div>
          </div>
        </div>

        {/* GIS Controls & Meta */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Geolocation Tag */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-medium">
            <Crosshair className="w-3.5 h-3.5 text-slate-500" />
            <span>23.30° N, 78.60° E</span>
          </div>

          {/* Google Maps Layer Toggle */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => setActiveLayer("hybrid")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeLayer === "hybrid"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Hybrid
            </button>
            <button
              onClick={() => setActiveLayer("satellite")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeLayer === "satellite"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setActiveLayer("terrain")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeLayer === "terrain"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Terrain
            </button>
          </div>

          {/* Fullscreen Map Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Focus</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Focus Map</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Map + Recent Alerts Panel */}
      <div
        className={`grid gap-6 items-start transition-all ${
          isFullscreen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-12"
        }`}
      >
        {/* Full Interactive Google BorderMap */}
        <div
          className={`${
            isFullscreen
              ? "col-span-1 min-h-[760px]"
              : "lg:col-span-7 xl:col-span-8"
          } flex flex-col`}
        >
          <BorderMap initialMapType={activeLayer} height={isFullscreen ? "760px" : "560px"} />
        </div>

        {/* Tactical Feed / Recent Alerts */}
        {!isFullscreen && (
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-6">
            <RecentAlerts />
          </div>
        )}
      </div>

      {/* System Status & Camera Feed Strip */}
      {!isFullscreen && (
        <>
          <SystemStatus />
          <CameraFeedStrip />
        </>
      )}
    </div>
  );
}
