import { Text, View } from "react-native";
import { cn } from "@/lib/utils";

/**
 * Würth wordmark rendered as styled type so the app stays asset-free while
 * reading unmistakably as Würth.
 */
export function WuerthLogo({
  variant = "red",
  className,
}: {
  variant?: "red" | "white";
  className?: string;
}) {
  return (
    <View className="flex-row items-baseline">
      <Text
        className={cn(
          "font-extrabold tracking-tight",
          variant === "red" ? "text-wuerth-red" : "text-white",
          className
        )}
      >
        WÜRTH
      </Text>
      <Text
        className={cn(
          "ml-1 text-[10px] font-bold uppercase tracking-widest",
          variant === "red" ? "text-wuerth-mute" : "text-white/70"
        )}
      >
        Elektronik
      </Text>
    </View>
  );
}

/** The WEave product lockup used on the login splash. */
export function WeaveLockup() {
  return (
    <View className="items-center">
      <WuerthLogo variant="white" className="text-2xl" />
      <View className="mt-3 flex-row items-center gap-2">
        <View className="h-px w-6 bg-white/40" />
        <Text className="text-sm font-semibold uppercase tracking-[3px] text-white/90">WEave</Text>
        <View className="h-px w-6 bg-white/40" />
      </View>
    </View>
  );
}
