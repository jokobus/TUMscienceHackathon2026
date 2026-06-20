import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Platform, RefreshControl, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search } from "lucide-react-native";
import type { WeaveEvent } from "@/lib/types";
import * as api from "@/lib/api";
import { EventCard } from "@/components/student/EventCard";
import { FeedFilters } from "@/components/student/FeedFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<WeaveEvent[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  // AI search results (GET /api/events/search); null = no active search.
  const [searchResults, setSearchResults] = useState<WeaveEvent[] | null>(null);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    try {
      const items = await api.getEvents();
      setEvents(items);
    } catch {
      setEvents([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (events === null) load();
    }, [events, load])
  );

  // Debounced AI-assisted search via the backend (semantic, future + past).
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(() => {
      api
        .searchEvents(q)
        .then((r) => {
          if (!cancelled) setSearchResults(r);
        })
        .catch(() => {
          if (!cancelled) setSearchResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const isSearch = searchQuery.trim().length > 0;

  const sortedEvents = useMemo(() => {
    let list = [...(isSearch ? searchResults ?? [] : events ?? [])];
    if (activeFilter) {
      const now = Date.now();
      switch (activeFilter) {
        case "Upcoming":
          list = list.filter((e) => new Date(e.startAt).getTime() >= now);
          break;
        case "Past":
          list = list.filter((e) => new Date(e.endAt).getTime() < now);
          break;
        case "Hackathons":
          list = list.filter((e) => e.type === "hackathon");
          break;
        case "Seminars":
          list = list.filter((e) => e.type === "seminar" || e.type === "webinar");
          break;
        case "Workshops":
          list = list.filter((e) => e.type === "technical_talk");
          break;
        case "Career Fairs":
          list = list.filter((e) => e.type === "career_fair_booth" || e.type === "trade_fair");
          break;
        case "Munich":
          list = list.filter(
            (e) => e.city === "München" || (e.location ?? "").toLowerCase().includes("münchen")
          );
          break;
        case "Germany":
          list = list.filter(
            (e) => (e.location ?? "").includes(", DE") || (e.location ?? "").includes("Germany")
          );
          break;
      }
    }
    return list.sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }, [events, searchResults, isSearch, activeFilter]);

  const header = (
    <View>
      <Text className="mb-6 text-3xl font-bold text-we-ink">Discover Events</Text>

      {/* AI-assisted Search Bar (GET /api/events/search) */}
      <View className="relative mb-4">
        <View className="absolute left-4 top-0 z-10 h-12 justify-center">
          <Search size={20} color="#9ca3af" />
        </View>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search events, locations, or topics..."
          placeholderTextColor="#9ca3af"
          className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm text-we-ink"
        />
      </View>

      <FeedFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {searching ? (
        <Text className="mb-1 mt-1 text-sm text-gray-400">Searching…</Text>
      ) : sortedEvents.length > 0 ? (
        <Text className="mb-1 mt-1 text-sm text-gray-400">
          {sortedEvents.length} event{sortedEvents.length !== 1 ? "s" : ""} found
        </Text>
      ) : null}
    </View>
  );

  const loading = events === null || (isSearch && searchResults === null);

  if (loading) {
    return (
      <View className="flex-1 bg-white px-4" style={{ paddingTop: insets.top + 16 }}>
        {header}
        <View className="mt-4">
          <ListSkeleton rows={4} />
        </View>
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-white"
      data={sortedEvents}
      keyExtractor={(e) => e.id}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: insets.top + 16,
        paddingBottom: 24,
      }}
      ListHeaderComponent={header}
      renderItem={({ item, index }) => (
        <View className="mb-5">
          <EventCard event={item} featured={index === 0 && !isSearch && !activeFilter} />
        </View>
      )}
      ListEmptyComponent={
        <EmptyState
          icon={Search}
          title="No Events Found"
          description="Try adjusting your search or filters to find what you're looking for."
          action={activeFilter ? { label: "Clear Filter", onClick: () => setActiveFilter(null) } : undefined}
        />
      }
      refreshControl={
        Platform.OS === "web" ? undefined : (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#cc0000" />
        )
      }
      showsVerticalScrollIndicator={false}
    />
  );
}
