"use client";

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

export function EventTable() {
  const { data, loading } = useAsync(() => getEvents(), []);

  if (loading) return <Skeleton className="h-64 w-full rounded-card" />;
  if (!data || data.length === 0)
    return (
      <Card>
        <EmptyState title="No events yet" hint="Create an event or run the scraper seed." />
      </Card>
    );

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-we-line text-left font-mono text-[10.5px] uppercase tracking-wider text-we-muted">
              <Th>Event</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>University</Th>
              <Th>Date</Th>
              <Th className="text-right">Rel. ROI</Th>
              <Th>Health</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((ev) => (
              <tr
                key={ev.id}
                className="group border-b border-we-line transition-colors last:border-0 hover:bg-we-canvas/50"
              >
                <td className="px-5 py-4">
                  <Link href={`/events/${ev.id}`} className="font-medium text-we-ink link-underline">
                    {ev.title}
                  </Link>
                  <div className="font-mono text-[10.5px] uppercase tracking-wide text-we-muted">
                    {ev.city ?? ev.location}
                  </div>
                </td>
                <td className="px-5 py-4 text-we-slate">{EVENT_TYPE_LABEL[ev.type]}</td>
                <td className="px-5 py-4">
                  <StatusDot tone={EVENT_STATUS_TONE[ev.status]}>{EVENT_STATUS_LABEL[ev.status]}</StatusDot>
                </td>
                <td className="px-5 py-4 text-we-slate">{ev.partner_university ?? "—"}</td>
                <td className="tnum px-5 py-4 text-[12px] text-we-muted">{fmtDate(ev.start_at)}</td>
                <td className="tnum px-5 py-4 text-right">
                  {ev.relationship_roi > 0 ? (
                    <span className="font-medium text-we-ink">{ev.relationship_roi}</span>
                  ) : (
                    <span className="text-we-faint">—</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <StatusDot tone={EVENT_HEALTH_TONE[ev.health]}>{EVENT_HEALTH_LABEL[ev.health]}</StatusDot>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-5 py-3 font-medium ${className}`}>{children}</th>;
}
