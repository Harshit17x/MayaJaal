import { Camera as CameraEntity } from "@/types/camera";

export interface TrajectoryWaypoint {
  name: string;
  code: string;
  lat: number;
  lng: number;
  camId?: string;
}

export interface TrajectoryTelemetry {
  activeNodeIndex: number;
  activeNodeName: string;
  phase: "dwell" | "transit" | "hold";
  legName: string;
  progress: number; // 0 to 1
  statusText: string;
  elapsedSec: number;
  totalDistanceMeters: number;
}

// Fallback campus coordinates matching Rashtriya Raksha University layout
const DEFAULT_RRU_COORDINATES: Record<string, { lat: number; lng: number; label: string }> = {
  audi2: { lat: 23.15405, lng: 72.88345, label: "Auditorium Block 2 (audi2)" },
  audi3: { lat: 23.15315, lng: 72.88355, label: "Auditorium Block 3 (audi3)" },
  saset: { lat: 23.15305, lng: 72.88580, label: "Applied Sciences Block (SASET)" },
  sitaics: { lat: 23.15300, lng: 72.88975, label: "IT & Cyber Security Block (SITAICS)" },
};

/**
 * Resolves the 4 key surveillance cameras from active cameras or default coordinates.
 */
export function resolveSuspectWaypoints(cameras: CameraEntity[]): TrajectoryWaypoint[] {
  const findCam = (keys: string[]) => {
    return cameras.find((c) => {
      const target = `${c.name || ""} ${c.id || ""} ${c.location || ""}`.toLowerCase();
      return keys.some((k) => target.includes(k));
    });
  };

  const camAudi2 = findCam(["audi2", "audi-2", "audi 2"]);
  const camAudi3 = findCam(["audi3", "audi-3", "audi 3"]);
  const camSaset = findCam(["saset"]);
  const camSitaics = findCam(["sitaics"]);

  return [
    {
      code: "audi2",
      name: camAudi2?.name || DEFAULT_RRU_COORDINATES.audi2.label,
      lat: Number(camAudi2?.latitude ?? (camAudi2?.coordinates ? camAudi2.coordinates[1] : DEFAULT_RRU_COORDINATES.audi2.lat)),
      lng: Number(camAudi2?.longitude ?? (camAudi2?.coordinates ? camAudi2.coordinates[0] : DEFAULT_RRU_COORDINATES.audi2.lng)),
      camId: camAudi2?.id,
    },
    {
      code: "audi3",
      name: camAudi3?.name || DEFAULT_RRU_COORDINATES.audi3.label,
      lat: Number(camAudi3?.latitude ?? (camAudi3?.coordinates ? camAudi3.coordinates[1] : DEFAULT_RRU_COORDINATES.audi3.lat)),
      lng: Number(camAudi3?.longitude ?? (camAudi3?.coordinates ? camAudi3.coordinates[0] : DEFAULT_RRU_COORDINATES.audi3.lng)),
      camId: camAudi3?.id,
    },
    {
      code: "SASET",
      name: camSaset?.name || DEFAULT_RRU_COORDINATES.saset.label,
      lat: Number(camSaset?.latitude ?? (camSaset?.coordinates ? camSaset.coordinates[1] : DEFAULT_RRU_COORDINATES.saset.lat)),
      lng: Number(camSaset?.longitude ?? (camSaset?.coordinates ? camSaset.coordinates[0] : DEFAULT_RRU_COORDINATES.saset.lng)),
      camId: camSaset?.id,
    },
    {
      code: "SITAICS",
      name: camSitaics?.name || DEFAULT_RRU_COORDINATES.sitaics.label,
      lat: Number(camSitaics?.latitude ?? (camSitaics?.coordinates ? camSitaics.coordinates[1] : DEFAULT_RRU_COORDINATES.sitaics.lat)),
      lng: Number(camSitaics?.longitude ?? (camSitaics?.coordinates ? camSitaics.coordinates[0] : DEFAULT_RRU_COORDINATES.sitaics.lng)),
      camId: camSitaics?.id,
    },
  ];
}

/**
 * Calculates geodesic distance in meters between two lat/lng points.
 */
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * High-performance realistic animation controller for suspect transgression trail.
 */
export class SuspectTrailAnimator {
  private map: google.maps.Map;
  private waypoints: TrajectoryWaypoint[];
  private onTelemetry?: (telemetry: TrajectoryTelemetry) => void;

  private isRunning = false;
  private animFrameId: number | null = null;
  private startTime = 0;

