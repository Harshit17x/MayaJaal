export function DashboardHeader() {
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
          <span className="text-xs font-mono text-slate-500 mt-0.5">
            08 Sep 2026 | 10:24 IST
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
