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
import { PageHeader } from "@/components/ui/PageHeader";
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
    <div className="mx-auto max-w-7xl space-y-6">
      <Link href="/dashboard" className="text-xs text-we-muted hover:text-we-red">
        ← Back to dashboard
      </Link>

      <PageHeader
        title={loading || !ev ? "Loading…" : ev.title}
        subtitle={
          ev ? `${EVENT_TYPE_LABEL[ev.type]} · ${ev.city ?? ev.location ?? ""} · ${fmtDate(ev.start_at)}` : undefined
        }
        action={
          ev ? (
            <div className="flex items-center gap-2">
              <Badge tone={EVENT_STATUS_TONE[ev.status]}>{EVENT_STATUS_LABEL[ev.status]}</Badge>
              <HealthBadge health={ev.health} />
            </div>
          ) : undefined
        }
      />

      {/* Analysis summary (ongoing/past) */}
      {ev?.analysis && (
        <Card className="border-we-red-soft">
          <CardBody>
            <div className="flex items-start gap-3">
              <div className="we-line mt-1.5" />
              <div>
                <p className="text-sm font-medium text-we-ink">{ev.analysis.summary}</p>
                <ul className="mt-2 space-y-1">
                  {ev.analysis.highlights.map((h, i) => (
                    <li key={i} className="text-xs text-we-slate">
                      • {h}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* 2.1 Local KPIs */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-we-slate">Local KPIs</h2>
        <KpiGrid kpis={kpis} loading={kpiLoading} />
      </section>

      {/* 2.2 Next Best Steps + (prediction for planned) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NextBestSteps eventId={eventId} />
        </div>
        {isPlannedLike ? <PredictionCard eventId={eventId} /> : <EventMeta eventId={eventId} />}
      </div>

      {/* 2.3 Materials + 2.4 Description */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MaterialManager eventId={eventId} />
        {ev && <EditableDescription eventId={eventId} initial={ev.description} />}
      </div>

      {/* Attendees + interactions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AttendeesCard eventId={eventId} />
        <InteractionsCard eventId={eventId} />
      </div>

      {/* Follow-ups + host report */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FollowUpsCard eventId={eventId} />
        <HostReportCard eventId={eventId} />
      </div>
    </div>
  );
}

// ── Sub-cards ────────────────────────────────────────────────────────────────

function EventMeta({ eventId }: { eventId: string }) {
  const { data: ev } = useAsync(() => getEvent(eventId), [eventId]);
  return (
    <Card>
      <CardHeader title="Event Setup" subtitle="Drivers for comparison & prediction." />
      <CardBody className="space-y-2 text-sm">
        <Row label="Goal" value={ev?.goal} />
        <Row label="Target group" value={ev?.target_group} />
        <Row label="Cost" value={ev?.cost != null ? `€${ev.cost.toLocaleString()}` : undefined} />
        <Row label="Human capital" value={ev?.human_capital} />
        <Row label="Owner" value={ev?.owner?.display_name} />
      </CardBody>
    </Card>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-we-line pb-2 last:border-0">
      <span className="text-we-muted">{label}</span>
      <span className="text-right text-we-ink">{value ?? "—"}</span>
    </div>
  );
}

function AttendeesCard({ eventId }: { eventId: string }) {
  const { data, loading } = useAsync(() => getEventAttendees(eventId), [eventId]);
  return (
    <Card>
      <CardHeader title="Attendees" subtitle="Registered → appeared → full session." />
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
      <CardHeader title="Host Experience Report" subtitle="Qualitative context from the Würth host." />
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