  // Google Maps objects
  private haloPolylines: google.maps.Polyline[] = [];
  private laserPolylines: google.maps.Polyline[] = [];
  private targetMarker: google.maps.Marker | null = null;
  private heatCoreCircle: google.maps.Circle | null = null;
  private heatRippleCircle1: google.maps.Circle | null = null;
  private heatRippleCircle2: google.maps.Circle | null = null;
  private cameraPulseMarkers: google.maps.Marker[] = [];

  // Durations (in ms)
  private readonly DWELL_DURATION = 1500; // Time spent at camera detection with heat animation
  private readonly TRANSIT_DURATION = 2000; // Exactly 2 seconds per vector displacement line
  private readonly FINAL_HOLD_DURATION = 2500; // Hold full trajectory at SITAICS before loop restart
  private readonly RESET_PAUSE = 400; // Quick reset between loops

  constructor(
    map: google.maps.Map,
    waypoints: TrajectoryWaypoint[],
    onTelemetry?: (telemetry: TrajectoryTelemetry) => void
  ) {
    this.map = map;
    this.waypoints = waypoints;
    this.onTelemetry = onTelemetry;
    this.initMapObjects();
  }

  private initMapObjects() {
    const google = (window as any).google;
    if (!google?.maps) return;

    // 1. Initialize Polyline segments for 3 legs
    for (let i = 0; i < 3; i++) {
      // Glow halo (outer)
      const halo = new google.maps.Polyline({
        map: this.map,
        path: [],
        geodesic: true,
        strokeColor: "#ef4444",
        strokeOpacity: 0.35,
        strokeWeight: 9,
        zIndex: 220,
      });
      this.haloPolylines.push(halo);

      // Core laser line (inner)
      const laser = new google.maps.Polyline({
        map: this.map,
        path: [],
        geodesic: true,
        strokeColor: "#ff1111",
        strokeOpacity: 0.98,
        strokeWeight: 3.5,
        zIndex: 225,
        icons: [
          {
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 2.8,
              fillColor: "#ff0000",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 1.5,
            },
            offset: "100%",
          },
        ],
      });
      this.laserPolylines.push(laser);
    }

    // 2. High-intensity Animated Heat Circles around active camera
    this.heatCoreCircle = new google.maps.Circle({
      map: this.map,
      center: { lat: this.waypoints[0].lat, lng: this.waypoints[0].lng },
      radius: 12,
      fillColor: "#ef4444",
      fillOpacity: 0.5,
      strokeColor: "#ef4444",
      strokeOpacity: 0.9,
      strokeWeight: 2,
      zIndex: 210,
    });

    this.heatRippleCircle1 = new google.maps.Circle({
      map: this.map,
      center: { lat: this.waypoints[0].lat, lng: this.waypoints[0].lng },
      radius: 20,
      fillColor: "#f59e0b",
      fillOpacity: 0.35,
      strokeColor: "#ea580c",
      strokeOpacity: 0.6,
      strokeWeight: 1.5,
      zIndex: 205,
    });

    this.heatRippleCircle2 = new google.maps.Circle({
      map: this.map,
      center: { lat: this.waypoints[0].lat, lng: this.waypoints[0].lng },
      radius: 35,
      fillColor: "#e11d48",
      fillOpacity: 0.18,
      strokeColor: "#ef4444",
      strokeOpacity: 0.4,
      strokeWeight: 1,
      zIndex: 200,
    });

    // 3. Blinking highlight markers over each camera pin
    this.waypoints.forEach((wp) => {
      const pulseSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
          <defs>
            <radialGradient id="camGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ef4444" stop-opacity="0.9" />
              <stop offset="40%" stop-color="#f59e0b" stop-opacity="0.6" />
              <stop offset="80%" stop-color="#ef4444" stop-opacity="0.2" />
              <stop offset="100%" stop-color="#ef4444" stop-opacity="0" />
            </radialGradient>
          </defs>
          <circle cx="30" cy="30" r="28" fill="url(#camGlow)" />
          <circle cx="30" cy="30" r="16" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-dasharray="4 2" />
          <circle cx="30" cy="30" r="8" fill="#ff1a1a" stroke="#ffffff" stroke-width="1.8" />
        </svg>
      `)}`;

      const marker = new google.maps.Marker({
        map: null, // invisible until activated
        position: { lat: wp.lat, lng: wp.lng },
        icon: {
          url: pulseSvg,
          scaledSize: new google.maps.Size(60, 60),
          anchor: new google.maps.Point(30, 30),
        },
        zIndex: 250,
      });
      this.cameraPulseMarkers.push(marker);
    });

