"use client";

import { DashboardHeader } from "@/components/dashboard/dashboardheader";
import { MetricsRow } from "@/components/dashboard/metricsrow";
import { BorderMap } from "@/components/map/BorderMap";
import { RecentAlerts } from "@/components/dashboard/recentalerts";
import { SystemStatus } from "@/components/dashboard/systemstatus";
import { CameraFeedStrip } from "@/components/dashboard/camerafeedstrip";

export default function DashboardPage() {
  return (
    <div className="space-y-6 pb-10">
      {/* 1. Dashboard Header */}
      <DashboardHeader />

      {/* 2. Metrics Row */}
      <MetricsRow />

      {/* 3. Border Map + Recent Alerts side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
          <BorderMap />
        </div>
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
          <RecentAlerts />
        </div>
      </div>

      {/* 4. System Status */}
      <SystemStatus />

      {/* 5. Camera Feeds Strip */}
      <CameraFeedStrip />
    </div>
  );
}
