"use client";

import { useEffect, useState } from "react";
import { addNote, getEventNotes } from "@/lib/api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { relativeTime } from "@/lib/format";
import type { EventNote } from "@/lib/types";

/** Internal private notes for the event (employee-only). */
export function EventNotes({ eventId }: { eventId: string }) {
  const [notes, setNotes] = useState<EventNote[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getEventNotes(eventId)
      .then((d) => !cancelled && setNotes(d))
      .catch(() => !cancelled && setNotes([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  async function save() {
    const body = draft.trim();
    if (!body) return;
    setBusy(true);
    try {
      const created = await addNote(eventId, body);
      setNotes((prev) => [created, ...(prev ?? [])]);
      setDraft("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Private Notes" subtitle="Internal context — not visible to attendees." />
      <CardBody className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add an internal note…"
            className="flex-1 rounded-md border border-we-line bg-we-canvas px-3 py-2 text-sm outline-none focus:border-we-red focus:bg-we-surface"
          />
          <Button onClick={save} disabled={busy || !draft.trim()}>
            {busy ? "Saving…" : "Add note"}
          </Button>
        </div>
        {loading && <Skeleton className="h-20 w-full" />}
        {!loading && notes && notes.length === 0 && <EmptyState title="No notes yet" />}
        {!loading &&
          notes?.map((n) => (
            <div key={n.id} className="rounded-md border border-we-line px-3 py-2">
              <p className="text-sm text-we-slate">{n.body}</p>
              <div className="mt-0.5 text-[11px] text-we-muted">{relativeTime(n.created_at)}</div>
            </div>
          ))}
      </CardBody>
    </Card>
  );
}
