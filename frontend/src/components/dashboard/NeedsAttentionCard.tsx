"use client";

export function NeedsAttentionCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          What Needs Attention
        </h2>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          High priority highlights for current watch.
        </p>
      </div>

      {/* Cards List */}
      <div className="space-y-3.5">
        {/* Priority Item */}
        <div className="p-4 rounded-xl border border-rose-200/80 bg-rose-50/20 hover:bg-rose-50/40 transition-colors">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs sm:text-sm font-bold text-slate-900">
              Cam 02 · Eastern Gate
            </span>
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-rose-600">
              PRIORITY
            </span>
          </div>
          <p className="text-xs text-slate-600 font-normal leading-relaxed">
            Peak activity recorded during nocturnal hours (01:30 – 03:45 IST).
          </p>
        </div>

        {/* Optimal Item */}
        <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/20 hover:bg-emerald-50/40 transition-colors">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs sm:text-sm font-bold text-slate-900">
              Cam 01 · North Perimeter
            </span>
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-emerald-700">
              OPTIMAL
            </span>
          </div>
          <p className="text-xs text-slate-600 font-normal leading-relaxed">
            Normal perimeter status with zero unauthorized breaches today.
          </p>
        </div>
      </div>
    </div>
  );
}
