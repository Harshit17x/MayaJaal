"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useBackendStatus } from "@/lib/hooks/useBackendStatus";
import { Detection } from "@/types/backend";
import { alertsStore } from "@/lib/alertsStore";
import { DetectionCanvas } from "./detectioncanvas";
import { CameraGrid } from "./cameragrid";
import {
  Play,
  Upload,
  Radio,
  Sliders,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  Camera,
} from "lucide-react";

export function LiveWorkspace() {
  const { isOnline, loadedModels, refetch } = useBackendStatus();

  // Mode: "upload-image" | "upload-video" | "rtsp"
  const [sourceMode, setSourceMode] = useState<"upload-image" | "upload-video" | "rtsp">("upload-image");

  // Selected Model
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [loadingModel, setLoadingModel] = useState(false);

  // Confidence & IOU Sliders
  const [confThreshold, setConfThreshold] = useState<number>(0.25);
  const [iouThreshold, setIouThreshold] = useState<number>(0.45);

  // RTSP URL state
  const [rtspUrl, setRtspUrl] = useState<string>("rtsp://127.0.0.1:8554/live");

  // Image source state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("/images/himalayan-border-hero.jpg");
  const [sourceDims, setSourceDims] = useState<{ width: number; height: number }>({
    width: 1280,
    height: 720,
  });

  // Inference state
  const [isInferencing, setIsInferencing] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Set default model when models list updates (prioritize 'best')
  useEffect(() => {
    if (loadedModels.length > 0) {
      if (!selectedModel || !loadedModels.includes(selectedModel)) {
        const preferred = loadedModels.includes("best") ? "best" : loadedModels[0];
        setSelectedModel(preferred);
      }
    }
  }, [loadedModels, selectedModel]);

  // Load default model helper if no models loaded
  const handleLoadDefaultModel = async () => {
    setLoadingModel(true);
    setStatusMessage("Loading best.onnx into engine...");
    try {
      await api.loadModel("best", "best.onnx");
      await refetch();
      setSelectedModel("best");
      setStatusMessage("Model 'best' loaded successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load model";
      setStatusMessage(`Error: ${msg}`);
    } finally {
      setLoadingModel(false);
    }
  };

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setDetections([]);
    setLatencyMs(null);
    setStatusMessage(null);
  };

  // Measure natural dimensions when preview image loads
  const handleImageLoaded = () => {
    if (imageRef.current) {
      setSourceDims({
        width: imageRef.current.naturalWidth || 1280,
        height: imageRef.current.naturalHeight || 720,
      });
    }
  };

  // Trigger AI Inference
  const handleRunInference = async () => {
    if (!isOnline) {
      setStatusMessage("Cannot run inference: Backend is offline.");
      return;
    }

    const modelToUse = selectedModel || loadedModels[0];
    if (!modelToUse) {
      setStatusMessage("No model loaded. Please load or select an ONNX model.");
      return;
    }

    setIsInferencing(true);
    setStatusMessage("Executing ONNX pipeline...");
    const t0 = performance.now();

    try {
      if (sourceMode === "upload-image") {
        let fileToSubmit = selectedFile;
        if (!fileToSubmit) {
          // Fetch existing preview image as blob
          const res = await fetch(previewUrl);
          const blob = await res.blob();
          fileToSubmit = new File([blob], "surveillance_sample.jpg", {
            type: "image/jpeg",
          });
        }

        const result = await api.runImageInference({
          file: fileToSubmit,
          modelName: modelToUse,
          confThreshold,
          iouThreshold,
          postprocess: true,
        });

        const elapsed = Math.round(performance.now() - t0);
        setLatencyMs(result.inference_time_ms ? Math.round(result.inference_time_ms) : elapsed);
        setDetections(result.detections || []);
        setStatusMessage(
          `Detected ${result.detections?.length || 0} objects in ${elapsed}ms.`
        );

        // If detections found, create live alert in store
        if (result.detections && result.detections.length > 0) {
          const highThreatClasses = ["firearm", "explosive", "melee_weapon", "person", "blunt_weapon"];
          result.detections.forEach((det) => {
            if (det.confidence >= 0.4) {
              const isHigh = highThreatClasses.includes(det.class_name.toLowerCase());
              alertsStore.addAlert({
                title: `${det.class_name.replace(/_/g, " ").toUpperCase()} Identified in Sector`,
                location: "Live Surveillance Feed (Cam 01)",
                severity: isHigh ? "High" : "Medium",
                className: det.class_name,
                confidence: det.confidence,
                cameraName: "Live Stream Cam 01",
                box: det.box,
              });
            }
          });
        }
      } else if (sourceMode === "rtsp") {
        const result = await api.runRtspInference({
          rtspUrl,
          modelName: modelToUse,
          confThreshold,
          iouThreshold,
          maxFrames: 5,
        });

        const elapsed = Math.round(performance.now() - t0);
        setLatencyMs(elapsed);
        const lastFrame = result.frame_results?.[result.frame_results.length - 1];
        setDetections(lastFrame?.detections || []);
        setStatusMessage(
          `Sampled ${result.frames_sampled} frames from RTSP stream.`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Inference failed";
      setStatusMessage(`Inference error: ${msg}`);
    } finally {
      setIsInferencing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Tactical Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Source Mode Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setSourceMode("upload-image")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              sourceMode === "upload-image"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Surveillance Image
          </button>
          <button
            onClick={() => setSourceMode("rtsp")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              sourceMode === "rtsp"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            RTSP Stream
          </button>
        </div>

        {/* Model Selector and Thresholds */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Model selection */}
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-slate-500" />
            {loadedModels.length > 0 ? (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                {loadedModels.map((m) => (
                  <option key={m} value={m}>
                    Model: {m}
                  </option>
                ))}
              </select>
            ) : (
              <button
                onClick={handleLoadDefaultModel}
                disabled={loadingModel || !isOnline}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors disabled:opacity-50"
              >
                <Cpu className="w-3.5 h-3.5" />
                {loadingModel ? "Loading Model..." : "Load Detection Model"}
              </button>
            )}
          </div>

          {/* Confidence Slider */}
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Conf: {Math.round(confThreshold * 100)}%</span>
            <input
              type="range"
              min="0.05"
              max="0.95"
              step="0.05"
              value={confThreshold}
              onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
              className="w-16 accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {sourceMode === "upload-image" && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Image
            </button>
          )}

          {/* Run Inference CTA */}
          <button
            onClick={handleRunInference}
            disabled={isInferencing || !isOnline}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#123824] hover:bg-[#18462d] text-white shadow-xs transition-all duration-150 disabled:opacity-50"
          >
            {isInferencing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Inferencing...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Run AI Detection
              </>
            )}
          </button>
        </div>
      </div>

      {/* RTSP Stream URL Input row (if RTSP mode active) */}
      {sourceMode === "rtsp" && (
        <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center gap-3">
          <Radio className="w-4 h-4 text-rose-400 animate-pulse flex-shrink-0" />
          <span className="text-xs font-mono text-slate-300 flex-shrink-0">
            RTSP Stream URL:
          </span>
          <input
            type="text"
            value={rtspUrl}
            onChange={(e) => setRtspUrl(e.target.value)}
            placeholder="rtsp://user:pass@ip:port/h264Preview_01_main"
            className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
        </div>
      )}

      {/* 2. Primary Feed with Tactical Overlay Canvas & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Viewport (Col 8) */}
        <div className="lg:col-span-8 bg-[#0d1215] rounded-xl border border-slate-800 shadow-lg overflow-hidden flex flex-col relative select-none">
          {/* Tactical Header Overlay */}
          <div className="p-3 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-xs text-white z-30 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono font-bold tracking-wider">
                CAM-01 • SECTOR NORTH-EAST
              </span>
            </div>
            <div className="font-mono text-[11px] text-slate-400">
              RES: {sourceDims.width}x{sourceDims.height}
              {latencyMs !== null && ` • LATENCY: ${latencyMs}ms`}
            </div>
          </div>

          {/* Media Viewport + Overlay Canvas */}
          <div className="relative w-full aspect-video min-h-[360px] max-h-[560px] flex items-center justify-center bg-black overflow-hidden">
            {/* Corner Reticles */}
            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-emerald-500/80 z-30 pointer-events-none"></div>
            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-emerald-500/80 z-30 pointer-events-none"></div>
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-emerald-500/80 z-30 pointer-events-none"></div>
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-emerald-500/80 z-30 pointer-events-none"></div>

            {/* Displayed Image Frame */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={previewUrl}
              alt="Surveillance Feed Frame"
              onLoad={handleImageLoaded}
              className="w-full h-full object-contain"
            />

            {/* Tactical Canvas Overlay */}
            <DetectionCanvas
              detections={detections}
              sourceWidth={sourceDims.width}
              sourceHeight={sourceDims.height}
            />
          </div>

          {/* Bottom Bar with Status Telemetry */}
          <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <span className="font-mono text-[11px]">
              {statusMessage ||
                (isOnline
                  ? "Engine Ready — Trigger detection to scan frame."
                  : "AI Engine Offline — Start backend on port 8000.")}
            </span>
            <span className="font-semibold text-emerald-400 text-xs font-mono">
              {detections.length} TARGETS ACQUIRED
            </span>
          </div>
        </div>

        {/* Tactical Telemetry & Detection Inspector (Col 4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                Target Inspector
              </h3>
              <span className="text-xs font-mono font-medium text-slate-500">
                {detections.length} Detected
              </span>
            </div>

            {detections.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No active threats or targets identified in current view.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto mt-2">
                {detections.map((det, idx) => (
                  <div key={idx} className="py-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono uppercase text-slate-800">
                        {det.class_name} #{idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {Math.round(det.confidence * 100)}%
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                      <span>
                        Box: [{det.box.map((n) => Math.round(n)).join(", ")}]
                      </span>
                      <span>Class ID: {det.class_id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Engine Parameters Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 text-xs space-y-2 text-slate-600">
            <div className="font-semibold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center justify-between">
              <span>Runtime Specs</span>
              <span className="font-mono text-emerald-700 font-bold">
                {selectedModel || "None Selected"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Inference Hardware:</span>
              <span className="font-mono font-medium text-slate-800">
                ONNX Runtime (CPU/CUDA)
              </span>
            </div>
            <div className="flex justify-between">
              <span>NMS Threshold:</span>
              <span className="font-mono font-medium text-slate-800">
                IoU {iouThreshold}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Confidence Cutoff:</span>
              <span className="font-mono font-medium text-slate-800">
                Conf &gt;= {confThreshold}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sector Camera Feeds Matrix */}
      <section aria-label="Camera Matrix" className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-600 tracking-wider uppercase">
            Sector Camera Feeds
          </h2>
          <span className="text-xs font-mono text-slate-500">4 Online</span>
        </div>
        <CameraGrid />
      </section>
    </div>
  );
}

export default LiveWorkspace;
