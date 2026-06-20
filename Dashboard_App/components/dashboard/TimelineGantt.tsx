"use client";

import Link from "next/link";
import { getDashboardTimeline } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState, Skeleton } from "@/components/ui/States";
import type { TimelineBar, TimelineSegment } from "@/lib/types";

const SEGMENT_COLOR: Record<TimelineSegment["kind"], string> = {
  preparation: "#C7C2B6",
  event: "#CC1122",
  follow_up: "#3F5A73",
  material_deadline: "#9A6B16",
  host_report_deadline: "#9A6B16",
  communication: "#2F7D57",
};

const SEGMENT_LABEL: Record<TimelineSegment["kind"], string> = {
  preparation: "Preparation",
  event: "Event",
  follow_up: "Follow-up window",
  material_deadline: "Material deadline",
  host_report_deadline: "Host-report deadline",
  communication: "Communication",
};

const LOAD_TONE: Record<TimelineBar["human_capital_load"], string> = {
  low: "text-status-good",
  medium: "text-status-warn",
  high: "text-status-risk",
};

/** Gantt-style timeline (AGENT §1.4): prep → event → follow-up, deadlines, load. */
export function TimelineGantt() {
  const { data, loading } = useAsync(() => getDashboardTimeline(), []);

  // Compute a shared date window across all bars
  const window = data ? computeWindow(data) : null;

  return (
    <Card>
      <CardHeader
        eyebrow="Schedule"
        title="Event Timeline"
        subtitle="Relationship work spans before & after the event day — prep, deadlines, follow-up."
        action={<Legend />}
      />
      <CardBody className="space-y-4">
        {loading && (
          <>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </>
        )}
        {!loading && data && data.length === 0 && (
          <EmptyState title="No scheduled events" hint="Planned, ongoing and past events will appear here." />
        )}
        {!loading &&
          window &&
          data?.map((bar) => (
            <div key={bar.event_id} className="text-sm">
              <div className="mb-1 flex items-center justify-between">
                <Link
                  href={`/events/${bar.event_id}`}
                  className="font-medium text-we-ink hover:text-we-red"
                >
                  {bar.title}
                </Link>
                <span className="text-[11px] text-we-muted">
                  {bar.owner?.display_name} ·{" "}
                  <span className={LOAD_TONE[bar.human_capital_load]}>
                    {bar.human_capital_load} load
                  </span>
                </span>
              </div>
              <div className="relative h-7 w-full rounded bg-we-canvas">
                {bar.segments.map((seg, i) => {
                  const left = posPct(seg.start_at, window);
                  const width = Math.max(widthPct(seg.start_at, seg.end_at, window), 1.5);
                  const isDeadline = seg.kind.endsWith("deadline");
                  return (
                    <div
                      key={i}
                      title={`${SEGMENT_LABEL[seg.kind]} · ${seg.start_at}`}
                      className="absolute top-1/2 -translate-y-1/2 rounded"
                      style={{
                        left: `${left}%`,
                        width: isDeadline ? "8px" : `${width}%`,
                        height: isDeadline ? "16px" : "14px",
                        background: SEGMENT_COLOR[seg.kind],
                        opacity: isDeadline ? 1 : 0.85,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
      </CardBody>
    </Card>
  );
}

function Legend() {
  const items: TimelineSegment["kind"][] = [
    "preparation",
    "event",
    "follow_up",
    "communication",
    "material_deadline",
  ];
  return (
    <div className="hidden flex-wrap gap-x-3 gap-y-1 lg:flex">
      {items.map((k) => (
        <span key={k} className="inline-flex items-center gap-1 text-[10px] text-we-muted">
          <span className="h-2 w-2 rounded-sm" style={{ background: SEGMENT_COLOR[k] }} />
          {SEGMENT_LABEL[k]}
        </span>
      ))}
    </div>
  );
}

interface Window {
  min: number;
  max: number;
}

function computeWindow(bars: TimelineBar[]): Window {
  let min = Infinity;
  let max = -Infinity;
  for (const b of bars)
    for (const s of b.segments) {
      min = Math.min(min, new Date(s.start_at).getTime());
      max = Math.max(max, new Date(s.end_at).getTime());
    }
  // pad 1 day on each side
  return { min: min - 864e5, max: max + 864e5 };
}

function posPct(date: string, w: Window): number {
  return ((new Date(date).getTime() - w.min) / (w.max - w.min)) * 100;
}
function widthPct(start: string, end: string, w: Window): number {
  return ((new Date(end).getTime() - new Date(start).getTime()) / (w.max - w.min)) * 100;
}
