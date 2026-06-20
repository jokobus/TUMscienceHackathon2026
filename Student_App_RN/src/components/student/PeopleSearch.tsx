import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Search, UserPlus, Users } from "lucide-react-native";
import type { PersonSearchResult } from "@/lib/types";
import * as api from "@/lib/api";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { wuerth } from "@/theme";

/**
 * Start-a-chat sheet — mirrors the Employee PeopleSearch, but the backend only
 * surfaces contacts a student is allowed to message (co-attended an event or
 * already connected). Recruiters/students you haven't met never appear here.
 */
export function PeopleSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    api
      .searchPeople(query)
      .then((r) => active && setResults(r))
      .catch(() => active && setResults([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [query, open]);

  async function openChat(p: PersonSearchResult) {
    if (p.chatId) {
      onClose();
      router.push(`/(tabs)/chat/${p.chatId}` as any);
      return;
    }
    try {
      const chat = await api.createChat(p.userId);
      onClose();
      router.push(`/(tabs)/chat/${chat.id}` as any);
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "You can't message this person.",
        "error"
      );
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} scrollable snapPoints={["80%"]} title="Start a chat">
      <View className="mb-2 flex-row items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2">
        <Users size={14} color={wuerth.mute} />
        <Text className="flex-1 text-xs text-wuerth-mute">
          You can only message people you&apos;ve met at an event or already connected with.
        </Text>
      </View>

      <View className="relative mb-3">
        <View className="absolute left-3 top-3 z-10" pointerEvents="none">
          <Search size={18} color={wuerth.mute} />
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search people you've met…"
          placeholderTextColor={wuerth.mute}
          className="h-11 w-full rounded-xl bg-zinc-100 pl-10 pr-3 text-sm text-we-ink"
        />
      </View>

      {results.length === 0 ? (
        <EmptyState
          icon={Search}
          title={loading ? "Searching…" : "No contacts"}
          description="People you meet at events or scan will appear here."
        />
      ) : (
        <View className="gap-1">
          {results.map((p) => (
            <Pressable
              key={p.userId}
              onPress={() => openChat(p)}
              className="flex-row items-center gap-3 rounded-xl p-2 active:bg-zinc-50"
            >
              <Avatar name={p.displayName} size="md" tone={p.role === "employee" ? "ink" : "red"} />
              <View className="min-w-0 flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text numberOfLines={1} className="flex-shrink text-sm font-semibold text-we-ink">
                    {p.displayName}
                  </Text>
                  {p.role === "employee" && <Chip tone="neutral">Würth</Chip>}
                </View>
                <Text numberOfLines={1} className="text-xs text-wuerth-mute">
                  {p.context}
                </Text>
              </View>
              {!p.chatId && <UserPlus size={16} color={wuerth.red} />}
            </Pressable>
          ))}
        </View>
      )}
    </BottomSheet>
  );
}
