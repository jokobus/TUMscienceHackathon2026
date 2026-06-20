import { Text, View } from "react-native";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "red" | "green" | "amber" | "blue" | "slate";

const tones: Record<Tone, { bg: string; text: string }> = {
  neutral: { bg: "bg-zinc-100", text: "text-wuerth-slate" },
  red: { bg: "bg-wuerth-red-soft", text: "text-wuerth-red" },
  green: { bg: "bg-emerald-50", text: "text-emerald-700" },
  amber: { bg: "bg-amber-50", text: "text-amber-700" },
  blue: { bg: "bg-blue-50", text: "text-blue-700" },
  slate: { bg: "bg-zinc-800", text: "text-white" },
};

export function Chip({
  tone = "neutral",
  className,
  textClassName,
  children,
}: {
  tone?: Tone;
  className?: string;
  textClassName?: string;
  children: React.ReactNode;
}) {
  const t = tones[tone];
  return (
    <View
      className={cn(
        "flex-row items-center gap-1 self-start rounded-full px-2.5 py-1",
        t.bg,
        className
      )}
    >
      {typeof children === "string" ? (
        <Text className={cn("text-xs font-semibold", t.text, textClassName)}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}
