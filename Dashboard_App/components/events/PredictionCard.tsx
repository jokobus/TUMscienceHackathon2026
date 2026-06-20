"use client";

import { getEventPrediction } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/States";
import { PREDICTION_LABEL, PREDICTION_TONE } from "@/lib/format";

/** Flop detection / confidence-based prediction for planned events (AGENT §1 flop block). */
export function PredictionCard({ eventId }: { eventId: string }) {
  const { data, loading } = useAsync(() => getEventPrediction(eventId), [eventId]);

  return (
    <Card>
      <CardHeader title="Confidence Prediction" subtitle="Estimated performance vs. similar past events." />
      <CardBody>
        {loading || !data ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <Badge tone={PREDICTION_TONE[data.outcome]} dot>
                {PREDICTION_LABEL[data.outcome]}
              </Badge>
              <span className="text-xs text-we-muted">
                {Math.round(data.confidence * 100)}% confidence · {data.compared_against} similar
              </span>
            </div>
            <p className="mt-2 text-sm text-we-slate">{data.reason}</p>
          </>
        )}
      </CardBody>
    </Card>
  );
}
