"use client";

import { useState, useEffect } from "react";

export function DashboardHeader() {
  const [timestamp, setTimestamp] = useState<{ date: string; time: string }>({
    date: "09 Sep 2026",
    time: "10:24:00",
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const date = now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      });
      const time = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Kolkata",
      });
      setTimestamp({ date, time });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white rounded-xl border border-slate-200/80 p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Left Greeting */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
          Good Morning, Operator
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Stay vigilant. Every watch counts.
        </p>
      </div>

      {/* Right Post Meta & System State */}
      <div className="flex flex-wrap items-center gap-3 md:gap-5 text-xs md:text-sm">
        <div className="flex flex-col md:items-end">
          <span className="font-semibold text-slate-700">
            BOP: Demo Border Outpost
          </span>
          <span
            className="text-xs font-mono text-slate-500 mt-0.5"
            suppressHydrationWarning
          >
            {timestamp.date} | {timestamp.time} IST
          </span>
        </div>

        {/* System Operational Indicator */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-medium text-emerald-700 flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>System Operational</span>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
