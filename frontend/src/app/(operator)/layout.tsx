"use client";

import { useState, useEffect } from "react";
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
  Shield,
  Search,
  Bell,
  Cpu,
  LogOut,
} from "lucide-react";
import { useAlerts } from "@/lib/alertsStore";
import { useAuth } from "@/lib/authStore";

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
    <div className="flex h-screen w-screen overflow-hidden bg-[#f7f7f5]">
      {/* Dark Forest Green Left Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-[#0e2218] text-white flex flex-col border-r border-[#091710] select-none">
        {/* Top Header: MayaJaal Logo & Node Status */}
        <div className="p-5 border-b border-[#163325]">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            {/* Stylized MayaJaal Brand Icon */}
            <div className="w-10 h-10 rounded-xl bg-[#17432c] border border-emerald-500/30 flex items-center justify-center shadow-xs group-hover:border-emerald-400/60 transition-colors">
              <svg
                className="w-6 h-6 text-emerald-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-wider text-white uppercase">
                MAYAJAAL
              </h1>
              <p className="text-[11px] font-medium text-emerald-300/80">
                Border Video Analytics
              </p>
            </div>
          </Link>

          {/* Node Active Sector Pill */}
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#143224] border border-emerald-600/30 text-xs font-medium text-emerald-300 w-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Node Active • Sector-04</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">
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
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#1c4832] text-white shadow-xs"
                      : "text-emerald-100/75 hover:bg-[#143525] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-emerald-400" : "text-emerald-300/60"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        item.badgeColor || "bg-emerald-500 text-white"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* SYSTEM section */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold tracking-wider uppercase text-emerald-400/50">
              SYSTEM
            </div>
            <nav className="space-y-1">
              {systemNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-[#1c4832] text-white shadow-xs"
                        : "text-emerald-100/75 hover:bg-[#143525] hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-emerald-400" : "text-emerald-300/60"
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="px-5 py-3.5 border-t border-[#163325] text-xs text-emerald-300/60 flex items-center justify-between">
          <div>
            <p className="font-semibold text-emerald-200/90 text-[11px]">
              Sector HQ Command
            </p>
            <p className="text-[10px] text-emerald-400/60">Edge Inference v2.1</p>
          </div>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
        </div>
      </aside>

      {/* Main Area: Top Bar + Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Global Top Surveillance Bar */}
        <header className="h-16 flex-shrink-0 bg-white border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between gap-4 z-20">
          {/* Left Outpost & Mesh Status */}
          <div className="flex items-center gap-4 text-xs sm:text-sm">
            {/* BOP Outpost pill */}
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Shield className="w-4 h-4 text-emerald-800" />
              <span className="truncate max-w-[220px]">{operator?.sector || "Sector-04 (BOP Alpha)"}</span>
            </div>

            <div className="hidden md:block w-px h-4 bg-slate-200" />

            {/* Time Stamp */}
            <div
              className="hidden md:flex flex-col text-xs font-mono text-slate-500"
              suppressHydrationWarning
            >
              <span suppressHydrationWarning>{currentTimestamp.date}</span>
              <span className="text-[10px] text-slate-400" suppressHydrationWarning>
                {currentTimestamp.time} IST
              </span>
            </div>

            {/* Online Nodes indicator */}
            <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>12/12 Mesh Nodes Online</span>
            </div>
          </div>

          {/* Right Search, Alerts, & Commander Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Global Search Input */}
            <div className="relative hidden sm:block">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search cameras, zones, alert IDs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 w-48 lg:w-64 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all placeholder:text-slate-400"
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
                className="w-8 h-8 rounded-full bg-[#143724] text-white flex items-center justify-center text-xs font-bold ring-2 ring-emerald-600/20 shadow-xs select-none"
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

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto bg-[#f7f7f5] p-6 sm:p-8 md:p-10">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
