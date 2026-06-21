import Link from "next/link";
import { Hash, Radio } from "lucide-react";
import type { ChatSummary } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { cn, timeAgo } from "@/lib/utils";

export function ChatListItem({ chat }: { chat: ChatSummary }) {
  const isChannel = chat.type === "event_channel";
  return (
    <Link
      href={`/messages/${chat.id}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-50"
    >
      {isChannel ? (
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-full",
            chat.liveHighlight ? "bg-wuerth-red text-white" : "bg-zinc-200 text-wuerth-slate"
          )}
        >
          {chat.liveHighlight ? <Radio size={18} /> : <Hash size={18} />}
        </span>
      ) : (
        <Avatar name={chat.title} size="md" tone={chat.type === "internal" ? "ink" : "red"} />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-wuerth-ink">{chat.title}</span>
          {chat.liveHighlight && <Chip tone="red">Live</Chip>}
          {chat.type === "internal" && <Chip tone="neutral">Team</Chip>}
        </div>
        <p className="mt-0.5 truncate text-[13px] text-wuerth-mute">{chat.lastMessage}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        {chat.lastMessageAt && (
          <span className="text-[11px] text-wuerth-mute">{timeAgo(chat.lastMessageAt)}</span>
        )}
        <Badge count={chat.unread} />
      </div>
    </Link>
  );
}
