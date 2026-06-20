"use client";

import Link from "next/link";
import { getNextBestEvents } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { EVENT_TYPE_LABEL } from "@/lib/format";
import type { NextBestEvent } from "@/lib/types";

/** Compact recommendation strip below the global KPIs. */
export function NextBestEvents() {
  const { data, loading } = useAsync(() => getNextBestEvents(), []);

  if (loading) {
    return (
      <div className="-mt-px grid grid-cols-1 overflow-visible rounded-b-card border border-we-line bg-white shadow-card lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border-t border-we-line p-3 lg:border-l lg:border-t-0 first:lg:border-l-0">
            <Skeleton className="h-10 w-full rounded-tag" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title="No recommendations yet" hint="More event history is needed." />;
  }

  return (
    <div className="-mt-px grid grid-cols-1 overflow-visible rounded-b-card border border-we-line bg-white shadow-card lg:grid-cols-3">
      {data.slice(0, 3).map((event, index) => (
        <RecommendationCard key={event.id} event={event} index={index} />
      ))}
    </div>
  );
}

function RecommendationCard({ event, index }: { event: NextBestEvent; index: number }) {
  const href = assistedCreateHref(event);

  return (
    <Link
      href={href}
      className="group relative z-10 min-h-[68px] border-t border-we-line bg-white px-4 py-3 transition-colors duration-200 hover:z-20 hover:bg-we-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-we-red lg:border-l lg:border-t-0 first:lg:border-l-0"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-eyebrow text-we-muted">
            <span className="text-we-red">0{index + 1}</span>
            <span>{Math.round(event.confidence * 100)}% confidence</span>
          </div>
          <h3 className="truncate text-[13px] font-bold leading-tight text-we-ink">{event.title}</h3>
        </div>
        <span className="shrink-0 text-[12px] font-semibold text-we-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-we-red">
          Build -&gt;
        </span>
      </div>

      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] font-semibold uppercase tracking-eyebrow text-we-muted">
        {event.suggested_type && <span>{EVENT_TYPE_LABEL[event.suggested_type]}</span>}
        {event.suggested_location && <span>{event.suggested_location}</span>}
        {event.target_group && <span>{event.target_group}</span>}
      </div>

      <div className="pointer-events-none absolute left-3 right-3 top-[calc(100%-2px)] hidden rounded-card border border-we-line bg-white p-3 text-[12px] leading-relaxed text-we-slate shadow-lift group-hover:block">
        {event.reason}
      </div>
    </Link>
  );
}

function assistedCreateHref(event: NextBestEvent): string {
  const params = new URLSearchParams({
    assistant: "1",
    source: "next-best-event",
    title: event.title,
    reason: event.reason,
  });

  if (event.suggested_type) params.set("type", event.suggested_type);
  if (event.suggested_location) params.set("location", event.suggested_location);
  if (event.target_group) params.set("target_group", event.target_group);

  return `/create?${params.toString()}`;
}
