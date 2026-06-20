"use client";

import { SectionLabel } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { NextBestEvents } from "@/components/dashboard/NextBestEvents";
import { TimelineGantt } from "@/components/dashboard/TimelineGantt";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { EventTable } from "@/components/events/EventTable";
import { getDashboardKpis } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";

export default function DashboardPage() {
  const { data: kpis, loading } = useAsync(() => getDashboardKpis(), []);

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-editorial">
      {/* ── Masthead: kicker + headline only ── */}
      <header className="mb-12 border-b border-we-line pb-9">
        <div className="eyebrow mb-4">Control Center · {today}</div>
        <h1 className="font-display text-display-sm font-medium leading-[1.04] text-we-ink md:text-display-lg">
          Event intelligence,
          <br />
          <span className="italic text-we-red">measured in relationships.</span>
        </h1>
      </header>

      {/* ── Key figures — number-first, directly under the headline ── */}
      <Reveal as="section" className="mb-16">
        <KpiGrid kpis={kpis} loading={loading} />
      </Reveal>

      {/* ── 01 Performance + recommendations (asymmetric 8/4) ── */}
      <Reveal as="section" className="mb-16">
        <SectionLabel index="01" title="Performance" hint="Relationship & brand, not commercial" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.9fr_1fr]">
          <PerformanceChart />
          <NextBestEvents />
        </div>
      </Reveal>

      {/* ── 02 Timeline ── */}
      <Reveal as="section" className="mb-16">
        <SectionLabel index="02" title="Timeline" hint="Prep · event · follow-up windows" />
        <TimelineGantt />
      </Reveal>

      {/* ── 03 All events ── */}
      <Reveal as="section" className="mb-4">
        <SectionLabel index="03" title="All events" hint="Click to open the detail view" />
        <EventTable />
      </Reveal>
    </div>
  );
}
