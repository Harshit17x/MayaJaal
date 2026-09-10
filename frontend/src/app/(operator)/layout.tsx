"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Map as MapIcon,
  Video,
  AlertTriangle,
  Camera,
  Activity,
  Globe,
  Car,
  Settings,
  Search,
  Bell,
  Cpu,
  LogOut,
  Pin,
  PinOff,
  PanelLeft,
  Maximize2,
  Minimize2,
  ScanFace,
} from "lucide-react";
import { useAlerts } from "@/lib/alertsStore";
import { useAuth } from "@/lib/authStore";
import { TacticalThreatToast } from "@/components/alerts/TacticalThreatToast";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
}

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { operator, logout } = useAuth();
  const { unacknowledgedCount } = useAlerts();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTimestamp, setCurrentTimestamp] = useState<{
    date: string;
    time: string;
  }>({
    date: "09 Sep 2026",
    time: "10:24:00",
  });

  // Sidebar modes:
  // "rail" = compact icon rail (68px) that expands to 256px on hover
  // "hidden" = completely off-screen (0px), expands to 256px on left-edge / trigger hover
  // "pinned" = locked open at 256px
  const [sidebarMode, setSidebarMode] = useState<"rail" | "hidden" | "pinned">("rail");
  const [isHovered, setIsHovered] = useState(false);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Restore saved sidebar preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem("maatrix_sidebar_mode");
      if (saved === "rail" || saved === "hidden" || saved === "pinned") {
        setSidebarMode(saved);
      }
    } catch {
      // Ignore localStorage access errors
    }
  }, []);

  const handleModeChange = (newMode: "rail" | "hidden" | "pinned") => {
    setSidebarMode(newMode);
    try {
      localStorage.setItem("maatrix_sidebar_mode", newMode);
    } catch {}
  };

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
    leaveTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  };

  // Whether the sidebar is currently showing its expanded view
  const isExpanded = sidebarMode === "pinned" || isHovered;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const date = now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      });
      const time = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Kolkata",
      });
      setCurrentTimestamp({ date, time });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const mainNavItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "GIS Map",
      href: "/gis-map",
      icon: MapIcon,
    },
    {
      label: "Live Surveillance",
      href: "/live",
      icon: Video,
    },
    {
      label: "Alerts",
      href: "/alerts",
      icon: AlertTriangle,
      badge: unacknowledgedCount > 0 ? unacknowledgedCount : 8,
      badgeColor: "bg-rose-600 text-white",
    },
    {
      label: "Cameras",
      href: "/cameras",
      icon: Camera,
    },
    {
      label: "Tracks & Trajectories",
      href: "/tracks",
      icon: Activity,
    },
    {
      label: "Geofences",
      href: "/geofences",
      icon: Globe,
    },
    {
      label: "ANPR Vehicles",
      href: "/anpr",
      icon: Car,
    },
    {
      label: "Facial Recognition",
      href: "/facial-recognition",
      icon: ScanFace,
    },
  ];

  const systemNavItems: NavItem[] = [
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
    },
    {
      label: "Diagnostics",
      href: "/diagnostics",
      icon: Cpu,
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f4f7f5] relative">
      {/* Edge Hover Sensor for Pure Fullscreen Mode */}
      {sidebarMode === "hidden" && !isHovered && (
        <div
          onMouseEnter={handleMouseEnter}
          className="fixed top-0 bottom-0 left-0 w-3 z-30 group cursor-pointer flex items-center"
          title="Move cursor here to reveal navigation menu"
        >
          <div className="w-1.5 h-16 rounded-r-full bg-[#1e4b38]/50 group-hover:bg-[#1e4b38] group-hover:w-2.5 transition-all shadow-sm ml-0" />
        </div>
      )}

      {/* Spacer in document flow to keep layout stable and maximize screen width */}
      <div
        className={`flex-shrink-0 transition-all duration-300 ease-in-out ${
          sidebarMode === "pinned"
            ? "w-64"
            : sidebarMode === "rail"
            ? "w-[68px]"
            : "w-0"
        }`}
        aria-hidden="true"
      />

      {/* Subtle backdrop overlay when expanded in floating hover mode */}
      {sidebarMode !== "pinned" && isExpanded && (
        <div
          onClick={() => setIsHovered(false)}
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-[0.5px] z-30 transition-opacity duration-300"
        />
      )}

      {/* Light Government Green Left Sidebar (Auto-expand on hover, auto-collapse on mouse leave) */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#edf3ef] text-[#1c3829] flex flex-col border-r border-[#d2dfd6] select-none transition-all duration-300 ease-in-out ${
          sidebarMode === "hidden"
            ? isExpanded
              ? "w-64 translate-x-0 shadow-xl shadow-slate-900/10 ring-1 ring-[#1e4b38]/10"
              : "w-64 -translate-x-full shadow-none"
            : isExpanded
            ? "w-64 shadow-xl shadow-slate-900/10 ring-1 ring-[#1e4b38]/10"
            : "w-[68px] shadow-xs"
        }`}
      >
        {/* Top Header: MAATRIX Logo, Status & Controls */}
        <div className="p-3.5 border-b border-[#d2dfd6] bg-[#e4ede6]/60">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 group min-w-0"
              title="MAATRIX - Border Video Analytics"
            >
              {/* Official MAATRIX Brand Emblem */}
              <div className="w-10 h-10 rounded-xl bg-white border border-[#bcd3c4] flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:border-[#1e4b38]/60 transition-all p-1.5 overflow-hidden">
                <img
                  src="/images/logo/maatrix-emblem.png"
                  alt="MAATRIX Logo"
                  className="w-full h-full object-contain filter drop-shadow-xs"
                />
              </div>

              {isExpanded && (
                <div className="overflow-hidden min-w-0 animate-in fade-in duration-200">
                  <h1 className="text-base font-extrabold tracking-wider text-[#143924] uppercase truncate leading-tight">
                    MAATRIX
                  </h1>
                  <p className="text-[11px] font-semibold text-[#2b593d] truncate">
                    Border Video Analytics
                  </p>
                </div>
              )}
            </Link>

            {/* Quick Action Controls in Expanded Mode */}
            {isExpanded && (
              <div className="flex items-center gap-1 animate-in fade-in duration-150">
                {/* Switch between Compact Rail and Pure Fullscreen */}
                <button
                  type="button"
                  onClick={() =>
                    handleModeChange(sidebarMode === "hidden" ? "rail" : "hidden")
                  }
                  className={`p-1.5 rounded-lg text-[#325b42] hover:text-[#143924] hover:bg-[#d8e6db] transition-colors cursor-pointer ${
                    sidebarMode === "hidden" ? "text-[#143924] bg-[#d8e6db]" : ""
                  }`}
                  title={
                    sidebarMode === "hidden"
                      ? "Switch to Compact Rail mode"
                      : "Switch to 100% Pure Fullscreen mode (hide completely)"
                  }
                >
                  {sidebarMode === "hidden" ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Pin / Unpin Button */}
                <button
                  type="button"
                  onClick={() =>
                    handleModeChange(sidebarMode === "pinned" ? "rail" : "pinned")
                  }
                  className={`p-1.5 rounded-lg text-[#325b42] hover:text-[#143924] hover:bg-[#d8e6db] transition-colors cursor-pointer ${
                    sidebarMode === "pinned"
                      ? "text-[#143924] bg-[#d3e3d7] ring-1 ring-[#1e4b38]/20"
                      : ""
                  }`}
                  title={
                    sidebarMode === "pinned"
                      ? "Unpin sidebar (enable auto-collapse on hover)"
                      : "Pin sidebar permanently open"
                  }
                >
                  {sidebarMode === "pinned" ? (
                    <Pin className="w-3.5 h-3.5 rotate-45" />
                  ) : (
                    <PinOff className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-2.5 py-4 space-y-5 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {/* Main Operational Links */}
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === "/dashboard" && pathname === "/");
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={!isExpanded ? item.label : undefined}
                  className={`flex items-center rounded-xl text-xs font-semibold transition-all relative group ${
                    isExpanded
                      ? "px-3.5 py-2.5 justify-between"
                      : "w-11 h-11 mx-auto justify-center"
                  } ${
                    isActive
                      ? "bg-[#d5e6db] text-[#123621] font-bold shadow-2xs border border-[#b8d1c1]"
                      : "text-[#2e543d] hover:bg-[#e0ede4] hover:text-[#123621]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`flex-shrink-0 transition-colors ${
                        isExpanded ? "w-4 h-4" : "w-5 h-5"
                      } ${
                        isActive
                          ? "text-[#18492d]"
                          : "text-[#3d654f] group-hover:text-[#18492d]"
                      }`}
                    />
                    {isExpanded && (
                      <span className="truncate whitespace-nowrap animate-in fade-in duration-150">
                        {item.label}
                      </span>
                    )}
                  </div>

                  {item.badge !== undefined &&
                    (isExpanded ? (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full flex-shrink-0 ${
                          item.badgeColor || "bg-[#1e4b38] text-white"
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : (
                      <span
                        className={`absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center text-[9px] font-bold rounded-full ring-2 ring-[#edf3ef] ${
                          item.badgeColor || "bg-rose-600 text-white"
                        }`}
                      >
                        {item.badge}
                      </span>
                    ))}
                </Link>
              );
            })}
          </nav>

          {/* SYSTEM section */}
          <div>
            {isExpanded ? (
              <div className="px-3 mb-2 text-[10px] font-bold tracking-wider uppercase text-[#476e57] animate-in fade-in duration-150">
                SYSTEM
              </div>
            ) : (
              <div className="w-8 mx-auto h-px bg-[#cddcd2] my-3" />
            )}
            <nav className="space-y-1">
              {systemNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={!isExpanded ? item.label : undefined}
                    className={`flex items-center rounded-xl text-xs font-semibold transition-all relative group ${
                      isExpanded
                        ? "px-3.5 py-2.5 gap-3"
                        : "w-11 h-11 mx-auto justify-center"
                    } ${
                      isActive
                        ? "bg-[#d5e6db] text-[#123621] font-bold shadow-2xs border border-[#b8d1c1]"
                        : "text-[#2e543d] hover:bg-[#e0ede4] hover:text-[#123621]"
                    }`}
                  >
                    <Icon
                      className={`flex-shrink-0 transition-colors ${
                        isExpanded ? "w-4 h-4" : "w-5 h-5"
                      } ${
                        isActive
                          ? "text-[#18492d]"
                          : "text-[#3d654f] group-hover:text-[#18492d]"
                      }`}
                    />
                    {isExpanded && (
                      <span className="truncate whitespace-nowrap animate-in fade-in duration-150">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div
          className={`border-t border-[#d2dfd6] bg-[#e4ede6]/40 transition-all ${
            isExpanded
              ? "px-4 py-3.5 flex items-center justify-between text-xs text-[#2e543d]"
              : "py-3 flex flex-col items-center justify-center"
          }`}
        >
          {isExpanded ? (
            <>
              <div className="overflow-hidden">
                <p className="font-bold text-[#143924] text-[11px] truncate">
                  Sector HQ Command
                </p>
                <p className="text-[10px] text-[#476e57] truncate">Edge Inference v2.1</p>
              </div>
              <span className="inline-block w-2 h-2 rounded-full bg-[#16a34a] flex-shrink-0" />
            </>
          ) : (
            <div
              className="w-8 h-8 rounded-full bg-[#dbe8df] flex items-center justify-center cursor-help"
              title="Sector HQ Command • Edge Inference v2.1"
            >
              <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
            </div>
          )}
        </div>
      </aside>

      {/* Main Area: Top Bar + Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Global Top Surveillance Bar */}
        <header className="h-16 flex-shrink-0 bg-white border-b border-[#dce5df] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-4 z-20">
          {/* Left Outpost & Mesh Status + Sidebar Quick Toggle */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm min-w-0">
            {/* Sidebar quick mode toggle button */}
            <button
              type="button"
              onClick={() => {
                if (sidebarMode === "rail") handleModeChange("hidden");
                else if (sidebarMode === "hidden") handleModeChange("pinned");
                else handleModeChange("rail");
              }}
              className="p-2 rounded-xl text-slate-600 hover:text-[#18492d] hover:bg-[#ebf2ed] border border-slate-200 transition-all flex items-center gap-1.5 group cursor-pointer shadow-2xs flex-shrink-0"
              title={`Sidebar Mode: ${
                sidebarMode === "rail"
                  ? "Hover Rail (Click for 100% Pure Fullscreen)"
                  : sidebarMode === "hidden"
                  ? "100% Fullscreen (Click to Pin Open)"
                  : "Pinned Open (Click for Hover Rail)"
              }`}
            >
              <PanelLeft className="w-4 h-4 text-[#1e4b38] group-hover:scale-105 transition-transform" />
              <span className="hidden xl:inline text-[11px] font-semibold text-slate-600 group-hover:text-[#18492d]">
                {sidebarMode === "rail"
                  ? "Hover Rail"
                  : sidebarMode === "hidden"
                  ? "100% Fullscreen"
                  : "Pinned"}
              </span>
            </button>

            <div className="hidden md:block w-px h-4 bg-slate-200 flex-shrink-0" />

            {/* Time Stamp */}
            <div
              className="hidden md:flex flex-col text-xs font-mono text-slate-500 flex-shrink-0"
              suppressHydrationWarning
            >
              <span suppressHydrationWarning>{currentTimestamp.date}</span>
              <span className="text-[10px] text-slate-400" suppressHydrationWarning>
                {currentTimestamp.time} IST
              </span>
            </div>

          </div>

          {/* Right Search, Alerts, & Commander Profile */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            {/* Global Search Input */}
            <div className="relative hidden sm:block">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search cameras, zones, alert IDs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 w-44 lg:w-64 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e4b38]/20 focus:border-[#1e4b38] transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Notifications Bell */}
            <Link
              href="/alerts"
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              title="Tactical Alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-white" />
            </Link>

            <div className="w-px h-6 bg-slate-200" />

            {/* Officer Profile & Sign Out */}
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {operator?.name || "Insp. K. Rathore"}
                </div>
                <div className="text-[10px] font-medium text-slate-500">
                  {operator?.role || "Shift Commander"}
                </div>
              </div>
              <div
                className="w-8 h-8 rounded-full bg-[#1e4b38] text-white flex items-center justify-center text-xs font-bold ring-2 ring-[#1e4b38]/20 shadow-xs select-none"
                title={operator ? `${operator.name} • ${operator.badgeNumber}` : "Shift Commander"}
              >
                {operator?.avatarInitials || "KR"}
              </div>

              {/* Sign Out / Exit button */}
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Sign Out / Switch Operator"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Page Body - Full screen utilization */}
        <main className="flex-1 overflow-y-auto bg-[#f4f7f5] p-4 sm:p-6 lg:p-8 relative">
          <TacticalThreatToast />
          <div className="w-full max-w-[1920px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
