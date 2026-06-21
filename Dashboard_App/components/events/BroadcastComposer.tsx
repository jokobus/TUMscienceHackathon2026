"use client";

import { useState } from "react";
import { broadcastToEvent } from "@/lib/api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

/** Send a broadcast to all attendees + accepted applicants of this event. */
export function BroadcastComposer({ eventId }: { eventId: string }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function send() {
    const text = body.trim();
    if (!text) return;
    setBusy(true);
    setSent(false);
    try {
      await broadcastToEvent(eventId, text);
      setBody("");
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Broadcast" subtitle="Reaches every attendee and accepted applicant." />
      <CardBody className="space-y-3">
        <textarea
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            setSent(false);
          }}
          rows={3}
          placeholder="Type an announcement for all participants…"
          className="w-full resize-none rounded-md border border-we-line bg-we-canvas px-3 py-2 text-sm outline-none focus:border-we-red focus:bg-we-surface"
        />
        <div className="flex items-center justify-between gap-3">
          {sent ? (
            <span className="text-xs text-status-good">Broadcast sent.</span>
          ) : (
            <span className="text-[11px] text-we-muted">Posted to the event channel.</span>
          )}
          <Button onClick={send} disabled={busy || !body.trim()}>
            {busy ? "Sending…" : "Send broadcast"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
