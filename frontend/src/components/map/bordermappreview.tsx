import { Camera, AlertCircle } from "lucide-react";

export function BorderMapPreview() {
  return (
    <div className="bg-[#0e2a1b] rounded-xl border border-[#1c4e33] shadow-xs relative overflow-hidden flex flex-col justify-between p-5 min-h-[340px] text-white select-none">
      {/* Top Bar: Title */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <h2 className="text-base font-semibold text-emerald-50 tracking-wide">
            Live Border View
          </h2>
        </div>
        <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-sm bg-[#16412b] border border-emerald-500/20 text-emerald-300">
          Sector 04 Grid
        </span>
      </div>

      {/* Map Graphic Area */}
      <div className="relative flex-1 w-full my-4 min-h-[200px]">
        {/* Subtle Grid Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(circle, #52b788 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        ></div>

        {/* Pale Border Line Across the Panel */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 10 160 Q 180 120, 320 140 T 640 90 T 960 110"
            fill="none"
            stroke="#d8f3dc"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            opacity="0.85"
          />
        </svg>

        {/* Marker 1: Camera 01 (Green) */}
        <div className="absolute top-[22%] left-[18%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-emerald-200">
            <Camera className="w-3.5 h-3.5" />
          </div>
          <span className="mt-1 text-[10px] font-mono text-emerald-200 bg-black/50 px-1.5 py-0.5 rounded-xs">
            CAM 01
          </span>
        </div>

        {/* Marker 2: Camera 02 (Green) */}
        <div className="absolute top-[58%] left-[45%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-emerald-200">
            <Camera className="w-3.5 h-3.5" />
          </div>
          <span className="mt-1 text-[10px] font-mono text-emerald-200 bg-black/50 px-1.5 py-0.5 rounded-xs">
            CAM 02
          </span>
        </div>

        {/* Marker 3: Camera 03 (Green) */}
        <div className="absolute top-[32%] right-[22%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-emerald-200">
            <Camera className="w-3.5 h-3.5" />
          </div>
          <span className="mt-1 text-[10px] font-mono text-emerald-200 bg-black/50 px-1.5 py-0.5 rounded-xs">
            CAM 03
          </span>
        </div>

        {/* Marker 4: Red Alert Marker */}
        <div className="absolute top-[68%] right-[32%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
          <span className="relative flex h-7 w-7">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-7 w-7 bg-rose-600 text-white items-center justify-center border border-rose-200 shadow-lg shadow-rose-600/40">
              <AlertCircle className="w-4 h-4" />
            </span>
          </span>
          <span className="mt-1 text-[10px] font-mono text-rose-200 bg-rose-950/80 px-1.5 py-0.5 rounded-xs border border-rose-500/40">
            ALERT
          </span>
        </div>
      </div>

      {/* Legend at Bottom */}
      <div className="pt-3 border-t border-[#1c4e33] flex flex-wrap items-center gap-4 text-xs text-emerald-100/80 z-10">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
          Legend:
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span>Camera Online</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Active Alert</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-0.5 bg-[#d8f3dc] border-t border-dashed border-[#d8f3dc]"></span>
          <span>Border Area</span>
        </div>
      </div>
    </div>
  );
}

export default BorderMapPreview;
