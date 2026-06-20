import { Pressable, ScrollView, Text } from "react-native";
import { cn } from "@/lib/utils";

const FILTER_CHIPS = [
  "My Events",
  "Upcoming",
  "Past",
  "Hackathons",
  "Seminars",
  "Workshops",
  "Career Fairs",
  "Munich",
  "Germany",
];

export function FeedFilters({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="flex-row gap-2 pb-2"
    >
      {FILTER_CHIPS.map((tag) => {
        const active = activeFilter === tag;
        return (
          <Pressable
            key={tag}
            onPress={() => onFilterChange(active ? null : tag)}
            className={cn(
              "rounded-full border px-4 py-2",
              active ? "border-we-red bg-we-red" : "border-gray-200 bg-white"
            )}
          >
            <Text className={cn("text-sm font-medium", active ? "text-white" : "text-gray-600")}>
              {tag}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
