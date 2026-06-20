"use client";

import { Skeleton } from "@/components/ui/States";
import type { KpiSet } from "@/lib/types";

/** Key figures (AGENT §1.5 / §2.1). Number-first: large black figures carry the
 *  hierarchy on their own; labels are a quiet whisper underneath — no shouting
 *  uppercase, no mono labels, no secondary detail lines. */
export function KpiGrid({ kpis, loading }: { kpis?: KpiSet | null; loading?: boolean }) {
  if (loading || !kpis) {
    return <Skeleton className="h-44 w-full rounded-card" />;
  }

  const appearedRate = kpis.registered > 0 ? Math.round((kpis.appeared / kpis.registered) * 100) : null;
  const fullSessionRate = kpis.appeared > 0 ? Math.round((kpis.full_session / kpis.appeared) * 100) : 0;

  const items: { value: string; unit?: string; label: string }[] = [
    { value: String(kpis.visitor_count), label: "Visitors" },
    { value: appearedRate !== null ? String(appearedRate) : "—", unit: "%", label: "Appeared of registered" },
    { value: String(fullSessionRate), unit: "%", label: "Full session" },
    { value: kpis.recommendation_score.toFixed(1), label: "Recommendation" },
    { value: String(kpis.returning_users), label: "Returning users" },
    { value: String(kpis.qualified_leads), label: "Qualified leads" },
    { value: kpis.cost_per_lead != null ? String(kpis.cost_per_lead) : "—", unit: "€", label: "Cost per lead" },
    { value: String(kpis.avg_engagement), label: "Avg. engagement" },
    { value: kpis.avg_follow_up_actions.toFixed(1), label: "Follow-ups / event" },
    { value: kpis.host_experience != null ? kpis.host_experience.toFixed(1) : "—", label: "Host experience" },
  ];

  return (
    // gap-px on a line-colored ground draws clean hairlines between cells
    <div className="overflow-hidden rounded-card border border-we-line bg-we-line">
      <div className="grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-5">
        {items.map((it) => (
          <div key={it.label} className="bg-we-surface px-6 py-7">
            <div className="tnum flex items-baseline text-[34px] font-medium leading-none tracking-tight text-we-ink">
              {it.unit === "€" && <span className="mr-0.5 text-2xl text-we-slate">€</span>}
              {it.value}
              {it.unit === "%" && <span className="text-2xl text-we-slate">%</span>}
            </div>
            <div className="mt-3 text-[13px] leading-snug text-we-muted">{it.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
