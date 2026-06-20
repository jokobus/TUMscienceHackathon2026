import { cn } from "@/lib/utils";

/** Small inline label·value pill used in headers and rows. */
export function StatPill({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline gap-1 rounded-lg bg-zinc-100 px-2 py-1 text-xs",
        className
      )}
    >
      <span className="font-bold text-wuerth-ink">{value}</span>
      <span className="text-wuerth-mute">{label}</span>
    </div>
  );
}
