import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { CalendarDays, MapPin, Users } from "lucide-react-native";
import type { EventSummary } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EventStatusBadge } from "@/components/employee/EventStatusBadge";
import { EventImageCarousel } from "@/components/employee/EventImageCarousel";
import { eventTypeLabel, formatDateRange } from "@/lib/utils";
import { wuerth } from "@/theme";

export function EventCard({ event }: { event: EventSummary }) {
  const images = event.images ?? [];
  return (
    <Pressable onPress={() => router.push(`/events/${event.id}`)}>
      <Card className="overflow-hidden">
        {images.length > 0 && (
          <View>
            <EventImageCarousel images={images} />
            <View className="absolute right-3 top-3">
              <EventStatusBadge status={event.status} />
            </View>
          </View>
        )}

        <View className="p-4">
          <View className="flex-row items-start justify-between gap-3">
            <Chip tone="red">{eventTypeLabel(event.type)}</Chip>
            {images.length === 0 && <EventStatusBadge status={event.status} />}
          </View>

          <Text className="mt-2.5 text-[17px] font-bold leading-snug text-wuerth-ink">
            {event.title}
          </Text>

          <View className="mt-2.5 gap-1.5">
            <View className="flex-row items-center gap-1.5">
              <CalendarDays size={15} color={wuerth.mute} />
              <Text className="text-[13px] text-wuerth-slate">
                {formatDateRange(event.startAt, event.endAt)}
              </Text>
            </View>
            {event.location ? (
              <View className="flex-row items-center gap-1.5">
                <MapPin size={15} color={wuerth.mute} />
                <Text numberOfLines={1} className="flex-1 text-[13px] text-wuerth-slate">
                  {event.location}
                </Text>
              </View>
            ) : null}
          </View>

          {event.attendeeCount > 0 && (
            <View className="mt-3.5 flex-row items-center gap-1.5 border-t border-wuerth-line pt-3">
              <Users size={15} color={wuerth.mute} />
              <Text className="text-[13px] font-medium text-wuerth-slate">
                {event.attendeeCount} {event.status === "past" ? "attended" : "checked in"}
              </Text>
            </View>
          )}
        </View>
      </Card>
    </Pressable>
  );
}
