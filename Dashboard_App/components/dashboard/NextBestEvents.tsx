"use client";

import Link from "next/link";
import { getNextBestEvents } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { EmptyState, Skeleton } from "@/components/ui/States";
import type { NextBestEvent } from "@/lib/types";

/** Compact recommendation strip below the global KPIs. */
export function NextBestEvents() {
  const { data, loading } = useAsync(() => getNextBestEvents(), []);

  if (loading) {
    return (
      <div className="mt-3">
        <div className="mb-2 flex items-center gap-3">
          <div className="we-line h-[2px] w-7" />
          <div className="text-[11px] font-bold uppercase tracking-eyebrow text-we-muted">Best next actions</div>
        </div>
        <div className="grid grid-cols-1 overflow-visible rounded-card border border-we-line bg-white shadow-card lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border-t border-we-line p-3 first:border-t-0 lg:border-l lg:border-t-0 first:lg:border-l-0">
              <Skeleton className="h-10 w-full rounded-tag" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title="No recommendations yet" hint="More event history is needed." />;
  }

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center gap-3">
        <div className="we-line h-[2px] w-7" />
        <div className="text-[11px] font-bold uppercase tracking-eyebrow text-we-muted">Best next actions</div>
      </div>
      <div className="grid grid-cols-1 overflow-visible rounded-card border border-we-line bg-white shadow-card lg:grid-cols-3">
        {data.slice(0, 3).map((event, index) => (
          <RecommendationCard key={event.id} event={event} index={index} />
        ))}
      </div>
    </div>
  );
}

function RecommendationCard({ event, index }: { event: NextBestEvent; index: number }) {
  const href = assistedCreateHref(event);

  return (
    <Link
      href={href}
      className="group relative z-10 min-h-[68px] border-t border-we-line bg-white px-4 py-3 transition-colors duration-200 first:border-t-0 hover:z-20 hover:bg-we-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-we-red lg:border-l lg:border-t-0 first:lg:border-l-0"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-eyebrow text-we-muted">
            <span className="text-we-red">0{index + 1}</span>
            <span>{Math.round(event.confidence * 100)}% confidence</span>
          </div>
          <h3 className="text-[17px] font-bold leading-snug text-we-ink line-clamp-2">{event.title}</h3>
        </div>
        <span className="mt-5 shrink-0 text-[12px] font-semibold text-we-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-we-red">
          Build -&gt;
        </span>
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
