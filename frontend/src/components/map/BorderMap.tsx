"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  Camera,
  AlertTriangle,
  Navigation,
  RefreshCw,
  Layers,
  Shield,
  Flag,
  Compass,
  Check,
  Globe,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  Expand,
  Box,
  Flame,
  Filter,
  Video,
  Copy,
  X,
  Play,
  Pause,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Crosshair,
  Activity,
  Wifi,
  Eye,
  Search,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Camera as CameraEntity, CameraStatus, CameraType } from "@/types/camera";
import { useCameras } from "@/lib/camerasStore";
import { ALL_BORDER_CAMERAS } from "@/lib/borderCameras";
import { useAlerts } from "@/lib/alertsStore";
import { AlertItem } from "@/types/alert";
import {
  resolveSuspectWaypoints,
  SuspectTrailAnimator,
  TrajectoryTelemetry,
} from "./SuspectTrailOverlay";

const GOOGLE_MAPS_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  "AIzaSyBf6-zZna3bNFU7cBNeeHpYfVtrOrHa-d4";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Demo Alert Marker on International Border
const DEMO_ALERT = {
  id: "alert-1",
  name: "Sector-04 Intrusion Alert — RS Pura Border Fence",
  lat: 32.7240,
  lng: 74.6710,
  severity: "High",
};

export interface NeighborBorder {
  name: string;
  code: string;
  lengthKm: number;
  color: string;
  center: { lat: number; lng: number };
  zoom: number;
}

export const NEIGHBOR_BORDERS: NeighborBorder[] = [
  { name: "Pakistan", code: "PAK", lengthKm: 2725.8, color: "#dc2626", center: { lat: 29.5, lng: 72.0 }, zoom: 5.8 },
  { name: "China", code: "CHN", lengthKm: 3323.6, color: "#f59e0b", center: { lat: 31.5, lng: 86.0 }, zoom: 5.2 },
  { name: "Nepal", code: "NPL", lengthKm: 1756.2, color: "#10b981", center: { lat: 28.5, lng: 84.5 }, zoom: 6.8 },
  { name: "Bhutan", code: "BTN", lengthKm: 757.7, color: "#059669", center: { lat: 27.0, lng: 90.5 }, zoom: 7.8 },
  { name: "Bangladesh", code: "BGD", lengthKm: 4126.0, color: "#3b82f6", center: { lat: 24.5, lng: 89.5 }, zoom: 6.6 },
  { name: "Myanmar", code: "MMR", lengthKm: 1659.4, color: "#8b5cf6", center: { lat: 25.0, lng: 95.0 }, zoom: 6.2 },
];



interface BorderMapProps {
  initialMapType?: "hybrid" | "satellite" | "roadmap" | "terrain";
  onMapTypeChange?: (mapType: "hybrid" | "satellite" | "roadmap" | "terrain") => void;
  className?: string;
  height?: string;
  customCameras?: CameraEntity[];
  selectedCameraId?: string;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  interactive?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function BorderMap({
  initialMapType = "hybrid",
  onMapTypeChange,
  className = "",
  height = "560px",
  customCameras,
  selectedCameraId: propSelectedCameraId,
  onMapClick,
  center = { lat: 32.7240, lng: 74.6800 },
  zoom = 11.8,
  interactive = true,
  isFullscreen: isFullscreenProp,
  onToggleFullscreen,
}: BorderMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  const [mapType, setMapType] = useState<"hybrid" | "satellite" | "roadmap" | "terrain">(initialMapType);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fullscreen / Focus Mode state (supports controlled or uncontrolled)
  const [internalFullscreen, setInternalFullscreen] = useState(false);
  const isFocusMode = isFullscreenProp !== undefined ? isFullscreenProp : internalFullscreen;

  const toggleFocusMode = useCallback(() => {
    if (onToggleFullscreen) {
      onToggleFullscreen();
    } else {
      setInternalFullscreen((prev) => !prev);
    }
  }, [onToggleFullscreen]);

  const handleExit = useCallback(() => {
    if (typeof document !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    toggleFocusMode();
  }, [toggleFocusMode]);

  // Keyboard Escape listener to exit focus mode
  useEffect(() => {
    if (!isFocusMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleExit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocusMode, handleExit]);

  // International Border Layer state
  const [showBorders, setShowBorders] = useState(true);
  const [selectedNeighbor, setSelectedNeighbor] = useState<string>("All");
  const [isBordersLoaded, setIsBordersLoaded] = useState(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);

  // 3D Perspective & Heatmap states
  const [is3DMode, setIs3DMode] = useState<boolean>(false);
  const [showHeatmaps, setShowHeatmaps] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState<boolean>(true);

  // Active Selected Camera for Easy-Access Quick Inspection Drawer
  const [inspectedCamera, setInspectedCamera] = useState<CameraEntity | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Camera Types & Operational Status Filter Checkboxes
  const [filterTypes, setFilterTypes] = useState<Record<string, boolean>>({
    "Optical 4K": true,
    "Thermal FLIR": true,
    "Night Vision / IR": true,
    "PTZ 360": true,
    "ANPR Dedicated": true,
    "Panoramic": true,
    "Alert Active": true,
    "Offline / Degraded": true,
  });


  const { cameras: storeCameras } = useCameras();

  // Active cameras combined across whole border mesh (filtering out legacy central India points)
  const activeCameras = useMemo(() => {
    const isCentralIndiaLegacy = (c: any) => {
      if (!c) return true;
      if (["cam-1", "cam-2", "cam-3", "cam-4", "cam-5"].includes(c.id)) return true;
      const lat = Number(c.latitude ?? (c.coordinates ? c.coordinates[1] : 0));
      const lng = Number(c.longitude ?? (c.coordinates ? c.coordinates[0] : 0));
      // Exclude points in central India interior (lat 20.0-26.0, lng 75.0-82.0)
      return lat >= 20.0 && lat <= 26.0 && lng >= 75.0 && lng <= 82.0;
    };

    if (customCameras && customCameras.length > 0) {
      return customCameras.filter((c) => !isCentralIndiaLegacy(c));
    }

    const storeMap = new Map((storeCameras || []).map((c) => [c.id, c]));
    const base = ALL_BORDER_CAMERAS.map((c) => storeMap.get(c.id) || c);
    const extraFromStore = (storeCameras || []).filter(
      (c) =>
        !ALL_BORDER_CAMERAS.some((bc) => bc.id === c.id) &&
        !isCentralIndiaLegacy(c)
    );
    return [...base, ...extraFromStore].filter((c) => !isCentralIndiaLegacy(c));
  }, [customCameras, storeCameras]);

  // Filtered cameras based on time & type filter checkboxes
  const filteredCameras = useMemo(() => {
    return activeCameras.filter((cam) => {
      const type = cam.type || "Optical 4K";
      if (filterTypes[type] === false) return false;

      if (cam.status === "alert" && filterTypes["Alert Active"] === false) return false;
      if (
        (cam.status === "degraded" || cam.status === "offline") &&
        filterTypes["Offline / Degraded"] === false
      ) {
        return false;
      }

      return true;
    });
  }, [activeCameras, filterTypes]);

  // =========================================================================
  // SUSPECT TRAJECTORY TRAIL ANIMATION (audi2 -> audi3 -> SASET -> SITAICS)
  // Triggered automatically when alert for 'hariom' appears (or via toggle)
  // =========================================================================
  const { alerts } = useAlerts();

  const hasHariomAlert = useMemo(() => {
    return alerts.some((a) => {
      const sName = (a.suspectName || "").toLowerCase();
      const title = (a.title || "").toLowerCase();
      const notes = (a.notes || "").toLowerCase();
      return (
        sName.includes("hariom") ||
        title.includes("hariom") ||
        notes.includes("hariom")
      );
    });
  }, [alerts]);

  const [manualTrailActive, setManualTrailActive] = useState<boolean>(false);
  const isTrailActive = hasHariomAlert || manualTrailActive;

  const animatorRef = useRef<SuspectTrailAnimator | null>(null);
  const [telemetry, setTelemetry] = useState<TrajectoryTelemetry | null>(null);

  const waypoints = useMemo(() => {
    return resolveSuspectWaypoints(activeCameras);
  }, [activeCameras]);

  const trailProgressPercent = useMemo(() => {
    if (!telemetry || waypoints.length <= 1) return 0;
    if (telemetry.phase === "hold") return 100;
    const totalLegs = waypoints.length - 1;
    const legWeight = 100 / totalLegs;
    const base = telemetry.activeNodeIndex * legWeight;
    const currentTransit =
      telemetry.phase === "transit" ? (telemetry.progress || 0) * legWeight : 0;
    return Math.min(100, Math.max(0, Math.round(base + currentTransit)));
  }, [telemetry, waypoints.length]);

  const handleFocusTrajectory = useCallback(() => {
    if (animatorRef.current) {
      animatorRef.current.fitTrajectoryBounds();
      showToast("Focused on Suspect Transgression Trail");
    } else if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: 23.1534, lng: 72.8860 });
      mapInstanceRef.current.setZoom(17.5);
    }
  }, []);

