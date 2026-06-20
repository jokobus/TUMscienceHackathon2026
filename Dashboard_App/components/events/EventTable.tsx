"use client";

import Link from "next/link";
import { getEvents } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { HealthBadge } from "@/components/dashboard/HealthBadge";
import {
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
            <tr className="border-b border-we-line text-left text-xs text-we-muted">
              <Th>Event</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>University</Th>
              <Th>Date</Th>
              <Th>Rel. ROI</Th>
              <Th>Health</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((ev) => (
              <tr
                key={ev.id}
                className="border-b border-we-line last:border-0 hover:bg-we-canvas"
              >
                <td className="px-4 py-3">
                  <Link href={`/events/${ev.id}`} className="font-medium text-we-ink hover:text-we-red">
                    {ev.title}
                  </Link>
                  <div className="text-[11px] text-we-muted">{ev.city ?? ev.location}</div>
                </td>
                <td className="px-4 py-3 text-we-slate">{EVENT_TYPE_LABEL[ev.type]}</td>
                <td className="px-4 py-3">
                  <Badge tone={EVENT_STATUS_TONE[ev.status]}>{EVENT_STATUS_LABEL[ev.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-we-slate">{ev.partner_university ?? "—"}</td>
                <td className="px-4 py-3 text-we-slate">{fmtDate(ev.start_at)}</td>
                <td className="px-4 py-3">
                  {ev.relationship_roi > 0 ? (
                    <span className="font-semibold text-we-ink">{ev.relationship_roi}</span>
                  ) : (
                    <span className="text-we-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <HealthBadge health={ev.health} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 font-medium">{children}</th>;
}
