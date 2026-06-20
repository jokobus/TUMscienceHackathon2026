import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { MessagesSquare, Search, UserPlus } from "lucide-react-native";
import type { ChatSummary, ChatType } from "@/lib/types";
import * as api from "@/lib/api";
import { TopAppBar } from "@/components/employee/TopAppBar";
import { ChatListItem } from "@/components/employee/ChatListItem";
import { PeopleSearch } from "@/components/employee/PeopleSearch";
import { NotificationsBell } from "@/components/employee/NotificationsBell";
import { IconButton } from "@/components/ui/IconButton";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { wuerth } from "@/theme";

type Filter = "all" | ChatType;

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "event_channel", label: "Event channels" },
  { value: "dm", label: "Direct messages" },
  { value: "internal", label: "Team" },
];

export default function MessagesScreen() {
  const [chats, setChats] = useState<ChatSummary[] | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useFocusEffect(
    useCallback(() => {
      api.getChats().then(setChats);
    }, [])
  );

  const visible = useMemo(() => {
    if (!chats) return [];
    const q = query.trim().toLowerCase();
    return chats.filter((c) => {
      if (filter !== "all" && c.type !== filter) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        (c.lastMessage ?? "").toLowerCase().includes(q) ||
        (c.subtitle ?? "").toLowerCase().includes(q)
      );
    });
  }, [chats, query, filter]);

  return (
    <View className="flex-1 bg-wuerth-bg">
      <TopAppBar
        title="Messages"
        right={
          <View className="flex-row items-center">
            <IconButton accessibilityLabel="New message" onPress={() => setSearchOpen(true)}>
              <UserPlus size={22} color="#fff" />
            </IconButton>
            <NotificationsBell />
          </View>
        }
      />

      {/* WhatsApp-style search bar below the top bar */}
      <View className="bg-wuerth-bg px-4 pb-1 pt-3">
        <View className="flex-row items-center gap-2 rounded-full bg-white px-3.5 py-2.5">
          <Search size={18} color={wuerth.mute} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search messages"
            placeholderTextColor={wuerth.mute}
            className="flex-1 text-sm text-wuerth-ink"
          />
        </View>
      </View>

      {/* Filter tags */}
      <View className="pb-2 pt-1">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {filters.map((f) => {
            const active = filter === f.value;
            return (
              <Pressable
                key={f.value}
                onPress={() => setFilter(f.value)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5",
                  active ? "border-wuerth-red bg-wuerth-red-soft" : "border-wuerth-line bg-white"
                )}
              >
                <Text
                  className={cn(
                    "text-xs font-semibold",
                    active ? "text-wuerth-red" : "text-wuerth-slate"
                  )}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 112 }}>
        <View className="px-4 pt-1">
          {chats === null ? (
            <ListSkeleton rows={6} />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={MessagesSquare}
              title={query || filter !== "all" ? "No matches" : "No conversations yet"}
              description={
                query || filter !== "all"
                  ? "Try a different search or filter."
                  : "Tap the + to find an attendee or colleague."
              }
            />
          ) : (
            <Card className="overflow-hidden">
              {visible.map((c, i) => (
                <View key={c.id} className={cn(i > 0 && "border-t border-wuerth-line")}>
                  <ChatListItem chat={c} />
                </View>
              ))}
            </Card>
          )}
        </View>
      </ScrollView>

      <PeopleSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </View>
  );
}
