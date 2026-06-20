import { Pressable, ScrollView, Text, View } from "react-native";
import { cn } from "@/lib/utils";

interface Segment<T extends string> {
  value: T;
  label: string;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  scroll = false,
  className,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  scroll?: boolean;
  className?: string;
}) {
  const items = segments.map((seg) => {
    const active = seg.value === value;
    return (
      <Pressable
        key={seg.value}
        onPress={() => onChange(seg.value)}
        className={cn(
          "rounded-lg px-3 py-1.5",
          scroll ? "" : "flex-1",
          active ? "bg-white" : ""
        )}
      >
        <Text
          className={cn(
            "text-center text-sm font-semibold",
            active ? "text-wuerth-ink" : "text-wuerth-slate"
          )}
        >
          {seg.label}
        </Text>
      </Pressable>
    );
  });

  if (scroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-1"
        className={cn("rounded-xl bg-zinc-100 p-1", className)}
      >
        {items}
      </ScrollView>
    );
  }

  return (
    <View className={cn("flex-row gap-1 rounded-xl bg-zinc-100 p-1", className)}>{items}</View>
  );
}
