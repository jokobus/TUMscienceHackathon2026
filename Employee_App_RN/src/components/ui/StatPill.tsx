import { Text, View } from "react-native";
import { cn } from "@/lib/utils";

/** Small inline label·value pill used in headers and rows. */
export function StatPill({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <View
      className={cn(
        "flex-row items-baseline gap-1 self-start rounded-lg bg-zinc-100 px-2 py-1",
        className
      )}
    >
      <Text className="text-xs font-bold text-wuerth-ink">{value}</Text>
      <Text className="text-xs text-wuerth-mute">{label}</Text>
    </View>
  );
}
