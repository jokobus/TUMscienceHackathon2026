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

  useEffect(() => {
    return subscribe((e: WsEvent) => {
      if (e.action !== "new_message" && e.action !== "broadcast") return;
      if (e.payload.chatId !== chatId) return;
      const incoming: Message = {
        id: String(e.payload.messageId ?? Math.random()),
        chatId: String(chatId),
        senderUserId: String(e.payload.from),
        senderName: String(e.payload.senderName ?? "Someone"),
        body: String(e.payload.message ?? e.payload.body ?? ""),
        sentAt: String(e.payload.sentAt ?? new Date().toISOString()),
        isBroadcast: Boolean(e.payload.isBroadcast) || e.action === "broadcast",
      };
      setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
    });
  }, [chatId]);

  async function send() {
    const body = draft.trim();
    if (!body || !chatId) return;
    setDraft("");
    try {
      const msg = await api.sendMessage(chatId, body);
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    } catch {
      setDraft(body);
    }
  }

  const isChannel = chat?.type === "event_channel";
  const myId = user?.id ?? api.currentUserId();

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
                  mine ? "bg-we-red" : "border border-wuerth-line bg-white"
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
                  {formatTime(m.sentAt)}
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
