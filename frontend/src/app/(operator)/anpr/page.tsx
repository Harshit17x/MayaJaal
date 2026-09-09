"use client";

import { useState, useEffect, useRef } from "react";
import {
  Car,
  Camera,
  Video,
  Upload,
  Search,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  Sliders,
  Play,
  Pause,
  Maximize2,
  Layers,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { AnprRecord, AnprScanResponse, AnprVideoResponse, WatchlistEntry } from "@/types/anpr";
import { useCameras } from "@/lib/camerasStore";

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000";

export default function AnprPage() {
  const { cameras } = useCameras();
  const [activeTab, setActiveTab] = useState<"stream" | "image" | "video" | "watchlist">("stream");

  // Live Stream State
  const [selectedCameraId, setSelectedCameraId] = useState<string>("BOP-04-GATE");
  const [selectedStreamUrl, setSelectedStreamUrl] = useState<string>("sample");
  const [streamDetections, setStreamDetections] = useState<AnprRecord[]>([]);
  const [isStreamPlaying, setIsStreamPlaying] = useState<boolean>(true);

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageResult, setImageResult] = useState<AnprScanResponse | null>(null);
  const [isScanningImage, setIsScanningImage] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Video Upload State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoResult, setVideoResult] = useState<AnprVideoResponse | null>(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState<boolean>(false);
  const [videoStride, setVideoStride] = useState<number>(15);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Watchlist State
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState<boolean>(false);
  const [newPlateNumber, setNewPlateNumber] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newSeverity, setNewSeverity] = useState<"critical" | "high" | "medium">("high");
  const [newVehicleType, setNewVehicleType] = useState("car");
  const [showAddWatchlist, setShowAddWatchlist] = useState(false);

  // Copied Plate Toast
  const [copiedPlate, setCopiedPlate] = useState<string | null>(null);

  // Load Records & Watchlist on Mount
  useEffect(() => {
    fetchWatchlist();
    fetchRecords();
    const interval = setInterval(() => {
      fetchRecords();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchWatchlist = async () => {
    setIsLoadingWatchlist(true);
    try {
      const list = await api.getAnprWatchlist();
      setWatchlist(list);
    } catch (err) {
      console.error("Failed to load watchlist", err);
    } finally {
      setIsLoadingWatchlist(false);
    }
  };

  const fetchRecords = async () => {
    try {
      const records = await api.getAnprRecords({ limit: 20 });
      setStreamDetections(records);
    } catch (err) {
      console.error("Failed to fetch ANPR records", err);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPlate(text);
    setTimeout(() => setCopiedPlate(null), 2000);
  };

  // Image scan handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageResult(null);
    setImageError(null);
    setIsScanningImage(true);

    try {
      const result = await api.scanAnprImage(file, selectedCameraId);
      setImageResult(result);
      fetchRecords();
    } catch (err: any) {
      setImageError(err.message || "Failed to scan image for license plates");
    } finally {
      setIsScanningImage(false);
    }
  };

  // Video scan handler
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoResult(null);
    setVideoError(null);
    setIsProcessingVideo(true);

    try {
      const result = await api.processAnprVideo(file, selectedCameraId, videoStride);
      setVideoResult(result);
      fetchRecords();
    } catch (err: any) {
      setVideoError(err.message || "Failed to analyze video for license plates");
    } finally {
      setIsProcessingVideo(false);
    }
  };

  // Watchlist handlers
  const handleAddWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlateNumber.trim()) return;

    try {
      await api.addAnprWatchlist({
        plate_number: newPlateNumber.trim().toUpperCase(),
        reason: newReason || "Flagged Suspect Vehicle",
        severity: newSeverity,
        vehicle_type: newVehicleType,
      });
      setNewPlateNumber("");
      setNewReason("");
      setShowAddWatchlist(false);
      fetchWatchlist();
    } catch (err) {
      console.error("Failed to add to watchlist", err);
    }
  };

  const handleDeleteWatchlist = async (plateNumber: string) => {
    try {
      await api.deleteAnprWatchlist(plateNumber);
      fetchWatchlist();
    } catch (err) {
      console.error("Failed to delete from watchlist", err);
    }
  };

  const watchlistedCount = streamDetections.filter((r) => r.isWatchlisted).length;
  const uniquePlatesCount = new Set(streamDetections.map((r) => r.plateNumber)).size;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1c2022] flex items-center gap-2.5">
            <Car className="w-6 h-6 text-emerald-800" />
            Automatic Number Plate Recognition (ANPR)
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
            Real-time Vehicle & License Plate Interception • TrOCR Optical Engine • Survey of India Grid
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchRecords();
              fetchWatchlist();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Intercepts Logged</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{streamDetections.length}</div>
          <p className="text-xs text-slate-400 mt-0.5">Continuous gate monitoring</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unique Plates</span>
            <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-700">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{uniquePlatesCount}</div>
          <p className="text-xs text-slate-400 mt-0.5">Deduplicated across sessions</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Watchlist / BOLO Hits</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">{watchlistedCount}</div>
          <p className="text-xs text-rose-500/80 mt-0.5">High-priority alerts flagged</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Engine</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            RTX 4070 GPU
          </div>
          <p className="text-xs text-slate-400 mt-0.5">YOLOv8 + TrOCR Printed</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("stream")}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 ${
            activeTab === "stream"
              ? "bg-white text-emerald-800 border-t-2 border-emerald-600 border-x border-slate-200 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Live Surveillance Gate</span>
        </button>

        <button
          onClick={() => setActiveTab("image")}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 ${
            activeTab === "image"
              ? "bg-white text-emerald-800 border-t-2 border-emerald-600 border-x border-slate-200 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Single Image Scanner</span>
        </button>

        <button
          onClick={() => setActiveTab("video")}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 ${
            activeTab === "video"
              ? "bg-white text-emerald-800 border-t-2 border-emerald-600 border-x border-slate-200 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Recorded Video Analyzer</span>
        </button>

        <button
          onClick={() => setActiveTab("watchlist")}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 ${
            activeTab === "watchlist"
              ? "bg-white text-emerald-800 border-t-2 border-emerald-600 border-x border-slate-200 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>BOLO Watchlist ({watchlist.length})</span>
        </button>
      </div>

      {/* TAB 1: LIVE SURVEILLANCE GATE */}
      {activeTab === "stream" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Stream Container (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-lg relative">
              {/* Top Stream Control Bar */}
              <div className="bg-slate-950/80 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-xs font-bold font-mono text-emerald-400">ANPR GATE LIVE</span>
                  <span className="text-xs text-slate-400">|</span>
                  <span className="text-xs text-slate-300 font-mono">{selectedCameraId}</span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      const matched = cameras.find((c) => c.id === e.target.value);
                      if (matched && matched.streamUrl) {
                        setSelectedStreamUrl(matched.streamUrl);
                      } else {
                        setSelectedStreamUrl("sample");
                      }
                    }}
                    className="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-lg border border-slate-700 outline-none"
                  >
                    <option value="BOP-04-GATE">BOP-04 Main Gate Entrance</option>
                    <option value="BOP-02-HIGHWAY">Sector-02 Highway Checkpoint</option>
                    {cameras.map((c, idx) => (
                      <option key={c.id || `cam-${idx}`} value={c.id}>
                        {c.name} ({c.type})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setIsStreamPlaying(!isStreamPlaying)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                  >
                    {isStreamPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Stream Feed Viewport */}
              <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
                {isStreamPlaying ? (
                  <img
                    src={`${BACKEND_BASE_URL}/api/anpr/stream?rtsp_url=${encodeURIComponent(
                      selectedStreamUrl
                    )}&camera_id=${encodeURIComponent(selectedCameraId)}`}
                    alt="ANPR Live Stream"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-slate-500">
                    <Pause className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Stream Paused</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tactical Guidelines Bar */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 flex items-center justify-between text-xs text-slate-600 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                <span>Green Reticle: Verified License Plate</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-600"></span>
                <span>Red Reticle: Interception Watchlist Match</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
                <span>Amber Box: Vehicle Classifier (Car / Bike / Truck)</span>
              </div>
            </div>
          </div>

          {/* Side Panel: Recent Interceptions & Plate Gallery */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col h-[580px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">Recent Interceptions</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Auto-Updating
              </span>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {streamDetections.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <Car className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-xs">Awaiting inbound vehicle passes on active gates...</p>
                </div>
              ) : (
                streamDetections.map((rec, idx) => (
                  <div
                    key={rec.id || `stream-rec-${idx}-${rec.plateNumber}`}
                    className={`p-3 rounded-xl border transition-all ${
                      rec.isWatchlisted
                        ? "bg-rose-50/70 border-rose-200 hover:border-rose-300"
                        : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-sm font-black font-mono tracking-wider px-2 py-0.5 rounded-md ${
                              rec.isWatchlisted
                                ? "bg-rose-600 text-white"
                                : "bg-slate-900 text-emerald-400"
                            }`}
                          >
                            {rec.plateNumber}
                          </span>
                          <button
                            onClick={() => handleCopy(rec.plateNumber)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
                            title="Copy Plate Number"
                          >
                            {copiedPlate === rec.plateNumber ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] font-semibold text-slate-500 uppercase mt-1">
                          {rec.vehicleType} • {(rec.confidence * 100).toFixed(0)}% Confidence
                        </div>
                      </div>

                      {rec.isWatchlisted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase">
                          <ShieldAlert className="w-3 h-3" />
                          BOLO
                        </span>
                      )}
                    </div>

                    {rec.isWatchlisted && rec.watchlistReason && (
                      <p className="text-[11px] font-semibold text-rose-700 bg-rose-100/80 px-2 py-1 rounded-md mb-2">
                        Reason: {rec.watchlistReason}
                      </p>
                    )}

                    {/* Plate Crop Image */}
                    {rec.snapshotUrl && (
                      <div className="mt-1.5 rounded-lg overflow-hidden border border-slate-200 bg-black">
                        <img
                          src={`${BACKEND_BASE_URL}${rec.snapshotUrl}`}
                          alt={rec.plateNumber}
                          className="h-12 w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                      <span>Gate: {rec.cameraId}</span>
                      <span>{new Date(rec.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SINGLE IMAGE SCANNER */}
      {activeTab === "image" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Static Vehicle Photo Analysis</h3>
            <p className="text-xs text-slate-500 mb-4">
              Upload any photo of a vehicle or gate drive-by. The two-stage ONNX detector isolates the vehicle, crops the plate, and executes TrOCR.
            </p>

            {/* Dropzone */}
            <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition-all">
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs font-bold text-slate-700">Click to upload vehicle photo or drag and drop</span>
              <span className="text-[10px] text-slate-400 mt-1">Supports JPEG, PNG, WEBP</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isScanningImage}
              />
            </label>

            {isScanningImage && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-semibold">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Running ONNX Vehicle & Plate Detection on RTX 4070 GPU...</span>
              </div>
            )}

            {imageError && (
              <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {imageError}
              </div>
            )}
          </div>

          {/* Results Grid */}
          {imageResult && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Annotated Image (2 cols) */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Annotated Detection Output ({imageResult.processingTimeMs} ms)
                  </h4>
                  <span className="text-xs font-mono font-bold text-emerald-700">
                    {imageResult.platesDetected} Plate(s) Detected
                  </span>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-200 bg-black">
                  <img
                    src={imageResult.annotatedImageUrl}
                    alt="ANPR Scan Result"
                    className="w-full object-contain max-h-[500px]"
                  />
                </div>
              </div>

              {/* Extracted Plates Gallery (1 col) */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Extracted Plate Snapshots
                </h4>

                {imageResult.records.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No license plates recognized in this photo.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {imageResult.records.map((rec, idx) => (
                      <div
                        key={rec.id || `img-rec-${idx}-${rec.plateNumber}`}
                        className={`p-3 rounded-xl border ${
                          rec.isWatchlisted
                            ? "bg-rose-50 border-rose-200"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-base font-black font-mono tracking-wider text-slate-900">
                            {rec.plateNumber}
                          </span>
                          <button
                            onClick={() => handleCopy(rec.plateNumber)}
                            className="p-1 rounded text-slate-500 hover:text-slate-700"
                          >
                            {copiedPlate === rec.plateNumber ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        <div className="text-xs text-slate-500 mb-2">
                          Type: <span className="font-semibold text-slate-800 uppercase">{rec.vehicleType}</span> • Conf: {(rec.confidence * 100).toFixed(0)}%
                        </div>

                        {rec.snapshotUrl && (
                          <div className="rounded-lg overflow-hidden border border-slate-200 bg-black">
                            <img
                              src={`${BACKEND_BASE_URL}${rec.snapshotUrl}`}
                              alt={rec.plateNumber}
                              className="h-16 w-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RECORDED VIDEO ANALYZER */}
      {activeTab === "video" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Recorded Video Stride Processing</h3>
            <p className="text-xs text-slate-500">
              Upload video footage from outposts. The engine optimizes throughput by running TrOCR every {videoStride} frames while tracking plates through intermediate frames.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="md:col-span-2">
                <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition-all">
                  <Video className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-slate-700">
                    {videoFile ? videoFile.name : "Select MP4 / AVI / MOV video file"}
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    disabled={isProcessingVideo}
                  />
                </label>
              </div>

              {/* Stride Configuration */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <Sliders className="w-4 h-4 text-emerald-700" />
                  <span>OCR Stride Speed Tuning</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Process full ANPR + OCR every N frames:
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono font-bold text-emerald-800">
                    <span>Stride: {videoStride} frames</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={videoStride}
                    onChange={(e) => setVideoStride(Number(e.target.value))}
                    className="w-full accent-emerald-700"
                  />
                </div>
              </div>
            </div>

            {isProcessingVideo && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-semibold">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Processing video frame-by-frame with RTX 4070 CUDA acceleration...</span>
              </div>
            )}

            {videoError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {videoError}
              </div>
            )}
          </div>

          {/* Video Results */}
          {videoResult && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Processed Video ({videoResult.totalFrames} frames in {videoResult.processingTimeMs} ms)
                  </h4>
                  {videoResult.videoUrl && (
                    <a
                      href={`${BACKEND_BASE_URL}${videoResult.videoUrl}`}
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Download Video</span>
                    </a>
                  )}
                </div>

                {videoResult.videoUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video">
                    <video
                      key={videoResult.videoUrl}
                      src={`${BACKEND_BASE_URL}${videoResult.videoUrl}`}
                      controls
                      playsInline
                      preload="auto"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Extracted Plates Timeline */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Unique Plates Discovered ({videoResult.extractedPlates.length})
                </h4>

                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {videoResult.extractedPlates.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No license plates detected in sampled frames. Try lower stride (e.g. 5-10) for higher coverage.
                    </div>
                  ) : (
                    videoResult.extractedPlates.map((plate, idx) => {
                      const rec = videoResult.records?.find((r) => r.plateNumber === plate);
                      return (
                        <div
                          key={`vid-plate-${plate}-${idx}`}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {rec?.snapshotUrl && (
                              <img
                                src={`${BACKEND_BASE_URL}${rec.snapshotUrl}`}
                                alt={plate}
                                className="w-16 h-8 object-cover rounded border border-slate-300 bg-slate-100 shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <span className="font-mono font-black text-sm text-slate-900 block truncate">{plate}</span>
                              {rec && (
                                <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1 font-medium">
                                  <span>{rec.vehicleType}</span>
                                  <span>•</span>
                                  <span>{(rec.confidence * 100).toFixed(0)}%</span>
                                  {rec.isWatchlisted && (
                                    <span className="text-rose-600 font-bold ml-1">• BOLO</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleCopy(plate)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 shrink-0"
                            title="Copy plate number"
                          >
                            {copiedPlate === plate ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BOLO WATCHLIST */}
      {activeTab === "watchlist" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  Tactical Vehicle Watchlist (BOLO)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vehicles on this registry trigger automated high-severity alerts and audible notifications upon gate approach.
                </p>
              </div>

              <button
                onClick={() => setShowAddWatchlist(!showAddWatchlist)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Flag New Vehicle Plate</span>
              </button>
            </div>

            {/* Add Watchlist Form Modal / Drawer */}
            {showAddWatchlist && (
              <form onSubmit={handleAddWatchlist} className="mt-4 p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      License Plate Number *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DL01AB1234"
                      value={newPlateNumber}
                      onChange={(e) => setNewPlateNumber(e.target.value.toUpperCase())}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold uppercase outline-none focus:border-rose-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Interception Severity
                    </label>
                    <select
                      value={newSeverity}
                      onChange={(e) => setNewSeverity(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs outline-none focus:border-rose-600"
                    >
                      <option value="critical">Critical (Immediate Stop)</option>
                      <option value="high">High (Perimeter Check)</option>
                      <option value="medium">Medium (Monitor Only)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Vehicle Type
                    </label>
                    <select
                      value={newVehicleType}
                      onChange={(e) => setNewVehicleType(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs outline-none focus:border-rose-600"
                    >
                      <option value="car">Car / Sedan / SUV</option>
                      <option value="truck">Truck / Commercial</option>
                      <option value="motorcycle">Motorcycle / Two-Wheeler</option>
                      <option value="bus">Bus / Transport</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Interception Reason / Intelligence Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Smuggling suspect, expired border crossing permit"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs outline-none focus:border-rose-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddWatchlist(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 font-semibold hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    Save to Watchlist
                  </button>
                </div>
              </form>
            )}

            {/* Watchlist Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Plate Number</th>
                    <th className="py-2.5 px-3">Vehicle Type</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Reason / Intelligence</th>
                    <th className="py-2.5 px-3">Logged Date</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {watchlist.map((item: any, idx: number) => {
                    const plate = item.plateNumber || item.plate_number || `PLATE-${idx}`;
                    const rowKey = item.id || `wl-${plate}-${idx}`;
                    const vType = item.vehicleType || item.vehicle_type || "Vehicle";
                    const dateStr = item.addedAt || item.added_at ? new Date(item.addedAt || item.added_at).toLocaleDateString() : "Active";
                    return (
                      <tr key={rowKey} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-mono font-black text-xs px-2 py-1 rounded bg-slate-900 text-emerald-400">
                            {plate}
                          </span>
                        </td>
                        <td className="py-3 px-3 uppercase font-semibold text-slate-700">
                          {vType}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              item.severity === "critical"
                                ? "bg-rose-600 text-white"
                                : item.severity === "high"
                                ? "bg-amber-500 text-white"
                                : "bg-slate-200 text-slate-800"
                            }`}
                          >
                            {item.severity || "high"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium max-w-xs truncate">
                          {item.reason || "Flagged Suspect Vehicle"}
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                          {dateStr}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleDeleteWatchlist(plate)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remove from Watchlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
