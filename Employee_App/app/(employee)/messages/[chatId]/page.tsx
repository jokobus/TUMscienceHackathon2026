"use client";

import { useEffect, useRef, useState } from "react";
import { Megaphone, SendHorizontal } from "lucide-react";
import type { ChatSummary, Message, WsEvent } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import * as api from "@/lib/api";
import { subscribe } from "@/lib/ws";
import { TopAppBar } from "@/components/employee/TopAppBar";
import { ProfileSheet, type ProfilePerson } from "@/components/employee/ProfileSheet";
import { Chip } from "@/components/ui/Chip";
import { cn, formatTime } from "@/lib/utils";

export default function ChatThreadPage({ params }: { params: { chatId: string } }) {
  const { chatId } = params;
  const { employee } = useAuth();
  const [chat, setChat] = useState<ChatSummary | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [broadcastMode, setBroadcastMode] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getChat(chatId).then(setChat);
    api.getMessages(chatId).then(setMessages);
  }, [chatId]);

  // Live delivery (MASTER §7): append messages for this chat.
  useEffect(() => {
    return subscribe((e: WsEvent) => {
      if (e.action !== "new_message" && e.action !== "broadcast") return;
      if (e.payload.chatId !== chatId) return;
      const incoming: Message = {
        id: String(e.payload.messageId),
        chatId,
        senderUserId: String(e.payload.from),
        senderName: String(e.payload.senderName ?? "Someone"),
        body: String(e.payload.message),
        sentAt: String(e.payload.sentAt),
        isBroadcast: Boolean(e.payload.isBroadcast) || e.action === "broadcast",
      };
      setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
    });
  }, [chatId]);

  // Keep the newest message in view (instant on open, smooth for live updates).
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function send() {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    if (broadcastMode && chat?.eventId) {
      await api.broadcast(chat.eventId, body);
    } else {
      await api.sendMessage(chatId, body);
    }
  }

  const isChannel = chat?.type === "event_channel";
  const myId = employee?.id;

  // A DM / team chat counterpart is an "account" you can open a profile for.
  const person: ProfilePerson | null =
    chat && !isChannel
      ? (() => {
          const parts = (chat.subtitle ?? "").split(" · ").filter(Boolean);
          const internal = chat.type === "internal";
          const labels = internal ? ["Organisation", "Role"] : ["University", "Programme"];
          return {
            name: chat.title,
            role: internal ? "Würth colleague" : "Student",
            avatarTone: internal ? "ink" : "red",
            details: parts.map((value, i) => ({ label: labels[i] ?? "Detail", value })),
          };
        })()
      : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TopAppBar
        back
        title={
          person ? (
            <button
              onClick={() => setProfileOpen(true)}
              className="max-w-full truncate underline-offset-2 hover:underline"
            >
              {chat?.title ?? "Chat"}
            </button>
          ) : (
            chat?.title ?? "Chat"
          )
        }
        subtitle={chat?.subtitle}
        right={
          isChannel ? (
            <button
              onClick={() => setBroadcastMode((b) => !b)}
              className={cn(
                "mr-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
                broadcastMode ? "bg-white text-wuerth-red" : "bg-white/15 text-white"
              )}
            >
              <Megaphone size={14} /> Broadcast
            </button>
          ) : undefined
        }
      />

      {/* Messages — scrollable, newest pinned to the bottom like WhatsApp.
          mt-auto keeps short threads at the bottom; long ones scroll to history. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-wuerth-bg px-3 py-4">
        <div className="mt-auto space-y-2">
        {messages.map((m) => {
          const mine = m.senderUserId === myId;
          if (m.isBroadcast) {
            return (
              <div key={m.id} className="mx-auto max-w-[90%] rounded-xl bg-wuerth-red-soft px-3 py-2 text-center">
                <div className="mb-0.5 flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wide text-wuerth-red">
                  <Megaphone size={12} /> Broadcast
                </div>
                <p className="text-sm text-wuerth-ink">{m.body}</p>
                <p className="mt-1 text-[11px] text-wuerth-mute">{formatTime(m.sentAt)}</p>
              </div>
            );
          }
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[78%] rounded-2xl px-3 py-2", mine ? "bg-wuerth-red text-white" : "bg-white text-wuerth-ink ring-1 ring-wuerth-line")}>
                {isChannel && !mine && (
                  <div className="mb-0.5 text-[11px] font-bold text-wuerth-red">{m.senderName}</div>
                )}
                <p className="text-sm leading-snug">{m.body}</p>
                <p className={cn("mt-0.5 text-right text-[10px]", mine ? "text-white/70" : "text-wuerth-mute")}>
                  {formatTime(m.sentAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-wuerth-line bg-white px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {broadcastMode && (
          <div className="mb-1.5 flex items-center gap-1.5 px-1 text-xs font-semibold text-wuerth-red">
            <Megaphone size={13} /> Broadcasting to all attendees
            <Chip tone="red" className="ml-auto">channel</Chip>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder={broadcastMode ? "Announcement to all attendees…" : "Message…"}
            className="max-h-28 flex-1 resize-none rounded-2xl bg-zinc-100 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-wuerth-red"
          />
          <button
            onClick={send}
            disabled={!draft.trim()}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-wuerth-red text-white disabled:opacity-40"
            aria-label="Send"
          >
            <SendHorizontal size={18} />
          </button>
        </div>
      </div>

      <ProfileSheet person={profileOpen ? person : null} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
