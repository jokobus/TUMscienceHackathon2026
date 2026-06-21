"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserPlus } from "lucide-react";
import type { PersonSearchResult } from "@/lib/types";
import * as api from "@/lib/api";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";

export function PeopleSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonSearchResult[]>([]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    api.searchPeople(query).then((r) => active && setResults(r));
    return () => {
      active = false;
    };
  }, [query, open]);

  async function openChat(p: PersonSearchResult) {
    if (p.chatId) {
      router.push(`/messages/${p.chatId}`);
    } else if (p.role === "student") {
      const { chatId } = await api.scanStudent(p.userId);
      router.push(`/messages/${chatId}`);
    }
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Search people">
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-wuerth-mute" size={18} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Attendees, students, colleagues…"
          className="h-11 w-full rounded-xl bg-zinc-100 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-wuerth-red"
        />
      </div>

      {results.length === 0 ? (
        <EmptyState icon={Search} title="No matches" description="Try another name." />
      ) : (
        <div className="space-y-1">
          {results.map((p) => (
            <button
              key={p.userId}
              onClick={() => openChat(p)}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-zinc-50"
            >
              <Avatar name={p.displayName} size="md" tone={p.role === "employee" ? "ink" : "red"} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-wuerth-ink">{p.displayName}</span>
                  {p.role === "employee" && <Chip tone="neutral">Team</Chip>}
                </div>
                <div className="truncate text-xs text-wuerth-mute">{p.context}</div>
              </div>
              {!p.chatId && <UserPlus size={16} className="text-wuerth-red" />}
            </button>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}
