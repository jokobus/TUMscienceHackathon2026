"use client";

import { getEventNextBestSteps } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { EmptyState, Skeleton } from "@/components/ui/States";
import type { NextBestStep } from "@/lib/types";

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

      {!loading && (!data || data.length === 0) && <EmptyState title="No actions suggested" />}

      {!loading && data && data.length > 0 && (
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-card border border-we-line bg-we-line shadow-card md:grid-cols-2 lg:grid-cols-3">
          {data.slice(0, 3).map((step, index) => (
            <StepCard key={step.id} step={step} index={index + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function StepCard({ step, index }: { step: NextBestStep; index: number }) {
  return (
    <div className="flex min-h-[96px] flex-col bg-white px-4 py-3.5 transition-colors hover:bg-we-canvas">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-eyebrow text-we-muted">
          <span className="text-we-red">{String(index).padStart(2, "0")}</span>
          <span>{step.priority}</span>
        </span>
        {step.creates_follow_up && (
          <button
            type="button"
            className="shrink-0 rounded-tag border border-we-line bg-white px-2 py-0.5 text-[11px] font-semibold text-we-slate transition-colors hover:border-we-red hover:text-we-ink"
          >
            + Follow-up
          </button>
        )}
      </div>
      <h3 className="text-[14px] font-bold leading-snug text-we-ink">{step.action}</h3>
    </div>
  );
}
