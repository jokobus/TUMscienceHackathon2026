import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { CalendarX2 } from "lucide-react-native";
import type { EventSummary } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import * as api from "@/lib/api";
import { TopAppBar } from "@/components/employee/TopAppBar";
import { NotificationsBell } from "@/components/employee/NotificationsBell";
import { EventCard } from "@/components/employee/EventCard";
import { WuerthLogo } from "@/components/ui/WuerthLogo";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";

type Filter = "upcoming" | "past";

const isUpcoming = (e: EventSummary) =>
  e.status === "upcoming" || e.status === "ongoing" || e.status === "planned" || e.status === "draft";

export default function EventsScreen() {
  const { employee } = useAuth();
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [filter, setFilter] = useState<Filter>("upcoming");

  useEffect(() => {
    if (!employee) return;
    setEvents(null);
    api.getMyEvents(employee.id).then(setEvents).catch(() => setEvents([]));
  }, [employee]);

  const filtered = useMemo(() => {
    if (!events) return [];
    const list = events.filter((e) =>
      filter === "upcoming" ? isUpcoming(e) : e.status === "past" || e.status === "cancelled"
    );
    return list.sort((a, b) => {
      if (a.status === "ongoing" && b.status !== "ongoing") return -1;
      if (b.status === "ongoing" && a.status !== "ongoing") return 1;
      const da = +new Date(a.startAt);
      const db = +new Date(b.startAt);
      return filter === "upcoming" ? da - db : db - da;
    });
  }, [events, filter]);

  return (
    <View className="flex-1 bg-wuerth-bg">
      <TopAppBar
        title={<WuerthLogo variant="white" className="text-base" />}
        right={<NotificationsBell />}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 112 }}>
        <View className="px-4 pt-4">
          <Text className="text-xl font-bold text-wuerth-ink">My events</Text>
          <Text className="mt-0.5 text-sm text-wuerth-mute">
            {employee?.displayName} · {employee?.branchOffice}
          </Text>
        </View>

        <View className="px-4 py-3">
          <SegmentedControl<Filter>
            segments={[
              { value: "upcoming", label: "Upcoming & live" },
              { value: "past", label: "Past" },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </View>

        <View className="px-4">
          {events === null ? (
            <ListSkeleton rows={4} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={CalendarX2}
              title={filter === "upcoming" ? "No upcoming events" : "No past events"}
              description={
                filter === "upcoming"
                  ? "You have no scheduled events right now."
                  : "Past events you ran will appear here."
              }
            />
          ) : (
            <View className="gap-3">
              {filtered.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
