"use client";

import { useEffect, useRef, useState } from "react";
import { getChatMessages, getInternalChats, getStudentConversations } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import {
  connectChatSocket,
  disconnectChatSocket,
  messageFromEvent,
  sendChatMessage,
  subscribe,
} from "@/lib/ws";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { relativeTime } from "@/lib/format";
import type { ChatMessage } from "@/lib/types";

export default function CommunicationPage() {
  const internal = useAsync(() => getInternalChats(), []);
  const students = useAsync(() => getStudentConversations(), []);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string>("");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Messages"
        title="Communication Hub"
        subtitle="One place for internal coordination and student conversations — sorted by priority, not a flat inbox."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        {/* Left: chat lists */}
        <div className="space-y-6">
          {/* Student conversations — sorted by engagement/priority */}
          <Card className="overflow-hidden">
            <div className="border-b border-we-line px-4 py-3">
              <h3 className="text-sm font-semibold text-we-ink">Student Conversations</h3>
              <p className="text-[11px] text-we-muted">Ranked by follow-up signals</p>
            </div>
            <div className="divide-y divide-we-line">
              {students.loading && <Skeleton className="m-4 h-24" />}
              {!students.loading && students.data?.length === 0 && (
                <EmptyState title="No student conversations" />
              )}
              {!students.loading &&
                students.data?.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveChat(c.id);
                      setActiveTitle(c.title);
                    }}
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-we-canvas ${
                      activeChat === c.id ? "bg-we-red-soft" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-we-ink">{c.title}</span>
                      <div className="flex items-center gap-1.5">
                        {c.follow_up_needed && <span className="h-2 w-2 rounded-full bg-we-red" />}
                        {c.unread > 0 && (
                          <span className="rounded-full bg-we-red px-1.5 text-[10px] font-semibold text-white">
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-we-slate">{c.last_message_preview}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {c.priority_signals.slice(0, 3).map((s) => (
                        <span key={s} className="rounded bg-we-canvas px-1.5 py-0.5 text-[10px] text-we-muted">
                          {s}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
            </div>
          </Card>

          {/* Internal Würth chats */}
          <Card className="overflow-hidden">
            <div className="border-b border-we-line px-4 py-3">
              <h3 className="text-sm font-semibold text-we-ink">Internal Würth Chats</h3>
              <p className="text-[11px] text-we-muted">Employee ↔ employee coordination</p>
            </div>
            <div className="divide-y divide-we-line">
              {internal.loading && <Skeleton className="m-4 h-20" />}
              {!internal.loading &&
                internal.data?.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveChat(c.id);
                      setActiveTitle(c.title);
                    }}
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-we-canvas ${
                      activeChat === c.id ? "bg-we-red-soft" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-we-ink">{c.title}</span>
                      {c.unread > 0 && (
                        <span className="rounded-full bg-we-red px-1.5 text-[10px] font-semibold text-white">
                          {c.unread}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-we-slate">{c.last_message_preview}</p>
                  </button>
                ))}
            </div>
          </Card>
        </div>

        {/* Right: thread */}
        <ChatThreadView chatId={activeChat} title={activeTitle} />
      </div>
    </div>
  );
}

function ChatThreadView({ chatId, title }: { chatId: string | null; title: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load the thread history whenever the active chat changes.
  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getChatMessages(chatId)
      .then((msgs) => {
        if (!cancelled) {
          setMessages(msgs);
          setLoading(false);
        }
      })
      .catch(() => {
        // A failed history fetch must clear loading (otherwise the thread hangs on a
        // permanent skeleton) and not leave an unhandled rejection. Live WS delivery
        // still works, so start from an empty thread.
        if (!cancelled) {
          setMessages([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [chatId]);

  // Live delivery: connect the socket and append incoming messages for this chat.
  useEffect(() => {
    if (!chatId) return;
    connectChatSocket();
    const unsubscribe = subscribe((event) => {
      const incoming = messageFromEvent(event);
      if (!incoming || incoming.chatId !== chatId) return;
      const msg = incoming.message;
      setMessages((prev) => {
        // 1) Reconcile our own optimistic message: swap its temp id for the server
        //    messageId and clear `pending` (in place — never appended a second time).
        if (msg.client_msg_id) {
          const idx = prev.findIndex(
            (m) => m.pending && m.client_msg_id === msg.client_msg_id
          );
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { ...msg, mine: true, pending: false };
            return next;
          }
        }
        // 2) Otherwise dedup strictly by server messageId; append only if absent.
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    return () => {
      unsubscribe();
    };
  }, [chatId]);

  // Disconnect when the Hub unmounts.
  useEffect(() => () => disconnectChatSocket(), []);

  // Keep the thread pinned to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !chatId) return;
    // Push over the socket first to obtain the clientMsgId, then optimistically
    // render my own message keyed by it. When the server echoes the frame back the
    // matching clientMsgId reconciles this entry in place (no duplicate, no flash).
    const clientMsgId = sendChatMessage(chatId, body);
    const mine: ChatMessage = {
      id: clientMsgId,
      mine: true,
      sender: { display_name: "You" },
      body,
      sent_at: new Date().toISOString(),
      client_msg_id: clientMsgId,
      pending: true,
    };
    setMessages((prev) => [...prev, mine]);
    setDraft("");
  }

  if (!chatId) {
    return (
      <Card className="flex min-h-[400px] items-center justify-center">
        <EmptyState
          title="Select a conversation"
          hint="Pick a student or internal chat to view the thread. Live delivery runs over WebSocket (Master §7)."
          icon="💬"
        />
      </Card>
    );
  }

  return (
    <Card className="flex min-h-[400px] flex-col">
      <div className="border-b border-we-line px-5 py-3">
        <h3 className="text-sm font-semibold text-we-ink">{title}</h3>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {loading && <Skeleton className="h-40 w-full" />}
        {!loading && messages.length === 0 && (
          <p className="py-8 text-center text-xs text-we-muted">No messages yet — say hello.</p>
        )}
        {!loading &&
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  m.mine ? "bg-we-red text-white" : "bg-we-canvas text-we-ink"
                }`}
              >
                {!m.mine && <div className="mb-0.5 text-[11px] font-medium opacity-70">{m.sender.display_name}</div>}
                {m.body}
                <div className={`mt-1 text-[10px] ${m.mine ? "text-white/70" : "text-we-muted"}`}>
                  {m.pending ? "Sending…" : relativeTime(m.sent_at)}
                </div>
              </div>
            </div>
          ))}
      </div>
      <div className="border-t border-we-line p-3">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 rounded-md border border-we-line bg-we-canvas px-3 py-2 text-sm outline-none focus:border-we-red focus:bg-we-surface"
          />
          <Button type="submit" disabled={!draft.trim()}>
            Send
          </Button>
        </form>
      </div>
    </Card>
  );
}
