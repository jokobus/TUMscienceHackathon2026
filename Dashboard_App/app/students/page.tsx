"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPriorityQueue, getStudents } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, Skeleton } from "@/components/ui/States";
import type { StudentRow } from "@/lib/types";
import {
  EVENT_TYPE_LABEL,
  FOLLOW_UP_LABEL,
  FOLLOW_UP_TONE,
  NEUTRAL_STATUS_LABEL,
  PRIORITY_TONE,
  relativeTime,
} from "@/lib/format";

type Sort = "priority" | "engagement" | "recency";

/** Free-text filter across name / university / tags / target group / last event. */
function matchesQuery(s: StudentRow, q: string): boolean {
  const hay = [
    s.display_name,
    s.university ?? "",
    s.target_group ?? "",
    s.last_event?.title ?? "",
    ...s.interest_tags,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q.toLowerCase());
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl"><Skeleton className="h-64 w-full rounded-card" /></div>}>
      <StudentsInner />
    </Suspense>
  );
}

function StudentsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  const [sort, setSort] = useState<Sort>("priority");
  const { data, loading } = useAsync(() => getStudents({ sort }), [sort]);

  const filtered = useMemo(
    () => (q ? (data ?? []).filter((s) => matchesQuery(s, q)) : data),
    [data, q]
  );

  function clearFilter() {
    router.push("/students");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Relationships"
        title="Student Explorer"
        subtitle="Follow-up opportunities from consent-based signals — not a public ranking."
        action={
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-md border border-we-line bg-we-surface px-2.5 py-1.5 text-xs font-medium text-we-slate outline-none focus:border-we-red"
          >
            <option value="priority">Sort: Priority</option>
            <option value="engagement">Sort: Engagement</option>
            <option value="recency">Sort: Recency</option>
          </select>
        }
      />

      {q && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-we-muted">Filtered by</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-we-red-soft px-2.5 py-1 text-xs font-medium text-we-red">
            “{q}”
            <button onClick={clearFilter} className="text-we-red/70 hover:text-we-red" aria-label="Clear filter">
              ✕
            </button>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Explorer table */}
        <Card className="overflow-hidden">
          {loading && <Skeleton className="m-4 h-64" />}
          {!loading && filtered && filtered.length === 0 && (
            <EmptyState
              title={q ? `No students match “${q}”` : "No students yet"}
              hint={q ? "Try a different university or interest." : "Interactions will populate this table."}
            />
          )}
          {!loading && filtered && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-we-line text-left text-xs text-we-muted">
                    <th className="px-4 py-2.5 font-medium">Student</th>
                    <th className="px-4 py-2.5 font-medium">Last event</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">Activity</th>
                    <th className="px-4 py-2.5 font-medium">Follow-up</th>
                    <th className="px-4 py-2.5 font-medium">Next step</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.user_id} className="border-b border-we-line last:border-0 hover:bg-we-canvas">
                      <td className="px-4 py-3">
                        <Link href={`/students/${s.user_id}`} className="font-medium text-we-ink hover:text-we-red">
                          {s.display_name}
                        </Link>
                        <div className="text-[11px] text-we-muted">{s.university}</div>
                      </td>
                      <td className="px-4 py-3 text-we-slate">
                        {s.last_event ? (
                          <>
                            {s.last_event.title}
                            <div className="text-[11px] text-we-muted">{EVENT_TYPE_LABEL[s.last_event.type]}</div>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone="info">{NEUTRAL_STATUS_LABEL[s.interaction_status]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-we-muted">{relativeTime(s.latest_activity_at)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={FOLLOW_UP_TONE[s.follow_up_status]}>
                          {FOLLOW_UP_LABEL[s.follow_up_status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-we-slate">{s.recommended_next_step}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Priority queue (backend prioritization output) */}
        <PriorityQueueCard />
      </div>
    </div>
  );
}

function PriorityQueueCard() {
  const { data, loading } = useAsync(() => getPriorityQueue(), []);
  return (
    <Card>
      <CardHeader title="Priority Queue" subtitle="Backend-ranked next actions." />
      <CardBody className="space-y-2.5">
        {loading && <Skeleton className="h-40 w-full" />}
        {!loading && data?.length === 0 && <EmptyState title="Queue empty" />}
        {!loading &&
          data?.map((p) => (
            <Link
              key={p.user_id}
              href={`/students/${p.user_id}`}
              className="block rounded-md border border-we-line p-3 transition-colors hover:border-we-red-soft"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-we-ink">{p.display_name}</span>
                <Badge tone={PRIORITY_TONE[p.urgency]} dot>
                  {p.urgency}
                </Badge>
              </div>
              <div className="mt-1 text-xs font-medium text-we-slate">{p.recommended_action}</div>
              <p className="mt-0.5 text-[11px] text-we-muted">{p.reason}</p>
              <div className="mt-1 text-[10px] text-we-muted">
                {Math.round(p.confidence * 100)}% confidence
              </div>
            </Link>
          ))}
      </CardBody>
    </Card>
  );
}
