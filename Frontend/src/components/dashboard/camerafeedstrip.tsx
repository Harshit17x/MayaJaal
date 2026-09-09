import { Camera } from "lucide-react";

const cameras = [
  { id: "cam-1", name: "Camera 01", location: "North Perimeter" },
  { id: "cam-2", name: "Camera 02", location: "Eastern Gate" },
  { id: "cam-3", name: "Camera 03", location: "Watch Tower" },
  { id: "cam-4", name: "Camera 04", location: "Southern Trail" },
];

export function CameraFeedStrip() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5">
      {/* Title */}
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-base font-semibold text-slate-900">
          Camera Feeds
        </h2>
        <span className="text-xs font-mono text-slate-500">
          4 Feeds Connected
        </span>
      </div>

      {/* 4 Small Dark Placeholder Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {cameras.map((cam) => (
          <div
            key={cam.id}
            className="rounded-lg bg-[#0e1315] border border-slate-800/80 overflow-hidden group hover:border-slate-700 transition-all select-none"
          >
            {/* Dark Placeholder Video Canvas */}
            <div className="aspect-video relative flex flex-col items-center justify-center p-3 text-slate-600">
              <Camera className="w-6 h-6 opacity-30 text-slate-400 mb-1" />
              <span className="text-[10px] tracking-wider uppercase font-mono text-slate-500">
                Standby
              </span>

              {/* Live indicator badge */}
              <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-black/60 text-[9px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>REC</span>
              </div>
            </div>

            {/* Label Area */}
            <div className="px-3 py-2 bg-[#141b1f] border-t border-slate-800/60 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                {cam.name}
              </span>
              <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                {cam.location}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CameraFeedStrip;
