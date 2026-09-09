import { ConnectionStatus } from "@/components/status/connectionstatus";
import { LiveWorkspace } from "@/components/surveillance/liveworkspace";

export default function LivePage() {
  return (
    <div className="space-y-6 pb-8">
      {/* Header bar with Title, BOP Label, and ConnectionStatus */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1c2022]">
            Live Surveillance
          </h1>
          <p className="text-xs md:text-sm font-medium text-slate-500 mt-0.5">
            BOP: Demo Border Outpost
          </p>
        </div>

        {/* Connection Status indicator near the title */}
        <div>
          <ConnectionStatus />
        </div>
      </div>

      {/* Live Workspace: Large feed placeholder + 4-camera grid */}
      <LiveWorkspace />
    </div>
  );
}
