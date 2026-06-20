"use client";

import Link from "next/link";
import { getDashboardSummary } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { Skeleton } from "@/components/ui/States";
import type { ExecutiveSummary } from "@/lib/types";

/** Executive summary (AGENT §1.1) — art-directed as one asymmetric panel:
 *  a lead "best event" hero + a quiet column of signals, then a recommendation
 *  band. Composition over equal-weight tiles. */
export function ExecutiveSummaryStrip() {
  const { data, loading } = useAsync(() => getDashboardSummary(), []);

  if (loading || !data) {
    return <Skeleton className="h-64 w-full rounded-card" />;
  }

  const s: ExecutiveSummary = data;
  const trend = s.returning_user_trend;
  const arrow = trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→";

  return (
    <div className="overflow-hidden rounded-card border border-we-line bg-we-surface">
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr]">
        {/* Lead: best performing event */}
        <Link
          href={s.best_event ? `/events/${s.best_event.event_id}` : "#"}
          className="group relative flex flex-col justify-between gap-8 border-b border-we-line p-8 transition-colors hover:bg-we-canvas/40 lg:border-b-0 lg:border-r"
        >
          <div>
            <div className="eyebrow mb-4">Best performing · this quarter</div>
            <h3 className="font-display text-2xl font-medium leading-tight text-we-ink md:text-3xl">
              {s.best_event?.title ?? "—"}
            </h3>
          </div>
          <div className="flex items-end justify-between">
            <div className="tnum text-4xl font-medium text-we-ink">
              {s.highest_relationship_roi?.value ?? "—"}
              <span className="ml-1.5 font-sans text-sm font-normal text-we-muted">
                Relationship-ROI
              </span>
            </div>
            <span className="text-[13px] font-medium text-we-muted transition-colors group-hover:text-we-red">
              View event →
            </span>
          </div>
        </Link>

        {/* Quiet signal column, divided by hairlines */}
        <div className="divide-y divide-we-line">
          <Signal
            label="Avg. relationship engagement"
            value={String(s.avg_relationship_engagement)}
            unit="/100"
          />
          <Signal
            label="Returning-user trend"
            value={`${arrow} ${Math.abs(trend.delta_pct)}%`}
            tone={trend.direction === "down" ? "risk" : "good"}
          />
          <div className="px-6 py-[18px]">
            <div className="eyebrow mb-1.5">Weakest event</div>
            <Link
              href={s.weakest_event ? `/events/${s.weakest_event.event_id}` : "#"}
              className="link-underline text-[14px] font-medium text-we-ink"
            >
              {s.weakest_event?.title ?? "—"}
            </Link>
            <div className="tnum mt-0.5 text-[12px] text-we-muted">
              {s.weakest_event?.metric}
            </div>
          </div>
          <div className="px-6 py-[18px]">
            <div className="eyebrow mb-2">Pipeline</div>
            <div className="tnum flex gap-4 text-[13px] text-we-slate">
              <span>
                <span className="text-we-ink">{s.pipeline_status.ongoing}</span> ongoing
              </span>
              <span>
                <span className="text-we-ink">{s.pipeline_status.upcoming}</span> upcoming
              </span>
              <span>
                <span className="text-we-ink">{s.pipeline_status.past}</span> past
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation band — the single editorial accent */}
      {s.next_best_event && (
        <div className="flex flex-col gap-4 border-t border-we-line bg-we-canvas/50 p-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="we-line mt-2.5 shrink-0" />
            <div>
              <div className="eyebrow mb-1.5">Recommended next move</div>
              <h4 className="font-display text-lg font-medium text-we-ink">
                {s.next_best_event.title}
              </h4>
              <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-we-slate">
                {s.next_best_event.reason}
              </p>
            </div>
          </div>
          <Link
            href="/create"
            className="shrink-0 self-start whitespace-nowrap text-[13px] font-medium text-we-ink transition-colors hover:text-we-red md:self-center"
          >
            Plan it →
          </Link>
        </div>
      )}
    </div>
  );
}

function Signal({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: "good" | "risk";
}) {
  const color =
    tone === "good" ? "text-status-good" : tone === "risk" ? "text-status-risk" : "text-we-ink";
  return (
    <div className="px-6 py-[18px]">
      <div className="eyebrow mb-1.5">{label}</div>
      <div className={`tnum text-2xl font-medium ${color}`}>
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-we-muted">{unit}</span>}
      </div>
    </div>
  );
}
