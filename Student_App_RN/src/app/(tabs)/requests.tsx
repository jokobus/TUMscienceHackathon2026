import { useCallback, useState } from "react";
import { Platform, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowBigDown,
  ArrowBigUp,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react-native";
import type { Suggestion } from "@/lib/types";
import * as api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { cn, localeDate } from "@/lib/utils";

export default function RequestsScreen() {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const { isStudent, user } = useAuth();

  const [sort, setSort] = useState<"popular" | "recent">("popular");
  const [items, setItems] = useState<Suggestion[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(
    async (s: "popular" | "recent" = sort) => {
      try {
        const data = await api.getSuggestions(s === "popular" ? "popularity" : "recency");
        setItems(data);
      } catch {
        setItems([]);
      }
    },
    [sort]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  function requireStudent(): boolean {
    if (!isStudent) {
      toast("Sign in to continue.", "info");
      router.push("/login");
      return false;
    }
    return true;
  }

  async function onVote(s: Suggestion, value: 1 | -1) {
    if (!requireStudent()) return;
    try {
      const updated = await api.voteSuggestion(s.id, value);
      setItems((prev) => (prev ? prev.map((x) => (x.id === s.id ? updated : x)) : prev));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Vote failed.", "error");
    }
  }

  function openCreate() {
    if (!requireStudent()) return;
    setEditId(null);
    setTitle("");
    setDescription("");
    setFormOpen(true);
  }

  function openEdit(s: Suggestion) {
    setEditId(s.id);
    setTitle(s.title);
    setDescription(s.description);
    setFormOpen(true);
  }

  async function onSubmitForm() {
    if (!title.trim() || !description.trim()) {
      toast("Add a title and description.", "info");
      return;
    }
    try {
      if (editId) {
        await api.editSuggestion(editId, { title, description });
        toast("Suggestion updated");
      } else {
        await api.createSuggestion(title, description);
        toast("Request added!");
      }
      setFormOpen(false);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save.", "error");
    }
  }

  async function onDelete(s: Suggestion) {
    try {
      await api.deleteSuggestion(s.id);
      toast("Suggestion deleted");
      setItems((prev) => (prev ? prev.filter((x) => x.id !== s.id) : prev));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not delete.", "error");
    }
  }

  const meId = user?.id ?? api.currentUserId();

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <View className="mb-6 flex-row items-center justify-between px-4">
        <Text className="text-3xl font-bold text-we-ink">Event Requests</Text>
        <Pressable
          onPress={openCreate}
          className="h-10 w-10 items-center justify-center rounded-full bg-we-red"
        >
          <Plus size={20} color="#fff" />
        </Pressable>
      </View>

      <View className="mb-6 px-4">
        <SegmentedControl
          segments={[
            { value: "popular", label: "Most Popular" },
            { value: "recent", label: "Recent" },
          ]}
          value={sort}
          onChange={(v) => {
            setSort(v);
            load(v);
          }}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={
          Platform.OS === "web" ? undefined : (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#cc0000" />
          )
        }
        showsVerticalScrollIndicator={false}
      >
        {items === null ? (
          <ListSkeleton rows={4} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No requests yet"
            description="Be the first to suggest an event idea to Würth Elektronik."
            action={{ label: "Suggest Event", onClick: openCreate }}
          />
        ) : (
          <View className="gap-4">
            {items.map((s) => {
              const mine = !!meId && s.proposerUserId === meId;
              const up = s.myVote === 1;
              const down = s.myVote === -1;
              return (
                <View
                  key={s.id}
                  className={cn(
                    "flex-row gap-4 rounded-2xl border bg-white p-5",
                    mine ? "border-we-red" : "border-gray-200"
                  )}
                >
                  {/* Vote column */}
                  <View className="items-center gap-1">
                    <Pressable
                      onPress={() => onVote(s, 1)}
                      className={cn("rounded-lg p-1.5", up && "bg-red-50")}
                    >
                      <ArrowBigUp size={24} color={up ? "#cc0000" : "#9ca3af"} />
                    </Pressable>
                    <Text className={cn("text-sm font-bold", up ? "text-we-red" : "text-gray-700")}>
                      {s.upvotes - s.downvotes}
                    </Text>
                    <Pressable
                      onPress={() => onVote(s, -1)}
                      className={cn("rounded-lg p-1.5", down && "bg-indigo-50")}
                    >
                      <ArrowBigDown size={24} color={down ? "#4f46e5" : "#9ca3af"} />
                    </Pressable>
                  </View>

                  {/* Content */}
                  <View className="flex-1">
                    {mine && (
                      <View className="mb-2 self-start rounded-md bg-we-red px-2 py-0.5">
                        <Text className="text-[10px] font-bold text-white">Your Suggestion</Text>
                      </View>
                    )}
                    <Text className="mb-2 text-lg font-bold leading-tight text-we-ink">{s.title}</Text>
                    <Text className="mb-3 text-sm text-gray-600">{s.description}</Text>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs text-gray-400">Posted {localeDate(s.createdAt)}</Text>
                      {mine && (
                        <View className="flex-row gap-2">
                          <Pressable onPress={() => openEdit(s)} className="rounded-lg p-1.5">
                            <Pencil size={16} color="#9ca3af" />
                          </Pressable>
                          <Pressable onPress={() => onDelete(s)} className="rounded-lg p-1.5">
                            <Trash2 size={16} color="#9ca3af" />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Create / edit sheet */}
      <BottomSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editId ? "Edit Suggestion" : "Suggest an Event"}
      >
        <View className="gap-4 pt-1">
          <View>
            <Text className="mb-1.5 text-sm font-semibold text-we-ink">Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Event idea title"
              placeholderTextColor="#9ca3af"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-we-ink"
            />
          </View>
          <View>
            <Text className="mb-1.5 text-sm font-semibold text-we-ink">Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="A short description"
              placeholderTextColor="#9ca3af"
              multiline
              className="min-h-[80px] rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-we-ink"
            />
          </View>
          <Button onPress={onSubmitForm} block size="lg">
            {editId ? "Save Changes" : "Post Request"}
          </Button>
        </View>
      </BottomSheet>
    </View>
  );
}
