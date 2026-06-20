"use client";

import { useState } from "react";
import { updateEventDescription } from "@/lib/api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

/** Student-facing editable description (AGENT §2.4 → PATCH /internal/events/{id}). */
export function EditableDescription({
  eventId,
  initial,
}: {
  eventId: string;
  initial: string;
}) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const dirty = value !== saved;

  async function handleSave() {
    setBusy(true);
    await updateEventDescription(eventId, value);
    setSaved(value);
    setBusy(false);
  }

  return (
    <Card>
      <CardHeader
        title="Student-Facing Description"
        subtitle="Shown to students externally. Managed here; analytics stay internal."
        action={
          dirty ? (
            <Button onClick={handleSave} disabled={busy} className="px-3 py-1.5 text-xs">
              {busy ? "Saving…" : "Save"}
            </Button>
          ) : (
            <span className="text-xs text-status-good">Saved ✓</span>
          )
        }
      />
      <CardBody>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          className="w-full resize-y rounded-md border border-we-line bg-we-canvas px-3 py-2 text-sm leading-relaxed outline-none focus:border-we-red focus:bg-we-surface"
        />
      </CardBody>
    </Card>
  );
}
