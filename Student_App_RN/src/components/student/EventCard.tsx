import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Calendar, Clock, MapPin, Users } from "lucide-react-native";
import type { WeaveEvent } from "@/lib/types";
import {
  checkedInCount,
  cn,
  eventImage,
  formatShortDate,
  formatTime,
  isSameDay,
  typeLabel,
} from "@/lib/utils";

export function EventCard({ event, featured = false }: { event: WeaveEvent; featured?: boolean }) {
  const sameDay = isSameDay(event.startAt, event.endAt);
  const now = Date.now();
  const start = new Date(event.startAt).getTime();
  const end = new Date(event.endAt).getTime();
  const isPast = end < now;
  const isLive = now >= start && now <= end;
  const statusLabel = isLive ? "Live now" : isPast ? "Past" : "Upcoming";
  const image = eventImage(event.images);

  return (
    <Pressable onPress={() => router.push(`/(tabs)/feed/${event.id}` as any)}>
      <View
        className={cn(
          "overflow-hidden rounded-2xl bg-white",
          featured ? "border-2 border-we-red" : "border border-gray-200"
        )}
      >
        {/* Banner */}
        <View className="h-36 w-full bg-red-50">
          {image ? (
            <Image source={{ uri: image }} contentFit="cover" style={{ width: "100%", height: "100%" }} />
          ) : null}
          {/* Status pill */}
          <View className="absolute right-3 top-3 flex-row items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1">
            {isLive && <View className="h-2 w-2 rounded-full bg-we-red" />}
            <Text
              className={cn(
                "text-[11px] font-bold uppercase tracking-wide",
                isLive ? "text-we-red" : "text-we-ink"
              )}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View className="p-5">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="self-start rounded-full bg-red-50 px-2 py-0.5">
              <Text className="text-xs font-bold uppercase tracking-wider text-we-red">
                {typeLabel(event.type)}
              </Text>
            </View>
            {event.applicationRequired && !isPast && (
              <Text className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                App. Required
              </Text>
            )}
          </View>

          <Text className="mb-3 text-lg font-bold leading-snug text-we-ink" numberOfLines={2}>
            {event.title}
          </Text>

          <View className="mb-5 gap-2">
            <View className="flex-row items-center">
              <Calendar size={16} color="#9ca3af" />
              <Text className="ml-2 text-sm text-gray-600" numberOfLines={1}>
                {formatShortDate(event.startAt)}
                {!sameDay ? ` - ${formatShortDate(event.endAt)}` : ""}
              </Text>
            </View>
            {sameDay && (
              <View className="flex-row items-center">
                <Clock size={16} color="#9ca3af" />
                <Text className="ml-2 text-sm text-gray-600">
                  {formatTime(event.startAt)} - {formatTime(event.endAt)}
                </Text>
              </View>
            )}
            {!!event.city && (
              <View className="flex-row items-center">
                <MapPin size={16} color="#9ca3af" />
                <Text className="ml-2 text-sm text-gray-600" numberOfLines={1}>
                  {event.location ? event.location : event.city}
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center border-t border-gray-100 pt-4">
            <Users size={16} color="#9ca3af" />
            <Text className="ml-1.5 text-sm font-medium text-gray-500">
              {checkedInCount(event.id)} checked in
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
