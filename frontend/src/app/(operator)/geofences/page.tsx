"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  ShieldAlert,
  Shield,
  MapPin,
  Camera as CameraIcon,
  Plus,
  Trash2,
  Check,
  X,
  Play,
  RotateCcw,
  Sliders,
  Eye,
  Crosshair,
  ArrowRight,
  ArrowLeftRight,
  Sparkles,
  Layers,
  Activity,
  AlertTriangle,
  Move,
  MousePointer,
  HelpCircle,
  Maximize2,
  RefreshCw,
  BellRing,
} from "lucide-react";
import { useCameras } from "@/lib/camerasStore";
import { useAlerts } from "@/lib/alertsStore";
import { api } from "@/lib/api";
import {
  GeofenceZone,
  DirectionalTripwire,
  TripwireDirection,
  GeofenceSeverity,
  GeofenceBreachEvent,
} from "@/types/geofence";

type ToolMode = "select" | "polygon" | "tripwire" | "simulate";

const COLOR_PRESETS = [
  { name: "Crimson Red", hex: "#ef4444" },
  { name: "Tactical Amber", hex: "#f59e0b" },
  { name: "Cyber Blue", hex: "#3b82f6" },
  { name: "Emerald Guard", hex: "#10b981" },
  { name: "Hostile Purple", hex: "#8b5cf6" },
  { name: "Zero Line Rose", hex: "#f43f5e" },
];

