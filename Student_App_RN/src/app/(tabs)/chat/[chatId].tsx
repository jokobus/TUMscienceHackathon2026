import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Megaphone, SendHorizontal } from "lucide-react-native";
import type { ChatSummary, Message, WsEvent } from "@/lib/types";
import * as api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { subscribe } from "@/lib/ws";
import { TopAppBar } from "@/components/student/TopAppBar";
import { cn, formatTime } from "@/lib/utils";
import { wuerth } from "@/theme";

export default function ChatThreadScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [chat, setChat] = useState<ChatSummary | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!chatId) return;
    api.getChat(chatId).then(setChat).catch(() => {});
    api.getMessages(chatId).then(setMessages).catch(() => {});
  }, [chatId]);

  const myId = user?.id ?? api.currentUserId();

  useEffect(() => {
    return subscribe((e: WsEvent) => {
      if (e.action !== "new_message" && e.action !== "broadcast") return;
      // String-safe compare: defends against a numeric chatId on the wire.
      if (String(e.payload.chatId) !== String(chatId)) return;
      const senderId = String(e.payload.senderUserId ?? e.payload.from);
      const clientMsgId = e.payload.clientMsgId != null ? String(e.payload.clientMsgId) : null;
      const incoming: Message = {
        id: String(e.payload.messageId ?? clientMsgId ?? Math.random()),
        chatId: String(chatId),
        senderUserId: senderId,
        senderName: String(e.payload.senderName ?? "Someone"),
        body: String(e.payload.message ?? e.payload.body ?? ""),
        sentAt: String(e.payload.sentAt ?? new Date().toISOString()),
        isBroadcast: Boolean(e.payload.isBroadcast) || e.action === "broadcast",
        clientMsgId,
      };
      setMessages((prev) => {
        // Reconcile our own optimistic row: swap it in place (keep position),
        // adopting the server messageId and clearing the pending flag.
        if (clientMsgId) {
          const idx = prev.findIndex((m) => m.pending && m.clientMsgId === clientMsgId);
          if (idx !== -1) {
            const next = prev.slice();
            next[idx] = { ...incoming, pending: false };
            return next;
          }
        }
        // Otherwise dedup by server messageId and append only if absent.
        if (prev.some((m) => m.id === incoming.id)) return prev;
        return [...prev, incoming];
      });
    });
  }, [chatId]);

  async function send() {
    const body = draft.trim();
    if (!body || !chatId) return;
    setDraft("");
    // Optimistically append so the bubble shows instantly; reconciled when the
    // server fans the message back out (matched by clientMsgId).
    const clientMsgId = `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: Message = {
      id: clientMsgId,
      chatId: String(chatId),
      senderUserId: String(myId ?? ""),
      senderName: user?.displayName ?? "You",
      body,
      sentAt: new Date().toISOString(),
      clientMsgId,
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const saved = await api.sendMessage(chatId, body, clientMsgId);
      // The confirmed message normally arrives over the socket and replaces the
      // optimistic row. Reconcile from the REST response too as a fallback (e.g.
      // if the socket is down), and dedup so the later WS frame is a no-op.
      setMessages((prev) => {
        if (prev.some((m) => !m.pending && m.id === saved.id)) {
          return prev.filter((m) => m.id !== clientMsgId);
        }
        const idx = prev.findIndex((m) => m.pending && m.id === clientMsgId);
        if (idx === -1) return prev;
        const next = prev.slice();
        next[idx] = { ...optimistic, ...saved, clientMsgId, pending: false };
        return next;
      });
    } catch {
      // Roll back the optimistic row and restore the draft for a retry.
      setMessages((prev) => prev.filter((m) => m.id !== clientMsgId));
      setDraft(body);
    }
  }

  const isChannel = chat?.type === "event_channel";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-wuerth-bg"
    >
      <TopAppBar back title={chat?.title ?? "Chat"} subtitle={chat?.subtitle ?? undefined} />

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end", padding: 12, gap: 8 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m) => {
          const mine = m.senderUserId === myId;
          if (m.isBroadcast) {
            return (
              <View key={m.id} className="mx-auto max-w-[90%] rounded-xl bg-red-50 px-3 py-2">
                <View className="mb-0.5 flex-row items-center justify-center gap-1">
                  <Megaphone size={12} color={wuerth.red} />
                  <Text className="text-[11px] font-bold uppercase tracking-wide text-we-red">
                    Broadcast
                  </Text>
                </View>
                <Text className="text-center text-sm text-we-ink">{m.body}</Text>
                <Text className="mt-1 text-center text-[11px] text-wuerth-mute">
                  {formatTime(m.sentAt)}
                </Text>
              </View>
            );
          }
          return (
            <View key={m.id} className={cn("flex-row", mine ? "justify-end" : "justify-start")}>
              <View
                className={cn(
                  "max-w-[78%] rounded-2xl px-3 py-2",
                  mine ? "bg-we-red" : "border border-wuerth-line bg-white",
                  m.pending && "opacity-70"
                )}
              >
                {isChannel && !mine ? (
                  <Text className="mb-0.5 text-[11px] font-bold text-we-red">{m.senderName}</Text>
                ) : null}
                <Text className={cn("text-sm leading-snug", mine ? "text-white" : "text-we-ink")}>
                  {m.body}
                </Text>
                <Text
                  className={cn(
                    "mt-0.5 text-right text-[10px]",
                    mine ? "text-white/70" : "text-wuerth-mute"
                  )}
                >
                  {m.pending ? "Sending…" : formatTime(m.sentAt)}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View
        className="border-t border-wuerth-line bg-white px-3 py-2"
        style={{ paddingBottom: Math.max(8, insets.bottom) }}
      >
        <View className="flex-row items-end gap-2">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            multiline
            placeholder="Message…"
            placeholderTextColor={wuerth.mute}
            className="max-h-28 flex-1 rounded-2xl bg-zinc-100 px-3.5 py-2.5 text-sm text-we-ink"
          />
          <Pressable
            onPress={send}
            disabled={!draft.trim()}
            className={cn(
              "h-11 w-11 items-center justify-center rounded-full bg-we-red",
              !draft.trim() && "opacity-40"
            )}
          >
            <SendHorizontal size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
