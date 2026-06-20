"use client";

import { useEffect, useState } from "react";
import { MessagesSquare, Search } from "lucide-react";
import type { ChatSummary } from "@/lib/types";
import * as api from "@/lib/api";
import { TopAppBar } from "@/components/employee/TopAppBar";
import { ChatListItem } from "@/components/employee/ChatListItem";
import { PeopleSearch } from "@/components/employee/PeopleSearch";
import { IconButton } from "@/components/ui/IconButton";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";

export default function MessagesPage() {
  const [chats, setChats] = useState<ChatSummary[] | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    api.getChats().then(setChats);
  }, []);

  const channels = chats?.filter((c) => c.type === "event_channel") ?? [];
  const direct = chats?.filter((c) => c.type === "dm") ?? [];
  const internal = chats?.filter((c) => c.type === "internal") ?? [];

  return (
    <div className="h-full overflow-y-auto pb-28">
      <TopAppBar
        title="Messages"
        right={
          <IconButton aria-label="Search people" className="text-white" onClick={() => setSearchOpen(true)}>
            <Search size={22} />
          </IconButton>
        }
      />

      <div className="px-4 pt-4">
        {chats === null ? (
          <ListSkeleton rows={5} />
        ) : chats.length === 0 ? (
          <EmptyState
            icon={MessagesSquare}
            title="No conversations yet"
            description="Search for an attendee or colleague to start chatting."
          />
        ) : (
          <div className="space-y-5">
            <Section title="Event channels" chats={channels} />
            <Section title="Direct messages" chats={direct} />
            <Section title="Team" chats={internal} />
          </div>
        )}
      </div>

      <PeopleSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function Section({ title, chats }: { title: string; chats: ChatSummary[] }) {
  if (chats.length === 0) return null;
  return (
    <div>
      <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-wuerth-mute">{title}</h2>
      <Card className="divide-y divide-wuerth-line overflow-hidden">
        {chats.map((c) => (
          <ChatListItem key={c.id} chat={c} />
        ))}
      </Card>
    </div>
  );
}
