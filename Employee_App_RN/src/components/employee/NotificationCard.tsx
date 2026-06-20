import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Activity, AlertTriangle, Lightbulb, RefreshCw, UserCheck } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import type { NotificationItem } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { cardShadow } from "@/theme";

const config: Record<NotificationItem["type"], { icon: LucideIcon; bg: string; color: string }> = {
  engagement: { icon: Activity, bg: "bg-emerald-50", color: "#047857" },
  retention: { icon: UserCheck, bg: "bg-blue-50", color: "#1d4ed8" },
  improvement: { icon: Lightbulb, bg: "bg-amber-50", color: "#b45309" },
  attention: { icon: AlertTriangle, bg: "bg-wuerth-red-soft", color: "#CC0000" },
  follow_up: { icon: RefreshCw, bg: "bg-zinc-100", color: "#52525B" },
};

export function NotificationCard({
  item,
  onOpen,
}: {
  item: NotificationItem;
  onOpen?: (item: NotificationItem) => void;
}) {
  const cfg = config[item.type];
  const Icon = cfg.icon;

  function press() {
    onOpen?.(item);
    if (item.eventId) router.push(`/events/${item.eventId}`);
  }

  return (
    <Pressable
      onPress={press}
      style={cardShadow}
      className={cn(
        "flex-row gap-3.5 rounded-2xl border bg-white p-4",
        item.readAt ? "border-wuerth-line" : "border-wuerth-red/30"
      )}
    >
      <View className={cn("h-10 w-10 items-center justify-center rounded-xl", cfg.bg)}>
        <Icon size={18} color={cfg.color} />
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-start justify-between gap-2">
          <Text className="flex-1 text-sm font-bold leading-snug text-wuerth-ink">{item.title}</Text>
          {!item.readAt && <View className="mt-1 h-2 w-2 rounded-full bg-wuerth-red" />}
        </View>
        <Text className="mt-1.5 text-[13px] leading-relaxed text-wuerth-slate">{item.body}</Text>
        <Text className="mt-2.5 text-xs text-wuerth-mute">{timeAgo(item.createdAt)} ago</Text>
      </View>
    </Pressable>
  );
}
