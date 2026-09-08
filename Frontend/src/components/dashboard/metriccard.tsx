import React from "react";

export interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  isAlert?: boolean;
}

export function MetricCard({
  icon: Icon,
  value,
  label,
  isAlert = false,
}: MetricCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-xs transition-all flex items-center gap-4 ${
        isAlert
          ? "bg-rose-50/80 border-rose-200/90 text-rose-950"
          : "bg-white border-slate-200/80 text-slate-900"
      }`}
    >
      {/* Small icon area on the left */}
      <div
        className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isAlert
            ? "bg-rose-100 text-rose-600"
            : "bg-slate-100 text-slate-600"
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Value and Label */}
      <div className="min-w-0">
        <div
          className={`text-2xl md:text-3xl font-bold tracking-tight ${
            isAlert ? "text-rose-700" : "text-slate-900"
          }`}
        >
          {value}
        </div>
        <div
          className={`text-xs font-medium truncate mt-0.5 ${
            isAlert ? "text-rose-600/90" : "text-slate-500"
          }`}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

export default MetricCard;
