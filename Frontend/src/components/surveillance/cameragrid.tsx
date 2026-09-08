import { CameraCard } from "./cameracard";

const temporaryCameras = [
  { id: "cam-01", name: "Camera 01", location: "North Perimeter" },
  { id: "cam-02", name: "Camera 02", location: "Eastern Gate" },
  { id: "cam-03", name: "Camera 03", location: "Watch Tower" },
  { id: "cam-04", name: "Camera 04", location: "Southern Trail" },
];

export function CameraGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {temporaryCameras.map((camera) => (
        <CameraCard
          key={camera.id}
          name={camera.name}
          location={camera.location}
          isOnline={true}
        />
      ))}
    </div>
  );
}

export default CameraGrid;
