/**
 * ws.ts — mock WebSocket (MASTER §7 envelope).
 *
 * In-memory pub/sub standing in for `wss://api.weave.de/chat`. It delivers
 * new_message / broadcast events to subscribers so chat & broadcast feel live
 * in the demo. Swap `connectChatSocket` for a real WebSocket later — the
 * envelope shape is identical.
 */
import type { Message, WsEvent } from "@/lib/types";

type Listener = (event: WsEvent) => void;

const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(event: WsEvent) {
  // async to mimic network delivery
  setTimeout(() => {
    listeners.forEach((l) => l(event));
  }, 60);
}

/** Fan out a freshly-sent message to all open subscribers. */
export function publishMessage(message: Message) {
  emit({
    action: "new_message",
    payload: {
      chatId: message.chatId,
      from: message.senderUserId,
      message: message.body,
      sentAt: message.sentAt,
      messageId: message.id,
      senderName: message.senderName,
      isBroadcast: message.isBroadcast ?? false,
    },
  });
}

/** Organiser broadcast to an event channel (MASTER §6.12). */
export function publishBroadcast(eventId: string, chatId: string, message: Message) {
  emit({
    action: "broadcast",
    payload: {
      eventId,
      chatId,
      message: message.body,
      from: message.senderUserId,
      messageId: message.id,
      sentAt: message.sentAt,
      senderName: message.senderName,
    },
  });
}
