"use client";

import { use, useState } from "react";
import Link from "next/link";
import { getEvent, getEventAttendees, getEventKpis, getHostReport } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { HealthBadge } from "@/components/dashboard/HealthBadge";
import { NextBestSteps } from "@/components/events/NextBestSteps";
import { PredictionCard } from "@/components/events/PredictionCard";
import { MaterialManager } from "@/components/events/MaterialManager";
import { EVENT_STATUS_LABEL, EVENT_STATUS_TONE, EVENT_TYPE_LABEL, fmtDate } from "@/lib/format";
import type { EventDetail, HostReport } from "@/lib/types";

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [showVisitors, setShowVisitors] = useState(false);
  const { data: ev, loading, error } = useAsync(() => getEvent(eventId), [eventId]);
  const { data: kpis, loading: kpiLoading } = useAsync(() => getEventKpis(eventId), [eventId]);
  const { data: hostReport } = useAsync(() => getHostReport(eventId), [eventId]);

  if (error) return <ErrorState message={error} />;

  const isPlannedLike = ev && ["planned", "upcoming", "draft"].includes(ev.status);

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <Link href="/dashboard" className="inline-flex text-xs font-semibold text-we-muted hover:text-we-red">
        {"<- Back to dashboard"}
      </Link>

      {loading || !ev ? (
        <Skeleton className="h-56 w-full rounded-card" />
      ) : (
        <EventSetupBox ev={ev} hostReport={hostReport} />
      )}

      <Card className="overflow-hidden">
        <div className="border-b border-we-line bg-white px-5 py-4">
          <div className="we-line mb-3" />
          <h2 className="text-xl font-bold text-we-ink">Event KPIs</h2>
        </div>
        <CardBody className="bg-white p-4 md:p-5">
          <KpiGrid
            kpis={kpis}
            loading={kpiLoading}
            visitorsActive={showVisitors}
            onVisitorsClick={() => setShowVisitors((v) => !v)}
          />
          {showVisitors && <VisitorsList eventId={eventId} />}
          <NextBestSteps eventId={eventId} />
        </CardBody>
      </Card>

      {isPlannedLike && <PredictionCard eventId={eventId} />}

      {ev && <MaterialManager eventId={eventId} initialDescription={ev.description} />}
    </div>
  );
}

function EventSetupBox({ ev, hostReport }: { ev: EventDetail; hostReport?: HostReport | null }) {
  const place = ev.city ?? ev.location ?? "Location TBD";
  const summary = ev.goal || ev.description;
  const hostScore = hostReport
    ? (
        (hostReport.organization_rating +
          hostReport.audience_relevance_rating +
          hostReport.interaction_quality_rating) /
        3
      ).toFixed(1)
    : null;

  return (
    <Card className="overflow-hidden">
      <CardBody className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="bg-white p-6 md:p-7">
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
            <div className="we-line mb-4" />
            <div className="space-y-4">
              <SetupFact label="University" value={ev.partner_university} />
              <SetupFact label="Cost" value={ev.cost != null ? `EUR ${ev.cost.toLocaleString("de-DE")}` : null} />
              <SetupFact label="Human capital" value={ev.human_capital} />
              <HostExperienceHover report={hostReport} score={hostScore} />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function HostExperienceHover({
  report,
  score,
}: {
  report?: HostReport | null;
  score: string | null;
}) {
  return (
    <div className="group relative">
      <div className="text-[10px] font-bold uppercase tracking-eyebrow text-we-muted">Host experience</div>
      <div className="mt-1 inline-flex cursor-default items-baseline gap-1 text-sm font-semibold text-we-ink">
        {score ? `${score}/5` : "-"}
        {report && <span className="text-[11px] text-we-muted">hover</span>}
      </div>
      {report && (
        <div className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden w-72 rounded-card border border-we-line bg-white p-3 text-xs leading-relaxed text-we-slate shadow-lift group-hover:block">
          <div className="mb-1 font-bold text-we-ink">{report.repeat_recommendation}</div>
          <div>
            Organization {report.organization_rating}/5 - Relevance {report.audience_relevance_rating}/5 - Interaction{" "}
            {report.interaction_quality_rating}/5
          </div>
          {report.notes && <div className="mt-2">{report.notes}</div>}
        </div>
      )}
    </div>
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

function VisitorsList({ eventId }: { eventId: string }) {
  const { data, loading } = useAsync(() => getEventAttendees(eventId), [eventId]);
  return (
    <div className="mt-3 overflow-hidden rounded-card border border-we-line bg-white">
      <div className="border-b border-we-line px-4 py-2 text-[11px] font-bold uppercase tracking-eyebrow text-we-muted">
        Visitor list
      </div>
      {loading && <Skeleton className="m-4 h-24 w-auto" />}
      {!loading && data && data.length === 0 && <EmptyState title="No visitors recorded" />}
      {!loading && data && data.length > 0 && (
        <div className="divide-y divide-we-line">
          {data.map((a) => (
            <Link
              key={a.user_id}
              href={`/students/${a.user_id}`}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 text-sm transition-colors hover:bg-we-canvas"
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold text-we-ink">{a.display_name}</span>
                <span className="block truncate text-[12px] text-we-muted">{a.university ?? "-"}</span>
              </span>
              <span className="text-[12px] font-semibold text-we-muted">
                {a.checked_out_at ? "full session" : a.checked_in_at ? "checked in" : "no-show"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
