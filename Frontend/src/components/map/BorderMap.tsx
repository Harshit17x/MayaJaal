"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, AlertTriangle, Layers, Navigation, RefreshCw, ZoomIn, ZoomOut } from "lucide-react";

// Google Maps API Key
const GOOGLE_MAPS_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  "AIzaSyBf6-zZna3bNFU7cBNeeHpYfVtrOrHa-d4";

// Demo Camera Markers
const DEMO_CAMERAS = [
  { id: "cam-1", name: "Camera 01 — North Perimeter", lat: 24.10, lng: 77.70, type: "Optical 4K" },
  { id: "cam-2", name: "Camera 02 — Eastern Gate", lat: 23.70, lng: 79.30, type: "Elevated Activity" },
  { id: "cam-3", name: "Camera 03 — Watch Tower", lat: 22.40, lng: 78.10, type: "Thermal FLIR" },
];

// Demo Alert Marker
const DEMO_ALERT = {
  id: "alert-1",
  name: "Demo Alert — Geofence Crossing",
  lat: 23.25,
  lng: 78.75,
  severity: "High",
};

// Dashed Border Line Coordinates
const DEMO_BORDER_LINE = [
  { lat: 24.60, lng: 76.80 },
  { lat: 24.00, lng: 77.60 },
  { lat: 23.40, lng: 78.50 },
  { lat: 22.90, lng: 79.40 },
  { lat: 22.20, lng: 80.50 },
];

interface BorderMapProps {
  initialMapType?: "hybrid" | "satellite" | "roadmap" | "terrain";
  className?: string;
  height?: string;
}

export function BorderMap({
  initialMapType = "hybrid",
  className = "",
  height = "560px",
}: BorderMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [mapType, setMapType] = useState<"hybrid" | "satellite" | "roadmap" | "terrain">(initialMapType);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load Google Maps Script
  useEffect(() => {
    let isMounted = true;

    function loadScript(): Promise<void> {
      if (typeof window !== "undefined" && (window as any).google?.maps) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        const existingScript = document.getElementById("google-maps-api-script");
        if (existingScript) {
          existingScript.addEventListener("load", () => resolve());
          existingScript.addEventListener("error", () => reject(new Error("Failed to load Google Maps script")));
          return;
        }

        const script = document.createElement("script");
        script.id = "google-maps-api-script";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Google Maps script failed to load."));
        document.head.appendChild(script);
      });
    }

    loadScript()
      .then(() => {
        if (!isMounted || !mapContainerRef.current) return;

        const google = (window as any).google;
        const center = { lat: 23.30, lng: 78.60 };

        // Initialize Google Map
        const map = new google.maps.Map(mapContainerRef.current, {
          center,
          zoom: 6.2,
          mapTypeId: mapType,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false, // controlled by our custom tactical toolbar
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

        // Custom InfoWindow
        const infoWindow = new google.maps.InfoWindow({
          maxWidth: 240,
        });

        // 1. Add Camera Markers (Green)
        DEMO_CAMERAS.forEach((cam) => {
          const markerSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 36 42">
              <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 24 18 24s18-10.5 18-24C36 8.06 27.94 0 18 0z" fill="#059669" stroke="#ffffff" stroke-width="2"/>
              <circle cx="18" cy="18" r="9" fill="#047857"/>
              <path d="M22 13h-1.5l-1-1.5h-3l-1 1.5H14c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zm-4 7c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" fill="#ffffff"/>
            </svg>
          `)}`;

          const marker = new google.maps.Marker({
            position: { lat: cam.lat, lng: cam.lng },
            map,
            title: cam.name,
            icon: {
              url: markerSvg,
              scaledSize: new google.maps.Size(32, 38),
              anchor: new google.maps.Point(16, 38),
            },
          });

          marker.addListener("click", () => {
            const contentString = `
              <div style="font-family:system-ui,-apple-system,sans-serif; padding:6px 2px; min-width:160px;">
                <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                  <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10b981;"></span>
                  <strong style="font-size:12px; color:#064e3b;">Online • ${cam.type}</strong>
                </div>
                <h4 style="margin:0 0 4px; font-size:13px; font-weight:700; color:#0f172a;">${cam.name}</h4>
                <p style="margin:0 0 8px; font-size:11px; color:#64748b; font-family:monospace;">${cam.lat.toFixed(2)}°N, ${cam.lng.toFixed(2)}°E</p>
                <a href="/live" style="display:block; text-align:center; padding:5px 8px; font-size:11px; font-weight:700; color:#ffffff; background:#143724; border-radius:6px; text-decoration:none;">
                  View Live Feed &rarr;
                </a>
              </div>
            `;
            infoWindow.setContent(contentString);
            infoWindow.open(map, marker);
          });
        });

        // 2. Add Red Alert Marker
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

        alertMarker.addListener("click", () => {
          const alertContent = `
            <div style="font-family:system-ui,-apple-system,sans-serif; padding:6px 2px; min-width:160px;">
              <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#ef4444;"></span>
                <strong style="font-size:11px; color:#dc2626; text-transform:uppercase;">Critical Threat</strong>
              </div>
              <h4 style="margin:0 0 4px; font-size:13px; font-weight:700; color:#991b1b;">${DEMO_ALERT.name}</h4>
              <p style="margin:0 0 8px; font-size:11px; color:#64748b; font-family:monospace;">${DEMO_ALERT.lat.toFixed(2)}°N, ${DEMO_ALERT.lng.toFixed(2)}°E</p>
              <a href="/alerts" style="display:block; text-align:center; padding:5px 8px; font-size:11px; font-weight:700; color:#ffffff; background:#dc2626; border-radius:6px; text-decoration:none;">
                Inspect Alert Details &rarr;
              </a>
            </div>
          `;
          infoWindow.setContent(alertContent);
          infoWindow.open(map, alertMarker);
        });

        // 3. Add Dashed Green Border Perimeter Line
        const lineSymbol = {
          path: "M 0,-1 0,1",
          strokeOpacity: 1,
          scale: 3,
          strokeColor: "#10b981",
        };

        new google.maps.Polyline({
          path: DEMO_BORDER_LINE,
          strokeOpacity: 0,
          icons: [
            {
              icon: lineSymbol,
              offset: "0",
              repeat: "16px",
            },
          ],
          map,
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

  // Sync MapType switch
  const handleMapTypeChange = (type: "hybrid" | "satellite" | "roadmap" | "terrain") => {
    setMapType(type);
    if (mapInstanceRef.current && (window as any).google?.maps) {
      mapInstanceRef.current.setMapTypeId(type);
    }
  };

  // Reset Camera View
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat: 23.30, lng: 78.60 });
      mapInstanceRef.current.setZoom(6.2);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col ${className}`}>
      {/* Map Header with Title, Status & Layer Switcher */}
      <div className="p-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Google Maps Tactical Surveillance
          </h2>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-800 font-semibold">
            Google API Live
          </span>
        </div>

        {/* Tactical Layer Controls */}
        <div className="flex items-center gap-2">
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
                className={`px-2.5 py-1 rounded-lg transition-all text-[11px] font-medium ${
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
            title="Reset to Demo Cluster"
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full bg-slate-900 overflow-hidden" style={{ height }}>
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
      </div>

      {/* Map Footer Legend */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block shadow-xs" />
            <span>3 Active Cameras</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block shadow-xs" />
            <span>1 Threat Perimeter Alert</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="inline-block w-4 h-0.5 border-t-2 border-dashed border-emerald-600" />
            <span>Sector Border Geofence</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Powered by Google Maps Platform
        </div>
      </div>
    </div>
  );
}

export default BorderMap;
