"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radio,
  AlertTriangle,
  Camera,
  Activity,
  ShieldAlert,
  Car,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Live", href: "/live", icon: Radio },
  { label: "Alerts", href: "/alerts", icon: AlertTriangle },
  { label: "Cameras", href: "/cameras", icon: Camera },
  { label: "Tracks", href: "/tracks", icon: Activity },
  { label: "Geofences", href: "/geofences", icon: ShieldAlert },
  { label: "ANPR", href: "/anpr", icon: Car },
];

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f7f7f5]">
      {/* Dark Forest Green Left Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-[#123824] text-white flex flex-col border-r border-[#0d2a1b]">
        {/* Top Header: Portal Name */}
        <div className="px-6 py-6 border-b border-[#1b4b32]">
          <Link href="/" className="block">
            <h1 className="text-2xl font-black tracking-widest text-white">
              IBVAP
            </h1>
            <p className="text-[11px] font-medium tracking-wider text-emerald-300/80 uppercase mt-0.5">
              Operator Portal
            </p>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#1c5436] text-white shadow-sm"
                    : "text-emerald-100/75 hover:bg-[#18462d] hover:text-white"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-emerald-300" : "text-emerald-200/70"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-6 py-4 border-t border-[#1b4b32] text-xs text-emerald-200/60">
          <p className="font-semibold text-emerald-100/80">Sector HQ Surveillance</p>
          <p className="text-[11px] mt-0.5">Border Security Ops</p>
        </div>
      </aside>

      {/* Large Light Main Area */}
      <main className="flex-1 h-full overflow-y-auto bg-[#f7f7f5] p-8 md:p-10">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
