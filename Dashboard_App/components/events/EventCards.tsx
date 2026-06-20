"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getEvents } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { Card } from "@/components/ui/Card";
import { StatusDot } from "@/components/ui/Badge";
import { EmptyState, Skeleton } from "@/components/ui/States";
import {
  EVENT_HEALTH_LABEL,
  EVENT_HEALTH_TONE,
  EVENT_STATUS_LABEL,
  EVENT_STATUS_TONE,
  EVENT_TYPE_LABEL,
  fmtDate,
} from "@/lib/format";
import type { BadgeTone } from "@/lib/format";
import type { EventSummary } from "@/lib/types";

const DOT: Record<BadgeTone, string> = {
  good: "bg-status-good",
  warn: "bg-status-warn",
  risk: "bg-status-risk",
  neutral: "bg-status-neutral",
  info: "bg-status-info",
};

export function EventCards() {
  const { data, loading } = useAsync(() => getEvents(), []);
  const [view, setView] = useState<"cards" | "timeline">("cards");

  if (loading)
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[360px] w-full rounded-card" />
        ))}
      </div>
    );

  if (!data || data.length === 0)
    return (
      <Card>
        <EmptyState title="No events yet" hint="Create an event or run the scraper seed." />
      </Card>
    );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="we-line mb-3" />
          <p className="max-w-xl text-sm leading-relaxed text-we-muted">
            Switch between full event cards and a compact chronological line.
          </p>
        </div>
        <div className="flex shrink-0 rounded-card border border-we-line bg-white p-1 shadow-card">
          <button
            type="button"
            onClick={() => setView("cards")}
            className={`rounded-tag px-3 py-1.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${
              view === "cards" ? "bg-we-ink text-white" : "text-we-muted hover:text-we-ink"
            }`}
          >
            Events
          </button>
          <button
            type="button"
            onClick={() => setView("timeline")}
            className={`rounded-tag px-3 py-1.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${
              view === "timeline" ? "bg-we-ink text-white" : "text-we-muted hover:text-we-ink"
            }`}
          >
            Timeline
          </button>
        </div>
      </div>

      {view === "cards" ? <EventCardGrid events={data} /> : <EventTimeline events={data} />}
    </div>
  );
}

function EventCardGrid({ events }: { events: EventSummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {events.map((ev) => (
        <EventCard key={ev.id} ev={ev} />
      ))}
    </div>
  );
}

