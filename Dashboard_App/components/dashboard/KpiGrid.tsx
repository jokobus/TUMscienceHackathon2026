"use client";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/States";
import type { KpiSet } from "@/lib/types";

/** KPI & Relationship-ROI context (AGENT §1.5 / §2.1). Reused globally & per-event. */
export function KpiGrid({ kpis, loading }: { kpis?: KpiSet | null; loading?: boolean }) {
  if (loading || !kpis) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-card" />
        ))}
      </div>
    );
  }

  const appearedRate = kpis.registered > 0 ? Math.round((kpis.appeared / kpis.registered) * 100) : null;
  const fullSessionRate = kpis.appeared > 0 ? Math.round((kpis.full_session / kpis.appeared) * 100) : 0;

  const items: { label: string; value: string; sub?: string }[] = [
    { label: "Visitors", value: String(kpis.visitor_count) },
    {
      label: "Registered → Appeared",
      value: appearedRate !== null ? `${appearedRate}%` : "—",
      sub: `${kpis.appeared}/${kpis.registered || "—"}`,
    },
    { label: "Full Session", value: `${fullSessionRate}%`, sub: `${kpis.full_session} stayed` },
    { label: "Recommendation", value: kpis.recommendation_score.toFixed(1), sub: kpis.nps_score != null ? `NPS ${kpis.nps_score}` : undefined },
    { label: "Returning Users", value: String(kpis.returning_users), sub: `${kpis.new_users} new` },
    { label: "Qualified Leads", value: String(kpis.qualified_leads) },
    { label: "Cost / Lead", value: kpis.cost_per_lead != null ? `€${kpis.cost_per_lead}` : "—" },
    { label: "Avg. Engagement", value: `${kpis.avg_engagement}/100` },
    { label: "Avg. Follow-Ups", value: kpis.avg_follow_up_actions.toFixed(1) },
    { label: "Host Experience", value: kpis.host_experience != null ? `${kpis.host_experience.toFixed(1)}/5` : "—" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {items.map((it) => (
        <Card key={it.label} className="p-4">
          <div className="text-xs font-medium text-we-muted">{it.label}</div>
          <div className="mt-1 text-lg font-semibold text-we-ink">{it.value}</div>
          {it.sub && <div className="text-[11px] text-we-slate">{it.sub}</div>}
        </Card>
      ))}
    </div>
  );
}
