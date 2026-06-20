import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/lib/utils";
import { GlassFill, liquidGlass } from "@/components/ui/Glass";

export type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Accepted for API compatibility; the Modal sheet sizes to content. */
  snapPoints?: string[];
  scrollable?: boolean;
};

/**
 * Controlled bottom half-sheet built on React Native's Modal — works identically
 * on iOS, Android and web (the previous @gorhom/Reanimated sheet failed to present
 * on web and was unreliable on device). Slides up, dimmed backdrop, tap-to-close.
 */
export function BottomSheet({ open, onClose, title, children, scrollable = false }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1">
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />
        <View
          className={cn(
            "absolute inset-x-0 bottom-0 w-full self-center overflow-hidden rounded-t-3xl",
            liquidGlass ? "" : "bg-white"
          )}
          style={{ maxWidth: 520, maxHeight: height * 0.9 }}
        >
          <GlassFill glassStyle="regular" />
          <View className="items-center pt-2.5">
            <View className="h-1.5 w-10 rounded-full bg-zinc-200" />
          </View>
          <View className="px-5" style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}>
            {title ? (
              <Text className="mb-2 mt-1 text-[17px] font-bold text-wuerth-ink">{title}</Text>
            ) : null}
            {scrollable ? (
              <ScrollView style={{ maxHeight: height * 0.72 }} showsVerticalScrollIndicator={false}>
                {children}
              </ScrollView>
            ) : (
              children
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
