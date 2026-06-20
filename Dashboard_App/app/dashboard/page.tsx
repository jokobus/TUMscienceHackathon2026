"use client";

import { SectionLabel } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { NextBestEvents } from "@/components/dashboard/NextBestEvents";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { EventCards } from "@/components/events/EventCards";
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
        <NextBestEvents />
      </Reveal>

      {/* ── 01 Performance + recommendations (asymmetric 8/4) ── */}
      <Reveal as="section" className="mb-16">
        <SectionLabel index="02" title="Performance" hint="Relationship & brand, not commercial" />
        <PerformanceChart />
      </Reveal>

      {/* ── 02 Events ── */}
      <Reveal as="section" className="mb-4">
        <SectionLabel index="03" title="Events" hint="Cards or timeline" />
        <EventCards />
      </Reveal>
    </div>
  );
}
