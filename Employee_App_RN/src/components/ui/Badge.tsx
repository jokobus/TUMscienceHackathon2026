import { Text, View } from "react-native";
import { cn } from "@/lib/utils";

/** Small count badge (unread chats / notifications). */
export function Badge({
  count,
  className,
  dot = false,
}: {
  count?: number;
  className?: string;
  dot?: boolean;
}) {
  if (dot) {
    return (
      <View
        className={cn("h-2.5 w-2.5 rounded-full border-2 border-white bg-wuerth-red", className)}
      />
    );
  }
  if (!count || count <= 0) return null;
  return (
    <View
      className={cn(
        "h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-wuerth-red px-1.5",
        className
      )}
    >
      <Text className="text-[11px] font-bold leading-none text-white">
        {count > 99 ? "99+" : count}
      </Text>
    </View>
  );
}
