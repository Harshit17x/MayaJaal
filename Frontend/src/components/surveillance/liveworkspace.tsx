import { CameraFeedPlaceholder } from "./camerafeedplaceholder";
import { CameraGrid } from "./cameragrid";

export function LiveWorkspace() {
  return (
    <div className="space-y-6">
      {/* Large primary feed area */}
      <section aria-label="Primary Camera Feed">
        <CameraFeedPlaceholder />
      </section>

      {/* 4-camera grid below */}
      <section aria-label="Camera Matrix">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-600 tracking-wider uppercase">
            Sector Camera Feeds
          </h2>
          <span className="text-xs font-mono text-slate-500">
            4 Online
          </span>
        </div>
        <CameraGrid />
      </section>
    </div>
  );
}

export default LiveWorkspace;
