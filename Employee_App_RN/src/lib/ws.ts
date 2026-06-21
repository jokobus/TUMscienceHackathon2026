/**
 * ws.ts — chat transport (WEAVE_MASTER §7).
 *
 * Dual-mode: in backend mode (USE_BACKEND) connectChatSocket() opens a real
 * WebSocket to `${BASE}/ws/chat` and forwards `{action,payload}` frames to
 * subscribers; sending is done via REST (api.sendMessage), the server fans out.
 * In mock mode it's an in-memory pub/sub so chat & broadcast feel live offline.
 */
import type { Message, WsEvent } from "@/lib/types";
import { API_BASE_URL, USE_BACKEND, getToken } from "@/lib/http";

/** Full chat WebSocket URL (without the token query), env-configurable.
 * EXPO_PUBLIC_WS_URL overrides; otherwise derived from EXPO_PUBLIC_API_BASE_URL. */
export const WS_URL =
  process.env.EXPO_PUBLIC_WS_URL ?? `${API_BASE_URL.replace(/^http/, "ws")}/ws/chat`;

type Listener = (event: WsEvent) => void;

const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function deliver(event: WsEvent) {
  listeners.forEach((l) => l(event));
}

// ── Backend mode: a single shared socket ─────────────────────────────────────
let socket: WebSocket | null = null;

export async function connectChatSocket(): Promise<void> {
  if (!USE_BACKEND || socket) return;
  const token = await getToken();
  const wsUrl = WS_URL + (token ? `?token=${encodeURIComponent(token)}` : "");
  const sock = new WebSocket(wsUrl);
  socket = sock;
  sock.onopen = () => {
    if (token) sock.send(JSON.stringify({ action: "authenticate", payload: { token } }));
  };
  sock.onmessage = (ev: { data: string }) => {
    try {
      deliver(JSON.parse(ev.data) as WsEvent);
    } catch {
      // ignore malformed frames
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

// ── Mock mode: in-memory delivery ────────────────────────────────────────────
function emitLocal(event: WsEvent) {
  // async to mimic network delivery
  setTimeout(() => deliver(event), 60);
}

/** Fan out a freshly-sent message to all open subscribers (mock only). */
export function publishMessage(message: Message) {
  if (USE_BACKEND) return; // the server delivers over the socket
  emitLocal({
    action: "new_message",
    payload: {
      chatId: message.chatId,
      from: message.senderUserId,
      senderUserId: message.senderUserId,
      message: message.body,
      sentAt: message.sentAt,
      messageId: message.id,
      clientMsgId: message.clientMsgId ?? null,
      senderName: message.senderName,
      isBroadcast: message.isBroadcast ?? false,
    },
  });
}

/** Organiser broadcast to an event channel (MASTER §6.12) (mock only). */
export function publishBroadcast(eventId: string, chatId: string, message: Message) {
  if (USE_BACKEND) return;
  emitLocal({
    action: "broadcast",
    payload: {
      eventId,
      chatId,
      message: message.body,
      from: message.senderUserId,
      senderUserId: message.senderUserId,
      messageId: message.id,
      clientMsgId: message.clientMsgId ?? null,
      sentAt: message.sentAt,
      senderName: message.senderName,
    },
  });
}
