"use client";

import { Skeleton } from "@/components/ui/States";
import type { KpiSet } from "@/lib/types";

export function KpiGrid({
  kpis,
  loading,
  onVisitorsClick,
  visitorsActive = false,
}: {
  kpis?: KpiSet | null;
  loading?: boolean;
  onVisitorsClick?: () => void;
  visitorsActive?: boolean;
}) {
  if (loading || !kpis) {
    return <Skeleton className="h-44 w-full rounded-card" />;
  }

  const appearedRate = kpis.registered > 0 ? Math.round((kpis.appeared / kpis.registered) * 100) : null;
  const fullSessionRate = kpis.appeared > 0 ? Math.round((kpis.full_session / kpis.appeared) * 100) : 0;

  const items: { value: string; unit?: string; label: string }[] = [
    { value: String(kpis.visitor_count), label: "Visitors" },
    { value: appearedRate !== null ? String(appearedRate) : "-", unit: "%", label: "Appeared of registered" },
    { value: String(fullSessionRate), unit: "%", label: "Full session" },
    { value: kpis.recommendation_score.toFixed(1), label: "Recommendation" },
    { value: String(kpis.returning_users), label: "Returning users" },
    { value: String(kpis.qualified_leads), label: "Qualified leads" },
    { value: kpis.cost_per_lead != null ? String(kpis.cost_per_lead) : "-", unit: "EUR", label: "Cost per lead" },
    { value: String(kpis.avg_engagement), label: "Avg. engagement" },
    { value: kpis.avg_follow_up_actions.toFixed(1), label: "Follow-ups / event" },
    { value: kpis.host_experience != null ? kpis.host_experience.toFixed(1) : "-", label: "Host experience" },
  ];

  return (
    <div className="overflow-hidden rounded-card border border-we-line bg-we-line">
      <div className="grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-5">
        {items.map((it) => {
          const isVisitors = it.label === "Visitors";
          const clickable = isVisitors && onVisitorsClick;
          const className = `bg-we-surface px-6 py-7 text-left transition-colors ${
            clickable ? "cursor-pointer hover:bg-we-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-we-red" : ""
          } ${visitorsActive && isVisitors ? "bg-we-canvas" : ""}`;
          const content = (
            <>
              <div className="tnum flex items-baseline text-[34px] font-medium leading-none tracking-tight text-we-ink">
                {it.unit === "EUR" && <span className="mr-1 text-2xl text-we-slate">EUR</span>}
                {it.value}
                {it.unit === "%" && <span className="text-2xl text-we-slate">%</span>}
              </div>
              <div className="mt-3 text-[13px] leading-snug text-we-muted">{it.label}</div>
            </>
          );

          return clickable ? (
            <button key={it.label} type="button" onClick={onVisitorsClick} className={className}>
              {content}
            </button>
          ) : (
            <div key={it.label} className={className}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
