"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

// Neutral, bundled placeholder (inline SVG data-URI) — used only when an event has
// no image. Events from the DB always carry image_url, so this is the rare path.
const PLACEHOLDER_IMG =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520"><rect width="800" height="520" fill="#f4f4f5"/><path d="M0 400 L260 250 L440 360 L580 270 L800 420 L800 520 L0 520 Z" fill="#e4e4e7"/><circle cx="620" cy="150" r="56" fill="#e4e4e7"/></svg>`,
  );

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
      <div className="flex justify-center">
        <div className="grid w-full max-w-xl grid-cols-2 rounded-card border border-we-line bg-white p-1 shadow-card">
          <button
            type="button"
            onClick={() => setView("cards")}
            className={`rounded-tag px-4 py-3 text-center text-xl font-bold transition-all duration-200 active:scale-95 ${
              view === "cards" ? "bg-we-ink text-white" : "text-we-muted hover:text-we-ink"
            }`}
          >
            Events
          </button>
          <button
            type="button"
            onClick={() => setView("timeline")}
            className={`rounded-tag px-4 py-3 text-center text-xl font-bold transition-all duration-200 active:scale-95 ${
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
  const active = sorted.find((ev) => ev.id === activeId) ?? sorted[0];
  const activeIndex = Math.max(0, sorted.findIndex((ev) => ev.id === active?.id));

  // Measure the available width so the road can wrap responsively without
  // overflowing — events are spaced evenly along the path (not by time), which
  // is what stops temporally-close events from collapsing onto one another.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const road = useMemo(() => buildRoadmap(sorted, width), [sorted, width]);
  const points = useMemo(() => road.stops.map((s) => ({ x: s.x, y: s.y })), [road]);
  const fullPath = useMemo(() => roundedPath(points, 28), [points]);
  const progressPath = useMemo(() => roundedPath(points.slice(0, activeIndex + 1), 28), [points, activeIndex]);

  if (!active) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <div className="grid items-start gap-0 lg:grid-cols-[minmax(0,1.55fr)_360px]">
        <div className="border-b border-we-line p-6 lg:border-b-0 lg:border-r lg:border-we-line">
          <div className="mb-6 flex items-end justify-between gap-6">
            <div>
              <div className="eyebrow mb-2">Timeline</div>
              <h3 className="text-xl font-bold tracking-normal text-we-ink">Event roadmap</h3>
            </div>
            <span className="hidden text-sm text-we-muted sm:block">Follow the road · hover a stop to preview.</span>
          </div>

          <div ref={wrapRef} className="relative w-full">
            {width === 0 ? (
              <div className="h-44 w-full animate-pulse rounded-card bg-we-canvas" />
            ) : (
              <>
                <svg
                  width={road.W}
                  height={road.H}
                  viewBox={`0 0 ${road.W} ${road.H}`}
                  className="block"
                  aria-hidden
                >
                  {/* asphalt */}
                  <path d={fullPath} fill="none" stroke="#E4E7EC" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
                  {/* lane markings */}
                  <path d={fullPath} fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeDasharray="1 16" />
                  {/* progress travelled so far */}
                  <path d={progressPath} fill="none" stroke="#CC0000" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                {road.stops.map((s) => {
                  const isActive = s.ev.id === active.id;
                  const done = s.index <= activeIndex;
                  return (
                    <Link
                      key={s.ev.id}
                      href={`/events/${s.ev.id}`}
                      onMouseEnter={() => setActiveId(s.ev.id)}
                      onFocus={() => setActiveId(s.ev.id)}
                      className="group absolute z-10 flex w-[104px] cursor-pointer flex-col items-center rounded-tag pb-1 text-center outline-none focus-visible:ring-2 focus-visible:ring-we-red focus-visible:ring-offset-1"
                      style={{ left: s.x, top: s.y, transform: "translate(-50%, -14px)" }}
                      aria-label={`Open ${s.ev.title}`}
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-bold tnum transition-all duration-200 ${
                          isActive
                            ? "scale-110 border-we-red bg-we-red text-white shadow-[0_0_0_5px_rgba(204,0,0,0.10)]"
                            : done
                              ? "border-we-red bg-white text-we-red group-hover:scale-110"
                              : "border-we-line-strong bg-white text-we-muted group-hover:scale-110 group-hover:border-we-red group-hover:text-we-red"
                        }`}
                      >
                        {s.index + 1}
                      </span>
                      <span className="mt-1 block w-full rounded bg-we-surface/90 px-1 backdrop-blur-sm">
                        <span
                          className={`block truncate text-[11px] font-semibold leading-tight ${
                            isActive ? "text-we-red" : "text-we-ink group-hover:text-we-red"
                          }`}
                        >
                          {s.ev.city ?? s.ev.location}
                        </span>
                        <span className="tnum block text-[10px] leading-tight text-we-muted">{fmtDate(s.ev.start_at)}</span>
                      </span>
                    </Link>
                  );
                })}
              </>
            )}
          </div>
        </div>

        <div className="self-start bg-we-canvas p-5">
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
          src={ev.image_url ?? PLACEHOLDER_IMG}
          alt={city}
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            if (!img.dataset.fb) {
              img.dataset.fb = "1";
              img.src = PLACEHOLDER_IMG;
            }
          }}
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
          src={ev.image_url ?? PLACEHOLDER_IMG}
          alt={city}
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            if (!img.dataset.fb) {
              img.dataset.fb = "1";
              img.src = PLACEHOLDER_IMG;
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

interface RoadStop {
  ev: EventSummary;
  x: number;
  y: number;
  index: number;
}

interface Roadmap {
  W: number;
  H: number;
  stops: RoadStop[];
}

// Lay events out evenly along a serpentine path: each row flows in the opposite
// direction to the one above, with a U-turn drop at the end. Spacing is uniform
// regardless of the time gap between events, so close-together dates never stack.
function buildRoadmap(events: EventSummary[], containerW: number): Roadmap {
  const W = Math.max(Math.round(containerW), 320);
  const padX = 56;
  const padTop = 34;
  const rowGap = 84;
  const padBottom = 52;
  const n = events.length;
  if (n === 0) return { W, H: padTop + padBottom, stops: [] };

  // Pack as many stops per row as fit (each needs ~118px), so a large event
  // list wraps into far fewer rows and the roadmap stays compact.
  let cols = Math.floor((W - padX * 2) / 118);
  cols = Math.max(3, Math.min(cols, 7));
  cols = Math.max(1, Math.min(cols, n));
  const rows = Math.ceil(n / cols);
  const colW = cols > 1 ? (W - padX * 2) / (cols - 1) : 0;

  const stops = events.map((ev, i) => {
    const row = Math.floor(i / cols);
    const inRow = i % cols;
    // reverse direction on odd rows so the road snakes back the other way
    const col = row % 2 === 0 ? inRow : cols - 1 - inRow;
    const x = cols > 1 ? padX + col * colW : W / 2;
    const y = padTop + row * rowGap;
    return { ev, x, y, index: i };
  });

  const H = padTop + (rows - 1) * rowGap + padBottom;
  return { W, H, stops };
}

interface Pt {
  x: number;
  y: number;
}

// Polyline through the given points with rounded corners — turns the right-angle
// row transitions into smooth road bends.
function roundedPath(points: Pt[], radius: number): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${round(points[0].x)} ${round(points[0].y)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const a = lerpToward(p1, p0, Math.min(radius, dist(p0, p1) / 2));
    const b = lerpToward(p1, p2, Math.min(radius, dist(p1, p2) / 2));
    d += ` L ${round(a.x)} ${round(a.y)} Q ${round(p1.x)} ${round(p1.y)} ${round(b.x)} ${round(b.y)}`;
  }
  const last = points[points.length - 1];
  d += ` L ${round(last.x)} ${round(last.y)}`;
  return d;
}

function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function lerpToward(from: Pt, to: Pt, d: number): Pt {
  const len = dist(from, to) || 1;
  return { x: from.x + ((to.x - from.x) / len) * d, y: from.y + ((to.y - from.y) / len) * d };
}

function round(v: number): number {
  return Math.round(v * 10) / 10;
}
