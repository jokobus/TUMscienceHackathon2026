import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Search, UserPlus } from "lucide-react-native";
import type { PersonSearchResult } from "@/lib/types";
import * as api from "@/lib/api";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { wuerth } from "@/theme";

export function PeopleSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonSearchResult[]>([]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    api.searchPeople(query).then((r) => active && setResults(r));
    return () => {
      active = false;
    };
  }, [query, open]);

  async function openChat(p: PersonSearchResult) {
    if (p.chatId) {
      router.push(`/messages/${p.chatId}`);
    } else if (p.role === "student") {
      const { chatId } = await api.scanStudent(p.userId);
      router.push(`/messages/${chatId}`);
    }
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose} scrollable snapPoints={["80%"]} title="Search people">
      <View className="relative mb-3">
        <View className="absolute left-3 top-3 z-10">
          <Search size={18} color={wuerth.mute} />
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Attendees, students, colleagues…"
          placeholderTextColor={wuerth.mute}
          className="h-11 w-full rounded-xl bg-zinc-100 pl-10 pr-3 text-sm text-wuerth-ink"
        />
      </View>

      {results.length === 0 ? (
        <EmptyState icon={Search} title="No matches" description="Try another name." />
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
                  <Text numberOfLines={1} className="flex-shrink text-sm font-semibold text-wuerth-ink">
                    {p.displayName}
                  </Text>
                  {p.role === "employee" && <Chip tone="neutral">Team</Chip>}
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
