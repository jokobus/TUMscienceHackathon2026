"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  createFollowUp,
  getEvent,
  getEventAttendees,
  getEventFollowUps,
  getEventInteractions,
  getEventKpis,
  getHostReport,
  submitHostReport,
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
import { EventGallery } from "@/components/events/EventGallery";
import { MemoriesThread } from "@/components/events/MemoriesThread";
import { ApplicationsReview } from "@/components/events/ApplicationsReview";
import { BroadcastComposer } from "@/components/events/BroadcastComposer";
import { LiveSentiment } from "@/components/events/LiveSentiment";
import { EventNotes } from "@/components/events/EventNotes";
import {
  EVENT_STATUS_LABEL,
  EVENT_STATUS_TONE,
  EVENT_TYPE_LABEL,
  FOLLOW_UP_LABEL,
  FOLLOW_UP_TONE,
  fmtDate,
  fmtDateTime,
} from "@/lib/format";
import type { EventDetail, HostReport } from "@/lib/types";

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
  const isOngoing = ev?.status === "ongoing";
  const isPast = ev?.status === "past";
  const galleryImages = ev?.images?.length ? ev.images : ev?.image_url ? [ev.image_url] : [];

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

      {/* Event image / gallery */}
      {galleryImages.length > 0 && <EventGallery images={galleryImages} alt={ev?.title ?? ""} />}

      {/* Live coordination (ongoing): broadcast + live sentiment */}
      {isOngoing && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BroadcastComposer eventId={eventId} />
          <LiveSentiment eventId={eventId} />
        </div>
      )}

      {/* Applications review (only for events that require an application) */}
      {ev?.application_required && <ApplicationsReview eventId={eventId} />}

      {/* Analysis summary (ongoing/past) */}
      {ev?.analysis && (
        <Card className="border-we-red-soft">
          <CardBody>
            <div className="flex items-start gap-3">
              <div className="we-line mt-1.5" />
              <div>
                <p className="text-sm font-medium text-we-ink">{ev.analysis.summary}</p>
                <ul className="mt-2 space-y-1">
                  {(ev.analysis.highlights ?? []).map((h, i) => (
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
          <NextBestSteps eventId={eventId} status={ev?.status} />
        </div>
        {isPlannedLike ? <PredictionCard eventId={eventId} /> : <EventMeta event={ev} />}
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
        <FollowUpsCard eventId={eventId} status={ev?.status} />
        <HostReportCard eventId={eventId} />
      </div>

      {/* Memories (events that have a public wall) + private notes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {isPast || isOngoing ? <MemoriesThread eventId={eventId} /> : <EventNotes eventId={eventId} />}
        {isPast || isOngoing ? <EventNotes eventId={eventId} /> : null}
      </div>
    </div>
  );
}

// ── Sub-cards ────────────────────────────────────────────────────────────────

function EventMeta({ event: ev }: { event: EventDetail | null }) {
  return (
    <Card>
      <CardHeader title="Event Setup" subtitle="Drivers for comparison & prediction." />
      <CardBody className="space-y-2 text-sm">
        <Row label="Goal" value={ev?.goal} />
        <Row label="Target group" value={ev?.target_group} />
        <Row label="Partner university" value={ev?.partner_university} />
        <Row label="Cost" value={ev?.cost != null ? `€${ev.cost.toLocaleString()}` : undefined} />
        <Row label="Human capital" value={ev?.human_capital} />
        <Row label="Owner" value={ev?.owner_name ?? ev?.owner?.display_name} />
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
                <Badge tone={a.full_session ? "good" : a.checked_in_at ? "warn" : "neutral"}>
                  {a.full_session ? "full session" : a.checked_in_at ? "checked in" : "no-show"}
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

function FollowUpsCard({ eventId, status }: { eventId: string; status?: EventDetail["status"] }) {
  const isPlannedLike = status ? ["planned", "upcoming", "draft"].includes(status) : false;
  const { data, loading } = useAsync(() => getEventFollowUps(eventId), [eventId]);
  return (
    <Card>
      <CardHeader title="Follow-Up Context" subtitle="Open relationship actions for this event." />
      <CardBody className="space-y-2">
        {/* New events haven't happened yet — no follow-ups to recommend. */}
        {isPlannedLike ? (
          <EmptyState title="No follow-ups for now" hint="Follow-ups appear once the event has run." />
        ) : (
          <>
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
          </>
        )}
      </CardBody>
    </Card>
  );
}

function HostReportCard({ eventId }: { eventId: string }) {
  const { data, loading } = useAsync(() => getHostReport(eventId), [eventId]);
  const [report, setReport] = useState<HostReport | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);

  // `report` overrides the fetched value once the user submits/edits.
  const current = report !== undefined ? report : data;

  return (
    <Card>
      <CardHeader title="Host Experience Report" subtitle="Qualitative context from the Würth host." />
      <CardBody>
        {loading && report === undefined && <Skeleton className="h-24 w-full" />}

        {!loading && !current && !editing && (
          <div className="flex flex-col items-start gap-3">
            <EmptyState title="No host report yet" hint="Required for event-health classification." />
            <Button variant="secondary" className="text-xs" onClick={() => setEditing(true)}>
              Submit host report
            </Button>
          </div>
        )}

        {!loading && current && !editing && (
          <div className="space-y-2 text-sm">
            <div className="flex gap-4">
              <Stat label="Organization" value={`${current.organization_rating}/5`} />
              <Stat label="Relevance" value={`${current.audience_relevance_rating}/5`} />
              <Stat label="Interaction" value={`${current.interaction_quality_rating}/5`} />
            </div>
            <div>
              <Badge tone={current.repeat_recommendation === "repeat" ? "good" : current.repeat_recommendation === "improve" ? "warn" : "risk"}>
                {current.repeat_recommendation}
              </Badge>
            </div>
            {current.notes && <p className="text-we-slate">{current.notes}</p>}
            {current.suggested_improvements && (
              <p className="text-xs text-we-muted">Improve: {current.suggested_improvements}</p>
            )}
            <Button variant="ghost" className="px-0 text-xs" onClick={() => setEditing(true)}>
              Edit report
            </Button>
          </div>
        )}

        {editing && (
          <HostReportForm
            eventId={eventId}
            initial={current ?? null}
            onCancel={() => setEditing(false)}
            onSaved={(r) => {
              setReport(r);
              setEditing(false);
            }}
          />
        )}
      </CardBody>
    </Card>
  );
}

function HostReportForm({
  eventId,
  initial,
  onCancel,
  onSaved,
}: {
  eventId: string;
  initial: HostReport | null;
  onCancel: () => void;
  onSaved: (r: HostReport) => void;
}) {
  const [org, setOrg] = useState(initial?.organization_rating ?? 4);
  const [rel, setRel] = useState(initial?.audience_relevance_rating ?? 4);
  const [inter, setInter] = useState(initial?.interaction_quality_rating ?? 4);
  const [rec, setRec] = useState<HostReport["repeat_recommendation"]>(initial?.repeat_recommendation ?? "repeat");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [improve, setImprove] = useState(initial?.suggested_improvements ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const r = await submitHostReport(eventId, {
        organization_rating: org,
        audience_relevance_rating: rel,
        interaction_quality_rating: inter,
        repeat_recommendation: rec,
        notes: notes.trim() || null,
        suggested_improvements: improve.trim() || null,
      });
      onSaved(r);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-3 gap-3">
        <RatingField label="Organization" value={org} onChange={setOrg} />
        <RatingField label="Relevance" value={rel} onChange={setRel} />
        <RatingField label="Interaction" value={inter} onChange={setInter} />
      </div>
      <label className="block">
        <span className="text-[11px] text-we-muted">Recommendation</span>
        <select
          value={rec}
          onChange={(e) => setRec(e.target.value as HostReport["repeat_recommendation"])}
          className="mt-1 w-full rounded-md border border-we-line bg-we-canvas px-2.5 py-2 text-sm text-we-slate outline-none focus:border-we-red"
        >
          <option value="repeat">Repeat</option>
          <option value="improve">Improve</option>
          <option value="stop">Stop</option>
        </select>
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Notes…"
        className="w-full resize-none rounded-md border border-we-line bg-we-canvas px-3 py-2 text-sm outline-none focus:border-we-red focus:bg-we-surface"
      />
      <textarea
        value={improve}
        onChange={(e) => setImprove(e.target.value)}
        rows={2}
        placeholder="Suggested improvements…"
        className="w-full resize-none rounded-md border border-we-line bg-we-canvas px-3 py-2 text-sm outline-none focus:border-we-red focus:bg-we-surface"
      />
      <div className="flex gap-2">
        <Button onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save report"}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function RatingField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] text-we-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-md border border-we-line bg-we-canvas px-2.5 py-2 text-sm text-we-slate outline-none focus:border-we-red"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n}/5
          </option>
        ))}
      </select>
    </label>
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
