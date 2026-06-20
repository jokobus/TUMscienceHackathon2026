"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Gauge } from "lucide-react";
import type { EventSentiment, LiveAnalytics } from "@/lib/types";
import * as api from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { cn, timeAgo } from "@/lib/utils";

const moods = [
  { value: 0.8, emoji: "🔥", label: "Energised" },
  { value: 0.4, emoji: "🙂", label: "Engaged" },
  { value: 0, emoji: "😐", label: "Neutral" },
  { value: -0.4, emoji: "😴", label: "Flat" },
  { value: -0.8, emoji: "⚡", label: "Tense" },
];

const moodLabel: Record<LiveAnalytics["mood"], { text: string; tone: string }> = {
  energised: { text: "Energised", tone: "text-emerald-600" },
  engaged: { text: "Engaged", tone: "text-emerald-600" },
  neutral: { text: "Neutral", tone: "text-wuerth-slate" },
  flat: { text: "Flat", tone: "text-amber-600" },
  tense: { text: "Tense", tone: "text-wuerth-red" },
};

export function SentimentPanel({
  eventId,
  liveEnabled,
}: {
  eventId: string;
  liveEnabled: boolean;
}) {
  const { toast } = useToast();
  const [entries, setEntries] = useState<EventSentiment[] | null>(null);
  const [analytics, setAnalytics] = useState<LiveAnalytics | null>(null);
  const [description, setDescription] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(() => {
    api.getSentiment(eventId).then(setEntries);
    if (liveEnabled) api.getLiveAnalytics(eventId).then(setAnalytics);
  }, [eventId, liveEnabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll live analytics every 8s while enabled (MASTER §3.3).
  useEffect(() => {
    if (!liveEnabled) return;
    const id = setInterval(() => api.getLiveAnalytics(eventId).then(setAnalytics), 8000);
    return () => clearInterval(id);
  }, [eventId, liveEnabled]);

  async function capture() {
    if (!description.trim()) return;
    setSaving(true);
    await api.addSentiment(eventId, description.trim(), mood ?? undefined);
    setDescription("");
    setMood(null);
    setSaving(false);
    refresh();
    toast("Sentiment captured ✓");
  }

  return (
    <div className="space-y-3">
      {liveEnabled && analytics && (
        <Card className="p-4">
          <div className="flex items-center gap-2 text-wuerth-mute">
            <Gauge size={15} />
            <span className="text-xs font-semibold uppercase tracking-wide">Live room mood</span>
            <span className="ml-auto flex items-center gap-1 text-[11px] text-wuerth-mute">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-wuerth-red" /> polling
            </span>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div className={cn("text-2xl font-extrabold", moodLabel[analytics.mood].tone)}>
              {moodLabel[analytics.mood].text}
            </div>
            <div className="text-xs text-wuerth-mute">{analytics.sampleCount} captures</div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-wuerth-red transition-all"
              style={{ width: `${Math.round(((analytics.averageSentiment + 1) / 2) * 100)}%` }}
            />
          </div>
        </Card>
      )}

      <Card className="p-3">
        <div className="mb-2 flex gap-1.5">
          {moods.map((m) => (
            <button
              key={m.value}
              onClick={() => setMood(mood === m.value ? null : m.value)}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-[10px] font-semibold transition-colors",
                mood === m.value ? "bg-wuerth-red-soft text-wuerth-red ring-1 ring-wuerth-red/30" : "text-wuerth-mute hover:bg-zinc-50"
              )}
            >
              <span className="text-lg">{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Describe the room's sentiment right now…"
        />
        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={capture} loading={saving} disabled={!description.trim()}>
            Capture
          </Button>
        </div>
      </Card>

      {!entries ? (
        <ListSkeleton rows={2} />
      ) : entries.length === 0 ? (
        <EmptyState icon={Activity} title="No captures yet" description="Capture the crowd's mood during the event." />
      ) : (
        <div className="space-y-2.5">
          {entries.map((e) => (
            <Card key={e.id} className="p-3.5">
              <p className="text-sm leading-snug text-wuerth-ink">{e.description}</p>
              <p className="mt-2 text-xs text-wuerth-mute">{timeAgo(e.createdAt)} ago</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
