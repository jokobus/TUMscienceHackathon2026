import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Activity, Gauge } from "lucide-react-native";
import type { EventSentiment, LiveAnalytics } from "@/lib/types";
import * as api from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { cn, timeAgo } from "@/lib/utils";
import { wuerth } from "@/theme";

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
    api.getSentiment(eventId).then(setEntries).catch(() => setEntries([]));
    if (liveEnabled) api.getLiveAnalytics(eventId).then(setAnalytics).catch(() => {});
  }, [eventId, liveEnabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!liveEnabled) return;
    const id = setInterval(
      () => api.getLiveAnalytics(eventId).then(setAnalytics).catch(() => {}),
      8000
    );
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
    <View className="gap-3">
      {liveEnabled && analytics ? (
        <Card className="p-4">
          <View className="flex-row items-center gap-2">
            <Gauge size={15} color={wuerth.mute} />
            <Text className="text-xs font-semibold uppercase tracking-wide text-wuerth-mute">
              Live room mood
            </Text>
            <View className="ml-auto flex-row items-center gap-1">
              <View className="h-1.5 w-1.5 rounded-full bg-wuerth-red" />
              <Text className="text-[11px] text-wuerth-mute">polling</Text>
            </View>
          </View>
          <View className="mt-2 flex-row items-end justify-between">
            <Text className={cn("text-2xl font-extrabold", moodLabel[analytics.mood].tone)}>
              {moodLabel[analytics.mood].text}
            </Text>
            <Text className="text-xs text-wuerth-mute">{analytics.sampleCount} captures</Text>
          </View>
          <View className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
            <View
              className="h-full rounded-full bg-wuerth-red"
              style={{ width: `${Math.round(((analytics.averageSentiment + 1) / 2) * 100)}%` }}
            />
          </View>
        </Card>
      ) : null}

      <Card className="p-3">
        <View className="mb-2 flex-row gap-1.5">
          {moods.map((m) => {
            const active = mood === m.value;
            return (
              <Pressable
                key={m.value}
                onPress={() => setMood(active ? null : m.value)}
                className={cn(
                  "flex-1 items-center gap-0.5 rounded-lg py-2",
                  active ? "border border-wuerth-red/30 bg-wuerth-red-soft" : ""
                )}
              >
                <Text className="text-lg">{m.emoji}</Text>
                <Text
                  className={cn(
                    "text-[10px] font-semibold",
                    active ? "text-wuerth-red" : "text-wuerth-mute"
                  )}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Textarea
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the room's sentiment right now…"
        />
        <View className="mt-2 items-end">
          <Button size="sm" onPress={capture} loading={saving} disabled={!description.trim()}>
            Capture
          </Button>
        </View>
      </Card>

      {!entries ? (
        <ListSkeleton rows={2} />
      ) : entries.length === 0 ? (
        <EmptyState icon={Activity} title="No captures yet" description="Capture the crowd's mood during the event." />
      ) : (
        <View className="gap-2.5">
          {entries.map((e) => (
            <Card key={e.id} className="p-3.5">
              <Text className="text-sm leading-snug text-wuerth-ink">{e.description}</Text>
              <Text className="mt-2 text-xs text-wuerth-mute">{timeAgo(e.createdAt)} ago</Text>
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}
