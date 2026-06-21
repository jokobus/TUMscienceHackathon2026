"use client";

import { useState } from "react";
import { createFollowUp, getEventNextBestSteps, messageContact, uploadMaterial } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { PRIORITY_TONE } from "@/lib/format";
import type { EventStatus, NextBestStep } from "@/lib/types";

/** Turns local analysis into concrete action (AGENT §2.2). */
export function NextBestSteps({ eventId, status }: { eventId: string; status?: EventStatus }) {
  const isPlannedLike = status ? ["planned", "upcoming", "draft"].includes(status) : false;
  const { data, loading } = useAsync(() => getEventNextBestSteps(eventId), [eventId]);

  return (
    <Card>
      <CardHeader title="Next Best Steps" subtitle="What Würth should do next for this event." />
      <CardBody className="space-y-2.5">
        {/* New events haven't run yet — nothing to follow up on. */}
        {isPlannedLike ? (
          <EmptyState title="No follow-ups for now" hint="Steps appear once the event is ongoing or past." />
        ) : (
          <>
            {loading && <Skeleton className="h-32 w-full" />}
            {!loading && data && data.length === 0 && (
              <EmptyState title="No actions suggested" hint="Analysis will surface steps once data is in." />
            )}
            {!loading && data?.map((step) => <StepRow key={step.id} eventId={eventId} step={step} />)}
          </>
        )}
      </CardBody>
    </Card>
  );
}

function StepRow({ eventId, step }: { eventId: string; step: NextBestStep }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  return (
    <div className="rounded-md border border-we-line p-3">
      <div className="flex items-start gap-3">
        <Badge tone={PRIORITY_TONE[step.priority]} dot>
          {step.priority}
        </Badge>
        <div className="flex-1">
          <div className="text-sm font-medium text-we-ink">{step.action}</div>
          <div className="mt-0.5 text-xs text-we-slate">{step.rationale}</div>
        </div>
        {!done && (
          <Button
            variant="secondary"
            className="shrink-0 px-2.5 py-1 text-xs"
            onClick={() => setOpen((v) => !v)}
          >
            {step.kind === "upload_slides" ? "Upload slides" : "Message"}
          </Button>
        )}
      </div>

      {done && <p className="mt-2 text-xs text-status-good">{done}</p>}

      {open && !done && step.kind === "contact" && step.contact_user_id && (
        <ContactComposer
          eventId={eventId}
          contactUserId={step.contact_user_id}
          contactName={step.contact_name}
          defaultBody={`Hi ${step.contact_name ?? "there"}, `}
          onSent={() => setDone(`Message sent to ${step.contact_name ?? "contact"}.`)}
        />
      )}

      {open && !done && step.kind === "upload_slides" && (
        <SlidesUploader eventId={eventId} onUploaded={(t) => setDone(`Uploaded "${t}".`)} />
      )}
    </div>
  );
}

/** Reuses the communication chat send path: find/create a DM, then send + log a follow-up. */
function ContactComposer({
  eventId,
  contactUserId,
  contactName,
  defaultBody,
  onSent,
}: {
  eventId: string;
  contactUserId: string;
  contactName: string | null;
  defaultBody: string;
  onSent: () => void;
}) {
  const [body, setBody] = useState(defaultBody);
  const [busy, setBusy] = useState(false);

  async function send() {
    const text = body.trim();
    if (!text) return;
    setBusy(true);
    try {
      await messageContact(contactUserId, text);
      // Also log a follow-up so the action is tracked on the event.
      await createFollowUp({
        event_id: eventId,
        contact_user_id: contactUserId,
        next_action: `Messaged ${contactName ?? "contact"}`,
        type: "contact",
      }).catch(() => undefined);
      onSent();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        className="w-full resize-none rounded-md border border-we-line bg-we-canvas px-3 py-2 text-sm outline-none focus:border-we-red focus:bg-we-surface"
      />
      <Button onClick={send} disabled={busy || !body.trim()} className="px-2.5 py-1 text-xs">
        {busy ? "Sending…" : "Send message"}
      </Button>
    </div>
  );
}

/** Opens the slides upload flow (MaterialManager type=slides). */
function SlidesUploader({ eventId, onUploaded }: { eventId: string; onUploaded: (title: string) => void }) {
  const [title, setTitle] = useState("Event slides");
  const [busy, setBusy] = useState(false);

  async function upload() {
    const t = title.trim();
    if (!t) return;
    setBusy(true);
    try {
      await uploadMaterial(eventId, { title: t, type: "slides", url: "#" });
      onUploaded(t);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Slides title"
        className="flex-1 rounded-md border border-we-line bg-we-canvas px-3 py-2 text-sm outline-none focus:border-we-red focus:bg-we-surface"
      />
      <Button onClick={upload} disabled={busy || !title.trim()} className="px-2.5 py-1 text-xs">
        {busy ? "Uploading…" : "Upload slides"}
      </Button>
    </div>
  );
}
