"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getStudents } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState, Skeleton } from "@/components/ui/States";
import type { StudentRow } from "@/lib/types";

/** Priority buckets — the page is the backend-ranked follow-up queue, grouped
 *  by urgency. Detail (history, tags, status, timeline) lives on the student page. */
const BUCKETS = [
  { band: "high", label: "High priority", dot: "bg-status-risk" },
  { band: "medium", label: "Medium priority", dot: "bg-status-warn" },
  { band: "low", label: "Low priority", dot: "bg-status-neutral" },
] as const;

function matchesQuery(s: StudentRow, q: string): boolean {
  const hay = [s.display_name, s.university ?? "", s.target_group ?? "", s.last_event?.title ?? "", ...s.interest_tags]
    .join(" ")
    .toLowerCase();
  return hay.includes(q.toLowerCase());
}

export default function RelationshipsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl">
          <Skeleton className="h-72 w-full rounded-card" />
        </div>
      }
    >
      <RelationshipsInner />
    </Suspense>
  );
}

function RelationshipsInner() {
  const router = useRouter();
  const q = useSearchParams().get("q") ?? "";
  const { data, loading } = useAsync(() => getStudents({ sort: "priority" }), []);

  const filtered = useMemo(
    () => (q ? (data ?? []).filter((s) => matchesQuery(s, q)) : data ?? []),
    [data, q]
  );

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Relationships" />

      {q && (
        <div className="mb-6 flex items-center gap-2 text-sm">
          <span className="text-we-muted">Filtered by</span>
          <span className="inline-flex items-center gap-1.5 rounded-tag bg-we-red-soft px-2.5 py-1 text-xs font-medium text-we-red">
            “{q}”
            <button
              onClick={() => router.push("/students")}
              className="text-we-red/70 hover:text-we-red"
              aria-label="Clear filter"
            >
              ✕
            </button>
          </span>
        </div>
      )}

      {loading && <Skeleton className="h-72 w-full rounded-card" />}

      {!loading && filtered.length === 0 && (
        <Card>
          <EmptyState
            title={q ? `No relationships match “${q}”` : "Nothing in the queue"}
            hint={q ? "Try a different university or interest." : "Follow-up signals will surface here."}
          />
        </Card>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-9">
          {BUCKETS.map((b) => {
            const rows = filtered.filter((s) => s.priority_band === b.band);
            if (rows.length === 0) return null;
            return (
              <section key={b.band}>
                <div className="mb-3 flex items-center gap-3 px-1">
                  <span className={`h-2 w-2 rounded-full ${b.dot}`} />
                  <h2 className="text-[15px] font-bold text-we-ink">{b.label}</h2>
                  <span className="text-[13px] text-we-muted">{rows.length}</span>
                </div>
                <Card className="divide-y divide-we-line overflow-hidden">
                  {rows.map((s) => (
                    <QueueRow key={s.user_id} s={s} />
                  ))}
                </Card>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QueueRow({ s }: { s: StudentRow }) {
  return (
    <Link
      href={`/students/${s.user_id}`}
      className="group block px-5 py-4 transition-colors hover:bg-we-canvas"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold text-we-ink group-hover:text-we-red">{s.display_name}</span>
        <span className="shrink-0 text-[11px] text-we-muted">{s.university}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="truncate text-[13px] text-we-slate">{s.recommended_next_step}</span>
        <svg
          className="h-4 w-4 shrink-0 text-we-muted transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-we-red"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Link>
  );
}
