"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { ExecutiveSummaryStrip } from "@/components/dashboard/ExecutiveSummaryStrip";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { NextBestEvents } from "@/components/dashboard/NextBestEvents";
import { TimelineGantt } from "@/components/dashboard/TimelineGantt";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { EventTable } from "@/components/events/EventTable";
import { getDashboardKpis } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";

export default function DashboardPage() {
  const { data: kpis, loading } = useAsync(() => getDashboardKpis(), []);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Event Dashboard"
        subtitle="Event Intelligence & Relationship-ROI control center — which events build lasting student relationships."
      />

      {/* 1.1 Executive Summary Strip */}
      <ExecutiveSummaryStrip />

      {/* 1.2 Performance Chart + 1.3 Next Best Events */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PerformanceChart />
        </div>
        <NextBestEvents />
      </div>

      {/* 1.4 Timeline / Gantt */}
      <TimelineGantt />

      {/* 1.5 Global KPI context */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-we-slate">
          KPI & Relationship-ROI context
        </h2>
        <KpiGrid kpis={kpis} loading={loading} />
      </section>

      {/* All events overview (click → Event Detail) */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-we-slate">All events</h2>
        <EventTable />
      </section>
    </div>
  );
}