    // 4. Moving Suspect Beacon Marker
    const targetSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="130" height="42" viewBox="0 0 130 42">
        <defs>
          <filter id="blipGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(239,68,68,0.7)"/>
          </filter>
        </defs>
        <!-- Background Pill Tag -->
        <g filter="url(#blipGlow)">
          <rect x="22" y="6" width="102" height="28" rx="14" fill="#0f172a" stroke="#ef4444" stroke-width="1.8" />
        </g>
        <text x="36" y="24" font-family="-apple-system,BlinkMacSystemFont,monospace" font-size="10" font-weight="900" fill="#ffffff" letter-spacing="0.5">
          HARIOM
        </text>
        <circle cx="96" cy="20" r="3" fill="#ef4444" />
        <text x="103" y="23" font-family="-apple-system,BlinkMacSystemFont,monospace" font-size="8" font-weight="700" fill="#f87171">
          TRK
        </text>

        <!-- Pulsing Red Crosshair Blip -->
        <circle cx="16" cy="20" r="14" fill="#ef4444" fill-opacity="0.3" />
        <circle cx="16" cy="20" r="8" fill="#ef4444" stroke="#ffffff" stroke-width="2" />
        <circle cx="16" cy="20" r="3" fill="#ffffff" />
        <line x1="2" y1="20" x2="30" y2="20" stroke="#ef4444" stroke-width="1.2" stroke-dasharray="2 2" />
        <line x1="16" y1="6" x2="16" y2="34" stroke="#ef4444" stroke-width="1.2" stroke-dasharray="2 2" />
      </svg>
    `)}`;

