"use client";

import { getEventMemories } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { relativeTime } from "@/lib/format";
import type { EventMemory } from "@/lib/types";

/** Read-only display of the public event memory wall, threaded by parent_id. */
export function MemoriesThread({ eventId }: { eventId: string }) {
  const { data, loading, error } = useAsync(() => getEventMemories(eventId), [eventId]);

  const roots = (data ?? []).filter((m) => !m.parent_id);
  const repliesOf = (id: string) => (data ?? []).filter((m) => m.parent_id === id);

  return (
    <Card>
      <CardHeader title="Memories" subtitle="What attendees shared from this event." />
      <CardBody className="space-y-4">
        {loading && <Skeleton className="h-32 w-full" />}
        {!loading && error && <ErrorState message={error} />}
        {!loading && !error && roots.length === 0 && (
          <EmptyState title="No memories yet" hint="Attendees haven't posted to this event wall." />
        )}
        {!loading && !error &&
          roots.map((m) => (
            <div key={m.id} className="space-y-3">
              <MemoryItem m={m} />
              {repliesOf(m.id).length > 0 && (
                <div className="ml-5 space-y-3 border-l border-we-line pl-4">
                  {repliesOf(m.id).map((r) => (
                    <MemoryItem key={r.id} m={r} />
                  ))}
                </div>
              )}
            </div>
          ))}
      </CardBody>
    </Card>
  );
}

function MemoryItem({ m }: { m: EventMemory }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-we-ink">{m.author_name}</span>
        <span className="text-[11px] text-we-muted">{relativeTime(m.created_at)}</span>
      </div>
      <p className="mt-0.5 text-sm text-we-slate">{m.body}</p>
      {m.images.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {m.images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" loading="lazy" className="h-20 w-28 rounded-md object-cover" />
          ))}
        </div>
      )}
    </div>
  );
}
