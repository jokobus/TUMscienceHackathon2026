"use client";

import { getNextBestEvents } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { EVENT_TYPE_LABEL } from "@/lib/format";

/** "Next Best Events" — each recommendation carries a WHY (AGENT §1.3). */
export function NextBestEvents() {
  const { data, loading } = useAsync(() => getNextBestEvents(), []);

  return (
    <Card>
      <CardHeader title="Next Best Events" subtitle="Where to invest relationship effort next." />
      <CardBody className="space-y-3">
        {loading && (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        )}
        {!loading && data && data.length === 0 && (
          <EmptyState title="No recommendations yet" hint="More event history is needed to suggest next best events." />
        )}
        {!loading &&
          data?.map((nbe) => (
            <div
              key={nbe.id}
              className="rounded-md border border-we-line p-3.5 transition-colors hover:border-we-red-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-semibold text-we-ink">{nbe.title}</div>
                <span className="shrink-0 rounded-full bg-we-canvas px-2 py-0.5 text-[11px] font-medium text-we-slate">
                  {Math.round(nbe.confidence * 100)}% confidence
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-we-slate">{nbe.reason}</p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-we-muted">
                {nbe.suggested_type && (
                  <span className="rounded bg-we-canvas px-1.5 py-0.5">
                    {EVENT_TYPE_LABEL[nbe.suggested_type]}
                  </span>
                )}
                {nbe.suggested_location && (
                  <span className="rounded bg-we-canvas px-1.5 py-0.5">{nbe.suggested_location}</span>
                )}
                {nbe.target_group && (
                  <span className="rounded bg-we-canvas px-1.5 py-0.5">{nbe.target_group}</span>
                )}
              </div>
            </div>
          ))}
      </CardBody>
    </Card>
  );
}
