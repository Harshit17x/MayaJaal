"use client";

import Link from "next/link";
import { ArrowUpRight, Video } from "lucide-react";

export function NeedsAttentionCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#dce5df] p-6 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          What Needs Attention
        </h2>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          High priority highlights for current watch. Click to inspect live feed.
        </p>
      </div>

      {/* Cards List */}
      <div className="space-y-3.5">
        {/* Priority Item */}
        <Link
          href="/live?camera=bop-jk-02"
          className="block p-4 rounded-xl border border-rose-200/80 bg-rose-50/20 hover:bg-rose-50/70 hover:border-rose-300 hover:shadow-sm transition-all group cursor-pointer"
          title="Open Cam 02 Eastern Gate Live Feed"
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-rose-700 transition-colors flex items-center gap-1.5">
              <span>Cam 02 · Eastern Gate</span>
              <Video className="w-3.5 h-3.5 text-rose-500" />
            </span>
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded flex items-center gap-1">
              <span>PRIORITY</span>
              <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </div>
          <p className="text-xs text-slate-600 font-normal leading-relaxed">
            Peak activity recorded during nocturnal hours (01:30 – 03:45 IST).
          </p>
        </Link>

        {/* Optimal Item */}
        <Link
          href="/live?camera=bop-jk-01"
          className="block p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/20 hover:bg-emerald-50/70 hover:border-emerald-300 hover:shadow-sm transition-all group cursor-pointer"
          title="Open Cam 01 North Perimeter Live Feed"
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors flex items-center gap-1.5">
              <span>Cam 01 · North Perimeter</span>
              <Video className="w-3.5 h-3.5 text-emerald-600" />
            </span>
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded flex items-center gap-1">
              <span>OPTIMAL</span>
              <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </div>
          <p className="text-xs text-slate-600 font-normal leading-relaxed">
            Normal perimeter status with zero unauthorized breaches today.
          </p>
        </Link>
      </div>
    </div>
  );
}
