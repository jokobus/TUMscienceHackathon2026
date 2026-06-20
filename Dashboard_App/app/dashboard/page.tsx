"use client";

import { SectionLabel } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { ExecutiveSummaryStrip } from "@/components/dashboard/ExecutiveSummaryStrip";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { NextBestEvents } from "@/components/dashboard/NextBestEvents";
import { TimelineGantt } from "@/components/dashboard/TimelineGantt";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { EventTable } from "@/components/events/EventTable";
import { getDashboardKpis, getDashboardSummary } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";

export default function DashboardPage() {
  const { data: kpis, loading } = useAsync(() => getDashboardKpis(), []);
  const { data: summary } = useAsync(() => getDashboardSummary(), []);

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-editorial">
      {/* ── Masthead: asymmetric — editorial headline + one oversized figure ── */}
      <header className="mb-12 grid grid-cols-1 items-end gap-8 border-b border-we-line pb-9 lg:grid-cols-[1fr_auto]">
        <div className="max-w-2xl">
          <div className="eyebrow mb-4">Control Center · {today}</div>
          <h1 className="font-display text-display-sm font-medium leading-[1.04] text-we-ink md:text-display-lg">
            Event intelligence,
            <br />
            <span className="italic text-we-red">measured in relationships.</span>
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-we-slate">
            Which events build lasting student relationships — and which formats to
            repeat, fix, or retire. Not commercial vanity metrics; brand retention and
            continuity.
          </p>
        </div>

        {summary && (
          <div className="flex gap-10 lg:flex-col lg:items-end lg:gap-6 lg:border-l lg:border-we-line lg:pl-10">
            <Figure
              value={String(summary.avg_relationship_engagement)}
              unit="/100"
              label="Avg. engagement"
            />
            <Figure
              value={`↑ ${Math.abs(summary.returning_user_trend.delta_pct)}%`}
              label="Returning trend"
              accent
            />
          </div>
        )}
      </header>

      {/* ── 01 Overview ── */}
      <Reveal as="section" className="mb-16">
        <SectionLabel index="01" title="Overview" hint="What needs attention right now" />
        <ExecutiveSummaryStrip />
      </Reveal>

      {/* ── 02 Performance + recommendations (asymmetric 8/4) ── */}
      <Reveal as="section" className="mb-16">
        <SectionLabel index="02" title="Performance" hint="Relationship & brand, not commercial" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.9fr_1fr]">
          <PerformanceChart />
          <NextBestEvents />
        </div>
      </Reveal>

      {/* ── 03 Timeline ── */}
      <Reveal as="section" className="mb-16">
        <SectionLabel index="03" title="Timeline" hint="Prep · event · follow-up windows" />
        <TimelineGantt />
      </Reveal>

      {/* ── 04 KPI context ── */}
      <Reveal as="section" className="mb-16">
        <SectionLabel index="04" title="Key figures" hint="Through a relationship-ROI lens" />
        <KpiGrid kpis={kpis} loading={loading} />
      </Reveal>

      {/* ── 05 All events ── */}
      <Reveal as="section" className="mb-4">
        <SectionLabel index="05" title="All events" hint="Click to open the detail view" />
        <EventTable />
      </Reveal>
    </div>
  );
}

function Figure({
  value,
  unit,
  label,
  accent,
}: {
  value: string;
  unit?: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="text-left lg:text-right">
      <div
        className={`tnum text-4xl font-medium leading-none ${
          accent ? "text-we-red" : "text-we-ink"
        }`}
      >
        {value}
        {unit && <span className="ml-1 text-base font-normal text-we-muted">{unit}</span>}
      </div>
      <div className="eyebrow mt-2">{label}</div>
    </div>
  );
}
