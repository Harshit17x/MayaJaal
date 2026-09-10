"use client";

interface OutpostItem {
  id: string;
  index: string;
  name: string;
  cameraInfo: string;
  status: "Normal" | "Elevated";
  badgeText: string;
  isAlert?: boolean;
}

const OUTPOSTS: OutpostItem[] = [
  {
    id: "outpost-1",
    index: "01",
    name: "North Perimeter",
    cameraInfo: "Cam 01 • Optical",
    status: "Normal",
    badgeText: "Normal",
  },
  {
    id: "outpost-2",
    index: "02",
    name: "Eastern Gate",
    cameraInfo: "Elevated Activity",
    status: "Elevated",
    badgeText: "6 Alerts",
    isAlert: true,
  },
  {
    id: "outpost-3",
    index: "03",
    name: "Watch Tower",
    cameraInfo: "Cam 03 • Thermal FLIR",
    status: "Normal",
    badgeText: "Normal",
  },
  {
    id: "outpost-4",
    index: "04",
    name: "Southern Ridge",
    cameraInfo: "Cam 04 • Fog Penetration",
    status: "Normal",
    badgeText: "Normal",
  },
];

export function CameraOutpostGrid() {
  return (
    <div className="bg-white rounded-2xl border border-[#dce5df] p-6 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Camera Outpost Status
        </h2>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Live operational state across key perimeter zones.
        </p>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {OUTPOSTS.map((outpost) => {
          return (
            <div
              key={outpost.id}
              className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                outpost.isAlert
                  ? "bg-rose-50/25 border-rose-200/70 hover:border-rose-300"
                  : "bg-slate-50/70 border-slate-100 hover:border-slate-200/90"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Index Pill */}
                <span
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                    outpost.isAlert
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-slate-200/80 text-slate-700"
                  }`}
                >
                  {outpost.index}
                </span>

                {/* Details */}
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    {outpost.name}
                  </h4>
                  <p
                    className={`text-[11px] font-medium mt-0.5 ${
                      outpost.isAlert ? "text-rose-600 font-semibold" : "text-slate-500"
                    }`}
                  >
                    {outpost.cameraInfo}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {outpost.isAlert ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                    {outpost.badgeText}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    {outpost.badgeText}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
