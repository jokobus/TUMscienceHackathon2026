"use client";

import { getEventNextBestSteps } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { PRIORITY_TONE } from "@/lib/format";

/** Turns local analysis into concrete action (AGENT §2.2). */
export function NextBestSteps({ eventId }: { eventId: string }) {
  const { data, loading } = useAsync(() => getEventNextBestSteps(eventId), [eventId]);

  return (
    <Card>
      <CardHeader title="Next Best Steps" subtitle="What Würth should do next for this event." />
      <CardBody className="space-y-2.5">
        {loading && <Skeleton className="h-32 w-full" />}
        {!loading && data && data.length === 0 && (
          <EmptyState title="No actions suggested" hint="Analysis will surface steps once data is in." />
        )}
        {!loading &&
          data?.map((step) => (
            <div key={step.id} className="flex items-start gap-3 rounded-md border border-we-line p-3">
              <Badge tone={PRIORITY_TONE[step.priority]} dot>
                {step.priority}
              </Badge>
              <div className="flex-1">
                <div className="text-sm font-medium text-we-ink">{step.action}</div>
                <div className="mt-0.5 text-xs text-we-slate">{step.rationale}</div>
              </div>
              {step.creates_follow_up && (
                <Button variant="secondary" className="shrink-0 px-2.5 py-1 text-xs">
                  + Follow-up
                </Button>
              )}
            </div>
          ))}
      </CardBody>
    </Card>
  );
}
