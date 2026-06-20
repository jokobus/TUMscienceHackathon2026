import Link from "next/link";
import { Activity, AlertTriangle, Lightbulb, RefreshCw, UserCheck } from "lucide-react";
import type { NotificationItem } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

const config: Record<
  NotificationItem["type"],
  { icon: typeof Activity; tint: string; ring: string }
> = {
  engagement: { icon: Activity, tint: "bg-emerald-50 text-emerald-700", ring: "ring-emerald-100" },
  retention: { icon: UserCheck, tint: "bg-blue-50 text-blue-700", ring: "ring-blue-100" },
  improvement: { icon: Lightbulb, tint: "bg-amber-50 text-amber-700", ring: "ring-amber-100" },
  attention: { icon: AlertTriangle, tint: "bg-wuerth-red-soft text-wuerth-red", ring: "ring-red-100" },
  follow_up: { icon: RefreshCw, tint: "bg-zinc-100 text-wuerth-slate", ring: "ring-zinc-100" },
};

export function NotificationCard({
  item,
  onOpen,
}: {
  item: NotificationItem;
  onOpen?: (item: NotificationItem) => void;
}) {
  const cfg = config[item.type];
  const Icon = cfg.icon;

  const inner = (
    <div
      className={cn(
        "flex gap-3.5 rounded-2xl bg-white p-4 shadow-card ring-1 ring-wuerth-line/70",
        !item.readAt && "ring-wuerth-red/30"
      )}
    >
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", cfg.tint)}>
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-bold leading-snug text-wuerth-ink">{item.title}</h4>
          {!item.readAt && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-wuerth-red" />}
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-wuerth-slate">{item.body}</p>
        <p className="mt-2.5 text-xs text-wuerth-mute">{timeAgo(item.createdAt)} ago</p>
      </div>
    </div>
  );

  if (item.eventId) {
    return (
      <Link href={`/events/${item.eventId}`} onClick={() => onOpen?.(item)}>
        {inner}
      </Link>
    );
  }
  return <button onClick={() => onOpen?.(item)} className="block w-full text-left">{inner}</button>;
}
