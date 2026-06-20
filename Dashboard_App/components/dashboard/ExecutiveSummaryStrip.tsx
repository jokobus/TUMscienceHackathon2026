"use client";

import Link from "next/link";
import { getDashboardSummary } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { Skeleton } from "@/components/ui/States";
import type { ExecutiveSummary } from "@/lib/types";

/** Compact orientation strip for management (AGENT §1.1). Insights, not raw dumps. */
export function ExecutiveSummaryStrip() {
  const { data, loading } = useAsync(() => getDashboardSummary(), []);

  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] w-full rounded-card" />
        ))}
      </div>
    );
  }

  const s: ExecutiveSummary = data;
  const trendArrow =
    s.returning_user_trend.direction === "up"
      ? "▲"
      : s.returning_user_trend.direction === "down"
      ? "▼"
      : "▬";

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Tile
        label="Best performing event"
        value={s.best_event?.title ?? "—"}
        meta={s.best_event?.metric}
        href={s.best_event ? `/events/${s.best_event.event_id}` : undefined}
        tone="good"
      />
      <Tile
        label="Weakest event"
        value={s.weakest_event?.title ?? "—"}
        meta={s.weakest_event?.metric}
        href={s.weakest_event ? `/events/${s.weakest_event.event_id}` : undefined}
        tone="risk"
      />
      <Tile
        label="Most urgent follow-up"
        value={s.most_urgent_follow_up_cluster?.label ?? "—"}
        meta={
          s.most_urgent_follow_up_cluster
            ? `${s.most_urgent_follow_up_cluster.count} contacts`
            : undefined
        }
        tone="warn"
      />
      <Tile
        label="Returning-user trend"
        value={`${trendArrow} ${s.returning_user_trend.delta_pct}%`}
        meta={`Avg. engagement ${s.avg_relationship_engagement}/100`}
        tone={s.returning_user_trend.direction === "down" ? "risk" : "good"}
      />

      {/* Second row: pipeline + next best event recommendation */}
      <div className="col-span-2 rounded-card border border-we-line bg-we-surface p-4 shadow-card md:col-span-1">
        <div className="text-xs font-medium text-we-muted">Pipeline</div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Pip n={s.pipeline_status.planned} label="planned" />
          <Pip n={s.pipeline_status.upcoming} label="upcoming" />
          <Pip n={s.pipeline_status.ongoing} label="ongoing" />
          <Pip n={s.pipeline_status.past} label="past" />
        </div>
      </div>
      <div className="col-span-2 rounded-card border border-we-red-soft bg-we-red-soft p-4 shadow-card md:col-span-3">
        <div className="text-xs font-medium text-we-red">Next best recommended event</div>
        <div className="mt-1 text-sm font-semibold text-we-ink">
          {s.next_best_event?.title ?? "—"}
        </div>
        <div className="mt-0.5 text-xs text-we-slate">{s.next_best_event?.reason}</div>
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  meta,
  href,
  tone,
}: {
  label: string;
  value: string;
  meta?: string;
  href?: string;
  tone: "good" | "warn" | "risk";
}) {
  const bar =
    tone === "good" ? "bg-status-good" : tone === "warn" ? "bg-status-warn" : "bg-status-risk";
  const inner = (
    <div className="relative overflow-hidden rounded-card border border-we-line bg-we-surface p-4 shadow-card transition-shadow hover:shadow-card-hover">
      <span className={`absolute left-0 top-0 h-full w-1 ${bar}`} />
      <div className="text-xs font-medium text-we-muted">{label}</div>
      <div className="mt-1 line-clamp-2 text-sm font-semibold text-we-ink">{value}</div>
      {meta && <div className="mt-0.5 text-xs text-we-slate">{meta}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function Pip({ n, label }: { n: number; label: string }) {
  return (
    <span className="text-we-slate">
      <span className="font-semibold text-we-ink">{n}</span> {label}
    </span>
  );
}
