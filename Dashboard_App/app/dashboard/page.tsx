"use client";

import { Reveal } from "@/components/ui/Reveal";
import { DashboardInsights } from "@/components/dashboard/DashboardInsights";
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

      {/* ── 01 Global KPIs / Performance alternative ── */}
      <Reveal as="section" className="mb-16">
        <DashboardInsights kpis={kpis} loading={loading} />
      </Reveal>

      {/* ── 02 Events ── */}
      <Reveal as="section" className="mb-4">
        <EventCards />
      </Reveal>
    </div>
  );
}
