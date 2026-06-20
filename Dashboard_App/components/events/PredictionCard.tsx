"use client";

import { getEventPrediction } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/States";
import { PREDICTION_LABEL } from "@/lib/format";

export function PredictionCard({ eventId }: { eventId: string }) {
  const { data, loading } = useAsync(() => getEventPrediction(eventId), [eventId]);

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Confidence Prediction" />
      <CardBody>
        {loading || !data ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-eyebrow text-we-muted">
                {PREDICTION_LABEL[data.outcome]}
              </div>
              <div className="mt-1 text-3xl font-bold leading-none text-we-ink">
                {Math.round(data.confidence * 100)}%
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-we-canvas">
                <div className="h-full bg-we-red" style={{ width: `${Math.round(data.confidence * 100)}%` }} />
              </div>
            </div>
            <div className="border-t border-we-line pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">
              <p className="text-sm leading-relaxed text-we-slate">{data.reason}</p>
              <div className="mt-2 text-[11px] font-semibold uppercase tracking-eyebrow text-we-muted">
                {data.compared_against} similar events
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