    this.targetMarker = new google.maps.Marker({
      map: this.map,
      position: { lat: this.waypoints[0].lat, lng: this.waypoints[0].lng },
      icon: {
        url: targetSvg,
        scaledSize: new google.maps.Size(130, 42),
        anchor: new google.maps.Point(16, 20),
      },
      zIndex: 300,
    });
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startTime = performance.now();
    this.tick(this.startTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public destroy() {
    this.stop();
    this.haloPolylines.forEach((p) => p.setMap(null));
    this.laserPolylines.forEach((p) => p.setMap(null));
    this.haloPolylines = [];
    this.laserPolylines = [];

    this.heatCoreCircle?.setMap(null);
    this.heatRippleCircle1?.setMap(null);
    this.heatRippleCircle2?.setMap(null);
    this.heatCoreCircle = null;
    this.heatRippleCircle1 = null;
    this.heatRippleCircle2 = null;

    this.targetMarker?.setMap(null);
    this.targetMarker = null;

    this.cameraPulseMarkers.forEach((m) => m.setMap(null));
    this.cameraPulseMarkers = [];
  }

  /**
   * Main animation loop executing 60fps linear interpolation & thermal pulse harmonics.
   */
  private tick = (currentTime: number) => {
    if (!this.isRunning) return;

    const totalCycle =
      this.DWELL_DURATION * 3 + // Dwell at audi2, audi3, SASET
      this.TRANSIT_DURATION * 3 + // Transit 1, 2, 3
      this.FINAL_HOLD_DURATION + // Hold at SITAICS
      this.RESET_PAUSE; // Quick loop restart

    const elapsed = (currentTime - this.startTime) % totalCycle;

    // Timeline schedule:
    // T0 -> T0 + DWELL: Node 0 (audi2) dwell
    // T1: Transit 0 (audi2 -> audi3) [2.0s]
    // T2: Node 1 (audi3) dwell [1.5s]
    // T3: Transit 1 (audi3 -> SASET) [2.0s]
    // T4: Node 2 (SASET) dwell [1.5s]
    // T5: Transit 2 (SASET -> SITAICS) [2.0s]
    // T6: Node 3 (SITAICS) dwell / hold [2.5s]
    // T7: Reset [0.4s]

    const t0 = 0;
    const t1 = t0 + this.DWELL_DURATION;
    const t2 = t1 + this.TRANSIT_DURATION;
    const t3 = t2 + this.DWELL_DURATION;
    const t4 = t3 + this.TRANSIT_DURATION;
    const t5 = t4 + this.DWELL_DURATION;
    const t6 = t5 + this.TRANSIT_DURATION;

    let activeNodeIndex = 0;
    let phase: "dwell" | "transit" | "hold" = "dwell";
    let legName = "audi2";
    let statusText = "Thermal Heat Bloom at audi2 Pin";
    let progress = 0;
    let currentPos = { lat: this.waypoints[0].lat, lng: this.waypoints[0].lng };

    // Update pulsing ground heat circles based on sinusoidal harmonics
    const pulseOsc = Math.sin((currentTime / 1000) * 3 * Math.PI); // oscillating ~1.5Hz
    const pulseRadiusBase = 16 + pulseOsc * 4; // 12m to 20m
    const rippleRadius = 26 + ((currentTime % 1400) / 1400) * 22; // 26m to 48m expanding
    const rippleOpacity = Math.max(0, 0.45 * (1 - (currentTime % 1400) / 1400));

    if (elapsed < t1) {
      // Phase 0: audi2 Dwell
      activeNodeIndex = 0;
      phase = "dwell";
      legName = "audi2";
      statusText = "Target detected at audi2 • Thermal signature locked";
      progress = elapsed / this.DWELL_DURATION;
      currentPos = { lat: this.waypoints[0].lat, lng: this.waypoints[0].lng };

      // Clear all vectors
      this.clearPolylines();
      this.setCameraPulseVisible(0);
    } else if (elapsed < t2) {
      // Phase 1: Transit 0 (audi2 -> audi3) [2 seconds]
      activeNodeIndex = 0;
      phase = "transit";
      legName = "audi2 ➔ audi3";
      progress = (elapsed - t1) / this.TRANSIT_DURATION;
      statusText = `Vector: audi2 → audi3 (${Math.round(progress * 100)}%)`;

      currentPos = this.interpolate(this.waypoints[0], this.waypoints[1], progress);
      this.setPolylinePath(0, [this.waypoints[0], currentPos]);
      this.clearPolyline(1);
      this.clearPolyline(2);
      this.setCameraPulseVisible(0);
    } else if (elapsed < t3) {
      // Phase 2: audi3 Dwell
      activeNodeIndex = 1;
      phase = "dwell";
      legName = "audi3";
      progress = (elapsed - t2) / this.DWELL_DURATION;
      statusText = "Target sighted at audi3 • Optical tracking active";
      currentPos = { lat: this.waypoints[1].lat, lng: this.waypoints[1].lng };

      this.setPolylinePath(0, [this.waypoints[0], this.waypoints[1]]);
      this.clearPolyline(1);
      this.clearPolyline(2);
      this.setCameraPulseVisible(1);
    } else if (elapsed < t4) {
      // Phase 3: Transit 1 (audi3 -> SASET) [2 seconds]
      activeNodeIndex = 1;
      phase = "transit";
      legName = "audi3 ➔ SASET";
      progress = (elapsed - t3) / this.TRANSIT_DURATION;
      statusText = `Vector: audi3 → SASET (${Math.round(progress * 100)}%)`;

      currentPos = this.interpolate(this.waypoints[1], this.waypoints[2], progress);
      this.setPolylinePath(0, [this.waypoints[0], this.waypoints[1]]);
      this.setPolylinePath(1, [this.waypoints[1], currentPos]);
      this.clearPolyline(2);
      this.setCameraPulseVisible(1);
    } else if (elapsed < t5) {
      // Phase 4: SASET Dwell
      activeNodeIndex = 2;
      phase = "dwell";
      legName = "SASET";
      progress = (elapsed - t4) / this.DWELL_DURATION;
      statusText = "Target sighted at SASET • Multi-sensor tracking";
      currentPos = { lat: this.waypoints[2].lat, lng: this.waypoints[2].lng };

      this.setPolylinePath(0, [this.waypoints[0], this.waypoints[1]]);
      this.setPolylinePath(1, [this.waypoints[1], this.waypoints[2]]);
      this.clearPolyline(2);
      this.setCameraPulseVisible(2);
    } else if (elapsed < t6) {
      // Phase 5: Transit 2 (SASET -> SITAICS) [2 seconds]
      activeNodeIndex = 2;
      phase = "transit";
      legName = "SASET ➔ SITAICS";
      progress = (elapsed - t5) / this.TRANSIT_DURATION;
      statusText = `Vector: SASET → SITAICS (${Math.round(progress * 100)}%)`;

      currentPos = this.interpolate(this.waypoints[2], this.waypoints[3], progress);
      this.setPolylinePath(0, [this.waypoints[0], this.waypoints[1]]);
      this.setPolylinePath(1, [this.waypoints[1], this.waypoints[2]]);
      this.setPolylinePath(2, [this.waypoints[2], currentPos]);
      this.setCameraPulseVisible(2);
    } else {
      // Phase 6: SITAICS Hold & Full Transgression Trail
      activeNodeIndex = 3;
      phase = "hold";
      legName = "SITAICS (Complete Trail)";
      progress = (elapsed - t6) / this.FINAL_HOLD_DURATION;
      statusText = "Breach complete at SITAICS • Full perimeter locked";
      currentPos = { lat: this.waypoints[3].lat, lng: this.waypoints[3].lng };

      this.setPolylinePath(0, [this.waypoints[0], this.waypoints[1]]);
      this.setPolylinePath(1, [this.waypoints[1], this.waypoints[2]]);
      this.setPolylinePath(2, [this.waypoints[2], this.waypoints[3]]);
      this.setCameraPulseVisible(3);
    }

    // Update target marker position
    if (this.targetMarker) {
      this.targetMarker.setPosition(currentPos);
    }

    // Update thermal heat circle center & animated radii
    const activeWp = this.waypoints[activeNodeIndex];
    if (this.heatCoreCircle) {
      this.heatCoreCircle.setCenter({ lat: activeWp.lat, lng: activeWp.lng });
      this.heatCoreCircle.setRadius(pulseRadiusBase);
    }
    if (this.heatRippleCircle1) {
      this.heatRippleCircle1.setCenter({ lat: activeWp.lat, lng: activeWp.lng });
      this.heatRippleCircle1.setRadius(rippleRadius);
      this.heatRippleCircle1.setOptions({ fillOpacity: rippleOpacity, strokeOpacity: rippleOpacity * 1.5 });
    }
    if (this.heatRippleCircle2) {
      this.heatRippleCircle2.setCenter({ lat: activeWp.lat, lng: activeWp.lng });
      this.heatRippleCircle2.setRadius(rippleRadius * 1.25);
      this.heatRippleCircle2.setOptions({ fillOpacity: rippleOpacity * 0.5, strokeOpacity: rippleOpacity * 0.8 });
    }

    // Calculate total displacement distance
    const totalDist =
      getDistanceMeters(this.waypoints[0].lat, this.waypoints[0].lng, this.waypoints[1].lat, this.waypoints[1].lng) +
      getDistanceMeters(this.waypoints[1].lat, this.waypoints[1].lng, this.waypoints[2].lat, this.waypoints[2].lng) +
      getDistanceMeters(this.waypoints[2].lat, this.waypoints[2].lng, this.waypoints[3].lat, this.waypoints[3].lng);

    // Telemetry callback
    if (this.onTelemetry) {
      this.onTelemetry({
        activeNodeIndex,
        activeNodeName: this.waypoints[activeNodeIndex].name,
        phase,
        legName,
        progress: Math.min(1, Math.max(0, progress)),
        statusText,
        elapsedSec: Math.round((elapsed / 1000) * 10) / 10,
        totalDistanceMeters: Math.round(totalDist),
      });
    }

    this.animFrameId = requestAnimationFrame(this.tick);
  };

  private interpolate(
    a: { lat: number; lng: number },
    b: { lat: number; lng: number },
    fraction: number
  ): { lat: number; lng: number } {
    return {
      lat: a.lat + (b.lat - a.lat) * fraction,
      lng: a.lng + (b.lng - a.lng) * fraction,
    };
  }

  private setPolylinePath(idx: number, pts: { lat: number; lng: number }[]) {
    if (this.haloPolylines[idx]) this.haloPolylines[idx].setPath(pts);
    if (this.laserPolylines[idx]) this.laserPolylines[idx].setPath(pts);
  }

  private clearPolyline(idx: number) {
    if (this.haloPolylines[idx]) this.haloPolylines[idx].setPath([]);
    if (this.laserPolylines[idx]) this.laserPolylines[idx].setPath([]);
  }

  private clearPolylines() {
    for (let i = 0; i < 3; i++) {
      this.clearPolyline(i);
    }
  }

  private setCameraPulseVisible(activeIndex: number) {
    this.cameraPulseMarkers.forEach((m, idx) => {
      m.setMap(idx === activeIndex ? this.map : null);
    });
  }

  /**
   * Smoothly pans and fits the viewport to encompass all 4 cameras in the trajectory.
   */
  public fitTrajectoryBounds() {
    const google = (window as any).google;
    if (!google?.maps || !this.map) return;
    const bounds = new google.maps.LatLngBounds();
    this.waypoints.forEach((wp) => {
      bounds.extend(new google.maps.LatLng(wp.lat, wp.lng));
    });
    this.map.fitBounds(bounds, { top: 70, bottom: 70, left: 70, right: 70 });
  }
}
