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
} from "lucide-react";
import { Camera as CameraEntity } from "@/types/camera";
import { useCameras } from "@/lib/camerasStore";

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
  name: "Sector-02 Intrusion Alert — RS Pura Border Fence",
  lat: 32.7160,
  lng: 74.6590,
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
  selectedCameraId,
  onMapClick,
  center = { lat: 28.60, lng: 77.20 },
  zoom = 5.5,
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

  // International Border Layer state
  const [showBorders, setShowBorders] = useState(true);
  const [selectedNeighbor, setSelectedNeighbor] = useState<string>("All");
  const [isBordersLoaded, setIsBordersLoaded] = useState(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);

  const { cameras: storeCameras } = useCameras();
  const activeCameras = customCameras ?? storeCameras;

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

        // Initialize Google Map centered over India
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
                    <span style="font-size:10px; color:#64748b; font-family:'SF Mono',SFMono-Regular,ui-monospace,Menlo,monospace;">WGS 84 (EPSG:4326)</span>
                  </div>
                  <h4 style="margin:0 0 4px; font-size:13px; font-weight:800; color:#0f172a;">
                    🇮🇳 India — ${escapeHtml(neighbor)} Border
                  </h4>
                  <div style="font-size:11px; color:#475569; margin-bottom:8px; line-height:1.5;">
                    <div><strong>Frontier Length:</strong> <span style="font-weight:700; color:#0f172a;">${Number(lenKm).toLocaleString()} km</span></div>
                    <div><strong>Type:</strong> International Land Boundary</div>
                    <div><strong>Status:</strong> MayaJaal Grid Active</div>
                  </div>
                  <div style="font-size:10px; color:#64748b; border-top:1px solid #e2e8f0; padding-top:4px;">
                    Coastlines omitted • Processed from Survey of India OUTLINE_OF_INDIA
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

        // 3. Add Demo Alert Marker
        const alertSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="38" height="44" viewBox="0 0 38 44">
            <path d="M19 0C8.5 0 0 8.5 0 19c0 14.5 19 25 19 25s19-10.5 19-25C38 8.5 29.5 0 19 0z" fill="#dc2626" stroke="#ffffff" stroke-width="2"/>
            <circle cx="19" cy="19" r="10" fill="#b91c1c"/>
            <path d="M19 12l6 11H13l6-11zm0 4v3m0 2h.01" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
        `)}`;

        const alertMarker = new google.maps.Marker({
          position: { lat: DEMO_ALERT.lat, lng: DEMO_ALERT.lng },
          map,
          title: DEMO_ALERT.name,
          icon: {
            url: alertSvg,
            scaledSize: new google.maps.Size(34, 40),
            anchor: new google.maps.Point(17, 40),
          },
        });

        const alertInfoWindow = new google.maps.InfoWindow();
        alertMarker.addListener("click", () => {
          const alertContent = `
            <div style="font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','SF Pro Display',system-ui,sans-serif; padding:6px 2px; min-width:160px;">
              <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#ef4444;"></span>
                <strong style="font-size:11px; color:#dc2626; text-transform:uppercase;">Critical Threat</strong>
              </div>
              <h4 style="margin:0 0 4px; font-size:13px; font-weight:700; color:#991b1b;">${DEMO_ALERT.name}</h4>
              <p style="margin:0 0 8px; font-size:11px; color:#64748b; font-family:'SF Mono',SFMono-Regular,ui-monospace,Menlo,monospace;">${DEMO_ALERT.lat.toFixed(2)}°N, ${DEMO_ALERT.lng.toFixed(2)}°E</p>
              <a href="/alerts" style="display:block; text-align:center; padding:5px 8px; font-size:11px; font-weight:700; color:#ffffff; background:#dc2626; border-radius:6px; text-decoration:none;">
                Inspect Alert Details &rarr;
              </a>
            </div>
          `;
          alertInfoWindow.setContent(alertContent);
          alertInfoWindow.open(map, alertMarker);
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

  // Render / Update Camera Markers whenever cameras change
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded || !(window as any).google?.maps) return;
    const google = (window as any).google;
    const map = mapInstanceRef.current;

    // Clear existing camera markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const infoWindow = new google.maps.InfoWindow({ maxWidth: 260 });

    activeCameras.forEach((cam) => {
      const lat = Number(cam.latitude ?? (cam.coordinates ? cam.coordinates[1] : 0));
      const lng = Number(cam.longitude ?? (cam.coordinates ? cam.coordinates[0] : 0));
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

      const isSelected = cam.id === selectedCameraId;
      const isAlert = cam.status === "alert";
      const isDegraded = cam.status === "degraded";
      const isOffline = cam.status === "offline";

      let pinColor = "#059669"; // emerald
      let innerColor = "#047857";
      let statusLabel = "Online";

      if (isAlert) {
        pinColor = "#dc2626"; // red
        innerColor = "#b91c1c";
        statusLabel = "Alert Active";
      } else if (isDegraded) {
        pinColor = "#d97706"; // amber
        innerColor = "#b45309";
        statusLabel = "Degraded";
      } else if (isOffline) {
        pinColor = "#64748b"; // slate
        innerColor = "#475569";
        statusLabel = "Offline";
      }

      const markerSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? "44" : "36"}" height="${isSelected ? "50" : "42"}" viewBox="0 0 36 42">
          <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 24 18 24s18-10.5 18-24C36 8.06 27.94 0 18 0z" fill="${pinColor}" stroke="#ffffff" stroke-width="${isSelected ? "3" : "2"}"/>
          <circle cx="18" cy="18" r="9" fill="${innerColor}"/>
          <path d="M22 13h-1.5l-1-1.5h-3l-1 1.5H14c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zm-4 7c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" fill="#ffffff"/>
        </svg>
      `)}`;

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        title: cam.name,
        zIndex: isSelected ? 999 : isAlert ? 500 : 100,
        icon: {
          url: markerSvg,
          scaledSize: new google.maps.Size(isSelected ? 40 : 32, isSelected ? 46 : 38),
          anchor: new google.maps.Point(isSelected ? 20 : 16, isSelected ? 46 : 38),
        },
      });

      marker.addListener("click", () => {
        const contentString = `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','SF Pro Display',system-ui,sans-serif; padding:6px 2px; min-width:200px;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
              <span style="font-size:10px; font-weight:800; text-transform:uppercase; color:${pinColor}; background:${pinColor}15; padding:2px 6px; border-radius:4px;">
                ${statusLabel} • ${escapeHtml(cam.type || "Optical")}
              </span>
              <span style="font-size:10px; color:#64748b; font-family:'SF Mono',SFMono-Regular,ui-monospace,Menlo,monospace;">${escapeHtml(cam.id)}</span>
            </div>
            <h4 style="margin:2px 0 4px; font-size:13px; font-weight:800; color:#0f172a;">${escapeHtml(cam.name)}</h4>
            <div style="font-size:11px; color:#475569; margin-bottom:6px;">
              <div><strong>Sector:</strong> ${escapeHtml(cam.sector)}</div>
              <div><strong>Coordinates:</strong> <span style="font-family:'SF Mono',SFMono-Regular,ui-monospace,Menlo,monospace;">${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E</span></div>
              ${cam.ipAddress ? `<div><strong>RTSP IP:</strong> <span style="font-family:'SF Mono',SFMono-Regular,ui-monospace,Menlo,monospace;">${escapeHtml(cam.ipAddress)}</span></div>` : ""}
            </div>
            <div style="display:flex; gap:6px; margin-top:8px;">
              <a href="/cameras" style="flex:1; text-align:center; padding:6px 8px; font-size:11px; font-weight:700; color:#ffffff; background:#143724; border-radius:6px; text-decoration:none;">
                Manage Node
              </a>
              <a href="/live" style="flex:1; text-align:center; padding:6px 8px; font-size:11px; font-weight:700; color:#143724; background:#ecfdf5; border:1px solid #10b981; border-radius:6px; text-decoration:none;">
                Live Stream
              </a>
            </div>
          </div>
        `;
        infoWindow.setContent(contentString);
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
    });
  }, [activeCameras, isLoaded, selectedCameraId]);

  // Sync MapType when parent prop changes
  useEffect(() => {
    if (initialMapType && initialMapType !== mapType) {
      setMapType(initialMapType);
      if (mapInstanceRef.current && (window as any).google?.maps) {
        mapInstanceRef.current.setMapTypeId(initialMapType);
      }
    }
  }, [initialMapType]);

  // Sync MapType switch
  const handleMapTypeChange = (type: "hybrid" | "satellite" | "roadmap" | "terrain") => {
    setMapType(type);
    onMapTypeChange?.(type);
    if (mapInstanceRef.current && (window as any).google?.maps) {
      mapInstanceRef.current.setMapTypeId(type);
    }
  };

  // Reset Camera View
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(center);
      mapInstanceRef.current.setZoom(zoom);
    }
  };

  // Focus on specific neighbor border
  const handleFocusNeighbor = (border: NeighborBorder) => {
    setSelectedNeighbor(border.name);
    setShowBorders(true);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(border.center);
      mapInstanceRef.current.setZoom(border.zoom);
    }
  };

  // Monitor map container resizing to trigger Google Maps resize
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const el = mapContainerRef.current;
    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current && (window as any).google?.maps) {
        (window as any).google.maps.event.trigger(mapInstanceRef.current, "resize");
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoaded]);

  // Explicitly trigger Google Maps resize when focus mode or height changes
  useEffect(() => {
    if (!mapInstanceRef.current || !(window as any).google?.maps) return;
    const map = mapInstanceRef.current;
    const triggerResize = () => {
      const currentCenter = map.getCenter();
      (window as any).google.maps.event.trigger(map, "resize");
      if (currentCenter) {
        map.setCenter(currentCenter);
      }
    };

    triggerResize();
    const t1 = setTimeout(triggerResize, 60);
    const t2 = setTimeout(triggerResize, 250);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isFocusMode, height]);

  // Keyboard Escape listener to exit focus mode
  useEffect(() => {
    if (!isFocusMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        toggleFocusMode();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocusMode, toggleFocusMode]);

  // Lock body scroll in focus mode so trackpad / mousewheel zooms the map instead of background
  useEffect(() => {
    if (isFocusMode) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isFocusMode]);

  // Monitor native fullscreen state
  useEffect(() => {
    const handleFsChange = () => {
      setIsBrowserFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const handleToggleNativeFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleExit = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    toggleFocusMode();
  };

  return (
    <div
      className={
        isFocusMode
          ? `fixed inset-0 z-[100] w-screen h-screen bg-slate-950 flex flex-col overflow-hidden animate-in fade-in duration-200 ${className}`
          : `bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col ${className}`
      }
    >
      {/* Standard Map Header (Shown only when NOT in focus mode) */}
      {!isFocusMode && (
        <div className="p-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Google Maps Tactical Surveillance</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-800 font-semibold">
                Survey of India Land Borders
              </span>
            </h2>
            <span
              suppressHydrationWarning
              className="hidden sm:inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 font-semibold"
            >
              {activeCameras.length} Node{activeCameras.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* Tactical Controls (Layers, Border Toggle, View Reset, Focus Map) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Border Layer Toggle Button */}
            <button
              type="button"
              onClick={() => setShowBorders(!showBorders)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-xl transition-all border cursor-pointer ${
                showBorders
                  ? "bg-[#143724] text-white border-emerald-700 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
              title="Toggle Survey of India International Land Borders"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>🇮🇳 Land Borders</span>
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

      {/* Standard Neighbor Frontier Quick Focus Ribbon (Shown only when NOT in focus mode) */}
      {!isFocusMode && showBorders && (
        <div className="px-4 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1 shrink-0 flex items-center gap-1">
            <Globe className="w-3 h-3 text-slate-500" />
            Frontiers:
          </span>

          <button
            type="button"
            onClick={() => {
              setSelectedNeighbor("All");
              handleResetView();
            }}
            className={`px-2.5 py-0.5 rounded-md font-bold transition-all shrink-0 cursor-pointer ${
              selectedNeighbor === "All"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            All Borders (14,349 km)
          </button>

          {NEIGHBOR_BORDERS.map((border) => (
            <button
              key={border.name}
              type="button"
              onClick={() => handleFocusNeighbor(border)}
              className={`px-2.5 py-0.5 rounded-md font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                selectedNeighbor === border.name
                  ? "bg-white text-slate-900 ring-2 shadow-xs"
                  : "bg-white/80 text-slate-700 border border-slate-200/80 hover:bg-white"
              }`}
              style={{
                borderColor: selectedNeighbor === border.name ? border.color : undefined,
              }}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: border.color }}
              />
              <span>{border.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                ({border.lengthKm.toLocaleString()} km)
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Map Container (Stretches to 100% of viewport in Focus Mode) */}
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
              Initializing Google Maps Satellite Pipeline...
            </p>
          </div>
        )}

        {/* Error Fallback */}
        {loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white p-6 z-20 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
            <h4 className="text-sm font-bold text-white mb-1">Google Maps Initialization Error</h4>
            <p className="text-xs text-slate-400 max-w-md">{loadError}</p>
          </div>
        )}

        {/* The Google Map DOM Node */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* FOCUS MODE FLOATING TACTICAL HUD */}
        {isFocusMode && (
          <>
            {/* Top Floating Command HUD */}
            <div className="absolute top-3 left-3 right-3 z-30 pointer-events-none flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Left: Tactical Badge & Node Count */}
                <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/60 text-white px-3.5 py-2 rounded-xl shadow-2xl flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-black tracking-wider uppercase text-white">
                    Tactical GIS Surveillance
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded font-bold uppercase">
                    Survey of India
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-mono text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded">
                    {activeCameras.length} Nodes Active
                  </span>
                </div>

                {/* Center: Desktop Frontier Quick Navigation */}
                <div className="pointer-events-auto hidden lg:flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 px-2 py-1.5 rounded-xl shadow-2xl overflow-x-auto max-w-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1.5 flex items-center gap-1 shrink-0">
                    <Globe className="w-3 h-3 text-emerald-400" />
                    Frontiers:
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNeighbor("All");
                      handleResetView();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedNeighbor === "All"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                    }`}
                  >
                    All (14,349 km)
                  </button>

                  {NEIGHBOR_BORDERS.map((border) => (
                    <button
                      key={border.name}
                      type="button"
                      onClick={() => handleFocusNeighbor(border)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        selectedNeighbor === border.name
                          ? "bg-white text-slate-900 font-bold shadow-xs"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full inline-block shrink-0"
                        style={{ backgroundColor: border.color }}
                      />
                      <span>{border.name}</span>
                    </button>
                  ))}
                </div>

                {/* Right: Tactical Controls & High-Visibility Exit Focus Button */}
                <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 p-1.5 rounded-xl shadow-2xl">
                  {/* Border Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setShowBorders(!showBorders)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      showBorders
                        ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
                    }`}
                    title="Toggle Survey of India International Land Borders"
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Land Borders</span>
                    {showBorders && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>

                  {/* Map Layer Mode buttons */}
                  <div className="inline-flex p-0.5 rounded-lg bg-slate-800/80 border border-slate-700/50 text-xs font-semibold">
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
                        className={`px-2 py-1 rounded-md transition-all text-[11px] cursor-pointer ${
                          mapType === layer.id
                            ? "bg-white text-slate-900 font-bold shadow-xs"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {layer.label}
                      </button>
                    ))}
                  </div>

                  {/* Reset Center button */}
                  <button
                    type="button"
                    onClick={handleResetView}
                    title="Reset Map to Pan-India Overview"
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                  </button>

                  {/* Native Fullscreen Toggle Button */}
                  <button
                    type="button"
                    onClick={handleToggleNativeFullscreen}
                    title={isBrowserFullscreen ? "Exit Fullscreen Window" : "Fullscreen Window (F11)"}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer hidden sm:inline-flex"
                  >
                    <Expand className="w-3.5 h-3.5" />
                  </button>

                  {/* Exit Focus Button */}
                  <button
                    type="button"
                    onClick={handleExit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer active:scale-95"
                    title="Exit Maximum Focus View (Esc)"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Exit Focus</span>
                    <kbd className="text-[9px] bg-emerald-800/90 text-emerald-200 px-1 py-0.5 rounded font-mono font-bold tracking-tight">
                      ESC
                    </kbd>
                  </button>
                </div>
              </div>

              {/* Mobile/Tablet Frontier Quick Navigation Ribbon */}
              <div className="pointer-events-auto lg:hidden flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 px-2 py-1.5 rounded-xl shadow-2xl overflow-x-auto">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1 shrink-0">
                  <Globe className="w-3 h-3 text-emerald-400" />
                  Frontiers:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNeighbor("All");
                    handleResetView();
                  }}
                  className={`px-2 py-0.5 rounded text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedNeighbor === "All"
                      ? "bg-emerald-600 text-white"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  All
                </button>
                {NEIGHBOR_BORDERS.map((border) => (
                  <button
                    key={border.name}
                    type="button"
                    onClick={() => handleFocusNeighbor(border)}
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                      selectedNeighbor === border.name
                        ? "bg-white text-slate-900 font-bold"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{ backgroundColor: border.color }}
                    />
                    <span>{border.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Floating Bottom Tactical Legend HUD */}
            <div className="absolute bottom-3 left-3 z-30 pointer-events-auto flex flex-wrap items-center gap-3 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 px-3.5 py-1.5 rounded-xl shadow-2xl text-xs text-slate-300">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-xs" />
                <span suppressHydrationWarning>
                  {activeCameras.filter((c) => c.status === "online").length} Online Nodes
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-xs" />
                <span suppressHydrationWarning>
                  {activeCameras.filter((c) => c.status === "alert").length} Elevated/Alert
                </span>
              </div>

              {showBorders && (
                <div className="hidden sm:flex flex-wrap items-center gap-2.5 text-[11px] font-medium text-slate-400 border-l border-slate-700 pl-3">
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

            {/* Floating Bottom Right Hint */}
            <div className="absolute bottom-3 right-3 z-30 pointer-events-none hidden md:flex items-center gap-2 bg-slate-900/75 backdrop-blur-md border border-slate-700/50 px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-400 shadow-xl">
              <span>Press <kbd className="bg-slate-800 text-slate-200 px-1 py-0.5 rounded font-bold">ESC</kbd> to exit focus view</span>
            </div>
          </>
        )}
      </div>

      {/* Standard Map Footer Legend (Shown only when NOT in focus mode) */}
      {!isFocusMode && (
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block shadow-xs" />
              <span suppressHydrationWarning>
                {activeCameras.filter((c) => c.status === "online").length} Online Nodes
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block shadow-xs" />
              <span suppressHydrationWarning>
                {activeCameras.filter((c) => c.status === "alert").length} Elevated/Alert
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