export default function GeofencesPage() {
  const { cameras } = useCameras();
  const { addAlert } = useAlerts();

  // Selected Camera
  const [selectedCamId, setSelectedCamId] = useState<string>("bop-jk-01");
  const activeCamera = useMemo(
    () => cameras.find((c) => c.id === selectedCamId) || cameras[0] || null,
    [cameras, selectedCamId]
  );

  // Loaded Geofences
  const [zones, setZones] = useState<GeofenceZone[]>([]);
  const [tripwires, setTripwires] = useState<DirectionalTripwire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Active Tool & Canvas Drawing State
  const [toolMode, setToolMode] = useState<ToolMode>("select");
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [activePoints, setActivePoints] = useState<[number, number][]>([]);
  const [mousePos, setMousePos] = useState<[number, number] | null>(null);

  // Vertex Dragging
  const [draggedVertex, setDraggedVertex] = useState<{
    entityId: string;
    entityType: "zone" | "tripwire";
    index: number;
  } | null>(null);

  // Interactive Target Simulation State
  const [simPos, setSimPos] = useState<[number, number]>([0.5, 0.1]);
  const [simPrevPos, setSimPrevPos] = useState<[number, number]>([0.5, 0.05]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simBreaches, setSimBreaches] = useState<GeofenceBreachEvent[]>([]);

  // Editor Form Drawer state
  const [editName, setEditName] = useState("");
  const [editSeverity, setEditSeverity] = useState<GeofenceSeverity>("CRITICAL");
  const [editColor, setEditColor] = useState("#ef4444");
  const [editDirection, setEditDirection] = useState<TripwireDirection>("FORWARD");
  const [editClasses, setEditClasses] = useState<string[]>(["person", "suspect"]);
  const [editCooldown, setEditCooldown] = useState(15);
  const [editDescription, setEditDescription] = useState("");

  const canvasRef = useRef<SVGSVGElement>(null);

  // ── Load Geofences from Backend ──────────────────────────────────────────
  const fetchGeofences = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getGeofences(selectedCamId);
      if (res?.zones) setZones(res.zones);
      if (res?.tripwires) setTripwires(res.tripwires);
    } catch (err) {
      console.warn("Using local or fallback geofences data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCamId]);

  useEffect(() => {
    fetchGeofences();
  }, [fetchGeofences]);

  // Sync selected entity details into edit form
  useEffect(() => {
    if (!selectedEntityId) return;

    const z = zones.find((item) => item.id === selectedEntityId);
    if (z) {
      setEditName(z.name);
      setEditSeverity(z.severity);
      setEditColor(z.color);
      setEditClasses(z.targetClasses || ["person"]);
      setEditCooldown(z.cooldownSeconds || 20);
      setEditDescription(z.description || "");
      return;
    }

    const w = tripwires.find((item) => item.id === selectedEntityId);
    if (w) {
      setEditName(w.name);
      setEditSeverity(w.severity);
      setEditColor(w.color);
      setEditDirection(w.direction);
      setEditClasses(w.targetClasses || ["person"]);
      setEditCooldown(w.cooldownSeconds || 15);
      setEditDescription(w.description || "");
    }
  }, [selectedEntityId, zones, tripwires]);

  // ── Coordinate Normalization Helpers ─────────────────────────────────────
  const getNormCoords = (e: React.MouseEvent<SVGSVGElement>): [number, number] => {
    if (!canvasRef.current) return [0, 0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    return [parseFloat(x.toFixed(4)), parseFloat(y.toFixed(4))];
  };

  // ── Canvas Interaction Handlers ──────────────────────────────────────────
  const handleCanvasClick = async (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggedVertex) {
      setDraggedVertex(null);
      return;
    }

    const [nx, ny] = getNormCoords(e);

    // 1. Polygon Drawing Mode
    if (toolMode === "polygon") {
      if (activePoints.length >= 3) {
        const [startX, startY] = activePoints[0];
        const dist = Math.hypot(nx - startX, ny - startY);
        // Snapping radius 0.04 to close polygon loop
        if (dist < 0.04) {
          const newZonePayload = {
            name: `Exclusion Zone ${zones.length + 1}`,
            cameraId: selectedCamId,
            color: editColor || "#ef4444",
            severity: editSeverity || "CRITICAL",
            polygon: activePoints,
            targetClasses: editClasses,
            cooldownSeconds: editCooldown,
            description: "Custom tactical exclusion zone.",
          };
          try {
            const res = await api.createGeofenceZone(newZonePayload);
            if (res?.zone) {
              setZones((prev) => [...prev, res.zone]);
              setSelectedEntityId(res.zone.id);
            }
          } catch {
            const fallbackZone: GeofenceZone = {
              id: `zone-local-${Date.now()}`,
              ...newZonePayload,
              enabled: true,
            };
            setZones((prev) => [...prev, fallbackZone]);
            setSelectedEntityId(fallbackZone.id);
          }
          setActivePoints([]);
          setToolMode("select");
          return;
        }
      }
      setActivePoints((prev) => [...prev, [nx, ny]]);
      return;
    }

    // 2. Tripwire Drawing Mode
    if (toolMode === "tripwire") {
      if (activePoints.length === 1) {
        const p1 = activePoints[0];
        const p2: [number, number] = [nx, ny];
        const newWirePayload = {
          name: `Tripwire Barrier ${tripwires.length + 1}`,
          cameraId: selectedCamId,
          color: editColor || "#dc2626",
          severity: editSeverity || "CRITICAL",
          p1,
          p2,
          direction: editDirection,
          targetClasses: editClasses,
          cooldownSeconds: editCooldown,
          description: "High-sensitivity border tripwire barrier.",
        };
        try {
          const res = await api.createTripwire(newWirePayload);
          if (res?.tripwire) {
            setTripwires((prev) => [...prev, res.tripwire]);
            setSelectedEntityId(res.tripwire.id);
          }
        } catch {
          const fallbackWire: DirectionalTripwire = {
            id: `wire-local-${Date.now()}`,
            ...newWirePayload,
            enabled: true,
          };
          setTripwires((prev) => [...prev, fallbackWire]);
          setSelectedEntityId(fallbackWire.id);
        }
        setActivePoints([]);
        setToolMode("select");
        return;
      }
      setActivePoints([[nx, ny]]);
      return;
    }

    // 3. Target Simulation Mode (Clicking moves the simulated target)
    if (toolMode === "simulate") {
      runSimulationStep([nx, ny]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const coords = getNormCoords(e);
    setMousePos(coords);

    if (draggedVertex) {
      const [nx, ny] = coords;
      if (draggedVertex.entityType === "zone") {
        setZones((prev) =>
          prev.map((z) => {
            if (z.id !== draggedVertex.entityId) return z;
            const updated = [...z.polygon];
            updated[draggedVertex.index] = [nx, ny];
            return { ...z, polygon: updated };
          })
        );
      } else if (draggedVertex.entityType === "tripwire") {
        setTripwires((prev) =>
          prev.map((w) => {
            if (w.id !== draggedVertex.entityId) return w;
            if (draggedVertex.index === 0) return { ...w, p1: [nx, ny] };
            return { ...w, p2: [nx, ny] };
          })
        );
      }
    }
  };

  // ── Simulation Engine Step ───────────────────────────────────────────────
  const runSimulationStep = async (newPos: [number, number]) => {
    setSimPrevPos(simPos);
    setSimPos(newPos);

    // Call backend evaluator
    try {
      const evalRes = await api.evaluateGeofences({
        cameraId: selectedCamId,
        tracks: [
          {
            trackId: 901,
            box: [
              Math.max(0, newPos[0] - 0.04),
              Math.max(0, newPos[1] - 0.08),
              Math.min(1, newPos[0] + 0.04),
              newPos[1], // bottom footpoint
            ],
            className: "suspect",
            confidence: 0.98,
            suspectName: "Simulated Intruder #901",
          },
        ],
        dispatchAlerts: true,
      });

      if (evalRes?.breaches && evalRes.breaches.length > 0) {
        setSimBreaches(evalRes.breaches);

        // Visual / Audio feedback
        const primary = evalRes.breaches[0];
        addAlert({
          title: `Intrusion Breach: ${primary.name}`,
          location: `Camera ${selectedCamId} • Zone Perimeter`,
          severity: primary.severity === "CRITICAL" ? "High" : "Medium",
          cameraId: selectedCamId,
          suspectName: "Simulated Intruder #901",
          threatLevel: primary.severity,
          category: primary.type === "zone_breach" ? "geofence_breach" : "tripwire_violation",
          notes: `Tactical simulation triggered ${primary.type} at (${newPos[0].toFixed(2)}, ${newPos[1].toFixed(2)})`,
        });

        setTimeout(() => setSimBreaches([]), 4000);
      }
    } catch {
      // Fallback in-browser evaluation if backend is temporarily disconnected
      evaluateClientSimulation(simPos, newPos);
    }
  };

  const evaluateClientSimulation = (pPrev: [number, number], pCurr: [number, number]) => {
    const detected: GeofenceBreachEvent[] = [];

    // 1. Check Zones
    zones.forEach((z) => {
      if (!z.enabled) return;
      if (pointInPoly(pCurr[0], pCurr[1], z.polygon)) {
        detected.push({
          type: "zone_breach",
          zoneId: z.id,
          name: z.name,
          cameraId: selectedCamId,
          trackId: 901,
          className: "suspect",
          confidence: 0.98,
          footpoint: pCurr,
          severity: z.severity,
          timestamp: new Date().toISOString(),
        });
      }
    });

    if (detected.length > 0) {
      setSimBreaches(detected);
      setTimeout(() => setSimBreaches([]), 4000);
    }
  };

  function pointInPoly(x: number, y: number, poly: [number, number][]): boolean {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0],
        yi = poly[i][1];
      const xj = poly[j][0],
        yj = poly[j][1];
      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // ── Save Entity Updates ──────────────────────────────────────────────────
  const handleSaveEntity = async () => {
    if (!selectedEntityId) return;

    const z = zones.find((item) => item.id === selectedEntityId);
    if (z) {
      const updatedZone = {
        ...z,
        name: editName,
        severity: editSeverity,
        color: editColor,
        targetClasses: editClasses,
        cooldownSeconds: editCooldown,
        description: editDescription,
      };
      setZones((prev) => prev.map((item) => (item.id === z.id ? updatedZone : item)));
      try {
        await api.updateGeofenceZone(z.id, updatedZone);
        setSaveStatus("Zone saved successfully!");
        setTimeout(() => setSaveStatus(null), 2500);
      } catch (err) {
        console.error("Save error:", err);
      }
      return;
    }

    const w = tripwires.find((item) => item.id === selectedEntityId);
    if (w) {
      const updatedWire = {
        ...w,
        name: editName,
        severity: editSeverity,
        color: editColor,
        direction: editDirection,
        targetClasses: editClasses,
        cooldownSeconds: editCooldown,
        description: editDescription,
      };
      setTripwires((prev) => prev.map((item) => (item.id === w.id ? updatedWire : item)));
      try {
        await api.updateTripwire(w.id, updatedWire);
        setSaveStatus("Tripwire saved successfully!");
        setTimeout(() => setSaveStatus(null), 2500);
      } catch (err) {
        console.error("Save error:", err);
      }
    }
  };

  const handleDeleteEntity = async (id: string, type: "zone" | "tripwire") => {
    if (type === "zone") {
      setZones((prev) => prev.filter((z) => z.id !== id));
      try {
        await api.deleteGeofenceZone(id);
      } catch {}
    } else {
      setTripwires((prev) => prev.filter((w) => w.id !== id));
      try {
        await api.deleteTripwire(id);
      } catch {}
    }
    if (selectedEntityId === id) setSelectedEntityId(null);
  };

  const toggleEntityEnabled = async (id: string, type: "zone" | "tripwire") => {
    if (type === "zone") {
      setZones((prev) =>
        prev.map((z) => {
          if (z.id === id) {
            const upd = { ...z, enabled: !z.enabled };
            api.updateGeofenceZone(id, { enabled: upd.enabled }).catch(() => {});
            return upd;
          }
          return z;
        })
      );
    } else {
      setTripwires((prev) =>
        prev.map((w) => {
          if (w.id === id) {
            const upd = { ...w, enabled: !w.enabled };
            api.updateTripwire(id, { enabled: upd.enabled }).catch(() => {});
            return upd;
          }
          return w;
        })
      );
    }
  };

  // ── Compute Tripwire Direction Normal Vector for Arrow Rendering ────────
  const getTripwireArrow = (p1: [number, number], p2: [number, number], dir: TripwireDirection) => {
    const midX = (p1[0] + p2[0]) / 2;
    const midY = (p1[1] + p2[1]) / 2;

    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const len = Math.hypot(dx, dy) || 1;

    // Right normal vector pointing to "Forward" side
    const nx = -dy / len;
    const ny = dx / len;

    const arrowLen = 0.035;
    const arrowX = midX + (dir === "REVERSE" ? -nx : nx) * arrowLen;
    const arrowY = midY + (dir === "REVERSE" ? -ny : ny) * arrowLen;

    return { midX, midY, arrowX, arrowY, nx, ny };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#143724] text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
                  Virtual Geofencing & Directional Tripwires
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 uppercase tracking-wider">
                  Live Studio
                </span>
              </div>
              <p className="text-xs md:text-sm font-medium text-slate-500 mt-0.5">
                Interactive FOV polygon fences, directional crossing barriers, and automated breach alerts.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Camera Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <CameraIcon className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-700">Camera Feed:</span>
            <select
              value={selectedCamId}
              onChange={(e) => {
                setSelectedCamId(e.target.value);
                setSelectedEntityId(null);
                setActivePoints([]);
              }}
              className="bg-white border border-slate-200 text-xs font-bold text-slate-900 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={fetchGeofences}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Main Studio Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center: Interactive Canvas Studio (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Tool Control Strip */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setToolMode("select");
                  setActivePoints([]);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  toolMode === "select"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <MousePointer className="w-3.5 h-3.5" />
                <span>Select & Edit</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setToolMode("polygon");
                  setActivePoints([]);
                  setSelectedEntityId(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  toolMode === "polygon"
                    ? "bg-rose-600 text-white shadow-xs animate-pulse"
                    : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Draw Polygon Zone</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setToolMode("tripwire");
                  setActivePoints([]);
                  setSelectedEntityId(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  toolMode === "tripwire"
                    ? "bg-blue-600 text-white shadow-xs animate-pulse"
                    : "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                }`}
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Draw Directional Tripwire</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setToolMode("simulate");
                  setActivePoints([]);
                  setIsSimulating(true);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  toolMode === "simulate"
                    ? "bg-emerald-600 text-white shadow-xs animate-pulse"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Test Intrusion Simulator</span>
              </button>
            </div>

            {/* Hint Badge */}
            <div className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              {toolMode === "polygon" && "Click to place vertices. Click near the start dot to close."}
              {toolMode === "tripwire" && "Click Point A, then Point B to draw the tripwire barrier."}
              {toolMode === "simulate" && "Click anywhere in the video feed to simulate an intruder footpoint."}
              {toolMode === "select" && "Click any zone/tripwire to inspect and drag vertex handles."}
            </div>
          </div>

          {/* Canvas Viewport */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-slate-950 shadow-md aspect-video select-none">
            {/* Background Camera Feed Backdrop */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-85 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.4) 0%, rgba(2, 6, 23, 0.85) 100%), url('/india_border_backdrop.jpg')`,
                backgroundColor: "#091219",
              }}
            >
              {/* Tactical Grid & HUD overlay */}
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage: `linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)`,
                  backgroundSize: "40px 40px",
                }}
              />
            </div>

            {/* Top HUD Tag */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2 pointer-events-none">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-white text-[11px] font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>REC • {activeCamera?.name || selectedCamId}</span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-300">{activeCamera?.resolution || "1920x1080 30FPS"}</span>
              </div>

              {simBreaches.length > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-600/95 backdrop-blur-md text-white text-[11px] font-bold shadow-lg animate-bounce">
                  <BellRing className="w-3.5 h-3.5 animate-spin" />
                  <span>BREACH DETECTED: {simBreaches[0].name}</span>
                </div>
              )}
            </div>

            {/* Interactive SVG Drawing Canvas */}
            <svg
              ref={canvasRef}
              className="absolute inset-0 w-full h-full cursor-crosshair z-10"
              viewBox="0 0 1000 1000"
              preserveAspectRatio="none"
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseUp={() => setDraggedVertex(null)}
            >
              <defs>
                {/* Arrowhead marker for directional tripwires */}
                <marker
                  id="arrow-fwd"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
                </marker>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* ── Render Existing Polygon Zones ─────────────────────────── */}
              {zones.map((zone) => {
                if (!zone.polygon || zone.polygon.length < 3) return null;
                const isSelected = selectedEntityId === zone.id;
                const isBreached = simBreaches.some((b) => b.zoneId === zone.id);
                const pointsString = zone.polygon
                  .map(([px, py]) => `${px * 1000},${py * 1000}`)
                  .join(" ");

                return (
                  <g key={zone.id} className="cursor-pointer">
                    <polygon
                      points={pointsString}
                      fill={zone.color || "#ef4444"}
                      fillOpacity={isBreached ? 0.55 : isSelected ? 0.35 : 0.2}
                      stroke={isBreached ? "#ff0000" : zone.color || "#ef4444"}
                      strokeWidth={isSelected ? 4 : 2}
                      strokeDasharray={isSelected ? "8 4" : undefined}
                      className={isBreached ? "animate-pulse" : ""}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEntityId(zone.id);
                        setToolMode("select");
                      }}
                    />

                    {/* Polygon Centroid Label */}
                    {(() => {
                      const avgX =
                        zone.polygon.reduce((acc, p) => acc + p[0], 0) / zone.polygon.length;
                      const avgY =
                        zone.polygon.reduce((acc, p) => acc + p[1], 0) / zone.polygon.length;
                      return (
                        <g transform={`translate(${avgX * 1000}, ${avgY * 1000})`}>
                          <rect
                            x="-65"
                            y="-14"
                            width="130"
                            height="28"
                            rx="6"
                            fill="#0f172a"
                            fillOpacity="0.85"
                            stroke={zone.color}
                            strokeWidth="1.5"
                          />
                          <text
                            x="0"
                            y="4"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {zone.name.slice(0, 16)}
                          </text>
                        </g>
                      );
                    })()}

                    {/* Draggable Vertex Handles when selected */}
                    {isSelected &&
                      zone.polygon.map(([vx, vy], vIdx) => (
                        <circle
                          key={vIdx}
                          cx={vx * 1000}
                          cy={vy * 1000}
                          r={8}
                          fill="#ffffff"
                          stroke={zone.color}
                          strokeWidth={3}
                          className="cursor-move hover:scale-125 transition-transform"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDraggedVertex({
                              entityId: zone.id,
                              entityType: "zone",
                              index: vIdx,
                            });
                          }}
                        />
                      ))}
                  </g>
                );
              })}

              {/* ── Render Existing Directional Tripwires ─────────────────── */}
              {tripwires.map((wire) => {
                if (!wire.p1 || !wire.p2) return null;
                const isSelected = selectedEntityId === wire.id;
                const isBreached = simBreaches.some((b) => b.wireId === wire.id);
                const x1 = wire.p1[0] * 1000;
                const y1 = wire.p1[1] * 1000;
                const x2 = wire.p2[0] * 1000;
                const y2 = wire.p2[1] * 1000;

                const arrow = getTripwireArrow(wire.p1, wire.p2, wire.direction);

                return (
                  <g key={wire.id} className="cursor-pointer">
                    {/* Glowing breach ripple */}
                    {isBreached && (
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#f43f5e"
                        strokeWidth={14}
                        strokeOpacity={0.6}
                        filter="url(#glow)"
                        className="animate-pulse"
                      />
                    )}

                    {/* Main Tripwire Line */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={wire.color || "#38bdf8"}
                      strokeWidth={isSelected ? 5 : 3}
                      strokeDasharray={wire.direction === "BIDIRECTIONAL" ? "10 6" : undefined}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEntityId(wire.id);
                        setToolMode("select");
                      }}
                    />

                    {/* Direction Vector Arrow Indicator */}
                    <line
                      x1={arrow.midX * 1000}
                      y1={arrow.midY * 1000}
                      x2={arrow.arrowX * 1000}
                      y2={arrow.arrowY * 1000}
                      stroke="#ffffff"
                      strokeWidth={3}
                      markerEnd="url(#arrow-fwd)"
                    />

                    {/* Tripwire Center Badge */}
                    <g transform={`translate(${arrow.midX * 1000}, ${arrow.midY * 1000})`}>
                      <circle r={12} fill="#0f172a" stroke={wire.color} strokeWidth={2} />
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        {wire.direction === "BIDIRECTIONAL" ? "⇄" : "➔"}
                      </text>
                    </g>

                    {/* Endpoints A and B handles */}
                    {isSelected && (
                      <>
                        <circle
                          cx={x1}
                          cy={y1}
                          r={8}
                          fill="#ffffff"
                          stroke={wire.color}
                          strokeWidth={3}
                          className="cursor-move hover:scale-125 transition-transform"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDraggedVertex({
                              entityId: wire.id,
                              entityType: "tripwire",
                              index: 0,
                            });
                          }}
                        />
                        <circle
                          cx={x2}
                          cy={y2}
                          r={8}
                          fill="#ffffff"
                          stroke={wire.color}
                          strokeWidth={3}
                          className="cursor-move hover:scale-125 transition-transform"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDraggedVertex({
                              entityId: wire.id,
                              entityType: "tripwire",
                              index: 1,
                            });
                          }}
                        />
                      </>
                    )}
                  </g>
                );
              })}

              {/* ── Active Drawing In-Progress Overlay ─────────────────────── */}
              {toolMode === "polygon" && activePoints.length > 0 && (
                <g>
                  {activePoints.map(([px, py], i) => (
                    <circle
                      key={i}
                      cx={px * 1000}
                      cy={py * 1000}
                      r={i === 0 ? 9 : 6}
                      fill={i === 0 ? "#10b981" : "#ffffff"}
                      stroke="#ef4444"
                      strokeWidth={2}
                      className={i === 0 ? "animate-pulse" : ""}
                    />
                  ))}
                  {/* Lines between placed points */}
                  <polyline
                    points={activePoints
                      .map(([px, py]) => `${px * 1000},${py * 1000}`)
                      .join(" ")}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                  />
                  {/* Line to mouse cursor */}
                  {mousePos && (
                    <line
                      x1={activePoints[activePoints.length - 1][0] * 1000}
                      y1={activePoints[activePoints.length - 1][1] * 1000}
                      x2={mousePos[0] * 1000}
                      y2={mousePos[1] * 1000}
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                    />
                  )}
                </g>
              )}

              {toolMode === "tripwire" && activePoints.length === 1 && mousePos && (
                <g>
                  <circle
                    cx={activePoints[0][0] * 1000}
                    cy={activePoints[0][1] * 1000}
                    r={8}
                    fill="#38bdf8"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                  <line
                    x1={activePoints[0][0] * 1000}
                    y1={activePoints[0][1] * 1000}
                    x2={mousePos[0] * 1000}
                    y2={mousePos[1] * 1000}
                    stroke="#38bdf8"
                    strokeWidth={3}
                    strokeDasharray="6 4"
                  />
                  <circle
                    cx={mousePos[0] * 1000}
                    cy={mousePos[1] * 1000}
                    r={6}
                    fill="#ffffff"
                    stroke="#38bdf8"
                    strokeWidth={2}
                  />
                </g>
              )}

              {/* ── Simulation Intruder Marker ────────────────────────────── */}
              {toolMode === "simulate" && (
                <g transform={`translate(${simPos[0] * 1000}, ${simPos[1] * 1000})`}>
                  <circle r={20} fill="#f43f5e" fillOpacity={0.25} className="animate-ping" />
                  <circle r={10} fill="#f43f5e" stroke="#ffffff" strokeWidth={2} />
                  <text
                    x="0"
                    y="-15"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    SUSPECT #901
                  </text>
                </g>
              )}
            </svg>

            {/* Bottom Status Overlay */}
            <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
              <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg text-white text-xs font-mono border border-slate-700/60">
                Active Fences:{" "}
                <span className="font-bold text-emerald-400">
                  {zones.filter((z) => z.enabled).length} Zones
                </span>{" "}
                •{" "}
                <span className="font-bold text-blue-400">
                  {tripwires.filter((w) => w.enabled).length} Tripwires
                </span>
              </div>

              {mousePos && (
                <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg text-slate-300 text-xs font-mono border border-slate-700/60">
                  FOV Norm: ({mousePos[0].toFixed(3)}, {mousePos[1].toFixed(3)})
                </div>
              )}
            </div>
          </div>

          {/* Quick Simulation Action Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Intrusion Breach Simulation & Trajectory Testing
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulate a real-time target crossing border tripwires or entering exclusion zones.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setToolMode("simulate");
                  // Animate simulated dot downward across center
                  let step = 0;
                  const interval = setInterval(() => {
                    step += 1;
                    const nextY = 0.2 + step * 0.08;
                    runSimulationStep([0.5, nextY]);
                    if (nextY >= 0.85) {
                      clearInterval(interval);
                    }
                  }, 400);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auto-Traverse Center</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  api.resetGeofenceHistory(selectedCamId);
                  setSimBreaches([]);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset Cooldowns</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Inspector & Configuration Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Properties Form (Active or Selected Entity) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedEntityId ? "Edit Barrier Properties" : "Barrier Configuration"}
                </h3>
              </div>
              {selectedEntityId && (
                <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  {selectedEntityId.slice(0, 10)}
                </span>
              )}
            </div>

            {selectedEntityId ? (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Barrier Designation</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. RS Pura Forward Exclusion"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Threat Severity</label>
                    <select
                      value={editSeverity}
                      onChange={(e) => setEditSeverity(e.target.value as GeofenceSeverity)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>

                  {tripwires.some((w) => w.id === selectedEntityId) && (
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Direction</label>
                      <select
                        value={editDirection}
                        onChange={(e) => setEditDirection(e.target.value as TripwireDirection)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="FORWARD">FORWARD (A➔B)</option>
                        <option value="REVERSE">REVERSE (B➔A)</option>
                        <option value="BIDIRECTIONAL">BIDIRECTIONAL (⇄)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Display Color</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLOR_PRESETS.map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setEditColor(col.hex)}
                        className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${
                          editColor === col.hex
                            ? "scale-125 border-slate-900 ring-2 ring-emerald-400"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: col.hex }}
                        title={col.name}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-slate-600 font-semibold mb-1">
                    <span>Alert Cooldown</span>
                    <span className="font-mono text-emerald-600">{editCooldown}s</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={120}
                    step={5}
                    value={editCooldown}
                    onChange={(e) => setEditCooldown(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Notes / Mission Directive</label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Instructions for Quick Reaction Team..."
                  />
                </div>

                {saveStatus && (
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>{saveStatus}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveEntity}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer text-center"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const isZone = zones.some((z) => z.id === selectedEntityId);
                      handleDeleteEntity(selectedEntityId, isZone ? "zone" : "tripwire");
                    }}
                    className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                    title="Delete barrier"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 space-y-2">
                <MousePointer className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-medium">Select a zone or tripwire from the canvas or list below.</p>
              </div>
            )}
          </div>

          {/* Configured Barriers List */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">Configured Perimeter Items</h3>
              <span className="text-xs font-semibold text-slate-500">
                {zones.length + tripwires.length} Total
              </span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  onClick={() => {
                    setSelectedEntityId(zone.id);
                    setToolMode("select");
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedEntityId === zone.id
                      ? "border-emerald-500 bg-emerald-50/60 shadow-xs"
                      : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: zone.color }}
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 leading-tight">{zone.name}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-semibold text-slate-400">
                          {zone.polygon.length} Vertices
                        </span>
                        <span className="text-slate-300">•</span>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                            zone.severity === "CRITICAL"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {zone.severity}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleEntityEnabled(zone.id, "zone");
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                        zone.enabled
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {zone.enabled ? "ACTIVE" : "OFF"}
                    </button>
                  </div>
                </div>
              ))}

              {tripwires.map((wire) => (
                <div
                  key={wire.id}
                  onClick={() => {
                    setSelectedEntityId(wire.id);
                    setToolMode("select");
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedEntityId === wire.id
                      ? "border-blue-500 bg-blue-50/60 shadow-xs"
                      : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-sm shrink-0 flex items-center justify-center text-[8px] text-white font-bold"
                      style={{ backgroundColor: wire.color }}
                    >
                      ➔
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 leading-tight">{wire.name}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-semibold text-slate-400">
                          Tripwire ({wire.direction})
                        </span>
                        <span className="text-slate-300">•</span>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                            wire.severity === "CRITICAL"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {wire.severity}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleEntityEnabled(wire.id, "tripwire");
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                        wire.enabled
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {wire.enabled ? "ACTIVE" : "OFF"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
