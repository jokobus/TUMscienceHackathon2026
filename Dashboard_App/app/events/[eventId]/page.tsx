"use client";

import { use } from "react";
import Link from "next/link";
import {
  getEvent,
  getEventAttendees,
  getEventFollowUps,
  getEventInteractions,
  getEventKpis,
  getHostReport,
} from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { HealthBadge } from "@/components/dashboard/HealthBadge";
import { NextBestSteps } from "@/components/events/NextBestSteps";
import { PredictionCard } from "@/components/events/PredictionCard";
import { MaterialManager } from "@/components/events/MaterialManager";
import { EditableDescription } from "@/components/events/EditableDescription";
import {
  EVENT_STATUS_LABEL,
  EVENT_STATUS_TONE,
  EVENT_TYPE_LABEL,
  FOLLOW_UP_LABEL,
  FOLLOW_UP_TONE,
  fmtDate,
  fmtDateTime,
} from "@/lib/format";
import type { EventDetail } from "@/lib/types";

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { data: ev, loading, error } = useAsync(() => getEvent(eventId), [eventId]);
  const { data: kpis, loading: kpiLoading } = useAsync(() => getEventKpis(eventId), [eventId]);

  if (error) return <ErrorState message={error} />;

  const isPlannedLike = ev && ["planned", "upcoming", "draft"].includes(ev.status);

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <Link href="/dashboard" className="inline-flex text-xs font-semibold text-we-muted hover:text-we-red">
        {"<- Back to dashboard"}
      </Link>

      {loading || !ev ? <Skeleton className="h-56 w-full rounded-card" /> : <EventSetupBox ev={ev} />}

      <Card className="overflow-hidden">
        <div className="border-b border-we-line px-5 py-4">
          <h2 className="text-xl font-bold text-we-ink">Event KPIs</h2>
        </div>
        <CardBody className="p-4 md:p-5">
          <KpiGrid kpis={kpis} loading={kpiLoading} />
          <NextBestSteps eventId={eventId} />
        </CardBody>
      </Card>

      {isPlannedLike && <PredictionCard eventId={eventId} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MaterialManager eventId={eventId} />
        {ev && <EditableDescription eventId={eventId} initial={ev.description} />}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AttendeesCard eventId={eventId} />
        <InteractionsCard eventId={eventId} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FollowUpsCard eventId={eventId} />
        <HostReportCard eventId={eventId} />
      </div>
    </div>
  );
}

