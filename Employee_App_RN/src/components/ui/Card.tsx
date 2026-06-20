import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";
import { cardShadow } from "@/theme";

export function Card({ className, style, children, ...rest }: ViewProps & { className?: string }) {
  return (
    <View
      className={cn("rounded-2xl border border-wuerth-line bg-wuerth-surface", className)}
      style={[cardShadow, style]}
      {...rest}
    >
      {children}
    </View>
  );
}

export function CardSection({ className, children, ...rest }: ViewProps & { className?: string }) {
  return (
    <View className={cn("p-4", className)} {...rest}>
      {children}
    </View>
  );
}
