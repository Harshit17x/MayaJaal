"use client";

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

// 3 fictional camera markers placed near the map's centre
const demoCameras = [
  { id: "cam-1", name: "Demo Camera 01", coords: [77.70, 24.10] as [number, number] },
  { id: "cam-2", name: "Demo Camera 02", coords: [79.30, 23.70] as [number, number] },
  { id: "cam-3", name: "Demo Camera 03", coords: [78.10, 22.40] as [number, number] },
];

// 1 fictional red alert marker near the centre
const demoAlert = {
  id: "alert-1",
  name: "Demo Alert — Geofence Crossing",
  coords: [78.75, 23.25] as [number, number],
};

// Fictional dashed border area line passing through the cluster
const demoBorderLineCoords = [
  [76.80, 24.60],
  [77.60, 24.00],
  [78.50, 23.40],
  [79.40, 22.90],
  [80.50, 22.20],
];

export function BorderMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    let map: any = null;

    async function initMap() {
      if (!mapContainerRef.current) return;

      // Dynamically load MapLibre GL in browser runtime
      const { Map, Marker, NavigationControl, Popup } = await import("maplibre-gl");

      if (!isMounted || !mapContainerRef.current) return;

      // Initialize MapLibre GL centered on the demo region in India
      map = new Map({
        container: mapContainerRef.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [78.60, 23.30], // Centered directly on demo marker cluster
        zoom: 5.2,
        minZoom: 3,
        maxZoom: 14,
      });

      // Add map controls in top-right: Zoom in, Zoom out, Reset north/compass
      map.addControl(
        new NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true,
        }),
        "top-right"
      );

      let markersAdded = false;

      const addMarkersAndLine = () => {
        if (!isMounted || !map) return;

        // Add markers once
        if (!markersAdded) {
          markersAdded = true;

          // 1. Add 3 Green Camera Markers
          demoCameras.forEach((cam) => {
            const el = document.createElement("div");
            el.style.cssText =
              "display:flex; flex-direction:column; align-items:center; cursor:pointer; transform:translateY(-12px);";
            el.innerHTML = `
              <div style="background-color:#059669; width:30px; height:30px; border-radius:50%; border:2px solid #ffffff; box-shadow:0 4px 8px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:white;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                  <circle cx="12" cy="13" r="3"/>
                </svg>
              </div>
              <div style="margin-top:3px; font-size:10px; font-family:sans-serif; font-weight:700; background:rgba(15,23,42,0.92); color:#ffffff; padding:2px 6px; border-radius:4px; white-space:nowrap; box-shadow:0 2px 4px rgba(0,0,0,0.25);">
                ${cam.name}
              </div>
            `;

            const popup = new Popup({ offset: 18, closeButton: true }).setHTML(`
              <div style="font-family:system-ui,-apple-system,sans-serif; padding:4px 2px; min-width:140px;">
                <h4 style="margin:0 0 4px; font-size:13px; font-weight:700; color:#0f172a;">${cam.name}</h4>
                <div style="display:flex; align-items:center; gap:6px; margin-bottom:8px;">
                  <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background-color:#10b981;"></span>
                  <span style="font-size:11px; font-weight:600; color:#059669;">Status: Online</span>
                </div>
                <a href="/live" style="display:block; text-align:center; padding:5px 8px; font-size:11px; font-weight:600; color:#ffffff; background-color:#153e28; border-radius:4px; text-decoration:none; box-sizing:border-box;">
                  View camera &rarr;
                </a>
              </div>
            `);

            new Marker({ element: el })
              .setLngLat(cam.coords)
              .setPopup(popup)
              .addTo(map);
          });

          // 2. Add 1 Red Alert Marker
          const alertEl = document.createElement("div");
          alertEl.style.cssText =
            "display:flex; flex-direction:column; align-items:center; cursor:pointer; transform:translateY(-12px);";
          alertEl.innerHTML = `
            <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center;">
              <div style="position:absolute; inset:0; border-radius:50%; background-color:#ef4444; opacity:0.6; animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
              <div style="position:relative; background-color:#dc2626; width:30px; height:30px; border-radius:50%; border:2px solid #ffffff; box-shadow:0 4px 10px rgba(220,38,38,0.5); display:flex; align-items:center; justify-content:center; color:white;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
            </div>
            <div style="margin-top:3px; font-size:10px; font-family:sans-serif; font-weight:700; background:#991b1b; color:#fee2e2; padding:2px 6px; border-radius:4px; white-space:nowrap; border:1px solid #f87171; box-shadow:0 2px 4px rgba(0,0,0,0.3);">
              Demo Alert
            </div>
          `;

          const alertPopup = new Popup({ offset: 18, closeButton: true }).setHTML(`
            <div style="font-family:system-ui,-apple-system,sans-serif; padding:4px 2px; min-width:150px;">
              <h4 style="margin:0 0 4px; font-size:13px; font-weight:700; color:#991b1b;">Geofence Crossing</h4>
              <div style="display:flex; align-items:center; gap:6px; margin-bottom:8px;">
                <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background-color:#ef4444;"></span>
                <span style="font-size:11px; font-weight:600; color:#dc2626;">Severity: High</span>
              </div>
              <a href="/alerts" style="display:block; text-align:center; padding:5px 8px; font-size:11px; font-weight:600; color:#ffffff; background-color:#991b1b; border-radius:4px; text-decoration:none; box-sizing:border-box;">
                Open alert &rarr;
              </a>
            </div>
          `);

          new Marker({ element: alertEl })
            .setLngLat(demoAlert.coords)
            .setPopup(alertPopup)
            .addTo(map);
        }

        // 3. Add Dashed Green Line for Demo Border Area
        if (map.isStyleLoaded && map.isStyleLoaded()) {
          if (!map.getSource("demo-border-line")) {
            map.addSource("demo-border-line", {
              type: "geojson",
              data: {
                type: "Feature",
                properties: { name: "Demo Border Area" },
                geometry: {
                  type: "LineString",
                  coordinates: demoBorderLineCoords,
                },
              },
            });

            map.addLayer({
              id: "demo-border-line-layer",
              type: "line",
              source: "demo-border-line",
              layout: {
                "line-join": "round",
                "line-cap": "round",
              },
              paint: {
                "line-color": "#059669",
                "line-width": 3.5,
                "line-dasharray": [4, 3],
              },
            });
          }
        }
      };

      map.on("load", () => {
        addMarkersAndLine();
        map.resize();
      });

      map.on("styledata", () => {
        addMarkersAndLine();
      });

      setTimeout(() => {
        addMarkersAndLine();
        map.resize();
      }, 300);
    }

    initMap();

    return () => {
      isMounted = false;
      if (map) {
        map.remove();
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
      {/* Map Header with title, demo tag, and legend */}
      <div className="p-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <h2 className="text-base font-semibold text-slate-900 tracking-wide">
            Live Border View
          </h2>
          <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-sm bg-slate-200/70 text-slate-700">
            Fictional Demo Grid
          </span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Camera Online</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>Active Alert</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 border-t-2 border-dashed border-emerald-600"></span>
            <span>Demo Border Area</span>
          </div>
        </div>
      </div>

      {/* MapLibre Canvas Container with fixed height of 520px */}
      <div className="relative w-full h-[520px] bg-[#eef3f6]">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
}

export default BorderMap;
