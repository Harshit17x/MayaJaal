"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Download,
  Video,
  MapPin,
  AlertTriangle,
  Car,
  ArrowUpRight,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { ActivityOverviewChart } from "./ActivityOverviewChart";
import { DetectionBreakdownCard } from "./DetectionBreakdownCard";
import { CameraOutpostGrid } from "./CameraOutpostGrid";
import { NeedsAttentionCard } from "./NeedsAttentionCard";

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d");

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Metric,Value,Status,Period\n" +
      `Total Detections,14820,+12% vs last week,${timeRange}\n` +
      `Critical Alerts,8,Needs Review,${timeRange}\n` +
      `System Health,99.9%,All 12 Nodes Online,${timeRange}\n` +
      "Humans,64%,Primary Detection,7d\n" +
      "Vehicles,25%,Secondary Detection,7d\n" +
      "Wildlife,11%,Filtered,7d\n";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `border_analytics_summary_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#eaf4ed] text-[#1b5032] border border-[#c4ded0]">
              <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
              Sector 04 Command Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Border Analytics Console
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
            Operational intelligence and live perimeter surveillance for Sector 04.
          </p>
        </div>

        {/* Range Buttons & Export */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Range Selector */}
          <div className="inline-flex p-1 rounded-xl bg-slate-200/70 border border-slate-300/60 shadow-inner">
            <button
              type="button"
              onClick={() => setTimeRange("7d")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeRange === "7d"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeRange("30d")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeRange === "30d"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Last 30 Days
            </button>
          </div>

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#1e4b38] hover:bg-[#163a2b] text-white shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Summary</span>
          </button>
        </div>
      </div>

      {/* Quick Operational Launchpad - Instant click-through to open live monitoring */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/live"
          className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#dce5df] hover:border-[#1e4b38] hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#eaf4ed] text-[#1e4b38] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-[#1e4b38]">
                Live Feeds
              </div>
              <div className="text-[10px] text-slate-500 font-medium">4K RTSP Grid</div>
            </div>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1e4b38] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </Link>

        <Link
          href="/gis-map"
          className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#dce5df] hover:border-[#1e4b38] hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                GIS Border Map
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Tactical Mesh</div>
            </div>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </Link>

        <Link
          href="/alerts"
          className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#dce5df] hover:border-rose-400 hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-rose-600">
                Threat Alerts
              </div>
              <div className="text-[10px] text-rose-600 font-medium">8 Active Alerts</div>
            </div>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </Link>

        <Link
          href="/anpr"
          className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#dce5df] hover:border-[#1e4b38] hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700">
                ANPR Vehicles
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Gate Recognition</div>
            </div>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </Link>
      </div>

      {/* Top 3 Interactive Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Detections -> Links to Tracks */}
        <Link
          href="/tracks"
          className="bg-white rounded-2xl border border-[#dce5df] p-6 shadow-xs hover:border-[#1e4b38]/40 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
          title="Open Tracks & Trajectories Analysis"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 group-hover:text-[#1e4b38] transition-colors flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>TOTAL DETECTIONS</span>
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#eaf4ed] text-[#1b5032] border border-[#c4ded0]">
              +12% vs last week
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight group-hover:text-[#1e4b38] transition-colors">
                14,820
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Detected across 4 border sectors · Click to view tracks
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-[#1e4b38] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
        </Link>

        {/* Critical Alerts -> Links to Alerts */}
        <Link
          href="/alerts"
          className="bg-white rounded-2xl border border-[#dce5df] p-6 shadow-xs hover:border-rose-300 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
          title="Open Tactical Alerts Log"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 group-hover:text-rose-600 transition-colors flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>CRITICAL ALERTS</span>
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70">
              Needs Review
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-rose-600 tracking-tight">
                8
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                184 alerts resolved this week · Click to inspect
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-rose-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
        </Link>

        {/* System Health -> Links to Diagnostics */}
        <Link
          href="/diagnostics"
          className="bg-white rounded-2xl border border-[#dce5df] p-6 shadow-xs hover:border-[#1e4b38]/40 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
          title="Open Edge Inference Diagnostics"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 group-hover:text-[#1e4b38] transition-colors flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SYSTEM HEALTH</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1b5032]">
              <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
              All 12 Nodes Online
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#1e4b38] tracking-tight">
                99.9%
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Continuous live feed operational · Click for telemetry
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-[#1e4b38] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
        </Link>
      </div>

      {/* Row 1: Activity Overview + Detection Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
          <ActivityOverviewChart />
        </div>
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
          <DetectionBreakdownCard />
        </div>
      </div>

      {/* Row 2: Camera Outpost Status + What Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
          <CameraOutpostGrid />
        </div>
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
          <NeedsAttentionCard />
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
