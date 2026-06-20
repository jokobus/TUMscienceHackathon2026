import { cn } from "@/lib/utils";

/** Small count badge (unread chats / notifications). */
export function Badge({
  count,
  className,
  dot = false,
}: {
  count?: number;
  className?: string;
  dot?: boolean;
}) {
  if (dot) {
    return (
      <span
        className={cn(
          "inline-block h-2.5 w-2.5 rounded-full bg-wuerth-red ring-2 ring-white",
          className
        )}
      />
    );
  }
  if (!count || count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-grid h-5 min-w-5 place-items-center rounded-full bg-wuerth-red px-1.5 text-[11px] font-bold leading-none text-white ring-2 ring-white",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
