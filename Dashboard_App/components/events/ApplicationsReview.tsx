"use client";

import { useEffect, useState } from "react";
import { getEventApplications, updateApplicationStatus } from "@/lib/api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { fmtDate } from "@/lib/format";
import type { BadgeTone } from "@/lib/format";
import type { EventApplication } from "@/lib/types";

const STATUS_TONE: Record<string, BadgeTone> = {
  submitted: "info",
  under_review: "warn",
  accepted: "good",
  rejected: "risk",
};

/** Review applications and accept / reject / mark under-review. */
export function ApplicationsReview({ eventId }: { eventId: string }) {
  const [apps, setApps] = useState<EventApplication[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getEventApplications(eventId)
      .then((d) => !cancelled && setApps(d))
      .catch(() => !cancelled && setApps([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  async function decide(id: string, status: "accepted" | "rejected" | "under_review") {
    setBusyId(id);
    try {
      const res = await updateApplicationStatus(id, status);
      setApps((prev) => prev?.map((a) => (a.id === id ? { ...a, status: res.status } : a)) ?? prev);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardHeader title="Applications" subtitle="Review applicants — accepting auto-registers them." />
      <CardBody className="space-y-3">
        {loading && <Skeleton className="h-32 w-full" />}
        {!loading && apps && apps.length === 0 && <EmptyState title="No applications yet" />}
        {!loading &&
          apps?.map((a) => {
            const pending = a.status === "submitted" || a.status === "under_review";
            return (
              <div key={a.id} className="rounded-md border border-we-line p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-we-ink">
                      {a.applicant_email ?? a.applicant_user_id ?? "Applicant"}
                    </div>
                    <div className="text-[11px] text-we-muted">Applied {fmtDate(a.submitted_at)}</div>
                  </div>
                  <Badge tone={STATUS_TONE[a.status] ?? "neutral"}>{a.status.replace(/_/g, " ")}</Badge>
                </div>
                {a.answers.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {a.answers.map((ans) => (
                      <li key={ans.question_id} className="text-xs text-we-slate">
                        • {ans.answer_text}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    onClick={() => decide(a.id, "accepted")}
                    disabled={busyId === a.id || a.status === "accepted"}
                    className="px-2.5 py-1 text-xs"
                  >
                    Accept
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => decide(a.id, "under_review")}
                    disabled={busyId === a.id || !pending}
                    className="px-2.5 py-1 text-xs"
                  >
                    Under review
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => decide(a.id, "rejected")}
                    disabled={busyId === a.id || a.status === "rejected"}
                    className="px-2.5 py-1 text-xs"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            );
          })}
      </CardBody>
    </Card>
  );
}
