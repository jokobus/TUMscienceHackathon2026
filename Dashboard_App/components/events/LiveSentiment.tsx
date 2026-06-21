"use client";

import { getLiveAnalytics } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { relativeTime } from "@/lib/format";
import type { BadgeTone } from "@/lib/format";

const MOOD_TONE: Record<string, BadgeTone> = {
  energised: "good",
  engaged: "good",
  neutral: "neutral",
  flat: "warn",
  tense: "risk",
};

/** Live sentiment for ongoing events — mood, average, and recent samples. */
export function LiveSentiment({ eventId }: { eventId: string }) {
  const { data, loading, error } = useAsync(() => getLiveAnalytics(eventId), [eventId]);

  return (
    <Card>
      <CardHeader title="Live Sentiment" subtitle="On-the-ground mood logged by the host team." />
      <CardBody className="space-y-3">
        {loading && <Skeleton className="h-24 w-full" />}
        {!loading && error && <ErrorState message={error} />}
        {!loading && !error && data && data.sample_count === 0 && (
          <EmptyState title="No sentiment logged yet" hint="The host team hasn't recorded the mood." />
        )}
        {!loading && !error && data && data.sample_count > 0 && (
          <>
            <div className="flex items-center justify-between gap-3">
              <Badge tone={MOOD_TONE[data.mood] ?? "neutral"} dot>
                {data.mood}
              </Badge>
              <span className="text-xs text-we-muted">
                avg {data.average_sentiment.toFixed(2)} · {data.sample_count} sample
                {data.sample_count === 1 ? "" : "s"}
              </span>
            </div>
            <div className="space-y-2">
              {data.recent.map((s) => (
                <div key={s.id} className="rounded-md border border-we-line px-3 py-2">
                  <p className="text-sm text-we-slate">{s.description}</p>
                  <div className="mt-0.5 flex items-center justify-between text-[11px] text-we-muted">
                    <span>{relativeTime(s.created_at)}</span>
                    {s.sentiment_value != null && <span className="tnum">{s.sentiment_value.toFixed(1)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
