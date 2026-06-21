import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Megaphone, Send } from "lucide-react-native";
import * as api from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { wuerth } from "@/theme";

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
    try {
      await api.broadcast(eventId, message.trim());
      setMessage("");
      setSentCount((c) => c + 1);
      toast(`Broadcast sent to ${attendeeCount} attendees ✓`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Broadcast failed", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <View className="gap-3">
      <Card className="p-4">
        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-wuerth-red-soft">
            <Megaphone size={18} color={wuerth.red} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-wuerth-ink">Broadcast to all attendees</Text>
            <Text className="text-xs text-wuerth-mute">
              One message → {attendeeCount} attendees · posts to the event channel
            </Text>
          </View>
        </View>

        <View className="mt-3">
          <Textarea value={message} onChangeText={setMessage} placeholder="Type an announcement…" />
        </View>

        <View className="mt-2 flex-row flex-wrap gap-1.5">
          {presets.map((p) => (
            <Pressable
              key={p}
              onPress={() => setMessage(p)}
              className="rounded-full bg-zinc-100 px-2.5 py-1 active:bg-zinc-200"
            >
              <Text className="text-xs font-medium text-wuerth-slate">
                {p.length > 28 ? `${p.slice(0, 28)}…` : p}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="mt-3 items-end">
          <Button onPress={send} loading={sending} disabled={!message.trim()} icon={<Send size={16} color="#fff" />}>
            Send broadcast
          </Button>
        </View>
      </Card>

      {sentCount > 0 ? (
        <Text className="text-center text-xs text-wuerth-mute">
          {sentCount} broadcast{sentCount > 1 ? "s" : ""} sent this session — view them in the event
          channel under Messages.
        </Text>
      ) : null}
    </View>
  );
}
