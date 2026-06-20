"use client";

import { use } from "react";
import Link from "next/link";
import { getStudentDetail, getStudentTimeline } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import {
  FOLLOW_UP_LABEL,
  FOLLOW_UP_TONE,
  NEUTRAL_STATUS_LABEL,
  fmtDate,
  fmtDateTime,
} from "@/lib/format";

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const { data: s, loading, error } = useAsync(() => getStudentDetail(studentId), [studentId]);
  const timeline = useAsync(() => getStudentTimeline(studentId), [studentId]);

  if (error) return <ErrorState message={error} />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/students" className="text-xs text-we-muted hover:text-we-red">
        ← Back to Student Explorer
      </Link>

      <PageHeader
        title={loading || !s ? "Loading…" : s.display_name}
        subtitle={s ? `${s.study_degree ?? ""}${s.university ? ` · ${s.university}` : ""}` : undefined}
        action={
          s ? <Badge tone="info">{NEUTRAL_STATUS_LABEL[s.interaction_status]}</Badge> : undefined
        }
      />

      {/* Continuity banner: students never see an internal score (AGENT §6) */}
      {s && (
        <Card className="border-we-red-soft">
          <CardBody>
            <div className="flex items-start gap-3">
              <div className="we-line mt-1.5" />
              <div>
                <div className="text-xs font-medium text-we-red">Recommended next Würth action</div>
                <p className="mt-0.5 text-sm font-medium text-we-ink">{s.recommended_next_step}</p>
                <p className="mt-1 text-[11px] text-we-muted">
                  Relationship since {fmtDate(s.first_interaction_at)} · last activity{" "}
                  {fmtDate(s.latest_interaction_at)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile + interests */}
        <Card>
          <CardHeader title="Relationship Profile" />
          <CardBody className="space-y-3 text-sm">
            {loading || !s ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {s.interest_tags.map((t) => (
                    <span key={t} className="rounded-full bg-we-canvas px-2.5 py-0.5 text-xs text-we-slate">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  {s.project_interest && <Badge tone="warn">Project interest</Badge>}
                  {s.career_interest && <Badge tone="good">Career interest</Badge>}
                  {s.returning && <Badge tone="info">Returning</Badge>}
                </div>
                <div className="border-t border-we-line pt-3">
                  <div className="mb-1 text-xs font-medium text-we-muted">Event history</div>
                  {s.event_history.map((e) => (
                    <Link
                      key={e.event_id}
                      href={`/events/${e.event_id}`}
                      className="flex justify-between py-1 text-sm hover:text-we-red"
                    >
                      <span className="text-we-ink">{e.title}</span>
                      <span className="text-[11px] text-we-muted">{fmtDate(e.date)}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </CardBody>
        </Card>

        {/* Interaction timeline */}
        <Card>
          <CardHeader title="Interaction Timeline" subtitle="Continuity — Würth doesn't start from zero." />
          <CardBody>
            {timeline.loading && <Skeleton className="h-40 w-full" />}
            {!timeline.loading && timeline.data?.length === 0 && <EmptyState title="No interactions" />}
            {!timeline.loading && timeline.data && timeline.data.length > 0 && (
              <ol className="relative space-y-4 border-l border-we-line pl-4">
                {timeline.data.map((t) => (
                  <li key={t.id} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-we-surface bg-we-red" />
                    <div className="text-sm font-medium text-we-ink">{t.type.replace(/_/g, " ")}</div>
                    {t.detail && <div className="text-xs text-we-slate">{t.detail}</div>}
                    <div className="text-[11px] text-we-muted">
                      {t.event_title ? `${t.event_title} · ` : ""}
                      {fmtDateTime(t.timestamp)}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Open follow-ups */}
      {s && s.open_follow_ups.length > 0 && (
        <Card>
          <CardHeader title="Open Follow-Ups" />
          <CardBody className="space-y-2">
            {s.open_follow_ups.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <div className="font-medium text-we-ink">{f.next_action}</div>
                  <div className="text-[11px] text-we-muted">
                    owner {f.assigned_owner.display_name}
                    {f.due_date ? ` · due ${fmtDate(f.due_date)}` : ""}
                  </div>
                </div>
                <Badge tone={FOLLOW_UP_TONE[f.status]}>{FOLLOW_UP_LABEL[f.status]}</Badge>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
