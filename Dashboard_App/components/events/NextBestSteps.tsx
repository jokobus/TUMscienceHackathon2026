"use client";

import { getEventNextBestSteps } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { EmptyState, Skeleton } from "@/components/ui/States";
import type { NextBestStep } from "@/lib/types";

const DOT: Record<NextBestStep["priority"], string> = {
  high: "bg-status-risk",
  medium: "bg-status-warn",
  low: "bg-status-neutral",
};
const TXT: Record<NextBestStep["priority"], string> = {
  high: "text-status-risk",
  medium: "text-status-warn",
  low: "text-status-neutral",
};

/**
 * Next Best Steps — same strip arrangement as the dashboard's "Best next
 * actions": a we-line label, then a hairline grid of compact action cards,
 * sitting directly under the local KPIs. (AGENT §2.2)
 */
export function NextBestSteps({ eventId }: { eventId: string }) {
  const { data, loading } = useAsync(() => getEventNextBestSteps(eventId), [eventId]);

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center gap-3">
        <div className="we-line h-[2px] w-7" />
        <div className="text-[11px] font-bold uppercase tracking-eyebrow text-we-muted">
          Next best steps
        </div>
      </div>

      {loading && <Skeleton className="h-28 w-full rounded-card" />}

      {!loading && (!data || data.length === 0) && (
        <EmptyState title="No actions suggested" hint="Analysis will surface steps once data is in." />
      )}

      {!loading && data && data.length > 0 && (
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-card border border-we-line bg-we-line shadow-card md:grid-cols-2 lg:grid-cols-3">
          {data.map((step) => (
            <StepCard key={step.id} step={step} />
          ))}
        </div>
      )}
    </div>
  );
}

function StepCard({ step }: { step: NextBestStep }) {
  return (
    <div className="flex flex-col bg-white px-4 py-3.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-eyebrow">
          <span className={`h-1.5 w-1.5 rounded-full ${DOT[step.priority]}`} />
          <span className={TXT[step.priority]}>{step.priority}</span>
        </span>
        {step.creates_follow_up && (
          <button
            type="button"
            className="shrink-0 rounded-tag border border-we-line px-2 py-0.5 text-[11px] font-semibold text-we-slate transition-colors hover:border-we-ink hover:text-we-ink"
          >
            + Follow-up
          </button>
        )}
      </div>
      <h3 className="text-[14px] font-bold leading-snug text-we-ink">{step.action}</h3>
      <p className="mt-1 text-[12px] leading-relaxed text-we-muted">{step.rationale}</p>
    </div>
  );
}
