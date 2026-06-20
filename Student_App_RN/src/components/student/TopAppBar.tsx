import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { IconButton } from "@/components/ui/IconButton";

/** Red Würth header bar (1:1 with the Employee app's TopAppBar). */
export function TopAppBar({
  title,
  subtitle,
  back = false,
  left,
  right,
}: {
  title: React.ReactNode;
  subtitle?: string | null;
  back?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View className="bg-we-red" style={{ paddingTop: insets.top }}>
      <View className="h-14 flex-row items-center gap-1.5 px-2">
        {back ? (
          <IconButton accessibilityLabel="Back" onPress={() => router.back()}>
            <ChevronLeft size={24} color="#fff" />
          </IconButton>
        ) : (
          left ?? <View className="w-2" />
        )}
        <View className="min-w-0 flex-1 px-1">
          {typeof title === "string" ? (
            <Text numberOfLines={1} className="text-base font-bold text-white">
              {title}
            </Text>
          ) : (
            title
          )}
          {subtitle ? (
            <Text numberOfLines={1} className="text-xs text-white/80">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}
