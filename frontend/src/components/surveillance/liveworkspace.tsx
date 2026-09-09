"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useBackendStatus } from "@/lib/hooks/useBackendStatus";
import { Detection, VideoFrameResult, VideoMetadata } from "@/types/backend";
import { Camera as CameraType } from "@/types/camera";
import { alertsStore } from "@/lib/alertsStore";
import { DetectionCanvas } from "./detectioncanvas";
import { CameraGrid } from "./cameragrid";
import {
  Play,
  Upload,
  Radio,
  Sliders,
  RefreshCw,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  Camera,
  Video,
  Film,
  WifiOff,
  Wifi,
  Link2,
  Link2Off,
  Maximize2,
  AlertTriangle,
  X,
  Globe,
  HelpCircle,
} from "lucide-react";

/** Build the backend MJPEG stream URL (proxied Next.js → FastAPI). */
function buildStreamUrl(rtspUrl: string, drawDetections = false): string {
  const params = new URLSearchParams({
    rtsp_url: rtspUrl,
    draw_detections: String(drawDetections),
    fps: "20",
    _t: String(Date.now()),
  });
  return `/api/backend/stream/live?${params.toString()}`;
}

export function LiveWorkspace() {
  const { isOnline, loadedModels, refetch } = useBackendStatus();

  // Mode: "upload-image" | "upload-video" | "rtsp"
  const [sourceMode, setSourceMode] = useState<
    "upload-image" | "upload-video" | "rtsp"
  >("upload-image");

  // Selected Model
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [loadingModel, setLoadingModel] = useState(false);

  // Confidence & IOU Sliders
  const [confThreshold, setConfThreshold] = useState<number>(0.25);
  const [iouThreshold, setIouThreshold] = useState<number>(0.45);

  // ─── Live Stream (RTSP & IP Webcam Pro) state ───────────────────────────
  const [rtspUrl, setRtspUrl] = useState<string>("sample");
  const [rtspInputValue, setRtspInputValue] = useState<string>("sample");
  const [streamKey, setStreamKey] = useState<number>(0);
  const [isStreamActive, setIsStreamActive] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<boolean>(false);
  const [isValidatingStream, setIsValidatingStream] = useState<boolean>(false);
  const [streamDiagnostics, setStreamDiagnostics] = useState<string | null>(null);
  const [streamProtocol, setStreamProtocol] = useState<string>("Live Stream");
  const [detectedResolvedUrl, setDetectedResolvedUrl] = useState<string | null>(null);
  const [drawDetectionsOnStream, setDrawDetectionsOnStream] = useState<boolean>(false);
  const [selectedCamera, setSelectedCamera] = useState<CameraType | null>(null);
  const [activeMjpegSrc, setActiveMjpegSrc] = useState<string | null>(null);

  // Image source state
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>(
    "/images/himalayan-border-hero.jpg"
  );

  // Video source state
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>(
    "/videos/himalayan-border-animated.mp4"
  );
  const [videoResults, setVideoResults] = useState<VideoFrameResult[]>([]);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(0);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);

  // Resolution dimensions
  const [sourceDims, setSourceDims] = useState<{ width: number; height: number }>({
    width: 1280,
    height: 720,
  });

  // Inference state
  const [isInferencing, setIsInferencing] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamImgRef = useRef<HTMLImageElement>(null);

  // Set default model when models list updates (prioritize 'best')
  useEffect(() => {
    if (loadedModels.length > 0) {
      if (!selectedModel || !loadedModels.includes(selectedModel)) {
        const preferred = loadedModels.includes("best") ? "best" : loadedModels[0];
        setSelectedModel(preferred);
      }
    }
  }, [loadedModels, selectedModel]);

  // Auto-stop stream when leaving RTSP mode
  useEffect(() => {
    if (sourceMode !== "rtsp") {
      setIsStreamActive(false);
      setActiveMjpegSrc(null);
      setStreamError(false);
      setStreamDiagnostics(null);
    }
  }, [sourceMode]);

  // Rebuild stream URL when AI overlay toggle changes while stream is live
  useEffect(() => {
    if (isStreamActive && rtspUrl) {
      const src = buildStreamUrl(rtspUrl, drawDetectionsOnStream);
      setActiveMjpegSrc(src);
      setStreamKey((k) => k + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawDetectionsOnStream]);

  // Camera grid click → populate RTSP URL + auto-connect
  const handleCameraSelect = useCallback(
    (camera: CameraType) => {
      const url = camera.streamUrl || "";
      setSelectedCamera(camera);
      setRtspUrl(url);
      setRtspInputValue(url);
      setSourceMode("rtsp");
      if (url) {
        const src = buildStreamUrl(url, drawDetectionsOnStream);
        setActiveMjpegSrc(src);
        setIsStreamActive(true);
        setStreamError(false);
        setStreamDiagnostics(`Connected to registered node: ${camera.name}`);
        setStreamProtocol("RTSP Camera");
        setStatusMessage(`Connecting to: ${camera.name} — ${camera.sector}`);
        setStreamKey((k) => k + 1);
      }
    },
    [drawDetectionsOnStream]
  );

  const handleConnectStream = useCallback(async (customUrl?: string) => {
    const rawUrl = (customUrl !== undefined ? customUrl : rtspInputValue).trim();
    if (!rawUrl) {
      setStatusMessage("Please enter a valid RTSP, IP Webcam (http://ip:8080), or 'sample' URL.");
      return;
    }

    setIsValidatingStream(true);
    setStreamError(false);
    setStreamDiagnostics(null);
    setStatusMessage(`Testing stream connection for: ${rawUrl}...`);

    try {
      // Pre-flight check via backend validator
      const validation = await api.validateStream(rawUrl);
      setStreamProtocol(validation.protocol || "Live Stream");
      setDetectedResolvedUrl(validation.resolved_url || rawUrl);

      if (validation.reachable) {
        setRtspUrl(rawUrl);
        setRtspInputValue(rawUrl);
        setStreamError(false);
        const src = buildStreamUrl(rawUrl, drawDetectionsOnStream);
        setActiveMjpegSrc(src);
        setIsStreamActive(true);
        setStreamKey((k) => k + 1);
        setStatusMessage(validation.message || `Connected to ${validation.protocol}`);
        setStreamDiagnostics(validation.message);
      } else {
        // Unreachable host/port
        setRtspUrl(rawUrl);
        setRtspInputValue(rawUrl);
        setStreamError(true);
        setStatusMessage(validation.message);
        setStreamDiagnostics(validation.message);
        // Start standby stream so tactical overlay with diagnostic text is displayed
        const src = buildStreamUrl(rawUrl, drawDetectionsOnStream);
        setActiveMjpegSrc(src);
        setIsStreamActive(true);
        setStreamKey((k) => k + 1);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Validation failed";
      setRtspUrl(rawUrl);
      setRtspInputValue(rawUrl);
      const src = buildStreamUrl(rawUrl, drawDetectionsOnStream);
      setActiveMjpegSrc(src);
      setIsStreamActive(true);
      setStreamKey((k) => k + 1);
      setStatusMessage(`Stream initialising: ${rawUrl}`);
      setStreamDiagnostics(`Connection initiated. (${msg})`);
    } finally {
      setIsValidatingStream(false);
    }
  }, [rtspInputValue, drawDetectionsOnStream]);

  const handleDisconnectStream = useCallback(() => {
    setIsStreamActive(false);
    setActiveMjpegSrc(null);
    setStreamError(false);
    setStreamDiagnostics(null);
    setStatusMessage("Stream disconnected.");
  }, []);

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

  // Handle local image selection
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
    setSourceMode("upload-image");
    setDetections([]);
    setLatencyMs(null);
    setStatusMessage(`Loaded image: ${file.name}`);
  };

  // Handle local video selection
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
    setSourceMode("upload-video");
    setDetections([]);
    setVideoResults([]);
    setLatencyMs(null);
    setStatusMessage(
      `Loaded video: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`
    );
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

  // Measure natural dimensions when preview video loads
  const handleVideoLoaded = () => {
    if (videoRef.current) {
      setSourceDims({
        width: videoRef.current.videoWidth || 1280,
        height: videoRef.current.videoHeight || 720,
      });
    }
  };

  // Switch active video frame inspector
  const handleSelectFrame = (frameIndex: number) => {
    setSelectedFrameIndex(frameIndex);
    const target = videoResults.find((fr) => fr.frame_index === frameIndex);
    if (target) {
      const dets = target.inference?.detections || target.detections || [];
      setDetections(dets);
    }

    if (videoRef.current && videoMetadata?.fps && videoMetadata.fps > 0) {
      videoRef.current.currentTime = frameIndex / videoMetadata.fps;
    }
  };

  // Trigger AI Inference (Image, Video, or RTSP)
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
    const t0 = performance.now();

    try {
      if (sourceMode === "upload-image") {
        setStatusMessage("Executing ONNX pipeline on image frame...");
        let fileToSubmit = selectedImageFile;
        if (!fileToSubmit) {
          const res = await fetch(imagePreviewUrl);
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
        setLatencyMs(
          result.inference_time_ms
            ? Math.round(result.inference_time_ms)
            : elapsed
        );
        setDetections(result.detections || []);
        setStatusMessage(
          `Detected ${result.detections?.length || 0} objects in ${elapsed}ms.`
        );

        // Register high threat alerts
        if (result.detections && result.detections.length > 0) {
          const highThreatClasses = [
            "firearm",
            "explosive",
            "melee_weapon",
            "person",
            "blunt_weapon",
          ];
          result.detections.forEach((det) => {
            if (det.confidence >= 0.4) {
              const isHigh = highThreatClasses.includes(
                det.class_name.toLowerCase()
              );
              alertsStore.addAlert({
                title: `${det.class_name
                  .replace(/_/g, " ")
                  .toUpperCase()} Identified in Sector`,
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
      } else if (sourceMode === "upload-video") {
        setStatusMessage("Sending video to backend endpoint /api/inference/video...");
        let fileToSubmit = selectedVideoFile;
        if (!fileToSubmit) {
          const res = await fetch(videoPreviewUrl);
          const blob = await res.blob();
          fileToSubmit = new File([blob], "surveillance_sample.mp4", {
            type: "video/mp4",
          });
        }

        const result = await api.runVideoInference({
          file: fileToSubmit,
          modelName: modelToUse,
          confThreshold,
          iouThreshold,
          maxFrames: 30,
          postprocess: true,
        });

        const elapsed = Math.round(performance.now() - t0);
        setLatencyMs(elapsed);

        const rawResults = result.results || result.frame_results || [];
        setVideoResults(rawResults);

        if (result.video) {
          setVideoMetadata(result.video);
          if (result.video.width && result.video.height) {
            setSourceDims({
              width: result.video.width,
              height: result.video.height,
            });
          }
        }

        // Collect all detections across all frames
        const allDetections: Detection[] = [];
        rawResults.forEach((fr) => {
          const dets = fr.inference?.detections || fr.detections || [];
          dets.forEach((d) => allDetections.push(d));
        });

        // Set active frame to first frame with detections
        const firstWithDets =
          rawResults.find(
            (fr) => (fr.inference?.detections || fr.detections || []).length > 0
          ) || rawResults[0];

        const activeDets = firstWithDets
          ? firstWithDets.inference?.detections || firstWithDets.detections || []
          : [];

        setSelectedFrameIndex(firstWithDets?.frame_index ?? 0);
        setDetections(activeDets);

        const framesProcessed =
          result.frames_processed ??
          result.total_frames_processed ??
          rawResults.length;

        setStatusMessage(
          `Processed ${framesProcessed} video frames in ${elapsed}ms. Found ${allDetections.length} targets across sequence.`
        );

        // Register alerts in store
        const highThreatClasses = [
          "firearm",
          "explosive",
          "melee_weapon",
          "person",
          "blunt_weapon",
          "car",
        ];
        allDetections.forEach((det) => {
          if (det.confidence >= 0.45) {
            const isHigh = highThreatClasses.includes(
              det.class_name.toLowerCase()
            );
            alertsStore.addAlert({
              title: `${det.class_name
                .replace(/_/g, " ")
                .toUpperCase()} Identified in Video Stream`,
              location: `Video Stream (${fileToSubmit.name})`,
              severity: isHigh ? "High" : "Medium",
              className: det.class_name,
              confidence: det.confidence,
              cameraName: "Video Upload Stream",
              box: det.box,
            });
          }
        });
      } else if (sourceMode === "rtsp") {
        setStatusMessage("Connecting to RTSP stream and sampling frames...");
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
      {/* Hidden File Inputs */}
      <input
        ref={imageFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />
      <input
        ref={videoFileInputRef}
        type="file"
        accept="video/*,.mp4,.avi,.mov,.mkv"
        onChange={handleVideoFileChange}
        className="hidden"
      />

      {/* 1. Tactical Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Source Mode Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
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
            type="button"
            onClick={() => {
              setSourceMode("upload-video");
              if (!selectedVideoFile) {
                videoFileInputRef.current?.click();
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              sourceMode === "upload-video"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Upload Video
          </button>

          <button
            type="button"
            onClick={() => setSourceMode("rtsp")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              sourceMode === "rtsp"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Live Surveillance (RTSP / IP Webcam)
          </button>
        </div>

        {/* Model Selector, Thresholds, and Action Buttons */}
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
                type="button"
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

          {/* Upload Button based on mode */}
          {sourceMode === "upload-image" ? (
            <button
              type="button"
              onClick={() => imageFileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Image
            </button>
          ) : sourceMode === "upload-video" ? (
            <button
              type="button"
              onClick={() => videoFileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              {selectedVideoFile
                ? `Video: ${selectedVideoFile.name.slice(0, 14)}...`
                : "Upload Video"}
            </button>
          ) : null}

          {/* Run Inference CTA */}
          <button
            type="button"
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

      {/* Live Stream URL Controls (RTSP & IP Webcam Pro) */}
      {sourceMode === "rtsp" && (
        <div className="space-y-2">
          <div className="bg-slate-900 text-white p-3 rounded-xl flex flex-col gap-2.5 shadow-md border border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Status dot / Protocol Icon */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isValidatingStream ? (
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-xs font-mono text-amber-300">Probing Link:</span>
                  </span>
                ) : isStreamActive && !streamError ? (
                  <span className="flex items-center gap-1.5">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <Wifi className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono text-emerald-300 whitespace-nowrap">
                      {streamProtocol}:
                    </span>
                  </span>
                ) : streamError ? (
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono text-amber-300 whitespace-nowrap">
                      Feed Alert:
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <WifiOff className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-mono text-slate-300 whitespace-nowrap">
                      Live Feed:
                    </span>
                  </span>
                )}
              </div>

              {/* URL input with Clear button */}
              <div className="relative flex-1 w-full">
                <input
                  id="rtsp-url-input"
                  type="text"
                  value={rtspInputValue}
                  onChange={(e) => {
                    setRtspInputValue(e.target.value);
                    if (streamError) setStreamError(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleConnectStream();
                    }
                  }}
                  placeholder="e.g. http://12.10.5.194:8080, rtsp://10.20.72.101:554/live, or 'sample'"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 pr-8 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
                {rtspInputValue && (
                  <button
                    type="button"
                    onClick={() => {
                      setRtspInputValue("");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                    title="Clear input"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Connect / Disconnect Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isStreamActive ? (
                  <button
                    type="button"
                    onClick={handleDisconnectStream}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-700 hover:bg-rose-600 text-white transition-colors"
                  >
                    <Link2Off className="w-3.5 h-3.5" />
                    Disconnect
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConnectStream()}
                    disabled={!rtspInputValue.trim() || isValidatingStream}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-40"
                  >
                    {isValidatingStream ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Link2 className="w-3.5 h-3.5" />
                        Connect Feed
                      </>
                    )}
                  </button>
                )}

                {/* AI overlay toggle */}
                {loadedModels.length > 0 && (
                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-slate-300 ml-1 border-l border-slate-700 pl-2.5">
                    <input
                      type="checkbox"
                      checked={drawDetectionsOnStream}
                      onChange={(e) => setDrawDetectionsOnStream(e.target.checked)}
                      className="accent-emerald-500 w-3.5 h-3.5"
                    />
                    AI Overlay
                  </label>
                )}
              </div>
            </div>

            {/* Quick preset links */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-800/80 text-[11px]">
              <span className="text-slate-400">Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setRtspInputValue("sample");
                  handleConnectStream("sample");
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 transition-colors font-mono"
              >
                Sample Simulation Feed
              </button>
              <button
                type="button"
                onClick={() => {
                  setRtspInputValue("http://192.168.1.5:8080");
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-500/30 transition-colors font-mono"
              >
                IP Webcam Pro (Android/iOS)
              </button>
              <button
                type="button"
                onClick={() => {
                  setRtspInputValue("rtsp://10.20.72.101:554/live/ch0");
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 transition-colors font-mono"
              >
                RTSP Camera (Port 554)
              </button>
            </div>
          </div>

          {/* Diagnostic & Error Feedback Banner */}
          {streamError && (
            <div className="bg-amber-950/40 border border-amber-500/50 rounded-lg p-3 text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-100">Feed Connection Issue</div>
                  <div className="text-amber-300 font-mono mt-0.5">
                    {streamDiagnostics || "Target address timed out or refused connection."}
                  </div>
                  <div className="text-slate-400 text-[11px] mt-1">
                    * If connecting to <strong className="text-slate-300">IP Webcam Pro</strong>: Make sure your phone is connected to the same Wi-Fi as this machine, and tap &quot;Start Server&quot; in the mobile app.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setRtspInputValue("sample");
                    handleConnectStream("sample");
                  }}
                  className="px-2.5 py-1 rounded bg-amber-900/80 hover:bg-amber-800 text-amber-100 font-medium transition-colors"
                >
                  Use Demo Feed
                </button>
                <button
                  type="button"
                  onClick={() => handleConnectStream()}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
              </div>
            </div>
          )}

          {isStreamActive && !streamError && streamDiagnostics && (
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-lg px-3 py-1.5 text-xs text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-2 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {streamDiagnostics}
              </span>
              {detectedResolvedUrl && detectedResolvedUrl !== rtspUrl && (
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                  Stream Endpoint: {detectedResolvedUrl}
                </span>
              )}
            </div>
          )}
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
                {sourceMode === "upload-video"
                  ? "VIDEO FEED • BORDER SURVEILLANCE"
                  : sourceMode === "rtsp"
                  ? `${streamProtocol.toUpperCase()} • LIVE STREAM`
                  : "CAM-01 • SECTOR NORTH-EAST"}
              </span>
            </div>
            <div className="font-mono text-[11px] text-slate-400">
              RES: {sourceDims.width}x{sourceDims.height}
              {videoMetadata?.fps ? ` • ${Math.round(videoMetadata.fps)} FPS` : ""}
              {latencyMs !== null && ` • LATENCY: ${latencyMs}ms`}
            </div>
          </div>

          {/* Media Viewport + Overlay Canvas */}
          <div className="relative w-full aspect-video min-h-[360px] max-h-[560px] flex items-center justify-center bg-black overflow-hidden">
            {/* Corner Reticles */}
            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-emerald-500/80 z-30 pointer-events-none" />
            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-emerald-500/80 z-30 pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-emerald-500/80 z-30 pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-emerald-500/80 z-30 pointer-events-none" />

            {/* ── RTSP / IP Webcam Live MJPEG Stream ── */}
            {sourceMode === "rtsp" ? (
              isStreamActive && activeMjpegSrc ? (
                <div className="relative w-full h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={streamImgRef}
                    key={streamKey}
                    src={activeMjpegSrc}
                    alt="Live Surveillance Stream"
                    className="w-full h-full object-contain"
                    onError={() => {
                      setStreamError(true);
                      setStatusMessage("Stream error — camera unreachable or backend offline.");
                    }}
                  />
                  {streamError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 z-20 p-6 text-center">
                      <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
                      <p className="text-white text-sm font-semibold">Stream Currently Offline</p>
                      <p className="text-slate-400 text-xs mt-1 max-w-md font-mono">{rtspUrl}</p>
                      {streamDiagnostics && (
                        <p className="text-amber-300 text-[11px] mt-2 max-w-lg font-mono bg-black/60 px-3 py-1.5 rounded border border-amber-500/30">
                          {streamDiagnostics}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setRtspInputValue("sample");
                            handleConnectStream("sample");
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white"
                        >
                          Load Sample Feed
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConnectStream()}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Retry Connection
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Standby — RTSP mode selected but not yet connected */
                <div className="flex flex-col items-center justify-center gap-4 w-full h-full bg-[#0a0e12] p-8">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-2 border-slate-700 flex items-center justify-center">
                      <Maximize2 className="w-8 h-8 text-slate-600" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
                      <WifiOff className="w-3 h-3 text-slate-500" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-300 text-sm font-semibold font-mono">NO STREAM ACTIVE</p>
                    <p className="text-slate-500 text-xs mt-1">
                      Enter an RTSP or IP Webcam URL above and click{" "}
                      <span className="text-emerald-400 font-semibold">Connect Feed</span>,
                      or choose a preset or camera from the grid below.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleConnectStream()}
                    disabled={!rtspInputValue.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-emerald-700 hover:bg-emerald-600 text-white transition-colors disabled:opacity-40"
                  >
                    <Link2 className="w-4 h-4" />
                    Connect to Stream
                  </button>
                </div>
              )
            ) : sourceMode === "upload-video" ? (
              <video
                ref={videoRef}
                src={videoPreviewUrl}
                controls
                playsInline
                loop
                onLoadedMetadata={handleVideoLoaded}
                className="w-full h-full object-contain"
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                ref={imageRef}
                src={imagePreviewUrl}
                alt="Surveillance Feed Frame"
                onLoad={handleImageLoaded}
                className="w-full h-full object-contain"
              />
            )}

            {/* Detection overlay canvas — only for image / video modes */}
            {sourceMode !== "rtsp" && (
              <DetectionCanvas
                detections={detections}
                sourceWidth={sourceDims.width}
                sourceHeight={sourceDims.height}
              />
            )}
          </div>

          {/* Video Frames Scrubber Bar (visible when video results are available) */}
          {sourceMode === "upload-video" && videoResults.length > 0 && (
            <div className="bg-slate-900 px-4 py-2.5 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-mono flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Film className="w-3.5 h-3.5" />
                  Processed Video Frames ({videoResults.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  Click frame to inspect targets
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                {videoResults.map((fr) => {
                  const frameDets =
                    fr.inference?.detections || fr.detections || [];
                  const isSelected = fr.frame_index === selectedFrameIndex;
                  const hasDetections = frameDets.length > 0;

                  return (
                    <button
                      key={fr.frame_index}
                      onClick={() => handleSelectFrame(fr.frame_index)}
                      className={`px-2 py-1 rounded text-[11px] font-mono whitespace-nowrap transition-all flex items-center gap-1 ${
                        isSelected
                          ? "bg-emerald-600 text-white font-bold ring-1 ring-emerald-400"
                          : hasDetections
                          ? "bg-slate-800 text-emerald-300 hover:bg-slate-700 border border-emerald-800/60"
                          : "bg-slate-800/80 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      <span>#{fr.frame_index}</span>
                      {hasDetections && (
                        <span className="px-1 rounded bg-emerald-950/80 text-[10px] text-emerald-300 font-semibold">
                          {frameDets.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Bar with Status Telemetry */}
          <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <span className="font-mono text-[11px]">
              {statusMessage ||
                (isOnline
                  ? "Engine Ready — Trigger detection to scan feed."
                  : "AI Engine Offline — Start backend on port 8000.")}
            </span>
            {sourceMode === "rtsp" ? (
              <span className={`font-semibold text-xs font-mono ${
                isStreamActive && !streamError ? "text-emerald-400" : "text-slate-500"
              }`}>
                {isStreamActive && !streamError ? "● LIVE" : streamError ? "● ERROR" : "○ STANDBY"}
              </span>
            ) : (
              <span className="font-semibold text-emerald-400 text-xs font-mono">
                {detections.length} TARGETS ACQUIRED
              </span>
            )}
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
                {sourceMode === "upload-video" && videoResults.length > 0
                  ? `Frame #${selectedFrameIndex} (${detections.length})`
                  : `${detections.length} Detected`}
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
              <span>Mode:</span>
              <span className="font-mono font-medium text-slate-800 capitalize">
                {sourceMode.replace("-", " ")}
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

      {/* 4. Sector Camera Feeds Matrix */}
      <section aria-label="Camera Matrix" className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-600 tracking-wider uppercase">
            Sector Camera Feeds
          </h2>
          <span className="text-xs font-mono text-slate-500">
            {selectedCamera ? `Viewing: ${selectedCamera.name}` : "Click a camera to connect"}
          </span>
        </div>
        <CameraGrid
          selectedCameraId={selectedCamera?.id}
          onSelectCamera={handleCameraSelect}
        />
      </section>
    </div>
  );
}

export default LiveWorkspace;
