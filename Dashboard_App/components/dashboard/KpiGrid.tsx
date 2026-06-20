"use client";

import { Skeleton } from "@/components/ui/States";
import type { KpiSet } from "@/lib/types";

/** KPI & Relationship-ROI context (AGENT §1.5 / §2.1). Editorial stat table:
 *  big mono figures on a hairline grid — no boxes, no shadows. */
export function KpiGrid({ kpis, loading }: { kpis?: KpiSet | null; loading?: boolean }) {
  if (loading || !kpis) {
    return <Skeleton className="h-44 w-full rounded-card" />;
  }

  const appearedRate = kpis.registered > 0 ? Math.round((kpis.appeared / kpis.registered) * 100) : null;
  const fullSessionRate = kpis.appeared > 0 ? Math.round((kpis.full_session / kpis.appeared) * 100) : 0;

  const items: { label: string; value: string; sub?: string }[] = [
    { label: "Visitors", value: String(kpis.visitor_count) },
    { label: "Reg. → Appeared", value: appearedRate !== null ? `${appearedRate}%` : "—", sub: `${kpis.appeared}/${kpis.registered || "—"}` },
    { label: "Full session", value: `${fullSessionRate}%`, sub: `${kpis.full_session} stayed` },
    { label: "Recommendation", value: kpis.recommendation_score.toFixed(1), sub: kpis.nps_score != null ? `NPS ${kpis.nps_score}` : undefined },
    { label: "Returning", value: String(kpis.returning_users), sub: `${kpis.new_users} new` },
    { label: "Qualified leads", value: String(kpis.qualified_leads) },
    { label: "Cost / lead", value: kpis.cost_per_lead != null ? `€${kpis.cost_per_lead}` : "—" },
    { label: "Avg. engagement", value: `${kpis.avg_engagement}`, sub: "/ 100" },
    { label: "Avg. follow-ups", value: kpis.avg_follow_up_actions.toFixed(1) },
    { label: "Host experience", value: kpis.host_experience != null ? kpis.host_experience.toFixed(1) : "—", sub: "/ 5" },
  ];

  return (
    // gap-px on a line-colored ground draws perfect hairlines between cells
    <div className="overflow-hidden rounded-card border border-we-line bg-we-line">
      <div className="grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-5">
        {items.map((it) => (
          <div key={it.label} className="bg-we-surface px-5 py-6">
            <div className="eyebrow mb-2.5 whitespace-nowrap">{it.label}</div>
            <div className="tnum flex items-baseline gap-1 text-[28px] font-medium leading-none text-we-ink">
              {it.value}
              {it.sub && <span className="text-[12px] font-normal text-we-muted">{it.sub}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
