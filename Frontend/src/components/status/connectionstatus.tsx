export function ConnectionStatus() {
  return (
    <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs shadow-xs">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-semibold text-emerald-800 tracking-wide">Connected</span>
      </div>
      <span className="text-emerald-300">•</span>
      <span className="text-slate-500 font-normal">Last updated: Just now</span>
    </div>
  );
}

export default ConnectionStatus;
