"use client";

/**
 * ws.ts — Communication Hub chat transport (WEAVE_MASTER §7).
 *
 * Envelope (both directions): { action, payload }.
 *
 * Backend mode (USE_MOCKS=false): opens one shared WebSocket to
 * `${WS_URL}?token=…`, forwards `new_message` frames to subscribers, and sends
 * via a `send_message` frame (the server persists + fans out).
 *
 * Mock mode (default): an in-memory pub/sub. Sending a message schedules a
 * canned reply from the other party, so the thread feels live during the pitch
 * with no backend running.
 */
import { USE_MOCKS, WS_URL, getToken } from "@/lib/http";
import type { ChatMessage } from "@/lib/types";

export interface WsEvent {
  action: string;
  payload: Record<string, unknown>;
}

type Listener = (event: WsEvent) => void;
const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function deliver(event: WsEvent) {
  listeners.forEach((l) => l(event));
}

/** Turn an incoming `new_message` frame into a ChatMessage for the UI. */
export function messageFromEvent(event: WsEvent): { chatId: string; message: ChatMessage } | null {
  if (event.action !== "new_message") return null;
  const p = event.payload;
  return {
    chatId: String(p.chatId ?? ""),
    message: {
      id: String(p.messageId ?? `m-${Math.round(Math.random() * 1e9)}`),
      mine: Boolean(p.mine ?? false),
      sender: { display_name: String(p.senderName ?? "Unknown") },
      body: String(p.message ?? ""),
      sent_at: String(p.sentAt ?? new Date().toISOString()),
    },
  };
}

// ── Backend mode ──────────────────────────────────────────────────────────────
let socket: WebSocket | null = null;

export function connectChatSocket(): void {
  if (USE_MOCKS || socket || typeof window === "undefined") return;
  const token = getToken();
  const url = WS_URL + (token ? `?token=${encodeURIComponent(token)}` : "");
  const sock = new WebSocket(url);
  socket = sock;
  sock.onopen = () => {
    if (token) sock.send(JSON.stringify({ action: "authenticate", payload: { token } }));
  };
  sock.onmessage = (ev) => {
    try {
      deliver(JSON.parse(ev.data) as WsEvent);
    } catch {
      /* ignore malformed frame */
    }
  };
  sock.onclose = () => {
    if (socket === sock) socket = null;
  };
}

export function disconnectChatSocket(): void {
  socket?.close();
  socket = null;
}

// ── Mock mode: in-memory delivery + canned reply ──────────────────────────────
const MOCK_REPLIES = [
  "Perfect, thanks for the quick reply!",
  "Got it — I'll take a look and get back to you.",
  "Sounds great, looking forward to it.",
  "Thank you! That's exactly what I needed.",
];

function emitLocal(event: WsEvent, delayMs: number) {
  setTimeout(() => deliver(event), delayMs);
}

/**
 * Send a message. The caller optimistically appends the outgoing message itself;
 * this only triggers the *incoming* side (server fan-out, or a mock reply).
 */
export function sendChatMessage(chatId: string, body: string, senderName = "You"): void {
  if (!USE_MOCKS) {
    socket?.send(JSON.stringify({ action: "send_message", payload: { chatId, message: body } }));
    return;
  }
  // Mock: simulate the other party replying so the thread looks live.
  const reply = MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)];
  emitLocal(
    {
      action: "new_message",
      payload: {
        chatId,
        mine: false,
        senderName: "Student",
        message: reply,
        messageId: `m-${Date.now()}`,
        sentAt: new Date().toISOString(),
      },
    },
    1100
  );
}
