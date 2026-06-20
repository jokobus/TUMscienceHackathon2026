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

  const appearedRate = kpis.registered > 0 ? Math.round(kpis.check_in_rate * 100) : null;
  const fullSessionRate = kpis.checked_in > 0 ? Math.round(kpis.full_session_rate * 100) : 0;

  const items: { value: string; unit?: string; label: string }[] = [
    { value: String(kpis.checked_in), label: "Visitors" },
    { value: appearedRate !== null ? String(appearedRate) : "—", unit: "%", label: "Appeared of registered" },
    { value: String(fullSessionRate), unit: "%", label: "Full session" },
    { value: kpis.recommendation_score.toFixed(1), label: "Recommendation" },
    { value: String(kpis.qualified_leads), label: "Qualified leads" },
    { value: String(kpis.engagement_index), label: "Avg. engagement" },
    { value: String(kpis.follow_ups_open), label: "Open follow-ups" },
    { value: kpis.nps_score != null ? String(kpis.nps_score) : "—", label: "NPS Score" },
    { value: kpis.returning_users != null ? String(kpis.returning_users) : "—", label: "Returning users" },
    { value: kpis.cost_per_lead != null ? String(kpis.cost_per_lead) : "—", unit: "€", label: "Cost per lead" },
  ];

  return (
    // gap-px on a line-colored ground draws clean hairlines between cells
    <div className="overflow-hidden rounded-card border border-we-line bg-we-line">
      <div className="grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-5">
        {items.map((it) => (
          <div key={it.label} className="bg-we-surface px-6 py-7">
            <div className="tnum flex items-baseline text-[38px] font-semibold leading-none tracking-tight text-we-ink">
              {it.unit === "€" && <span className="mr-0.5 text-2xl font-medium text-we-slate">€</span>}
              {it.value}
              {it.unit === "%" && <span className="text-2xl font-medium text-we-slate">%</span>}
            </div>
            <div className="mt-3 text-[14px] leading-snug text-we-muted">{it.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
