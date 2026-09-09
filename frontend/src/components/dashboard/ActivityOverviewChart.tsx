"use client";

import { useState } from "react";

interface DayData {
  day: string;
  isPeak?: boolean;
  normal: number;
  alerts: number;
  normalHeightPercent: number;
  alertHeightPercent: number;
}

const WEEK_DATA: DayData[] = [
  { day: "Mon", normal: 1840, alerts: 18, normalHeightPercent: 54, alertHeightPercent: 22 },
  { day: "Tue", normal: 2210, alerts: 24, normalHeightPercent: 65, alertHeightPercent: 28 },
  { day: "Wed", normal: 1620, alerts: 14, normalHeightPercent: 48, alertHeightPercent: 18 },
  { day: "Thu", normal: 3450, alerts: 48, normalHeightPercent: 92, alertHeightPercent: 44, isPeak: true },
  { day: "Fri", normal: 2050, alerts: 21, normalHeightPercent: 58, alertHeightPercent: 24 },
  { day: "Sat", normal: 2790, alerts: 32, normalHeightPercent: 78, alertHeightPercent: 35 },
  { day: "Sun", normal: 2160, alerts: 27, normalHeightPercent: 62, alertHeightPercent: 30 },
];

export function ActivityOverviewChart() {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between h-full">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Activity Overview
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Daily detection traffic and alerts over the past 7 days.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[2px] bg-[#1a442d] inline-block shadow-xs" />
            <span>Normal Traffic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[2px] bg-[#f59e0b] inline-block shadow-xs" />
            <span>Alerts</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative pt-6 pb-2">
        {/* Hover Tooltip display */}
        {hoveredDay && (
          <div className="absolute top-0 right-4 z-10 bg-slate-900 text-white text-[11px] px-3 py-1.5 rounded-lg shadow-md flex items-center gap-3">
            <span className="font-semibold text-emerald-300">{hoveredDay.day}</span>
            <span>Normal: <strong className="text-white">{hoveredDay.normal.toLocaleString()}</strong></span>
            <span>Alerts: <strong className="text-amber-400">{hoveredDay.alerts}</strong></span>
          </div>
        )}

        {/* Bar Columns Container */}
        <div className="h-56 w-full flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-slate-100 pb-2">
          {WEEK_DATA.map((item) => {
            const isHovered = hoveredDay?.day === item.day;
            return (
              <div
                key={item.day}
                onMouseEnter={() => setHoveredDay(item)}
                onMouseLeave={() => setHoveredDay(null)}
                className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
              >
                {/* Paired Bars Container */}
                <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2 h-full pb-1">
                  {/* Normal Traffic Bar (Dark Forest Green) */}
                  <div className="relative w-full max-w-[22px] flex items-end h-full">
                    <div
                      style={{ height: `${item.normalHeightPercent}%` }}
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        isHovered ? "bg-[#143724] ring-2 ring-emerald-600/30" : "bg-[#1b4830]"
                      }`}
                    />
                  </div>

                  {/* Alerts Bar (Warm Orange / Amber) */}
                  <div className="relative w-full max-w-[22px] flex items-end h-full">
                    <div
                      style={{ height: `${item.alertHeightPercent}%` }}
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        isHovered ? "bg-[#d97706] ring-2 ring-amber-500/30" : "bg-[#f59e0b]"
                      }`}
                    />
                  </div>
                </div>

                {/* Day Label */}
                <span
                  className={`text-xs mt-3 transition-colors ${
                    item.isPeak
                      ? "font-bold text-slate-900 underline decoration-emerald-700 underline-offset-4"
                      : "font-medium text-slate-500 group-hover:text-slate-900"
                  }`}
                >
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
