"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { ActivityOverviewChart } from "./ActivityOverviewChart";
import { DetectionBreakdownCard } from "./DetectionBreakdownCard";
import { CameraOutpostGrid } from "./CameraOutpostGrid";
import { NeedsAttentionCard } from "./NeedsAttentionCard";

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d");

  const handleExport = () => {
    // Generate a simple CSV export of summary metrics
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Border Analytics
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            High-level activity summary for Sector 04.
          </p>
        </div>

        {/* Range Buttons & Export */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Range Selector */}
          <div className="inline-flex p-1 rounded-xl bg-slate-200/70 border border-slate-300/60 shadow-inner">
            <button
              type="button"
              onClick={() => setTimeRange("7d")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#143724] hover:bg-[#102d1d] text-white shadow-xs transition-all active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Summary</span>
          </button>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Detections */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
              TOTAL DETECTIONS
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              +12% vs last week
            </span>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              14,820
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Detected across 4 border sectors
            </p>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
              CRITICAL ALERTS
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70">
              Needs Review
            </span>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-rose-600 tracking-tight">
              8
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              184 alerts resolved this week
            </p>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
              SYSTEM HEALTH
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              All 12 Nodes Online
            </span>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#143724] tracking-tight">
              99.9%
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Continuous live feed operational
            </p>
          </div>
        </div>
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
