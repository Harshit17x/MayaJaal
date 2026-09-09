import { Camera } from "lucide-react";

export interface CameraCardProps {
  name: string;
  location: string;
  isOnline?: boolean;
}

export function CameraCard({
  name,
  location,
  isOnline = true,
}: CameraCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition-all">
      {/* Dark empty video area */}
      <div className="relative aspect-video w-full bg-[#111618] flex flex-col items-center justify-center text-slate-600 select-none">
        <Camera className="w-8 h-8 opacity-30 text-slate-400 mb-1" />
        <span className="text-[11px] tracking-wider uppercase opacity-40 font-mono">
          No Stream
        </span>

        {/* Live overlay indicator */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-black/60 backdrop-blur-xs text-[10px] font-mono text-white/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>LIVE</span>
        </div>
      </div>

      {/* Info footer */}
      <div className="p-3.5 flex items-center justify-between gap-3 bg-white">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 truncate">
            {name}
          </h3>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {location}
          </p>
        </div>

        {/* Small green Online badge */}
        {isOnline && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Online
          </span>
        )}
      </div>
    </div>
  );
}

export default CameraCard;