function EventTimeline({ events }: { events: EventSummary[] }) {
  const sorted = useMemo(
    () => [...events].sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()),
    [events],
  );
  const [activeId, setActiveId] = useState(sorted[0]?.id);
  const window = useMemo(() => computeWindow(sorted), [sorted]);
  const active = sorted.find((ev) => ev.id === activeId) ?? sorted[0];

  if (!active) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.45fr)_360px]">
        <div className="border-b border-we-line p-6 lg:border-b-0 lg:border-r lg:border-we-line">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <div className="eyebrow mb-2">Timeline</div>
              <h3 className="text-xl font-bold tracking-normal text-we-ink">Event sequence</h3>
            </div>
            <span className="hidden text-sm text-we-muted sm:block">Hover a marker to reveal the event.</span>
          </div>

          <div className="overflow-x-auto pb-7 pt-6">
            <div className="relative h-32 min-w-[760px]">
              <div className="absolute left-0 right-0 top-12 h-px bg-we-line-strong" />
              {sorted.map((ev, index) => {
                const left = posPct(ev.start_at, window);
                const activeMarker = ev.id === active.id;
                const labelBelow = index % 2 === 1;

                return (
                  <Link
                    key={ev.id}
                    href={`/events/${ev.id}`}
                    onMouseEnter={() => setActiveId(ev.id)}
                    onFocus={() => setActiveId(ev.id)}
                    className="group absolute top-12 flex -translate-x-1/2 flex-col items-center outline-none"
                    style={{ left: `${left}%` }}
                    aria-label={`Open ${ev.title}`}
                  >
                    <span
                      className={`relative z-10 h-4 w-4 rounded-full border-2 bg-white transition-all duration-200 ${
                        activeMarker
                          ? "scale-125 border-we-red shadow-[0_0_0_6px_rgba(204,0,0,0.08)]"
                          : "border-we-line-strong group-hover:scale-110 group-hover:border-we-red"
                      }`}
                    />
                    <span className={`absolute ${labelBelow ? "top-7" : "-top-10"} w-32 text-center`}>
                      <span className="block truncate text-[12px] font-semibold text-we-ink">{ev.city ?? ev.location}</span>
                      <span className="tnum block text-[11px] text-we-muted">{fmtDate(ev.start_at)}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-we-canvas p-5">
          <TimelinePreview ev={active} />
        </div>
      </div>
    </Card>
  );
}

function TimelinePreview({ ev }: { ev: EventSummary }) {
  const city = ev.city ?? ev.location ?? "-";
  const partner = ev.partner_university ?? "Independent";
  const statusTone = EVENT_STATUS_TONE[ev.status];

  return (
    <Link
      href={`/events/${ev.id}`}
      className="group block overflow-hidden rounded-card border border-we-line bg-white shadow-card transition-all duration-200 hover:border-we-line-strong hover:shadow-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-we-red focus-visible:ring-offset-2 focus-visible:ring-offset-we-canvas"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-we-canvas">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ev.image_url ?? `https://picsum.photos/seed/${ev.id}/800/520`}
          alt={city}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-eyebrow">
          <span className="inline-flex items-center gap-1.5 rounded-tag border border-we-line bg-we-canvas px-2.5 py-1 text-we-ink">
            <span className={`h-1.5 w-1.5 rounded-full ${DOT[statusTone]}`} />
            {EVENT_STATUS_LABEL[ev.status]}
          </span>
          <span className="text-we-muted">{fmtDate(ev.start_at)}</span>
        </div>
        <h4 className="text-lg font-bold leading-snug text-we-ink">{ev.title}</h4>
        <div className="mt-3">
          <StatusDot tone={EVENT_HEALTH_TONE[ev.health]}>{EVENT_HEALTH_LABEL[ev.health]}</StatusDot>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-we-line pt-4">
          <Metric label="University" value={partner} />
          <Metric label="ROI" value={ev.relationship_roi > 0 ? String(ev.relationship_roi) : "-"} mono />
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-we-muted">
          <span>{city}</span>
          <span className="transition-transform duration-200 group-hover:translate-x-1">{"Open ->"}</span>
        </div>
      </div>
    </Link>
  );
}

function EventCard({ ev }: { ev: EventSummary }) {
  const city = ev.city ?? ev.location ?? "-";
  const partner = ev.partner_university ?? "Independent";
  const hasRoi = ev.relationship_roi > 0;
  const statusTone = EVENT_STATUS_TONE[ev.status];

  return (
    <Link
      href={`/events/${ev.id}`}
      className="group flex min-h-[430px] flex-col overflow-hidden rounded-card border border-we-line bg-we-surface transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:border-we-line-strong hover:shadow-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-we-red focus-visible:ring-offset-2 focus-visible:ring-offset-we-canvas"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-we-canvas">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ev.image_url ?? `https://picsum.photos/seed/${ev.id}/800/520`}
          alt={city}
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            if (!img.dataset.fb) {
              img.dataset.fb = "1";
              img.src = `https://picsum.photos/seed/${ev.id}/800/520`;
            }
          }}
          className="h-full w-full object-cover transition-transform duration-500 ease-premium group-hover:scale-[1.04]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/18 via-transparent to-transparent" />

        {hasRoi && (
          <span className="tnum absolute right-3 top-3 inline-flex min-w-[58px] items-baseline justify-center gap-1 rounded-tag bg-we-ink/85 px-2 py-1 text-white backdrop-blur-sm">
            <span className="text-[14px] font-semibold leading-none">{ev.relationship_roi}</span>
            <span className="text-[9px] uppercase tracking-wider text-white/70">ROI</span>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-semibold uppercase tracking-eyebrow">
          <span className="inline-flex items-center gap-1.5 rounded-tag border border-we-line bg-we-canvas px-2.5 py-1 text-we-ink">
            <span className={`h-1.5 w-1.5 rounded-full ${DOT[statusTone]}`} />
            {EVENT_STATUS_LABEL[ev.status]}
          </span>
          <span className="text-we-muted">{EVENT_TYPE_LABEL[ev.type]}</span>
          <span className="text-we-muted">{fmtDate(ev.start_at)}</span>
        </div>

        <h3 className="font-display text-[18px] font-medium leading-snug text-we-ink line-clamp-2">
          {ev.title}
        </h3>

        <div className="mt-3">
          <StatusDot tone={EVENT_HEALTH_TONE[ev.health]}>{EVENT_HEALTH_LABEL[ev.health]}</StatusDot>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-we-line pt-4">
          <Metric label="University" value={partner} />
          <Metric label="Relationship ROI" value={hasRoi ? String(ev.relationship_roi) : "-"} mono />
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[13.5px] font-medium text-we-ink">
              <PinIcon className="h-3.5 w-3.5 shrink-0 text-we-muted" />
              <span className="truncate">{city}</span>
            </div>
            <div className="mt-0.5 truncate pl-5 text-[12px] text-we-muted">{ev.location ?? partner}</div>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-we-line-strong text-we-ink transition-colors duration-200 group-hover:border-we-red group-hover:bg-we-red group-hover:text-white">
            <ArrowIcon className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function Metric({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0 rounded-tag bg-we-canvas px-3 py-2">
      <div className="font-mono text-[9.5px] uppercase tracking-wider text-we-muted">{label}</div>
      <div className={`mt-1 truncate text-[13px] font-medium text-we-ink ${mono ? "tnum" : ""}`}>{value}</div>
    </div>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 14s5-4.2 5-8A5 5 0 0 0 3 6c0 3.8 5 8 5 8z" />
      <circle cx="8" cy="6" r="1.8" />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface DateWindow {
  min: number;
  max: number;
}

function computeWindow(events: EventSummary[]): DateWindow {
  const times = events.map((ev) => new Date(ev.start_at).getTime());
  const min = Math.min(...times);
  const max = Math.max(...times);
  const pad = Math.max((max - min) * 0.08, 864e5);
  return { min: min - pad, max: max + pad };
}

function posPct(date: string, window: DateWindow): number {
  return ((new Date(date).getTime() - window.min) / (window.max - window.min)) * 100;
}
