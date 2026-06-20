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
    <Card className="h-full">
      <CardHeader eyebrow="Recommendations" title="Next Best Events" subtitle="Where to invest relationship effort next." />
      <CardBody className="space-y-0 divide-y divide-we-line p-0">
        {loading && (
          <div className="space-y-3 p-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}
        {!loading && data && data.length === 0 && (
          <div className="p-6">
            <EmptyState title="No recommendations yet" hint="More event history is needed to suggest next best events." />
          </div>
        )}
        {!loading &&
          data?.map((nbe, i) => (
            <div key={nbe.id} className="group p-6 transition-colors hover:bg-we-canvas/40">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-[11px] text-we-faint">0{i + 1}</span>
                <span className="tnum text-[11px] text-we-muted">
                  {Math.round(nbe.confidence * 100)}% conf.
                </span>
              </div>
              <h4 className="mt-1.5 font-display text-[15px] font-medium leading-snug text-we-ink">
                {nbe.title}
              </h4>
              <p className="mt-1.5 text-[13px] leading-relaxed text-we-slate">{nbe.reason}</p>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10.5px] uppercase tracking-wider text-we-muted">
                {nbe.suggested_type && <span>{EVENT_TYPE_LABEL[nbe.suggested_type]}</span>}
                {nbe.suggested_location && <span>· {nbe.suggested_location}</span>}
                {nbe.target_group && <span>· {nbe.target_group}</span>}
              </div>
            </div>
          ))}
      </CardBody>
    </Card>
  );
}
