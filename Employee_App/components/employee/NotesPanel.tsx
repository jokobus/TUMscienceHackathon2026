"use client";

import { useEffect, useState } from "react";
import { NotebookPen } from "lucide-react";
import type { EventNote } from "@/lib/types";
import * as api from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { timeAgo } from "@/lib/utils";

export function NotesPanel({ eventId }: { eventId: string }) {
  const { toast } = useToast();
  const [notes, setNotes] = useState<EventNote[] | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getNotes(eventId).then(setNotes);
  }, [eventId]);

  async function add() {
    if (!draft.trim()) return;
    setSaving(true);
    const note = await api.addNote(eventId, draft.trim());
    setNotes((prev) => [note, ...(prev ?? [])]);
    setDraft("");
    setSaving(false);
    toast("Note saved ✓");
  }

  return (
    <div className="space-y-3">
      <Card className="p-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Private note for this event — only you and the team see it."
        />
        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={add} loading={saving} disabled={!draft.trim()}>
            Add note
          </Button>
        </div>
      </Card>

      {!notes ? (
        <ListSkeleton rows={2} />
      ) : notes.length === 0 ? (
        <EmptyState icon={NotebookPen} title="No notes yet" description="Jot down observations, leads or to-dos." />
      ) : (
        <div className="space-y-2.5">
          {notes.map((n) => (
            <Card key={n.id} className="p-3.5">
              <p className="text-sm leading-snug text-wuerth-ink">{n.body}</p>
              <p className="mt-2 text-xs text-wuerth-mute">{timeAgo(n.createdAt)} ago</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
