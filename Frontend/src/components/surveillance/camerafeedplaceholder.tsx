import { MonitorPlay } from "lucide-react";

export function CameraFeedPlaceholder() {
  return (
    <div className="relative w-full aspect-video md:aspect-[21/9] min-h-[300px] max-h-[480px] bg-[#0d1215] rounded-xl border border-slate-800/80 shadow-md flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
      {/* Subtle corner reticles for tactical surveillance UI look */}
      <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-slate-700/60"></div>
      <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-slate-700/60"></div>
      <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-slate-700/60"></div>
      <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-slate-700/60"></div>

      {/* Center content */}
      <div className="flex flex-col items-center max-w-sm z-10">
        <div className="w-14 h-14 rounded-full bg-slate-800/50 border border-slate-700/60 flex items-center justify-center mb-3 text-slate-400">
          <MonitorPlay className="w-7 h-7" />
        </div>
        <h4 className="text-base font-medium text-slate-200">
          Select a camera to view live feed.
        </h4>
        <p className="text-xs text-slate-500 mt-1">
          Click any camera tile below to focus primary operational stream
        </p>
      </div>

      {/* Status watermark */}
      <div className="absolute bottom-3 left-4 text-[10px] font-mono tracking-wider text-slate-600 uppercase">
        FEED STATUS: IDLE • RESOLUTION: 1080P • LATENCY: --
      </div>
    </div>
  );
}

export default CameraFeedPlaceholder;
