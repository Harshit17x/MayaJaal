"use client";

interface CategoryStat {
  label: string;
  percentage: number;
  colorClass: string;
  dotBg: string;
}

const CATEGORIES: CategoryStat[] = [
  {
    label: "Humans",
    percentage: 64,
    colorClass: "bg-[#1b4830]",
    dotBg: "bg-[#1b4830]",
  },
  {
    label: "Vehicles",
    percentage: 25,
    colorClass: "bg-[#f59e0b]",
    dotBg: "bg-[#f59e0b]",
  },
  {
    label: "Wildlife / Other",
    percentage: 11,
    colorClass: "bg-[#cbd5e1]",
    dotBg: "bg-[#cbd5e1]",
  },
];

export function DetectionBreakdownCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Detection Breakdown
        </h2>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Primary classified activity categories.
        </p>
      </div>

      {/* Progress Bar Container */}
      <div className="my-6">
        <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-slate-100 shadow-inner">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.label}
              style={{ width: `${cat.percentage}%` }}
              className={`${cat.colorClass} h-full transition-all duration-500 hover:brightness-110`}
              title={`${cat.label}: ${cat.percentage}%`}
            />
          ))}
        </div>
      </div>

      {/* Breakdown Legend Items */}
      <div className="space-y-4 pt-2">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.label}
            className="flex items-center justify-between text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${cat.dotBg} shrink-0`} />
              <span className="font-medium text-slate-700">{cat.label}</span>
            </div>
            <span className="font-bold text-slate-900">{cat.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