  // Initialize and run trajectory animator when trail is active
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    if (isTrailActive) {
      if (animatorRef.current) {
        animatorRef.current.destroy();
      }
      const animator = new SuspectTrailAnimator(
        mapInstanceRef.current,
        waypoints,
        (t) => setTelemetry(t)
      );
      animatorRef.current = animator;
      animator.start();
      showToast("🚨 Suspect Trajectory Active: Target HARIOM");
    } else {
      if (animatorRef.current) {
        animatorRef.current.destroy();
        animatorRef.current = null;
        setTelemetry(null);
      }
    }

    return () => {
      if (animatorRef.current) {
        animatorRef.current.destroy();
        animatorRef.current = null;
      }
    };
  }, [isTrailActive, waypoints, isLoaded]);

  // Auto-focus on trajectory when hariom alert first appears
  const previousAlertRef = useRef(false);
  useEffect(() => {
    if (hasHariomAlert && !previousAlertRef.current && isLoaded) {
      setTimeout(() => {
        animatorRef.current?.fitTrajectoryBounds();
      }, 500);
    }
    previousAlertRef.current = hasHariomAlert;
  }, [hasHariomAlert, isLoaded]);

  // Load Google Maps Script & Initialize
  useEffect(() => {
    let isMounted = true;

    if (!GOOGLE_MAPS_KEY) {
      setLoadError(
        "Google Maps is not configured. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to an HTTP-referrer-restricted key."
      );
      return () => {
        isMounted = false;
      };
    }

    function loadScript(): Promise<void> {
      if (typeof window !== "undefined" && (window as any).google?.maps) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        const existingScript = document.getElementById("google-maps-api-script");
        if (existingScript) {
          existingScript.addEventListener("load", () => resolve());
          existingScript.addEventListener("error", () =>
            reject(new Error("Failed to load Google Maps script"))
          );
          return;
        }

        const script = document.createElement("script");
        script.id = "google-maps-api-script";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error("Google Maps script failed to load."));
        document.head.appendChild(script);
      });
    }

    loadScript()
      .then(() => {
        if (!isMounted || !mapContainerRef.current) return;

        const google = (window as any).google;

        // Initialize Google Map centered over tactical coordinates
        const map = new google.maps.Map(mapContainerRef.current, {
          center,
          zoom,
          mapTypeId: mapType,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: true,
          fullscreenControl: false,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        mapInstanceRef.current = map;

        // 1. Setup InfoWindow for International Borders
        const borderInfoWindow = new google.maps.InfoWindow({ maxWidth: 280 });

        // 2. Load Survey of India International Land Borders GeoJSON into map.data
        fetch("/data/india_borders.geojson")
          .then((res) => {
            if (!res.ok) throw new Error("Could not load /data/india_borders.geojson");
            return res.json();
          })
          .then((geoJsonData) => {
            if (!isMounted || !mapInstanceRef.current) return;
            map.data.addGeoJson(geoJsonData);
            setIsBordersLoaded(true);

            // Add interactive border hover & click handlers
            map.data.addListener("mouseover", (event: any) => {
              map.data.overrideStyle(event.feature, {
                strokeWeight: 4.5,
                strokeOpacity: 1.0,
              });
            });

            map.data.addListener("mouseout", () => {
              map.data.revertStyle();
            });

            map.data.addListener("click", (event: any) => {
              const neighbor = event.feature.getProperty("NEIGHBOR");
              const lenKm = event.feature.getProperty("LEN_KM");
              const color = event.feature.getProperty("strokeColor") || "#10b981";
              const source = event.feature.getProperty("SOURCE") || "Survey of India";

              const content = `
                <div style="font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','SF Pro Display',system-ui,sans-serif; padding:6px 2px; min-width:220px;">
                  <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                    <span style="font-size:10px; font-weight:800; text-transform:uppercase; color:${color}; background:${color}15; padding:2px 6px; border-radius:4px;">
                      ${escapeHtml(source)}
                    </span>
                    <span style="font-size:10px; color:#64748b; font-family:'SF Mono',SFMono-Regular,ui-monospace,Menlo,monospace;">WGS 84</span>
                  </div>
                  <h4 style="margin:0 0 4px; font-size:13px; font-weight:800; color:#0f172a;">
                    🇮🇳 India — ${escapeHtml(neighbor)} Border
                  </h4>
                  <div style="font-size:11px; color:#475569; margin-bottom:8px; line-height:1.5;">
                    <div><strong>Frontier Length:</strong> <span style="font-weight:700; color:#0f172a;">${Number(lenKm).toLocaleString()} km</span></div>
                    <div><strong>Type:</strong> International Land Boundary</div>
                    <div><strong>Status:</strong> MAATRIX Grid Active</div>
                  </div>
                </div>
              `;

              borderInfoWindow.setContent(content);
              borderInfoWindow.setPosition(event.latLng);
              borderInfoWindow.open(map);
            });
          })
          .catch((err) => {
            console.warn("Failed to load India borders GeoJSON:", err);
          });

        setIsLoaded(true);
      })
      .catch((err) => {
        if (isMounted) {
          setLoadError(err.message || "Failed to initialize Google Maps.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync International Border Styling & Visibility whenever showBorders or selectedNeighbor changes
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded || !isBordersLoaded) return;
    const map = mapInstanceRef.current;

    map.data.setStyle((feature: any) => {
      const neighbor = feature.getProperty("NEIGHBOR");
      const isNeighborMatch = selectedNeighbor === "All" || selectedNeighbor === neighbor;
      const isVisible = showBorders && isNeighborMatch;
      const color = feature.getProperty("strokeColor") || "#10b981";

      return {
        strokeColor: color,
        strokeWeight: selectedNeighbor === neighbor ? 4 : 2.75,
        strokeOpacity: isVisible ? 0.95 : 0,
        visible: isVisible,
        clickable: isVisible,
      };
    });
  }, [showBorders, selectedNeighbor, isLoaded, isBordersLoaded]);

  // Update onMapClick listener
  useEffect(() => {
    if (!mapInstanceRef.current || !(window as any).google?.maps) return;
    const map = mapInstanceRef.current;

    if (clickListenerRef.current) {
      (window as any).google.maps.event.removeListener(clickListenerRef.current);
      clickListenerRef.current = null;
    }

    if (onMapClick) {
      clickListenerRef.current = map.addListener("click", (e: any) => {
        if (e.latLng) {
          onMapClick({
            lat: Number(e.latLng.lat().toFixed(4)),
            lng: Number(e.latLng.lng().toFixed(4)),
          });
        }
      });
    }

    return () => {
      if (clickListenerRef.current) {
        (window as any).google.maps.event.removeListener(clickListenerRef.current);
      }
    };
  }, [onMapClick, isLoaded]);

  // Color helper for 3D Camera Pins & Ground Heatmaps
  const getCameraVisuals = useCallback((cam: CameraEntity) => {
    if (cam.status === "alert") {
      return {
        pinTop: "#ef4444",
        pinBottom: "#b91c1c",
        heatCenter: "rgba(239, 68, 68, 0.95)",
        heatMid: "rgba(245, 158, 11, 0.70)",
        heatOuter: "rgba(34, 197, 94, 0.25)",
        label: "Critical Alert",
      };
    }
    if (cam.status === "degraded") {
      return {
        pinTop: "#f59e0b",
        pinBottom: "#b45309",
        heatCenter: "rgba(245, 158, 11, 0.95)",
        heatMid: "rgba(239, 68, 68, 0.65)",
        heatOuter: "rgba(16, 185, 129, 0.20)",
        label: "Degraded Stream",
      };
    }
    if (cam.status === "offline") {
      return {
        pinTop: "#94a3b8",
        pinBottom: "#475569",
        heatCenter: "rgba(148, 163, 184, 0.60)",
        heatMid: "rgba(100, 116, 139, 0.30)",
        heatOuter: "rgba(0, 0, 0, 0.05)",
        label: "Offline",
      };
    }

    // Online by camera type
    switch (cam.type) {
      case "Thermal FLIR":
        return {
          pinTop: "#38bdf8",
          pinBottom: "#0284c7",
          heatCenter: "rgba(56, 189, 248, 0.95)",
          heatMid: "rgba(99, 102, 241, 0.60)",
          heatOuter: "rgba(234, 179, 8, 0.25)",
          label: "Thermal FLIR",
        };
      case "Night Vision / IR":
        return {
          pinTop: "#818cf8",
          pinBottom: "#4338ca",
          heatCenter: "rgba(129, 140, 248, 0.95)",
          heatMid: "rgba(16, 185, 129, 0.60)",
          heatOuter: "rgba(239, 68, 68, 0.25)",
          label: "Night Vision IR",
        };
      case "PTZ 360":
        return {
          pinTop: "#f59e0b",
          pinBottom: "#b45309",
          heatCenter: "rgba(245, 158, 11, 0.95)",
          heatMid: "rgba(239, 68, 68, 0.65)",
          heatOuter: "rgba(16, 185, 129, 0.25)",
          label: "PTZ 360 Turret",
        };
      case "ANPR Dedicated":
        return {
          pinTop: "#0ea5e9",
          pinBottom: "#0369a1",
          heatCenter: "rgba(14, 165, 233, 0.95)",
          heatMid: "rgba(245, 158, 11, 0.60)",
          heatOuter: "rgba(16, 185, 129, 0.25)",
          label: "ANPR Scanner",
        };
      case "Panoramic":
        return {
          pinTop: "#10b981",
          pinBottom: "#047857",
          heatCenter: "rgba(16, 185, 129, 0.95)",
          heatMid: "rgba(234, 179, 8, 0.65)",
          heatOuter: "rgba(239, 68, 68, 0.20)",
          label: "Panoramic Sensor",
        };
      case "Optical 4K":
      default:
        return {
          pinTop: "#22c55e",
          pinBottom: "#15803d",
          heatCenter: "rgba(34, 197, 94, 0.95)",
          heatMid: "rgba(234, 179, 8, 0.70)",
          heatOuter: "rgba(239, 68, 68, 0.25)",
          label: "Optical 4K Online",
        };
    }
  }, []);

  // Render / Update 3D Camera Markers with Camera Symbols & Ground Heatmap Blobs
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded || !(window as any).google?.maps) return;
    const google = (window as any).google;
    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    filteredCameras.forEach((cam) => {
      const lat = Number(cam.latitude ?? (cam.coordinates ? cam.coordinates[1] : 0));
      const lng = Number(cam.longitude ?? (cam.coordinates ? cam.coordinates[0] : 0));
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

      const isSelected = cam.id === inspectedCamera?.id || cam.id === propSelectedCameraId;
      const color = getCameraVisuals(cam);

      // Total dimensions of the compound SVG marker
      const svgW = 76;
      const svgH = 82;
      const cx = 38;
      const groundY = 72; // Contact point on ground
      const pinTipY = 68;
      const pinCenterY = 32;

      // Compound SVG: Radial Ground Heatmap + Realistic Shadow + 3D Elevated Pin with Camera Symbol
      const markerSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
          <defs>
            <!-- Radial Ground Heatmap Gradient (Matching Reference Screenshot) -->
            <radialGradient id="heat-${cam.id}" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="${color.heatCenter}" stop-opacity="${showHeatmaps ? "0.95" : "0"}" />
              <stop offset="45%" stop-color="${color.heatMid}" stop-opacity="${showHeatmaps ? "0.75" : "0"}" />
              <stop offset="75%" stop-color="${color.heatOuter}" stop-opacity="${showHeatmaps ? "0.35" : "0"}" />
              <stop offset="100%" stop-color="${color.heatOuter}" stop-opacity="0" />
            </radialGradient>

            <!-- 3D Shading Gradient for Pin Body -->
            <linearGradient id="pinGrad-${cam.id}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${color.pinTop}" />
              <stop offset="100%" stop-color="${color.pinBottom}" />
            </linearGradient>

            <!-- Drop Shadow Filter -->
            <filter id="shadow-${cam.id}" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="rgba(0,0,0,0.5)"/>
            </filter>
          </defs>

          <!-- 1. Radial Ground Heatmap Disk (centered at ground anchor) -->
          ${showHeatmaps ? `<ellipse cx="${cx}" cy="${groundY}" rx="${isSelected ? "36" : "32"}" ry="${isSelected ? "13" : "11"}" fill="url(#heat-${cam.id})" />` : ""}

          <!-- 2. Realistic Ground Shadow under pin contact point -->
          <ellipse cx="${cx}" cy="${groundY}" rx="12" ry="4" fill="rgba(0,0,0,0.55)" />

          <!-- 3. Pulsing Alert Ring for Threats -->
          ${
            cam.status === "alert"
              ? `<ellipse cx="${cx}" cy="${groundY}" rx="30" ry="10" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="4,4" opacity="0.9" />`
              : ""
          }

          <!-- 4. Elevated 3D Teardrop Pin Body -->
          <g filter="url(#shadow-${cam.id})">
            <path d="M ${cx} ${pinTipY} 
                     C ${cx - 6} ${pinTipY - 8}, ${cx - 18} ${pinCenterY + 12}, ${cx - 18} ${pinCenterY} 
                     A 18 18 0 1 1 ${cx + 18} ${pinCenterY} 
                     C ${cx + 18} ${pinCenterY + 12}, ${cx + 6} ${pinTipY - 8}, ${cx} ${pinTipY} Z" 
                  fill="url(#pinGrad-${cam.id})" 
                  stroke="#ffffff" 
                  stroke-width="${isSelected ? "2.6" : "1.8"}" />

            <!-- White Inner Circular Lens Badge -->
            <circle cx="${cx}" cy="${pinCenterY}" r="10.5" fill="#ffffff" />
            <circle cx="${cx}" cy="${pinCenterY}" r="9.2" fill="${color.pinTop}" fill-opacity="0.12" stroke="${color.pinTop}" stroke-width="0.7" />

            <!-- CAMERA SYMBOL INSIDE PIN (Replacing Cars) -->
            <g transform="translate(${cx - 7.5}, ${pinCenterY - 7.5}) scale(0.75)">
              <path d="M16 5h-3.2l-1.5-2H6.7L5.2 5H2C0.9 5 0 5.9 0 7v9c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2z" fill="${color.pinBottom}" />
              <circle cx="9" cy="11.5" r="3.6" fill="#ffffff" />
              <circle cx="9" cy="11.5" r="2.2" fill="${color.pinBottom}" />
              <!-- Lens reflection glint -->
              <circle cx="8.1" cy="10.6" r="0.9" fill="#ffffff" />
            </g>
          </g>
        </svg>
      `)}`;

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        title: cam.name,
        zIndex: isSelected ? 999 : cam.status === "alert" ? 500 : 100,
        icon: {
          url: markerSvg,
          scaledSize: new google.maps.Size(svgW, svgH),
          anchor: new google.maps.Point(cx, groundY),
        },
      });

      marker.addListener("click", () => {
        setInspectedCamera(cam);
        map.panTo({ lat, lng });
      });

      markersRef.current.push(marker);
    });
  }, [filteredCameras, inspectedCamera, propSelectedCameraId, showHeatmaps, getCameraVisuals, isLoaded]);

  // Sync MapType when parent prop changes
  useEffect(() => {
    if (initialMapType && initialMapType !== mapType) {
      setMapType(initialMapType);
      if (mapInstanceRef.current && (window as any).google?.maps) {
        mapInstanceRef.current.setMapTypeId(initialMapType);
      }
    }
  }, [initialMapType]);

  // Handle 3D Perspective Tilt on Google Map
  const handleToggle3D = () => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    if (!is3DMode) {
      // Switch to hybrid / satellite for 3D aerial photography
      if (mapType === "roadmap" || mapType === "terrain") {
        setMapType("hybrid");
        map.setMapTypeId("hybrid");
      }
      map.setTilt(45);
      map.setHeading(25);
      setIs3DMode(true);
      showToast("3D Perspective Tilt Activated (45° Pitch)");
    } else {
      map.setTilt(0);
      map.setHeading(0);
      setIs3DMode(false);
      showToast("Returned to Top-Down 2D View");
    }
  };

  // Sync MapType switch
  const handleMapTypeChange = (type: "hybrid" | "satellite" | "roadmap" | "terrain") => {
    setMapType(type);
    if (onMapTypeChange) onMapTypeChange(type);
    if (mapInstanceRef.current && (window as any).google?.maps) {
      mapInstanceRef.current.setMapTypeId(type);
    }
  };

  // Reset View to Pan-India
  const handleResetView = () => {
    if (!mapInstanceRef.current || !(window as any).google?.maps) return;
    mapInstanceRef.current.setCenter(center);
    mapInstanceRef.current.setZoom(zoom);
    if (is3DMode) {
      mapInstanceRef.current.setTilt(0);
      mapInstanceRef.current.setHeading(0);
      setIs3DMode(false);
    }
  };

  // Focus a specific neighbor border
  const handleFocusNeighbor = (border: NeighborBorder) => {
    if (!mapInstanceRef.current || !(window as any).google?.maps) return;
    setSelectedNeighbor(border.name);
    mapInstanceRef.current.setCenter(border.center);
    mapInstanceRef.current.setZoom(border.zoom);
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    showToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Resolve active alert and real threat snapshot for inspected camera
  const inspectedAlert = useMemo(() => {
    if (!inspectedCamera) return null;
    const camId = (inspectedCamera.id || "").toLowerCase().trim();
    const camName = (inspectedCamera.name || "").toLowerCase().trim();

    const matches = (a: AlertItem) => {
      const aId = (a.cameraId || "").toLowerCase().trim();
      const aName = (a.cameraName || "").toLowerCase().trim();
      const aLoc = (a.location || "").toLowerCase().trim();
      return (
        (aId && (aId === camId || camId.includes(aId) || aId.includes(camId))) ||
        (aName && (aName === camName || camName.includes(aName) || aName.includes(camName))) ||
        (aLoc && (aLoc.includes(camName) || aLoc.includes(camId)))
      );
    };

    // 1. Alert with real snapshot from store
    const withSnapshot = alerts.find((a) => matches(a) && Boolean(a.snapshotUrl));
    if (withSnapshot) return withSnapshot;

    // 2. Any alert for this camera
    const directAny = alerts.find(matches);
    if (directAny) return directAny;

    // 3. Fallback to known real camera snapshots for key surveillance perimeters
    const fallbackSnapshots: Record<
      string,
      {
        snapshotUrl: string;
        suspectName: string;
        threatLevel: string;
        confidence: number;
        notes: string;
        category: string;
      }
    > = {
      "bop-jk-05": {
        snapshotUrl: "/api/alerts/snapshots/alert_1789073825609_bop-jk-05.jpg",
        suspectName: "Hariom",
        threatLevel: "CRITICAL",
        confidence: 0.68,
        notes: "Biometric facial match on feed SASET",
        category: "Wanted / BOLO",
      },
      "saset": {
        snapshotUrl: "/api/alerts/snapshots/alert_1789073825609_bop-jk-05.jpg",
        suspectName: "Hariom",
        threatLevel: "CRITICAL",
        confidence: 0.68,
        notes: "Biometric facial match on feed SASET",
        category: "Wanted / BOLO",
      },
      "bop-jk-03": {
        snapshotUrl: "/api/alerts/snapshots/alert_1789074007750_bop-jk-03.jpg",
        suspectName: "Hariom",
        threatLevel: "CRITICAL",
        confidence: 0.55,
        notes: "Biometric facial match on feed Audi 3",
        category: "Wanted / BOLO",
      },
      "audi3": {
        snapshotUrl: "/api/alerts/snapshots/alert_1789074007750_bop-jk-03.jpg",
        suspectName: "Hariom",
        threatLevel: "CRITICAL",
        confidence: 0.55,
        notes: "Biometric facial match on feed Audi 3",
        category: "Wanted / BOLO",
      },
      "bop-jk-02": {
        snapshotUrl: "/api/alerts/snapshots/alert_1789069541646_bop-jk-02.jpg",
        suspectName: "Hariom",
        threatLevel: "CRITICAL",
        confidence: 0.61,
        notes: "Biometric facial match on feed Audi 2",
        category: "Wanted / BOLO",
      },
      "audi2": {
        snapshotUrl: "/api/alerts/snapshots/alert_1789069541646_bop-jk-02.jpg",
        suspectName: "Hariom",
        threatLevel: "CRITICAL",
        confidence: 0.61,
        notes: "Biometric facial match on feed Audi 2",
        category: "Wanted / BOLO",
      },
      "bop-jk-04": {
        snapshotUrl: "/api/alerts/snapshots/alert_1789073992456_bop-jk-04.jpg",
        suspectName: "Hariom",
        threatLevel: "CRITICAL",
        confidence: 0.91,
        notes: "Biometric facial match on feed SITAICS",
        category: "Wanted / BOLO",
      },
      "sitaics": {
        snapshotUrl: "/api/alerts/snapshots/alert_1789073992456_bop-jk-04.jpg",
        suspectName: "Hariom",
        threatLevel: "CRITICAL",
        confidence: 0.91,
        notes: "Biometric facial match on feed SITAICS",
        category: "Wanted / BOLO",
      },
      "bop-jk-01": {
        snapshotUrl: "/api/alerts/snapshots/alert_1789073601558_bop-jk-01.jpg",
        suspectName: "Hariom",
        threatLevel: "CRITICAL",
        confidence: 0.72,
        notes: "Biometric facial match on feed Audi 1",
        category: "Wanted / BOLO",
      },
      "audi1": {
        snapshotUrl: "/api/alerts/snapshots/alert_1789073601558_bop-jk-01.jpg",
        suspectName: "Hariom",
        threatLevel: "CRITICAL",
        confidence: 0.72,
        notes: "Biometric facial match on feed Audi 1",
        category: "Wanted / BOLO",
      },
    };

    for (const [k, v] of Object.entries(fallbackSnapshots)) {
      if (camId === k || camName === k || camId.includes(k) || camName.includes(k)) {
        return {
          id: `threat-${k}`,
          title: `🚨 SUSPECT SIGHTING: ${v.suspectName.toUpperCase()}`,
          location: inspectedCamera.location,
          time: "Just now",
          timestamp: Date.now(),
          severity: "High",
          cameraId: inspectedCamera.id,
          cameraName: inspectedCamera.name,
          snapshotUrl: v.snapshotUrl,
          suspectName: v.suspectName,
          threatLevel: v.threatLevel,
          confidence: v.confidence,
          notes: v.notes,
          category: v.category,
        } as AlertItem;
      }
    }

    return null;
  }, [inspectedCamera, alerts]);

  // Resolve threat snapshot URL
  const threatSnapshotUrl = useMemo(() => {
    if (!inspectedAlert?.snapshotUrl) return null;
    const url = inspectedAlert.snapshotUrl;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const backendBase =
      process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000";
    return `${backendBase}${url.startsWith("/") ? "" : "/"}${url}`;
  }, [inspectedAlert]);

  // Feed View Mode: "snapshot" or "live"
  const [feedViewMode, setFeedViewMode] = useState<"snapshot" | "live">("snapshot");
  const [snapshotImgSrc, setSnapshotImgSrc] = useState<string | null>(null);

  useEffect(() => {
    if (inspectedCamera?.status === "alert" || inspectedAlert?.snapshotUrl) {
      setFeedViewMode("snapshot");
    } else {
      setFeedViewMode("live");
    }
  }, [inspectedCamera?.id, inspectedAlert?.snapshotUrl]);

  useEffect(() => {
    if (threatSnapshotUrl) {
      setSnapshotImgSrc(threatSnapshotUrl);
    } else {
      setSnapshotImgSrc(null);
    }
  }, [threatSnapshotUrl]);

  const handleSnapshotError = () => {
    if (inspectedAlert?.snapshotUrl) {
      const filename = inspectedAlert.snapshotUrl.split("/").pop();
      if (filename && snapshotImgSrc !== `/snapshots/${filename}`) {
        setSnapshotImgSrc(`/snapshots/${filename}`);
      }
    }
  };

  // Live Stream Canvas Simulation inside Inspection Drawer
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thermalPalette, setThermalPalette] = useState<"rgb" | "flir" | "night">("rgb");
  const [isFeedPlaying, setIsFeedPlaying] = useState<boolean>(true);

  useEffect(() => {
    if (!canvasRef.current || !inspectedCamera) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let tick = 0;

    const renderFeed = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Base background tone depending on thermalPalette
      if (thermalPalette === "flir") {
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, "#1e1035");
        grad.addColorStop(0.5, "#4c1d95");
        grad.addColorStop(1, "#c2410c");
        ctx.fillStyle = grad;
      } else if (thermalPalette === "night") {
        ctx.fillStyle = "#052e16";
      } else {
        ctx.fillStyle = "#0f172a";
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle surveillance grid lines
      ctx.strokeStyle =
        thermalPalette === "night"
          ? "rgba(34, 197, 94, 0.15)"
          : thermalPalette === "flir"
          ? "rgba(251, 146, 60, 0.15)"
          : "rgba(148, 163, 184, 0.12)";
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Center crosshair
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy);
      ctx.lineTo(cx + 20, cy);
      ctx.moveTo(cx, cy - 20);
      ctx.lineTo(cx, cy + 20);
      ctx.stroke();

      // Only draw target bounding box if camera is actively in alert status
      if (inspectedCamera.status === "alert") {
        const targetX = cx + Math.sin(tick * 0.03) * 60 - 35;
        const targetY = cy + Math.cos(tick * 0.02) * 35 - 15;
        const boxColor = "#ef4444";

        // Target AI Bounding Box
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(targetX, targetY, 70, 54);

        // Corner ticks
        ctx.fillStyle = boxColor;
        ctx.fillRect(targetX - 2, targetY - 2, 6, 2);
        ctx.fillRect(targetX - 2, targetY - 2, 2, 6);
        ctx.fillRect(targetX + 66, targetY - 2, 6, 2);
        ctx.fillRect(targetX + 70, targetY - 2, 2, 6);
        ctx.fillRect(targetX - 2, targetY + 54, 6, 2);
        ctx.fillRect(targetX - 2, targetY + 50, 2, 6);
        ctx.fillRect(targetX + 66, targetY + 54, 6, 2);
        ctx.fillRect(targetX + 70, targetY + 50, 2, 6);

        // Real suspect name label tag
        const suspectLabel = inspectedAlert?.suspectName
          ? `TARGET: ${inspectedAlert.suspectName.toUpperCase()}`
          : "TARGET INTERCEPT";
        ctx.fillStyle = boxColor;
        ctx.fillRect(targetX, targetY - 16, Math.max(76, suspectLabel.length * 6.5 + 8), 14);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px monospace";
        ctx.fillText(suspectLabel, targetX + 4, targetY - 5);

        // Confidence
        const confText = inspectedAlert?.confidence
          ? `CONF: ${Math.round(inspectedAlert.confidence * 100)}%`
          : "PERSON 98%";
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = "8px monospace";
        ctx.fillText(confText, targetX + 4, targetY + 68);
      }

      // Top-left OSD overlay
      ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
      ctx.fillRect(8, 8, 150, 44);
      ctx.fillStyle = inspectedCamera.status === "alert" ? "#ef4444" : "#22c55e";
      ctx.beginPath();
      ctx.arc(18, 20, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px monospace";
      ctx.fillText(`CAM: ${inspectedCamera.id.toUpperCase()}`, 26, 24);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "9px monospace";
      ctx.fillText(`${inspectedCamera.resolution || "1080p"} • ${inspectedCamera.fps || 30} FPS`, 16, 36);
      ctx.fillText(`LATENCY: ${inspectedCamera.healthStats?.latencyMs || 42}ms`, 16, 46);

      // Blinking REC dot top right
      if (Math.floor(tick / 30) % 2 === 0) {
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(canvas.width - 32, 18, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px monospace";
        ctx.fillText("REC", canvas.width - 24, 22);
      }

      if (isFeedPlaying) {
        animFrame = requestAnimationFrame(renderFeed);
      }
    };

    renderFeed();

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [inspectedCamera, thermalPalette, isFeedPlaying, inspectedAlert]);

  return (
    <div
      className={
        isFocusMode
          ? `fixed inset-0 z-[100] w-screen h-screen bg-slate-950 flex flex-col overflow-hidden animate-in fade-in duration-200 ${className}`
          : `bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col ${className}`
      }
    >
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-white/95 text-[#1b5032] border border-[#c4ded0] rounded-xl text-xs font-bold shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#1b5032]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Standard Map Header (Shown only when NOT in focus mode) */}
      {!isFocusMode && (
        <div className="p-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Google Maps 3D Tactical Camera Surveillance</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-800 font-semibold">
                3D Grid
              </span>
            </h2>
            <span
              suppressHydrationWarning
              className="hidden sm:inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 font-semibold"
            >
              {filteredCameras.length} Nodes Active
            </span>
          </div>

          {/* Tactical Controls (Layers, 3D Tilt, Heatmap, Border Toggle, Focus Map) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 3D Perspective Tilt Button */}
            <button
              type="button"
              onClick={handleToggle3D}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-xl transition-all border cursor-pointer ${
                is3DMode
                  ? "bg-[#1e4b38] text-white border-emerald-700 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
              title="Toggle Google Maps 3D Oblique Perspective Tilt (45°)"
            >
              <Box className={`w-3.5 h-3.5 ${is3DMode ? "text-emerald-400" : "text-slate-500"}`} />
              <span>{is3DMode ? "3D Active" : "3D View"}</span>
            </button>

            {/* Heatmap Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setShowHeatmaps(!showHeatmaps);
                showToast(showHeatmaps ? "Ground Heatmaps Hidden" : "Ground Heatmaps Active");
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-xl transition-all border cursor-pointer ${
                showHeatmaps
                  ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
              title="Toggle Glowing Radial Heatmaps under Camera Pins"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Heat</span>
            </button>

            {/* Floating Filter Panels Toggle Button */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-xl transition-all border cursor-pointer ${
                showFilters
                  ? "bg-slate-900 text-white border-slate-800"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
              title="Toggle Time & Detection Filter Panels"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            {/* Border Layer Toggle Button */}
            <button
              type="button"
              onClick={() => setShowBorders(!showBorders)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-xl transition-all border cursor-pointer ${
                showBorders
                  ? "bg-[#1e4b38] text-white border-emerald-700 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
              title="Toggle Survey of India International Land Borders"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>🇮🇳 Borders</span>
              {showBorders && <Check className="w-3 h-3 text-emerald-300" />}
            </button>

            {/* Map Layer Mode buttons */}
            <div className="inline-flex p-1 rounded-xl bg-slate-200/60 border border-slate-300/60 text-xs font-semibold">
              {(
                [
                  { id: "hybrid", label: "Hybrid" },
                  { id: "satellite", label: "Satellite" },
                  { id: "terrain", label: "Terrain" },
                  { id: "roadmap", label: "Roadmap" },
                ] as const
              ).map((layer) => (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => handleMapTypeChange(layer.id)}
                  className={`px-2.5 py-1 rounded-lg transition-all text-[11px] font-medium cursor-pointer ${
                    mapType === layer.id
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {layer.label}
                </button>
              ))}
            </div>

            {/* Suspect Trajectory Animation Button */}
            <button
              type="button"
              onClick={() => {
                setManualTrailActive((prev) => !prev);
                if (!manualTrailActive) {
                  setTimeout(handleFocusTrajectory, 300);
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-xl transition-all border cursor-pointer ${
                isTrailActive
                  ? "bg-red-600 text-white border-red-500 shadow-md ring-2 ring-red-500/20"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
              title={
                hasHariomAlert
                  ? "Suspect Sighting Active: HARIOM (Auto-triggered)"
                  : "Toggle Suspect Transgression Trail (HARIOM)"
              }
            >
              <Navigation className={`w-3.5 h-3.5 ${isTrailActive ? "text-white animate-pulse" : "text-red-500"}`} />
              <span>{isTrailActive ? "Trail Active" : "Suspect Trail"}</span>
              {hasHariomAlert && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              )}
            </button>

            {/* Reset Center button */}
            <button
              type="button"
              onClick={handleResetView}
              title="Reset Map to Pan-India Overview"
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
            </button>

            {/* Focus / Maximize Map Button */}
            <button
              type="button"
              onClick={toggleFocusMode}
              title="Open Map to Maximum Screen Space"
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 shadow-xs transition-all cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Focus Map</span>
            </button>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div
        className={`relative w-full bg-slate-950 overflow-hidden ${
          isFocusMode ? "flex-1 h-full min-h-0" : ""
        }`}
        style={isFocusMode ? undefined : { height }}
      >
        {/* Loading Spinner */}
        {!isLoaded && !loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white z-20">
            <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin mb-3" />
            <p className="text-xs font-mono font-medium text-slate-300">
              Initializing Google Maps 3D Pipeline...
            </p>
          </div>
        )}

        {/* Error Fallback */}
        {loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white p-6 z-20 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
            <h4 className="text-sm font-bold text-white mb-1">Google Maps Error</h4>
            <p className="text-xs text-slate-400 max-w-md">{loadError}</p>
          </div>
        )}

        {/* The Google Map DOM Node */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* FLOATING TACTICAL SUSPECT TRAJECTORY HUD */}
        {isTrailActive && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[94%] sm:w-[540px] bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.12)] p-3.5 sm:p-4 text-slate-800 animate-in fade-in slide-in-from-top-4 pointer-events-auto select-none transition-all">
            {/* Header Row */}
            <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                </span>
                <span className="text-xs sm:text-sm font-bold tracking-tight text-slate-900 truncate">
                  Suspect Transgression Trail
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-red-50 text-red-700 border border-red-200 font-mono shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Target: HARIOM
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleFocusTrajectory}
                  className="px-2.5 py-1 rounded-xl bg-[#1e4b38] hover:bg-[#163a2b] text-white border border-[#163a2b] text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                  title="Focus camera view on all trail waypoints"
                >
                  <Crosshair className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Focus Trail</span>
                </button>
                <button
                  type="button"
                  onClick={() => setManualTrailActive(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Dismiss trajectory overlay"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Waypoint Flow Stepper */}
            <div className="flex items-center justify-between gap-1.5 mt-3 p-1.5 rounded-xl bg-slate-50/90 border border-slate-200/80">
              {waypoints.map((wp, idx) => {
                const isActive = telemetry?.activeNodeIndex === idx;
                const isVisited = (telemetry?.activeNodeIndex ?? -1) > idx || (telemetry?.phase === "hold" && idx === waypoints.length - 1);
                const isTransitingCurrent = isActive && telemetry?.phase === "transit";

                return (
                  <div key={wp.code} className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div
                      title={wp.name}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[11px] font-mono transition-all flex-1 justify-center truncate ${
                        isActive
                          ? "bg-red-50 text-red-700 border-red-300 shadow-xs ring-2 ring-red-400/20 font-bold"
                          : isVisited
                          ? "bg-[#edf3ef] text-[#1b5032] border border-[#c4ded0] font-semibold"
                          : "bg-white text-slate-500 border-slate-200 font-medium hover:border-slate-300 hover:text-slate-700"
                      }`}
                    >
                      {isActive ? (
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                      ) : isVisited ? (
                        <Check className="w-3 h-3 text-[#1b5032] shrink-0 stroke-[2.5]" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                      )}
                      <span className="truncate">{wp.code}</span>
                    </div>
                    {idx < waypoints.length - 1 && (
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                          idx < (telemetry?.activeNodeIndex ?? 0)
                            ? "text-[#2d6a4f]/70"
                            : isTransitingCurrent
                            ? "text-red-500 animate-pulse"
                            : "text-slate-300"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Dynamic Route Progress Bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2.5 border border-slate-200/60">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 transition-all duration-300 rounded-full"
                style={{ width: `${trailProgressPercent}%` }}
              />
            </div>

            {/* Real-time Telemetry Details */}
            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 truncate max-w-[280px] sm:max-w-[340px]">
                <Activity className="w-3.5 h-3.5 text-red-600 shrink-0 animate-pulse" />
                <span className="font-mono text-[11px] text-slate-700 truncate font-semibold">
                  {telemetry?.statusText || "Synchronizing vector displacement telemetry..."}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-slate-600 font-mono text-[11px]">
                <span className="text-slate-500 font-medium">Total Distance:</span>
                <strong className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/80">
                  {telemetry?.totalDistanceMeters || 0}m
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* FLOATING BACK / EXIT FULLSCREEN COMMAND HUD (Active in Fullscreen Focus View) */}
        {isFocusMode && (
          <div className="absolute top-4 left-4 z-40 flex flex-wrap items-center gap-2.5 select-none pointer-events-auto animate-in fade-in slide-in-from-top-3">
            {/* Primary Back / Exit Fullscreen Button */}
            <button
              type="button"
              onClick={handleExit}
              className="px-4 py-2.5 rounded-xl bg-white/95 hover:bg-slate-50 text-slate-800 border border-slate-200/90 shadow-xl backdrop-blur-md flex items-center gap-2.5 text-xs font-bold transition-all cursor-pointer hover:scale-105 hover:border-[#1e4b38]/60 ring-2 ring-[#1e4b38]/10"
              title="Exit Full Screen View and return to Dashboard (or press ESC)"
            >
              <ArrowLeft className="w-4 h-4 text-[#1b5032] shrink-0" />
              <span>Back / Exit Fullscreen</span>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                ESC
              </span>
            </button>

            {/* Quick Tactical Controls Toolbar in Fullscreen Mode */}
            <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-1 shadow-xl flex items-center gap-1.5 text-xs text-slate-700">
              {/* 3D Tilt Toggle */}
              <button
                type="button"
                onClick={handleToggle3D}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  is3DMode
                    ? "bg-[#1e4b38] text-white border border-[#163a2b] shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title="Toggle Google Maps 3D Oblique Perspective Tilt (45°)"
              >
                <Box className={`w-3.5 h-3.5 ${is3DMode ? "text-emerald-300" : "text-slate-500"}`} />
                <span>{is3DMode ? "3D Active" : "3D View"}</span>
              </button>

              {/* Heatmap Toggle */}
              <button
                type="button"
                onClick={() => {
                  setShowHeatmaps(!showHeatmaps);
                  showToast(showHeatmaps ? "Ground Heatmaps Hidden" : "Ground Heatmaps Active");
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  showHeatmaps
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title="Toggle Ground Heatmaps"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Heat</span>
              </button>

              {/* Filters Toggle */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  showFilters
                    ? "bg-[#1e4b38] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title="Toggle Floating Time & Detection Filter Panels"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>

              {/* Layer Switcher */}
              <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1.5 pr-0.5">
                {(["hybrid", "satellite", "terrain"] as const).map((layer) => (
                  <button
                    key={layer}
                    type="button"
                    onClick={() => handleMapTypeChange(layer)}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold capitalize transition-all cursor-pointer ${
                      mapType === layer
                        ? "bg-[#1e4b38] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    {layer}
                  </button>
                ))}
              </div>

              {/* Suspect Trail Button */}
              <button
                type="button"
                onClick={() => {
                  setManualTrailActive((prev) => !prev);
                  if (!manualTrailActive) {
                    setTimeout(handleFocusTrajectory, 300);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isTrailActive
                    ? "bg-red-600 text-white shadow-md ring-2 ring-red-500/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title="Toggle Suspect Transgression Trail (HARIOM)"
              >
                <Navigation className={`w-3.5 h-3.5 ${isTrailActive ? "text-white animate-pulse" : "text-red-500"}`} />
                <span>{isTrailActive ? "Trail Active" : "Suspect Trail"}</span>
              </button>

              {/* Reset View */}
              <button
                type="button"
                onClick={handleResetView}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="Reset Pan-India View"
              >
                <Navigation className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* FLOATING TACTICAL CAMERA FILTERS PANEL */}
        {showFilters && (
          <div className="absolute top-4 right-4 z-30 flex flex-col gap-3 max-w-[210px] w-full pointer-events-auto select-none">
            {/* Camera Filters Card */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-3 shadow-xl space-y-2 text-slate-800 animate-in fade-in slide-in-from-right-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 sticky top-0 bg-white/95 backdrop-blur-xs">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-xs font-black tracking-tight text-slate-900">Camera Filters</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {Object.values(filterTypes).filter(Boolean).length}/
                  {Object.keys(filterTypes).length}
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-medium max-h-[260px] overflow-y-auto pr-0.5">
                {Object.keys(filterTypes).map((typeKey) => (
                  <label
                    key={typeKey}
                    className="flex items-center gap-2 cursor-pointer hover:text-emerald-700 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filterTypes[typeKey]}
                      onChange={(e) =>
                        setFilterTypes((prev) => ({
                          ...prev,
                          [typeKey]: e.target.checked,
                        }))
                      }
                      className="rounded accent-emerald-700 cursor-pointer"
                    />
                    <span className="truncate">{typeKey}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM RIGHT: Map Legend Card (Exact Match to User Reference Screenshot) */}
        {showFilters && (
          <div className="absolute bottom-6 right-4 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-3 shadow-xl text-slate-800 max-w-[200px] w-full pointer-events-auto select-none animate-in fade-in slide-in-from-bottom-3">
            <div className="text-xs font-black text-slate-900 border-b border-slate-100 pb-1.5 mb-2">
              Map Legend
            </div>
            <div className="space-y-1.5 text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#16a34a] shrink-0 shadow-xs" />
                <span>Optical 4K Online</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#f59e0b] shrink-0 shadow-xs" />
                <span>PTZ 360 Turret</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#0ea5e9] shrink-0 shadow-xs" />
                <span>Thermal / ANPR</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ef4444] shrink-0 animate-pulse shadow-xs" />
                <span>Threat Alert</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#64748b] shrink-0 shadow-xs" />
                <span>Offline / Degraded</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-[#ef4444] shrink-0" />
                <span>Border Perimeter</span>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE-OVER QUICK-ACCESS CAMERA INSPECTION DRAWER */}
        {inspectedCamera && (
          <div className="absolute top-4 left-4 bottom-4 z-40 w-full max-w-sm bg-white/95 text-slate-900 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-[0_16px_40px_rgba(0,0,0,0.15)] p-4 flex flex-col justify-between overflow-hidden animate-in fade-in slide-in-from-left-4 duration-300 pointer-events-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      inspectedCamera.status === "alert" || inspectedAlert
                        ? "bg-red-500 animate-pulse"
                        : inspectedCamera.status === "degraded"
                        ? "bg-amber-400"
                        : inspectedCamera.status === "offline"
                        ? "bg-slate-400"
                        : "bg-emerald-500"
                    }`}
                  />
                  {inspectedCamera.status === "alert" || inspectedAlert ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-red-600" />
                      Threat Detected
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1b5032] bg-[#edf3ef] border border-[#c4ded0] px-2 py-0.5 rounded-full font-mono">
                      {inspectedCamera.type || "Optical 4K"}
                    </span>
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
                  {inspectedCamera.name}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {inspectedCamera.sector} • {inspectedCamera.location}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInspectedCamera(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close Inspection Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 my-2">
              {/* Threat Snapshot / Live Stream View Switcher Header */}
              {threatSnapshotUrl && (
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    Target Detected On Feed
                  </span>
                  <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setFeedViewMode("snapshot")}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        feedViewMode === "snapshot"
                          ? "bg-red-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Threat Capture
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedViewMode("live")}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        feedViewMode === "live"
                          ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Live Stream
                    </button>
                  </div>
                </div>
              )}

              {/* Feed Frame Container */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200/90 bg-slate-950 aspect-video flex items-center justify-center group shadow-inner">
                {feedViewMode === "snapshot" && snapshotImgSrc ? (
                  <div className="relative w-full h-full">
                    {/* Real Camera Threat Snapshot */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={snapshotImgSrc}
                      alt={inspectedAlert?.suspectName || "Threat Snapshot"}
                      onError={handleSnapshotError}
                      className="w-full h-full object-cover"
                    />

                    {/* Tactical OSD Badges overlaying real snapshot */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/80 backdrop-blur-xs px-2 py-0.5 rounded-md border border-red-500/40 text-[10px] font-mono text-red-300 font-bold shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      <span>CAM: {inspectedCamera.id.toUpperCase()}</span>
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-600/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-white text-[10px] font-mono font-bold shadow-md">
                      <ShieldAlert className="w-3 h-3" />
                      <span>TARGET: {inspectedAlert?.suspectName?.toUpperCase() || "HARIOM"}</span>
                    </div>

                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/80 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/10 text-[9px] font-mono text-slate-300">
                      <Camera className="w-3 h-3 text-red-400" />
                      <span>INTERCEPT SNAPSHOT</span>
                      {inspectedAlert?.confidence && (
                        <span className="text-emerald-400 font-bold ml-1">
                          {Math.round(inspectedAlert.confidence * 100)}% MATCH
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/10 text-[9px] font-mono text-slate-400">
                      {inspectedCamera.resolution || "4K UHD"}
                    </div>
                  </div>
                ) : (
                  <>
                    <canvas
                      ref={canvasRef}
                      width={340}
                      height={190}
                      className="w-full h-full object-cover"
                    />

                    {/* Thermal Filter Buttons overlay */}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-xs p-1 rounded-lg border border-white/10 text-[9px] font-bold">
                      <button
                        type="button"
                        onClick={() => setThermalPalette("rgb")}
                        className={`px-1.5 py-0.5 rounded ${
                          thermalPalette === "rgb" ? "bg-emerald-600 text-white" : "text-slate-300"
                        }`}
                      >
                        RGB
                      </button>
                      <button
                        type="button"
                        onClick={() => setThermalPalette("flir")}
                        className={`px-1.5 py-0.5 rounded ${
                          thermalPalette === "flir" ? "bg-purple-600 text-white" : "text-slate-300"
                        }`}
                      >
                        FLIR
                      </button>
                      <button
                        type="button"
                        onClick={() => setThermalPalette("night")}
                        className={`px-1.5 py-0.5 rounded ${
                          thermalPalette === "night" ? "bg-green-700 text-white" : "text-slate-300"
                        }`}
                      >
                        IR
                      </button>
                    </div>

                    {/* Play/Pause control */}
                    <button
                      type="button"
                      onClick={() => setIsFeedPlaying(!isFeedPlaying)}
                      className="absolute top-2 right-2 p-1 bg-black/60 rounded-lg text-white/80 hover:text-white"
                    >
                      {isFeedPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </button>
                  </>
                )}
              </div>

              {/* Identified Threat Intelligence Card */}
              {inspectedAlert && (
                <div className="p-2.5 rounded-xl bg-red-50/90 border border-red-200 shadow-xs flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/faces/person_1788701662_e0faf3.jpg"
                      alt={inspectedAlert.suspectName || "Suspect"}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      className="w-10 h-10 rounded-xl object-cover border border-red-200 shadow-xs shrink-0 bg-slate-100"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 tracking-tight truncate">
                          {inspectedAlert.suspectName || "Wanted Suspect"}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-600 text-white uppercase tracking-wider font-mono shrink-0">
                          {inspectedAlert.threatLevel || "CRITICAL"}
                        </span>
                      </div>
                      <p className="text-[10px] text-red-700 font-mono mt-0.5 truncate">
                        {inspectedAlert.notes || `Biometric match on ${inspectedCamera.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right font-mono">
                    <span className="text-[9px] text-slate-500 block font-medium">AI Match</span>
                    <span className="text-xs font-bold text-[#1b5032]">
                      {inspectedAlert.confidence ? `${Math.round(inspectedAlert.confidence * 100)}%` : "98%"}
                    </span>
                  </div>
                </div>
              )}

              {/* Telemetry Matrix */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center font-mono">
                <div>
                  <span className="text-[9px] uppercase text-slate-500 font-bold block">Latency</span>
                  <span className="text-xs font-bold text-[#1b5032]">
                    {inspectedCamera.healthStats?.latencyMs || 38}ms
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-slate-500 font-bold block">Bitrate</span>
                  <span className="text-xs font-bold text-slate-800">
                    {inspectedCamera.healthStats?.bitrate || "7.5 Mbps"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-slate-500 font-bold block">Loss</span>
                  <span className="text-xs font-bold text-slate-800">
                    {inspectedCamera.healthStats?.packetLoss || "0.0%"}
                  </span>
                </div>
              </div>

              {/* PTZ Pan-Tilt Directional Controller */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    PTZ Gimbal Pad
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Active Control
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1">
                  <div />
                  <button
                    type="button"
                    onClick={() => showToast("PTZ: Tilting Up (+5°)")}
                    className="p-1 rounded bg-white hover:bg-[#1e4b38] hover:text-white text-slate-700 border border-slate-200 shadow-xs flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <div />
                  <button
                    type="button"
                    onClick={() => showToast("PTZ: Panning Left (-5°)")}
                    className="p-1 rounded bg-white hover:bg-[#1e4b38] hover:text-white text-slate-700 border border-slate-200 shadow-xs flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast("PTZ: Centered to Home Point")}
                    className="p-1 rounded bg-slate-100 hover:bg-[#163a2b] hover:text-white text-[#1e4b38] font-bold border border-slate-200 flex items-center justify-center text-[9px] cursor-pointer"
                  >
                    ●
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast("PTZ: Panning Right (+5°)")}
                    className="p-1 rounded bg-white hover:bg-[#1e4b38] hover:text-white text-slate-700 border border-slate-200 shadow-xs flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <div />
                  <button
                    type="button"
                    onClick={() => showToast("PTZ: Tilting Down (-5°)")}
                    className="p-1 rounded bg-white hover:bg-[#1e4b38] hover:text-white text-slate-700 border border-slate-200 shadow-xs flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <div />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 shrink-0">
              <a
                href={`/live`}
                className="flex-1 text-center py-2 px-3 rounded-xl bg-[#1e4b38] hover:bg-[#163a2b] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Live Surveillance</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  if (inspectedCamera.streamUrl) {
                    handleCopy(inspectedCamera.streamUrl, "RTSP URI");
                  }
                }}
                className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors shadow-xs cursor-pointer"
                title="Copy RTSP Stream URL"
              >
                <Copy className="w-4 h-4" />
              </button>
              <a
                href={`/cameras`}
                className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors shadow-xs"
                title="Manage Node"
              >
                <Eye className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Standard Map Footer Legend (Shown only when NOT in focus mode) */}
      {!isFocusMode && (
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block shadow-xs" />
              <span suppressHydrationWarning>
                {filteredCameras.filter((c) => c.status === "online").length} Online Nodes
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block shadow-xs" />
              <span suppressHydrationWarning>
                {filteredCameras.filter((c) => c.status === "alert").length} Active Threat Alerts
              </span>
            </div>

            {/* Dynamic Border Legend */}
            {showBorders && (
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-500 border-l border-slate-200 pl-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-0.5 bg-[#dc2626] inline-block" />
                  <span>Pakistan</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-0.5 bg-[#f59e0b] inline-block" />
                  <span>China</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-0.5 bg-[#10b981] inline-block" />
                  <span>Nepal</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-0.5 bg-[#059669] inline-block" />
                  <span>Bhutan</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-0.5 bg-[#3b82f6] inline-block" />
                  <span>Bangladesh</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-0.5 bg-[#8b5cf6] inline-block" />
                  <span>Myanmar</span>
                </span>
              </div>
            )}
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            Source: Survey of India OUTLINE_OF_INDIA (WGS 84)
          </div>
        </div>
      )}
    </div>
  );
}

export default BorderMap;
