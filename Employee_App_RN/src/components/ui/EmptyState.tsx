import { Text, View } from "react-native";
import { type LucideIcon } from "lucide-react-native";
import { cardShadow, wuerth } from "@/theme";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <View className="items-center justify-center px-8 py-14">
      <View
        className="mb-3 h-14 w-14 items-center justify-center rounded-2xl border border-wuerth-line bg-white"
        style={cardShadow}
      >
        <Icon size={24} color={wuerth.mute} />
      </View>
      <Text className="text-sm font-bold text-wuerth-ink">{title}</Text>
      {description && (
        <Text className="mt-1 max-w-[16rem] text-center text-sm text-wuerth-mute">
          {description}
        </Text>
      )}
      {action && <View className="mt-4">{action}</View>}
    </View>
  );
}
