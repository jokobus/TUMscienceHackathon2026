import { View } from "react-native";
import { cn } from "@/lib/utils";
import { cardShadow } from "@/theme";

export function Skeleton({ className }: { className?: string }) {
  return <View className={cn("rounded-lg bg-zinc-200", className)} />;
}

export function CardSkeleton() {
  return (
    <View className="rounded-2xl border border-wuerth-line bg-white p-4" style={cardShadow}>
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="mt-3 h-3 w-1/2" />
      <Skeleton className="mt-2 h-3 w-1/3" />
    </View>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View className="gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </View>
  );
}
