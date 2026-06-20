import { Pressable, Text, View } from "react-native";
import { type LucideIcon } from "lucide-react-native";

/**
 * Student EmptyState — mirrors Student_App/components/ui/EmptyState.tsx:
 * a dashed bordered card with a circular icon, title, description and an
 * optional action button (label + onClick).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <View className="min-h-[300px] items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white px-4 py-16">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-gray-50">
        <Icon size={32} color="#9ca3af" />
      </View>
      <Text className="mb-2 text-xl font-bold text-we-ink">{title}</Text>
      <Text className="mb-6 max-w-[250px] text-center leading-relaxed text-gray-500">
        {description}
      </Text>
      {action && (
        <Pressable
          onPress={action.onClick}
          className="rounded-xl bg-gray-100 px-6 py-2.5 active:bg-gray-200"
        >
          <Text className="font-bold text-we-ink">{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}
