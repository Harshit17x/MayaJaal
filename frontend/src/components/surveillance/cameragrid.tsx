"use client";

import { CameraCard } from "./cameracard";
import { useCameras } from "@/lib/camerasStore";
import { Camera } from "@/types/camera";

interface CameraGridProps {
  selectedCameraId?: string;
  onSelectCamera?: (camera: Camera) => void;
}

export function CameraGrid({ selectedCameraId, onSelectCamera }: CameraGridProps) {
  const { cameras } = useCameras();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {cameras.map((camera) => (
        <CameraCard
          key={camera.id}
          id={camera.id}
          name={camera.name}
          location={camera.location}
          sector={camera.sector}
          isOnline={camera.status !== "offline"}
          streamUrl={camera.streamUrl}
          ipAddress={camera.ipAddress}
          isSelected={camera.id === selectedCameraId}
          onClick={() => onSelectCamera?.(camera)}
        />
      ))}
    </div>
  );
}

export default CameraGrid;
