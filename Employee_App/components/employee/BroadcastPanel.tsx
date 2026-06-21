"use client";

import { useState } from "react";
import { Megaphone, Send } from "lucide-react";
import * as api from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

const presets = [
  "Reminder: final demos start in 30 minutes.",
  "Lunch is served in the main hall 🍽️",
  "Location changed — we're now in Room B2.",
];

export function BroadcastPanel({
  eventId,
  attendeeCount,
}: {
  eventId: string;
  attendeeCount: number;
}) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  async function send() {
    if (!message.trim()) return;
    setSending(true);
    await api.broadcast(eventId, message.trim());
    setSending(false);
    setMessage("");
    setSentCount((c) => c + 1);
    toast(`Broadcast sent to ${attendeeCount} attendees ✓`);
  }

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <div className="flex items-center gap-2 text-wuerth-ink">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-wuerth-red-soft text-wuerth-red">
            <Megaphone size={18} />
          </span>
          <div>
            <div className="text-sm font-bold">Broadcast to all attendees</div>
            <div className="text-xs text-wuerth-mute">
              One message → {attendeeCount} attendees · posts to the event channel
            </div>
          </div>
        </div>

        <div className="mt-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Type an announcement…"
          />
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setMessage(p)}
              className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-wuerth-slate hover:bg-zinc-200"
            >
              {p.length > 28 ? `${p.slice(0, 28)}…` : p}
            </button>
          ))}
        </div>

        <div className="mt-3 flex justify-end">
          <Button onClick={send} loading={sending} disabled={!message.trim()}>
            <Send size={16} /> Send broadcast
          </Button>
        </div>
      </Card>

      {sentCount > 0 && (
        <p className="text-center text-xs text-wuerth-mute">
          {sentCount} broadcast{sentCount > 1 ? "s" : ""} sent this session — view them in the event channel under Messages.
        </p>
      )}
    </div>
  );
}
