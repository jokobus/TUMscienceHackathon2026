/**
 * ws.ts — chat transport (WEAVE_MASTER §7).
 *
 * connectChatSocket() opens a WebSocket to the chat endpoint and forwards
 * `{action, payload}` frames to subscribers; messages are sent via REST
 * (api.sendMessage) and the server fans them back out over the socket.
 *
 * Base URL is env-driven for deployment: EXPO_PUBLIC_WS_URL overrides everything;
 * otherwise it's derived from EXPO_PUBLIC_API_BASE_URL (http→ws, https→wss) + /ws/chat.
 */
import type { WsEvent } from "@/lib/types";
import { API_BASE_URL, USE_BACKEND, getToken } from "@/lib/http";

/** Full chat WebSocket URL (without the token query), env-configurable. */
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
