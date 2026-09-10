"use client";

import { useState, useEffect, useRef } from "react";
import {
  ScanFace,
  UserCheck,
  UserX,
  Camera,
  Video,
  Upload,
  Search,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  Play,
  Pause,
  Layers,
  Clock,
  Sparkles,
  Zap,
  Maximize2,
  X,
  UserPlus,
  Eye,
  Activity,
  Cpu,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  EnrolledPerson,
  FaceDetection,
  FaceEngineStatus,
  FaceEvent,
  FaceScanResponse,
} from "@/types/face";

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000";

export default function FacialRecognitionPage() {
  const [activeTab, setActiveTab] = useState<"stream" | "directory" | "scan">("stream");

  // Telemetry & Status
  const [engineStatus, setEngineStatus] = useState<FaceEngineStatus | null>(null);
  const [enrolledPersons, setEnrolledPersons] = useState<EnrolledPerson[]>([]);
  const [recentEvents, setRecentEvents] = useState<FaceEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Live Stream State
  const [streamSource, setStreamSource] = useState<string>("sample");
  const [isStreamPlaying, setIsStreamPlaying] = useState<boolean>(true);
  const [streamKey, setStreamKey] = useState<number>(0);
  const [streamError, setStreamError] = useState<boolean>(false);
  const streamImgRef = useRef<HTMLImageElement | null>(null);

  const handleToggleStream = async () => {
    if (isStreamPlaying) {
      setIsStreamPlaying(false);
      try {
        await api.stopFaceCamera();
      } catch {}
    } else {
      setStreamError(false);
      setStreamKey(Date.now());
      setIsStreamPlaying(true);
    }
  };

  const handleSourceChange = async (newSource: string) => {
    setStreamError(false);
    try {
      await api.stopFaceCamera();
    } catch {}
    setStreamSource(newSource);
    setStreamKey(Date.now());
    setIsStreamPlaying(true);
  };

  // Enrollment Modal State
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollMode, setEnrollMode] = useState<"webcam" | "upload">("webcam");
  const [enrollName, setEnrollName] = useState("");
  const [enrollFile, setEnrollFile] = useState<File | null>(null);
  const [enrollPreview, setEnrollPreview] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);
  const [targetPersonForSample, setTargetPersonForSample] = useState<EnrolledPerson | null>(null);

  // Webcam Capture Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  // Forensic Image Scan State
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<FaceScanResponse | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [minMatchThreshold, setMinMatchThreshold] = useState<number>(0.40);

  // Initial Data Fetch
  useEffect(() => {
    refreshAllData();
    const interval = setInterval(() => {
      fetchEvents();
      fetchStatus();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Handle Webcam Stream when modal is open
  useEffect(() => {
    if (isEnrollModalOpen && enrollMode === "webcam") {
      startWebcam();
    } else {
      stopWebcam();
    }
    return () => stopWebcam();
  }, [isEnrollModalOpen, enrollMode]);

  // Release camera hardware on component unmount
  useEffect(() => {
    return () => {
      api.stopFaceCamera().catch(() => {});
    };
  }, []);

  // When switching away from the Live Stream tab, pause and release camera hardware
  useEffect(() => {
    if (activeTab !== "stream" && isStreamPlaying) {
      handleToggleStream();
    }
  }, [activeTab]);

  const refreshAllData = async () => {
    setIsLoading(true);
    await Promise.all([fetchStatus(), fetchEnrolled(), fetchEvents()]);
    setIsLoading(false);
  };

  const fetchStatus = async () => {
    try {
      const res = await api.getFaceEngineStatus();
      setEngineStatus(res);
    } catch {
      // Backend temporarily reconnecting
    }
  };

  const fetchEnrolled = async () => {
    try {
      const res = await api.getEnrolledFaces();
      if (res.success) {
        setEnrolledPersons(res.persons);
      }
    } catch {
      // Backend temporarily reconnecting
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await api.getRecentFaceEvents(20);
      if (res.success) {
        setRecentEvents(res.events);
      }
    } catch {
      // Backend temporarily reconnecting
    }
  };

  const startWebcam = async () => {
    setWebcamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsWebcamActive(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setWebcamError(`Webcam access error: ${msg}. Try uploading a photo instead.`);
      setIsWebcamActive(false);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  };

  const captureWebcamSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setEnrollPreview(dataUrl);
    }
  };

  const handleEnrollSubmit = async () => {
    if (!targetPersonForSample && (!enrollName || !enrollName.trim())) {
      setEnrollError("Please enter a person name");
      return;
    }

    const payloadImage = enrollPreview || enrollFile;
    if (!payloadImage) {
      setEnrollError("Please capture or upload a face photo");
      return;
    }

    setIsEnrolling(true);
    setEnrollError(null);
    setEnrollSuccess(null);

    try {
      if (targetPersonForSample) {
        // Add sample to existing person
        const res = await api.addFaceSample(targetPersonForSample.id, payloadImage);
        if (res.success) {
          setEnrollSuccess(`Sample added successfully to ${targetPersonForSample.name}!`);
          await fetchEnrolled();
          setTimeout(() => {
            closeEnrollModal();
          }, 1400);
        } else {
          setEnrollError(res.error || "Failed to add sample");
        }
      } else {
        // Register new person
        const res = await api.registerFace(enrollName.trim(), payloadImage);
        if (res.success) {
          setEnrollSuccess(`Successfully registered ${res.person?.name || enrollName}!`);
          await fetchEnrolled();
          setTimeout(() => {
            closeEnrollModal();
          }, 1400);
        } else {
          setEnrollError(res.error || "Failed to enroll person");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setEnrollError(msg || "Enrolment failed");
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleDeletePerson = async (person: EnrolledPerson) => {
    if (!confirm(`Are you sure you want to remove ${person.name} from the facial recognition database?`)) {
      return;
    }
    try {
      await api.deleteFace(person.id);
      await fetchEnrolled();
    } catch (err) {
      alert("Failed to delete person from database");
    }
  };

  const openEnrollModal = (targetPerson: EnrolledPerson | null = null) => {
    setTargetPersonForSample(targetPerson);
    setEnrollName(targetPerson ? targetPerson.name : "");
    setEnrollPreview(null);
    setEnrollFile(null);
    setEnrollError(null);
    setEnrollSuccess(null);
    setIsEnrollModalOpen(true);
  };

  const closeEnrollModal = () => {
    stopWebcam();
    setIsEnrollModalOpen(false);
    setTargetPersonForSample(null);
    setEnrollPreview(null);
    setEnrollFile(null);
    setEnrollError(null);
    setEnrollSuccess(null);
  };

  const handleScanSubmit = async (file: File) => {
    setScanFile(file);
    const previewUrl = URL.createObjectURL(file);
    setScanPreview(previewUrl);
    setIsScanning(true);
    setScanError(null);
    setScanResult(null);

    try {
      const res = await api.scanFaceImage(file, minMatchThreshold, 40);
      setScanResult(res);
      await fetchEvents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setScanError(msg || "Image analysis failed");
    } finally {
      setIsScanning(false);
    }
  };

  const filteredPersons = enrolledPersons.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 min-h-screen bg-slate-950 text-slate-100">
      {/* Hidden canvas for webcam frame snapshotting */}
      <canvas ref={canvasRef} className="hidden" />

      {/* TOP COMMAND HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10">
            <ScanFace className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-wider text-slate-100 uppercase">
                Facial Recognition Command Center
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-mono font-semibold rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                BIOMETRIC SEC // DUAL-METRIC
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              YuNet High-Res Face Detector & SFace 128-D Cosine Matching with Temporal Smoothing
            </p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                engineStatus?.status === "ready" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            />
            <span className="font-mono text-slate-300">
              ENGINE: {engineStatus?.status === "ready" ? "ACTIVE" : "OFFLINE"}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-slate-300">
              ENROLLED: <strong className="text-emerald-400 font-bold">{enrolledPersons.length}</strong>
            </span>
          </div>

          <button
            onClick={refreshAllData}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700 disabled:opacity-50"
            title="Refresh System Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => openEnrollModal(null)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition transform active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-slate-950" />
            Enroll Identity
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        <button
          onClick={() => setActiveTab("stream")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-xs sm:text-sm transition ${
            activeTab === "stream"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Video className="w-4 h-4" />
          Live Recognition HUD
        </button>

        <button
          onClick={() => setActiveTab("directory")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-xs sm:text-sm transition ${
            activeTab === "directory"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Personnel Roster ({enrolledPersons.length})
        </button>

        <button
          onClick={() => setActiveTab("scan")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-xs sm:text-sm transition ${
            activeTab === "scan"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Upload className="w-4 h-4" />
          Photo Forensic Scanner
        </button>
      </div>

      {/* TAB 1: LIVE RECOGNITION HUD */}
      {activeTab === "stream" && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Video Screen */}
          <div className="xl:col-span-3 flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl aspect-video flex items-center justify-center">
              {isStreamPlaying ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={streamImgRef}
                    key={streamKey}
                    src={`${BACKEND_BASE_URL}/api/faces/stream?source=${encodeURIComponent(
                      streamSource
                    )}&fps=20${streamKey > 0 ? `&t=${streamKey}` : ""}`}
                    alt="Live Facial Recognition Stream"
                    className="w-full h-full object-contain"
                    onLoad={() => setStreamError(false)}
                    onError={() => {
                      setStreamError(true);
                    }}
                    suppressHydrationWarning
                  />
                  {streamError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-sm z-20 p-6 text-center gap-3">
                      <AlertTriangle className="w-10 h-10 text-amber-400 animate-bounce" />
                      <p className="text-sm text-slate-200 font-medium">
                        Unable to connect to feed ({streamSource === "0" ? "Local Camera 0 (Webcam)" : streamSource})
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Please verify that the webcam is connected and not locked by another software.
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => {
                            setStreamError(false);
                            setStreamKey(Date.now());
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition"
                        >
                          Retry Reconnect
                        </button>
                        <button
                          onClick={() => handleSourceChange("sample")}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                        >
                          Switch to Demo Video
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Video className="w-12 h-12 text-slate-600" />
                  <p className="text-sm">Stream paused</p>
                  <button
                    onClick={handleToggleStream}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 text-slate-950 font-bold text-xs uppercase"
                  >
                    Resume Stream
                  </button>
                </div>
              )}

              {/* Top Left Feed Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 backdrop-blur text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-slate-200 font-semibold">FEED: {streamSource.toUpperCase()}</span>
              </div>

              {/* Bottom Stream Controls Bar */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleToggleStream}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                  >
                    {isStreamPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setStreamKey(Date.now())}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                    title="Reconnect"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Source:</span>
                    <select
                      value={streamSource}
                      onChange={(e) => handleSourceChange(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="sample">Demo Video Loop</option>
                      <option value="0">Local Camera 0 (Webcam)</option>
                      <option value="1">External USB Camera 1</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                  <span className="hidden sm:inline">SMOOTHING: TEMPORAL 5-FRAME</span>
                  <span className="text-emerald-400 font-bold">YuNet + SFace</span>
                </div>
              </div>
            </div>

            {/* Quick Helper Banner */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  <strong>Emerald Reticles:</strong> Verified registered personnel with calibrated match score.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>
                  <strong>Amber Reticles:</strong> Unregistered or unknown individuals.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Detection Event Ticker */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Live Recognition Log
              </h2>
              <span className="text-xs font-mono text-slate-500">REALTIME</span>
            </div>

            <div className="flex flex-col gap-2.5 max-h-[600px] overflow-y-auto pr-1">
              {recentEvents.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                  No detection events logged yet. Faces appearing in the stream will automatically register here.
                </div>
              ) : (
                recentEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                      evt.is_known
                        ? "bg-slate-900/80 border-emerald-500/30 text-emerald-300"
                        : "bg-slate-900/80 border-amber-500/30 text-amber-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          evt.is_known
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {evt.is_known ? (
                          <UserCheck className="w-4 h-4" />
                        ) : (
                          <UserX className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-100 leading-tight">
                          {evt.name}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">
                          {evt.is_known ? `Match: ${evt.calibrated_conf}%` : "Unregistered Face"}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{evt.timestamp}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERSONNEL DIRECTORY */}
      {activeTab === "directory" && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search registered personnel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={() => openEnrollModal(null)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              Register New Identity
            </button>
          </div>

          {filteredPersons.length === 0 ? (
            <div className="p-16 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center flex flex-col items-center gap-3">
              <UserX className="w-12 h-12 text-slate-600" />
              <h3 className="text-base font-bold text-slate-300">No personnel found</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Enroll known operators, team members, or authorized border personnel using webcam or photo upload.
              </p>
              <button
                onClick={() => openEnrollModal(null)}
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-slate-950 font-bold text-xs uppercase"
              >
                Enroll First Person
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredPersons.map((person) => (
                <div
                  key={person.id}
                  className="group relative flex flex-col rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl hover:border-emerald-500/50 transition duration-300"
                >
                  <div className="relative aspect-square w-full bg-slate-950 overflow-hidden flex items-center justify-center">
                    <img
                      src={`${BACKEND_BASE_URL}${person.image_url}`}
                      alt={person.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono">
                      <span>{person.sample_count} samples</span>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col gap-3">
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm group-hover:text-emerald-400 transition">
                        {person.name}
                      </h3>
                      <p className="text-[11px] font-mono text-slate-500">ID: {person.id}</p>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {person.created_at || "Registered"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <button
                        onClick={() => openEnrollModal(person)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add Angle
                      </button>

                      <button
                        onClick={() => handleDeletePerson(person)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete Identity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FORENSIC PHOTO SCAN */}
      {activeTab === "scan" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload & Controls */}
          <div className="flex flex-col gap-5 p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-400" />
              Upload Photo for Inspection
            </h2>

            <label className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-500 cursor-pointer bg-slate-950/60 transition group">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleScanSubmit(e.target.files[0]);
                  }
                }}
              />
              <Upload className="w-10 h-10 text-slate-500 group-hover:text-emerald-400 transition" />
              <p className="mt-3 text-xs font-semibold text-slate-300">Click or Drag Image Here</p>
              <p className="text-[10px] text-slate-500 mt-1">Supports JPG, PNG, WEBP</p>
            </label>

            {/* Threshold Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Match Sensitivity Threshold:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {minMatchThreshold.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.25"
                max="0.65"
                step="0.05"
                value={minMatchThreshold}
                onChange={(e) => setMinMatchThreshold(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-800"
              />
              <span className="text-[10px] text-slate-500">
                Default 0.40 recommended for SFace cosine similarity.
              </span>
            </div>

            {scanError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {scanError}
              </div>
            )}
          </div>

          {/* Results Display */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {isScanning ? (
              <div className="p-16 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                <p className="text-xs">Extracting YuNet face anchors and computing SFace embeddings...</p>
              </div>
            ) : scanResult ? (
              <div className="flex flex-col gap-5">
                {/* Annotated Output Preview */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
                  {scanResult.annotated_image ? (
                    <img
                      src={scanResult.annotated_image}
                      alt="Annotated Inspection Result"
                      className="w-full max-h-[500px] object-contain mx-auto"
                    />
                  ) : scanPreview ? (
                    <img
                      src={scanPreview}
                      alt="Source Preview"
                      className="w-full max-h-[500px] object-contain mx-auto"
                    />
                  ) : null}

                  <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-mono text-emerald-400">
                    FACES DETECTED: {scanResult.face_count} • LATENCY: {scanResult.latency_ms}ms
                  </div>
                </div>

                {/* Detected Identities List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {scanResult.faces.map((f, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border flex items-center justify-between ${
                        f.is_known
                          ? "bg-slate-900/80 border-emerald-500/30 text-slate-100"
                          : "bg-slate-900/80 border-amber-500/30 text-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2.5 rounded-xl ${
                            f.is_known
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {f.is_known ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-100">{f.name}</p>
                          <p className="text-xs font-mono text-slate-400">
                            Confidence: {f.calibrated_conf}%
                          </p>
                          <p className="text-[10px] font-mono text-slate-500">
                            Cosine: {f.match_score} | L2: {f.l2_distance ?? "N/A"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                          f.is_known
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {f.is_known ? "VERIFIED" : "UNKNOWN"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-20 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                Upload or drop an image on the left to scan for registered personnel.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ENROLLMENT MODAL */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">
                    {targetPersonForSample
                      ? `Add Face Sample for ${targetPersonForSample.name}`
                      : "Enroll New Face Identity"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Quality requirements: Face &gt; 65x65 px, unblurred, good lighting
                  </p>
                </div>
              </div>
              <button
                onClick={closeEnrollModal}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                onClick={() => setEnrollMode("webcam")}
                className={`flex-1 py-2 rounded-lg font-medium transition ${
                  enrollMode === "webcam" ? "bg-emerald-600 text-slate-950 font-bold" : "text-slate-400"
                }`}
              >
                Direct Webcam Snap
              </button>
              <button
                onClick={() => setEnrollMode("upload")}
                className={`flex-1 py-2 rounded-lg font-medium transition ${
                  enrollMode === "upload" ? "bg-emerald-600 text-slate-950 font-bold" : "text-slate-400"
                }`}
              >
                Upload Photo File
              </button>
            </div>

            {/* Name Input (hidden if adding sample to existing) */}
            {!targetPersonForSample && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Personnel Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Hariom"
                  value={enrollName}
                  onChange={(e) => setEnrollName(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* Mode 1: Webcam Snap */}
            {enrollMode === "webcam" && (
              <div className="flex flex-col gap-3">
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
                  {enrollPreview ? (
                    <img
                      src={enrollPreview}
                      alt="Captured Face Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  )}

                  {enrollPreview && (
                    <button
                      onClick={() => setEnrollPreview(null)}
                      className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-900/90 text-xs text-slate-300 border border-slate-700 hover:bg-slate-800"
                    >
                      Retake
                    </button>
                  )}
                </div>

                {webcamError && (
                  <p className="text-xs text-rose-400">{webcamError}</p>
                )}

                {!enrollPreview && (
                  <button
                    onClick={captureWebcamSnapshot}
                    disabled={!isWebcamActive}
                    className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4 text-emerald-400" />
                    Snap Face Photo
                  </button>
                )}
              </div>
            )}

            {/* Mode 2: File Upload */}
            {enrollMode === "upload" && (
              <div className="flex flex-col gap-3">
                <label className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500 cursor-pointer bg-slate-950/60 transition">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setEnrollFile(file);
                        setEnrollPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  {enrollPreview ? (
                    <img
                      src={enrollPreview}
                      alt="Upload Preview"
                      className="max-h-48 rounded-xl object-contain"
                    />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-500" />
                      <p className="mt-2 text-xs text-slate-300 font-semibold">Select Clear Face Photo</p>
                      <p className="text-[10px] text-slate-500">JPG, PNG up to 10MB</p>
                    </>
                  )}
                </label>
              </div>
            )}

            {enrollError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {enrollError}
              </div>
            )}

            {enrollSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {enrollSuccess}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={closeEnrollModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleEnrollSubmit}
                disabled={isEnrolling || !enrollPreview}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition"
              >
                {isEnrolling ? "Verifying & Enrolling..." : "Complete Enrollment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
