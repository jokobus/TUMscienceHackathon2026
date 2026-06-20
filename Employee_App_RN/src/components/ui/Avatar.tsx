import { Image, Text, View } from "react-native";
import { cn, initials } from "@/lib/utils";

const sizes = {
  sm: { box: "h-8 w-8", text: "text-xs" },
  md: { box: "h-10 w-10", text: "text-sm" },
  lg: { box: "h-14 w-14", text: "text-lg" },
  xl: { box: "h-20 w-20", text: "text-2xl" },
};

export function Avatar({
  name,
  src,
  size = "md",
  tone = "red",
  className,
}: {
  name: string;
  src?: string;
  size?: keyof typeof sizes;
  tone?: "red" | "ink";
  className?: string;
}) {
  const s = sizes[size];
  if (src) {
    return (
      <Image
        source={{ uri: src }}
        resizeMode="cover"
        className={cn("rounded-full border border-wuerth-line", s.box, className)}
      />
    );
  }
  return (
    <View
      className={cn(
        "items-center justify-center rounded-full",
        tone === "red" ? "bg-wuerth-red-soft" : "bg-zinc-800",
        s.box,
        className
      )}
    >
      <Text className={cn("font-bold", s.text, tone === "red" ? "text-wuerth-red" : "text-white")}>
        {initials(name)}
      </Text>
    </View>
  );
}
