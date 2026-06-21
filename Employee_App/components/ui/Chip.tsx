import { cn } from "@/lib/utils";

type Tone = "neutral" | "red" | "green" | "amber" | "blue" | "slate";

const tones: Record<Tone, string> = {
  neutral: "bg-zinc-100 text-wuerth-slate",
  red: "bg-wuerth-red-soft text-wuerth-red",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-blue-50 text-blue-700",
  slate: "bg-zinc-800 text-white",
};

export function Chip({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
