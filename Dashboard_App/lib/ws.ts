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
import { USE_MOCKS, WS_URL, getToken, getCurrentUserId, ensureAuth } from "@/lib/http";
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

/**
 * Turn an incoming `new_message` / `broadcast` frame into a ChatMessage for the UI.
 *
 * The server fans the frame out to ALL participants — including the sender — so we
 * derive `mine` from `senderUserId` (the backend's authoritative sender id) rather
 * than a non-existent `payload.mine`, and carry `clientMsgId` through so the caller
 * can reconcile its own optimistic message instead of duplicating it.
 */
export function messageFromEvent(event: WsEvent): { chatId: string; message: ChatMessage } | null {
  if (event.action !== "new_message" && event.action !== "broadcast") return null;
  const p = event.payload;
  const senderId = p.senderUserId ?? p.from;
  const me = getCurrentUserId();
  const clientMsgId = p.clientMsgId != null ? String(p.clientMsgId) : null;
  return {
    chatId: String(p.chatId ?? ""),
    message: {
      id: String(p.messageId ?? `m-${Math.round(Math.random() * 1e9)}`),
      mine: senderId != null && me != null && String(senderId) === String(me),
      sender: { display_name: String(p.senderName ?? "Unknown") },
      body: String(p.message ?? ""),
      sent_at: String(p.sentAt ?? new Date().toISOString()),
      client_msg_id: clientMsgId,
    },
  };
}

// ── Backend mode ──────────────────────────────────────────────────────────────
let socket: WebSocket | null = null;
let connecting = false;
let wantConnected = false;
// Frames sent before the socket is OPEN are queued here and flushed on open, so a
// send during the CONNECTING window is never lost (and never throws InvalidStateError).
const pendingFrames: string[] = [];

function flushPending(sock: WebSocket) {
  while (pendingFrames.length && sock.readyState === WebSocket.OPEN) {
    sock.send(pendingFrames.shift()!);
  }
}

/**
 * Open the shared chat socket. Awaits ensureAuth() first so the token is always
 * available for both the `?token=` query param and the authenticate frame — on a
 * cold load the demo token is populated asynchronously, so reading it synchronously
 * (the old behaviour) connected an UNauthenticated socket that never received frames.
 */
export async function connectChatSocket(): Promise<void> {
  if (USE_MOCKS || typeof window === "undefined") return;
  wantConnected = true;
  if (socket || connecting) return;
  connecting = true;
  try {
    await ensureAuth();
  } catch {
    /* fall through — we still try to read whatever token exists */
  } finally {
    connecting = false;
  }
  if (socket) return; // a concurrent caller already connected
  const token = getToken();
  const url = WS_URL + (token ? `?token=${encodeURIComponent(token)}` : "");
  const sock = new WebSocket(url);
  socket = sock;
  sock.onopen = () => {
    const t = getToken();
    if (t) sock.send(JSON.stringify({ action: "authenticate", payload: { token: t } }));
    flushPending(sock);
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
    // Auto-reconnect so live delivery recovers if the socket drops mid-session.
    if (wantConnected) setTimeout(() => void connectChatSocket(), 1500);
  };
}

export function disconnectChatSocket(): void {
  wantConnected = false;
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

function genClientMsgId(): string {
  return `cmid-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

/**
 * Send a message. Returns the generated `clientMsgId` so the caller can render an
 * optimistic message keyed by it; when the server echoes the frame back (to ALL
 * participants, including the sender) the same `clientMsgId` lets the caller swap
 * the optimistic message for the persisted one instead of appending a duplicate.
 */
export function sendChatMessage(chatId: string, body: string): string {
  const clientMsgId = genClientMsgId();
  if (!USE_MOCKS) {
    const frame = JSON.stringify({
      action: "send_message",
      payload: { chatId, message: body, clientMsgId },
    });
    // Only send on an OPEN socket; otherwise queue + (re)connect so the frame flushes
    // on open. A raw send() while CONNECTING throws InvalidStateError synchronously.
    if (socket && socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(frame);
      } catch {
        pendingFrames.push(frame);
      }
    } else {
      pendingFrames.push(frame);
      void connectChatSocket();
    }
    return clientMsgId;
  }
  // Mock mode only (USE_MOCKS=true): simulate the other party replying so the thread
  // looks live with no backend. Never runs against the live backend.
  const reply = MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)];
  emitLocal(
    {
      action: "new_message",
      payload: {
        chatId,
        senderUserId: "mock-other",
        senderName: "Student",
        message: reply,
        messageId: `m-${Date.now()}`,
        clientMsgId: null,
        sentAt: new Date().toISOString(),
      },
    },
    1100
  );
  return clientMsgId;
}
