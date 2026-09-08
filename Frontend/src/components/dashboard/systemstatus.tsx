import { Server, HardDrive, Wifi, Cpu } from "lucide-react";

interface StatusItem {
  label: string;
  value: string;
  isGreen: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

const statusItems: StatusItem[] = [
  {
    label: "Edge Server",
    value: "Healthy",
    isGreen: true,
    icon: Server,
  },
  {
    label: "Storage",
    value: "76% Used",
    isGreen: false,
    icon: HardDrive,
  },
  {
    label: "Network",
    value: "Online",
    isGreen: true,
    icon: Wifi,
  },
  {
    label: "AI Modules",
    value: "Running",
    isGreen: true,
    icon: Cpu,
  },
];

export function SystemStatus() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5">
      {/* Title */}
      <h2 className="text-base font-semibold text-slate-900 mb-3.5">
        System Status
      </h2>

      {/* 4 Compact Status Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {statusItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/60 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">
                    {item.label}
                  </span>
                  <span className="text-sm font-semibold text-slate-800 block">
                    {item.value}
                  </span>
                </div>
              </div>

              {/* Status Dot / Indicator */}
              <div className="flex items-center">
                {item.isGreen ? (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                ) : (
                  <span className="inline-flex rounded-full h-2.5 w-2.5 bg-slate-400"></span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SystemStatus;