function EventSetupBox({ ev }: { ev: EventDetail }) {
  const place = ev.city ?? ev.location ?? "Location TBD";
  const summary = ev.goal || ev.description;

  return (
    <Card className="overflow-hidden">
      <CardBody className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="p-6 md:p-7">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Badge tone={EVENT_STATUS_TONE[ev.status]}>{EVENT_STATUS_LABEL[ev.status]}</Badge>
              <HealthBadge health={ev.health} />
              <span className="rounded-tag border border-we-line bg-we-canvas px-2.5 py-1 text-[11px] font-semibold uppercase tracking-eyebrow text-we-muted">
                {EVENT_TYPE_LABEL[ev.type]}
              </span>
            </div>

            <h1 className="max-w-4xl text-3xl font-bold leading-tight text-we-ink md:text-4xl">{ev.title}</h1>
            <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-we-slate">{summary}</p>

            <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-we-line bg-we-line md:grid-cols-4">
              <Fact label="Date" value={fmtDate(ev.start_at)} />
              <Fact label="Place" value={place} />
              <Fact label="Target" value={ev.target_group} />
              <Fact label="Owner" value={ev.owner?.display_name} />
            </div>
          </div>

          <div className="border-t border-we-line bg-we-canvas p-6 lg:border-l lg:border-t-0">
            <div className="eyebrow mb-4">Setup</div>
            <div className="space-y-4">
              <SetupFact label="University" value={ev.partner_university} />
              <SetupFact label="Cost" value={ev.cost != null ? `€${ev.cost.toLocaleString("de-DE")}` : null} />
              <SetupFact label="Human capital" value={ev.human_capital} />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function Fact({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="bg-white px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-eyebrow text-we-muted">{label}</div>
      <div className="mt-1 truncate text-[13px] font-semibold text-we-ink">{value ?? "-"}</div>
    </div>
  );
}

function SetupFact({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-eyebrow text-we-muted">{label}</div>
      <div className="mt-1 text-sm font-semibold leading-snug text-we-ink">{value ?? "-"}</div>
    </div>
  );
}

function AttendeesCard({ eventId }: { eventId: string }) {
  const { data, loading } = useAsync(() => getEventAttendees(eventId), [eventId]);
  return (
    <Card>
      <CardHeader title="Attendees" subtitle="Registered -> appeared -> full session." />
      <CardBody className="space-y-2">
        {loading && <Skeleton className="h-32 w-full" />}
        {!loading && data && data.length === 0 && <EmptyState title="No attendees recorded" />}
        {!loading &&
          data?.map((a) => (
            <div key={a.user_id} className="flex items-center justify-between gap-3 text-sm">
              <Link href={`/students/${a.user_id}`} className="font-medium text-we-ink hover:text-we-red">
                {a.display_name}
                <span className="ml-2 text-[11px] text-we-muted">{a.university}</span>
              </Link>
              <div className="flex items-center gap-2">
                {a.returning && <Badge tone="info">returning</Badge>}
                <Badge tone={a.checked_out_at ? "good" : a.checked_in_at ? "warn" : "neutral"}>
                  {a.checked_out_at ? "full session" : a.checked_in_at ? "checked in" : "no-show"}
                </Badge>
              </div>
            </div>
          ))}
      </CardBody>
    </Card>
  );
}

function InteractionsCard({ eventId }: { eventId: string }) {
  const { data, loading } = useAsync(() => getEventInteractions(eventId), [eventId]);
  return (
    <Card>
      <CardHeader title="Interaction Log" subtitle="Engagement signals captured for this event." />
      <CardBody className="space-y-2">
        {loading && <Skeleton className="h-32 w-full" />}
        {!loading && data && data.length === 0 && <EmptyState title="No interactions logged" />}
        {!loading &&
          data?.map((it) => (
            <div key={it.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-we-ink">
                <span className="font-medium">{it.user.display_name}</span>{" "}
                <span className="text-we-slate">{it.type.replace(/_/g, " ")}</span>
              </span>
              <span className="text-[11px] text-we-muted">{fmtDateTime(it.timestamp)}</span>
            </div>
          ))}
      </CardBody>
    </Card>
  );
}

function FollowUpsCard({ eventId }: { eventId: string }) {
  const { data, loading } = useAsync(() => getEventFollowUps(eventId), [eventId]);
  return (
    <Card>
      <CardHeader title="Follow-Up Context" subtitle="Open relationship actions for this event." />
      <CardBody className="space-y-2">
        {loading && <Skeleton className="h-24 w-full" />}
        {!loading && data && data.length === 0 && (
          <EmptyState title="No follow-ups" hint="Create one from a Next Best Step." />
        )}
        {!loading &&
          data?.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-3 text-sm">
              <div>
                <div className="font-medium text-we-ink">{f.next_action}</div>
                <div className="text-[11px] text-we-muted">
                  {f.contact.display_name} · owner {f.assigned_owner.display_name}
                  {f.due_date ? ` · due ${fmtDate(f.due_date)}` : ""}
                </div>
              </div>
              <Badge tone={FOLLOW_UP_TONE[f.status]}>{FOLLOW_UP_LABEL[f.status]}</Badge>
            </div>
          ))}
      </CardBody>
    </Card>
  );
}

function HostReportCard({ eventId }: { eventId: string }) {
  const { data, loading } = useAsync(() => getHostReport(eventId), [eventId]);
  return (
    <Card>
      <CardHeader title="Host Experience Report" subtitle="Qualitative context from the Wuerth host." />
      <CardBody>
        {loading && <Skeleton className="h-24 w-full" />}
        {!loading && !data && (
          <div className="flex flex-col items-start gap-3">
            <EmptyState title="No host report yet" hint="Required for event-health classification." />
            <Button variant="secondary" className="text-xs">
              Request host report
            </Button>
          </div>
        )}
        {!loading && data && (
          <div className="space-y-2 text-sm">
            <div className="flex gap-4">
              <Stat label="Organization" value={`${data.organization_rating}/5`} />
              <Stat label="Relevance" value={`${data.audience_relevance_rating}/5`} />
              <Stat label="Interaction" value={`${data.interaction_quality_rating}/5`} />
            </div>
            <div>
              <Badge tone={data.repeat_recommendation === "repeat" ? "good" : data.repeat_recommendation === "improve" ? "warn" : "risk"}>
                {data.repeat_recommendation}
              </Badge>
            </div>
            {data.notes && <p className="text-we-slate">{data.notes}</p>}
            {data.suggested_improvements && (
              <p className="text-xs text-we-muted">Improve: {data.suggested_improvements}</p>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-semibold text-we-ink">{value}</div>
      <div className="text-[11px] text-we-muted">{label}</div>
    </div>
  );
}
