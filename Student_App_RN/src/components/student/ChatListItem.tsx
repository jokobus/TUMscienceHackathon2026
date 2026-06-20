import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Hash, Radio } from "lucide-react-native";
import type { ChatSummary } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { cn, timeAgo } from "@/lib/utils";
import { wuerth } from "@/theme";

/** Conversation row — mirrors the Employee app's ChatListItem. */
export function ChatListItem({ chat }: { chat: ChatSummary }) {
  const isChannel = chat.type === "event_channel";
  return (
    <Pressable
      onPress={() => router.push(`/(tabs)/chat/${chat.id}` as any)}
      className="flex-row items-center gap-3 px-4 py-3 active:bg-zinc-50"
    >
      {isChannel ? (
        <View
          className={cn(
            "h-10 w-10 items-center justify-center rounded-full",
            chat.liveHighlight ? "bg-we-red" : "bg-zinc-200"
          )}
        >
          {chat.liveHighlight ? (
            <Radio size={18} color="#fff" />
          ) : (
            <Hash size={18} color={wuerth.slate} />
          )}
        </View>
      ) : (
        <Avatar name={chat.title} size="md" tone={chat.type === "internal" ? "ink" : "red"} />
      )}

      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          <Text numberOfLines={1} className="flex-shrink text-sm font-bold text-we-ink">
            {chat.title}
          </Text>
          {chat.liveHighlight && <Chip tone="red">Live</Chip>}
          {chat.type === "internal" && <Chip tone="neutral">Team</Chip>}
        </View>
        <Text numberOfLines={1} className="mt-0.5 text-[13px] text-wuerth-mute">
          {chat.lastMessage ?? "No messages yet"}
        </Text>
      </View>

      <View className="items-end gap-1">
        {chat.lastMessageAt ? (
          <Text className="text-[11px] text-wuerth-mute">{timeAgo(chat.lastMessageAt)}</Text>
        ) : null}
        <Badge count={chat.unread} />
      </View>
    </Pressable>
  );
}
