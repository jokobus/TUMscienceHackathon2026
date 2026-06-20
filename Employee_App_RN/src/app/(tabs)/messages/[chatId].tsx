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
import { useAuth } from "@/lib/auth";
import * as api from "@/lib/api";
import { subscribe } from "@/lib/ws";
import { TopAppBar } from "@/components/employee/TopAppBar";
import { ProfileSheet, type ProfilePerson } from "@/components/employee/ProfileSheet";
import { cn, formatTime } from "@/lib/utils";
import { wuerth } from "@/theme";

export default function ChatThreadScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { employee } = useAuth();
  const insets = useSafeAreaInsets();
  const [chat, setChat] = useState<ChatSummary | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [broadcastMode, setBroadcastMode] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!chatId) return;
    api.getChat(chatId).then(setChat);
    api.getMessages(chatId).then(setMessages);
  }, [chatId]);

  useEffect(() => {
    return subscribe((e: WsEvent) => {
      if (e.action !== "new_message" && e.action !== "broadcast") return;
      if (e.payload.chatId !== chatId) return;
      const incoming: Message = {
        id: String(e.payload.messageId),
        chatId: String(chatId),
        senderUserId: String(e.payload.from),
        senderName: String(e.payload.senderName ?? "Someone"),
        body: String(e.payload.message),
        sentAt: String(e.payload.sentAt),
        isBroadcast: Boolean(e.payload.isBroadcast) || e.action === "broadcast",
      };
      setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
    });
  }, [chatId]);

  async function send() {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    if (broadcastMode && chat?.eventId) {
      await api.broadcast(chat.eventId, body);
    } else if (chatId) {
      await api.sendMessage(chatId, body);
    }
  }

  const isChannel = chat?.type === "event_channel";
  const myId = employee?.id;

  const person: ProfilePerson | null =
    chat && !isChannel
      ? (() => {
          const parts = (chat.subtitle ?? "").split(" · ").filter(Boolean);
          const internal = chat.type === "internal";
          const labels = internal ? ["Organisation", "Role"] : ["University", "Programme"];
          return {
            name: chat.title,
            role: internal ? "Würth colleague" : "Student",
            avatarTone: internal ? ("ink" as const) : ("red" as const),
            details: parts.map((value, i) => ({ label: labels[i] ?? "Detail", value })),
          };
        })()
      : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-wuerth-bg"
    >
      <TopAppBar
        back
        title={
          person ? (
            <Pressable onPress={() => setProfileOpen(true)}>
              <Text numberOfLines={1} className="text-base font-bold text-white">
                {chat?.title ?? "Chat"}
              </Text>
            </Pressable>
          ) : (
            chat?.title ?? "Chat"
          )
        }
        subtitle={chat?.subtitle}
        right={
          isChannel ? (
            <Pressable
              onPress={() => setBroadcastMode((b) => !b)}
              className={cn(
                "mr-2 flex-row items-center gap-1 rounded-full px-2.5 py-1",
                broadcastMode ? "bg-white" : "bg-white/15"
              )}
            >
              <Megaphone size={14} color={broadcastMode ? wuerth.red : "#fff"} />
              <Text className={cn("text-xs font-bold", broadcastMode ? "text-wuerth-red" : "text-white")}>
                Broadcast
              </Text>
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end", padding: 12, gap: 8 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((m) => {
          const mine = m.senderUserId === myId;
          if (m.isBroadcast) {
            return (
              <View key={m.id} className="mx-auto max-w-[90%] rounded-xl bg-wuerth-red-soft px-3 py-2">
                <View className="mb-0.5 flex-row items-center justify-center gap-1">
                  <Megaphone size={12} color={wuerth.red} />
                  <Text className="text-[11px] font-bold uppercase tracking-wide text-wuerth-red">
                    Broadcast
                  </Text>
                </View>
                <Text className="text-center text-sm text-wuerth-ink">{m.body}</Text>
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
                  mine ? "bg-wuerth-red" : "border border-wuerth-line bg-white"
                )}
              >
                {isChannel && !mine ? (
                  <Text className="mb-0.5 text-[11px] font-bold text-wuerth-red">{m.senderName}</Text>
                ) : null}
                <Text className={cn("text-sm leading-snug", mine ? "text-white" : "text-wuerth-ink")}>
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
        {broadcastMode ? (
          <View className="mb-1.5 flex-row items-center gap-1.5 px-1">
            <Megaphone size={13} color={wuerth.red} />
            <Text className="text-xs font-semibold text-wuerth-red">
              Broadcasting to all attendees
            </Text>
          </View>
        ) : null}
        <View className="flex-row items-end gap-2">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            multiline
            placeholder={broadcastMode ? "Announcement to all attendees…" : "Message…"}
            placeholderTextColor={wuerth.mute}
            className="max-h-28 flex-1 rounded-2xl bg-zinc-100 px-3.5 py-2.5 text-sm text-wuerth-ink"
          />
          <Pressable
            onPress={send}
            disabled={!draft.trim()}
            className={cn(
              "h-11 w-11 items-center justify-center rounded-full bg-wuerth-red",
              !draft.trim() && "opacity-40"
            )}
          >
            <SendHorizontal size={18} color="#fff" />
          </Pressable>
        </View>
      </View>

      <ProfileSheet person={profileOpen ? person : null} onClose={() => setProfileOpen(false)} />
    </KeyboardAvoidingView>
  );
}
