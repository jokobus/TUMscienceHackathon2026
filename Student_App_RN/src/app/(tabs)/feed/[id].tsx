import { useCallback, useEffect, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  FileText,
  ImagePlus,
  MapPin,
  Send,
  Share2,
  Star,
  X,
} from "lucide-react-native";
import type {
  ApplicationInfo,
  InteractionType,
  Material,
  Memory,
  WeaveEvent,
} from "@/lib/types";
import * as api from "@/lib/api";
import { addRegistered, getRegisteredIds, removeRegistered } from "@/lib/registered";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import {
  cn,
  formatLongDate,
  formatShortDate,
  formatTime,
  isSameDay,
  localeDate,
  typeLabel,
} from "@/lib/utils";
import { we } from "@/theme";

type Tab = "info" | "files" | "memory";

/** Deterministic registration figures from the event id (mirrors the web demo). */
function regSeed(id: string): number {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n + id.charCodeAt(i) * (i + 1)) % 97;
  return n + 1;
}

const INTERESTS: { type: InteractionType; label: string }[] = [
  { type: "sample_interest", label: "Request a sample" },
  { type: "project_interest", label: "Project interest" },
  { type: "career_interest", label: "Career interest" },
  { type: "question_asked", label: "Ask a question" },
  { type: "follow_up_request", label: "Request follow-up" },
];

export default function EventDetailScreen() {
  const { id, scanned } = useLocalSearchParams<{ id: string; scanned?: string }>();
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const { isStudent, user } = useAuth();

  const [event, setEvent] = useState<WeaveEvent | null>(null);
  const [tab, setTab] = useState<Tab>("info");
  const [applied, setApplied] = useState(false);
  // Arriving from a successful QR scan ⇒ already checked in; reflect it immediately
  // so the primary button shows "Checked-in ✓" without a "Check In" flash.
  const [attended, setAttended] = useState(scanned === "1");

  const [memories, setMemories] = useState<Memory[]>([]);
  const [memoryText, setMemoryText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  const [files, setFiles] = useState<{ items: Material[]; hiddenReason: string | null } | null>(null);

  const [appInfo, setAppInfo] = useState<ApplicationInfo | null>(null);
  const [appOpen, setAppOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Feedback (end-of-event recommendation / NPS / text).
  const [fbOpen, setFbOpen] = useState(false);
  const [rec, setRec] = useState(0);
  const [nps, setNps] = useState<number | null>(null);
  const [fbText, setFbText] = useState("");

  useEffect(() => {
    if (!id) return;
    // Backend is the source of truth for registration/check-in. The live event
    // (and any event the student is registered to) reports viewerRegistered /
    // viewerCheckedIn, so the screen shows "Registered ✓ / Checked-in ✓" instead
    // of offering to register again.
    api
      .getEvent(id)
      .then((ev) => {
        setEvent(ev);
        if (ev.viewerRegistered) setApplied(true);
        if (ev.viewerCheckedIn) setAttended(true);
      })
      .catch(() => setEvent(null));
    // Also hydrate from the persisted local store as a fallback (offline / mock
    // mode, or before the backend round-trip lands) so the File Drive + Memory
    // tabs survive a reload without a re-check-in.
    getRegisteredIds()
      .then((ids) => {
        if (ids.includes(id)) {
          setApplied(true);
          setAttended(true);
        }
      })
      .catch(() => {});
  }, [id]);

  const isPast = event ? new Date(event.endAt).getTime() < Date.now() : false;
  const isStarted = event ? Date.now() >= new Date(event.startAt).getTime() || isPast : false;
  const sameDay = event ? isSameDay(event.startAt, event.endAt) : false;
  // Files + Memory subpages are available once an attended event has started —
  // this covers both the current/live event and past events the user attended.
  // Future (not-yet-started) events stay tab-less.
  const showFileDrive = isStarted && attended;
  const showMemory = isStarted && attended;
  // The Memory composer is gated server-side to checked-in attendees from
  // start_at onward; disable it locally too once the event is over.
  const canPostMemory = isStarted && attended && !isPast;

  const loadMemories = useCallback(() => {
    if (id) api.getMemories(id).then(setMemories).catch(() => {});
  }, [id]);

  const loadFiles = useCallback(() => {
    if (id) api.getEventFiles(id).then(setFiles).catch(() => setFiles({ items: [], hiddenReason: null }));
  }, [id]);

  useEffect(() => {
    if (tab === "memory") loadMemories();
    if (tab === "files") loadFiles();
  }, [tab, loadMemories, loadFiles]);

  function requireStudent(): boolean {
    if (!isStudent) {
      toast("Sign in to continue.", "info");
      router.push("/login");
      return false;
    }
    return true;
  }

  async function onCheckIn() {
    if (!user) {
      toast("Sign in to check in.", "info");
      router.push("/login");
      return;
    }
    try {
      await api.checkInEvent(id!);
      setAttended(true);
      addRegistered(id!);
      toast("Checked in! You now have access to files and memory.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Check-in failed.", "error");
    }
  }

  async function onPrimaryAction() {
    if (!event) return;
    if (isPast) {
      if (!requireStudent()) return;
      try {
        await api.repostEvent(event.id);
        toast("Event added to suggestions!");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not repost.", "error");
      }
      return;
    }
    if (applied) {
      setApplied(false);
      removeRegistered(event.id);
      toast("Registration cancelled.");
      return;
    }
    if (event.applicationRequired) {
      if (!user) {
        toast("Sign in to apply.", "info");
        router.push("/login");
        return;
      }
      try {
        const info = await api.getApplication(event.id);
        setAppInfo(info);
        setAppOpen(true);
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not load application.", "error");
      }
    } else {
      if (!user) {
        toast("Sign in to register.", "info");
        router.push("/login");
        return;
      }
      try {
        await api.submitApplication(event.id, user.email, []);
        setApplied(true);
        addRegistered(event.id);
        toast("Registered successfully!");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not register.", "error");
      }
    }
  }

  async function submitApplicationForm() {
    if (!event || !appInfo || !user) return;
    try {
      await api.submitApplication(
        event.id,
        user.email,
        appInfo.questions.map((q) => ({ questionId: q.id, answerText: answers[q.id] ?? "" }))
      );
      setApplied(true);
      setAppOpen(false);
      addRegistered(event.id);
      toast("Application Submitted!");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not submit.", "error");
    }
  }

  async function onPostMemory(withImage: boolean) {
    if (!requireStudent()) return;
    const body = memoryText.trim() || (withImage ? "Shared a photo!" : "");
    if (!body && !imageUrl) return;
    try {
      await api.postMemory(id!, body, withImage && imageUrl ? [imageUrl] : [], replyTo?.id);
      setMemoryText("");
      setImageUrl("");
      setShowImageInput(false);
      setReplyTo(null);
      toast(replyTo ? "Reply posted!" : withImage ? "Photo posted!" : "Memory posted!");
      loadMemories();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not post memory.", "error");
    }
  }

  async function onInterest(type: InteractionType, _label: string) {
    if (!requireStudent()) return;
    try {
      await api.logInteraction(type, id);
      // No success toast — the chip's selected highlight is feedback enough.
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not send.", "error");
    }
  }

  async function onSubmitFeedback() {
    if (!requireStudent()) return;
    if (!rec) {
      toast("Pick a recommendation rating.", "info");
      return;
    }
    try {
      await api.submitFeedback(id!, rec, nps ?? undefined, fbText.trim() || undefined);
      setFbOpen(false);
      setRec(0);
      setNps(null);
      setFbText("");
      toast("Thanks for your feedback!");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not submit feedback.", "error");
    }
  }

  async function onShare() {
    try {
      await Share.share({ message: `${event?.title} — WEave` });
    } catch {
      // user cancelled
    }
  }

  async function onOpenFile(m: Material) {
    api.logInteraction("file_view", id, { material_id: m.id }).catch(() => {});
    if (m.url && m.url !== "#") Linking.openURL(m.url).catch(() => {});
  }

  async function onDownloadFile(m: Material) {
    api.logInteraction("file_download", id, { material_id: m.id }).catch(() => {});
    if (m.url && m.url !== "#") Linking.openURL(m.url).catch(() => {});
  }

  if (!event) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-400">Loading event…</Text>
      </View>
    );
  }

  const seed = regSeed(event.id);
  const totalSpots = 20 + (seed * 7) % 80;
  const registered = Math.min(totalSpots - 1, 5 + (seed * 13) % (totalSpots - 3));
  const spotsLeft = totalSpots - registered;
  const regNow = registered + (applied ? 1 : 0);

  // Application window (from backend dates; falls back to a 3-days-before deadline).
  const now = Date.now();
  const appOpenAt = event.applicationOpenAt ? new Date(event.applicationOpenAt).getTime() : null;
  const appCloseAt = event.applicationCloseAt ? new Date(event.applicationCloseAt).getTime() : null;
  const fallbackDeadline = new Date(new Date(event.startAt).getTime() - 3 * 864e5).toISOString();
  const appUpcoming = event.applicationRequired && appOpenAt != null && now < appOpenAt;
  const appClosed = event.applicationRequired && appCloseAt != null && now > appCloseAt;
  const appBlocked = appUpcoming || appClosed; // not within the open window

  const windowText = event.applicationRequired
    ? appUpcoming
      ? `Applications open ${formatShortDate(event.applicationOpenAt!)}`
      : appClosed
        ? `Applications closed ${formatShortDate(event.applicationCloseAt!)}`
        : `Applications close ${formatShortDate(event.applicationCloseAt ?? fallbackDeadline)}`
    : null;

  const primaryLabel = isPast
    ? "Suggest Again"
    : applied
      ? event.applicationRequired
        ? "Application Submitted ✓"
        : "Registered ✓"
      : event.applicationRequired
        ? appUpcoming
          ? "Applications Upcoming"
          : appClosed
            ? "Applications Closed"
            : "Submit Application"
        : "Register Now";

  const primaryDisabled = !isPast && !applied && appBlocked;

  const tabBtn = (value: Tab, label: string) => (
    <Pressable
      onPress={() => setTab(value)}
      className={cn("border-b-2 px-4 py-2", tab === value ? "border-we-red" : "border-transparent")}
    >
      <Text className={cn("text-sm font-medium", tab === value ? "text-we-red" : "text-gray-500")}>
        {label}
      </Text>
    </Pressable>
  );

  const topLevelMemories = memories.filter((m) => !m.parentId);
  const repliesByParent = memories.reduce<Record<string, Memory[]>>((acc, m) => {
    if (m.parentId) (acc[m.parentId] ??= []).push(m);
    return acc;
  }, {});

  const renderMemory = (m: Memory, isReply = false) => (
    <View
      key={m.id}
      className={cn(
        "flex-row gap-3 rounded-2xl border border-gray-100 bg-white p-4",
        isReply && "ml-6 bg-gray-50"
      )}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-200">
        <Text className="font-bold text-gray-500">{(m.authorName ?? "?")[0]?.toUpperCase()}</Text>
      </View>
      <View className="flex-1">
        <View className="mb-1 flex-row items-center gap-2">
          <Text className="text-sm font-bold text-we-ink">{m.authorName ?? "Student"}</Text>
          <Text className="text-xs text-gray-400">{localeDate(m.createdAt)}</Text>
        </View>
        <Text className="mb-2 text-sm leading-relaxed text-gray-600">{m.body}</Text>
        {m.images?.[0] && (
          <Image
            source={{ uri: m.images[0] }}
            contentFit="cover"
            style={{ width: "100%", height: 180, borderRadius: 12 }}
          />
        )}
        {!isReply && (
          <Pressable
            onPress={() => setReplyTo({ id: m.id, name: m.authorName ?? "Student" })}
            className="mt-1 self-start"
          >
            <Text className="text-xs font-semibold text-we-red">Reply</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero */}
        <View className="h-64 w-full bg-we-red">
          {event.images?.[0] ? (
            <Image source={{ uri: event.images[0] }} contentFit="cover" style={{ width: "100%", height: "100%" }} />
          ) : null}
        </View>

        {/* Back button */}
        <Pressable
          onPress={() => router.back()}
          style={{ position: "absolute", top: insets.top + 8, left: 16 }}
          className="h-10 w-10 items-center justify-center rounded-full bg-black/30"
        >
          <ArrowLeft size={20} color="#fff" />
        </Pressable>

        {/* Body */}
        <View className="-mt-6 rounded-t-3xl bg-white px-5 pt-8">
          <View className="mb-4 self-start rounded-full bg-red-50 px-3 py-1">
            <Text className="text-xs font-bold uppercase tracking-wider text-we-red">
              {typeLabel(event.type)}
            </Text>
          </View>

          <Text className="mb-6 text-3xl font-bold leading-tight text-we-ink">{event.title}</Text>

          <View className="mb-8 gap-3 rounded-xl bg-gray-50 p-4">
            <View className="flex-row items-center">
              <Calendar size={16} color={we.red} />
              <Text className="ml-2 text-sm text-gray-600">
                {formatLongDate(event.startAt)}
                {!sameDay ? ` - ${formatLongDate(event.endAt)}` : ""}
              </Text>
            </View>
            {sameDay && (
              <View className="flex-row items-center">
                <Clock size={16} color={we.red} />
                <Text className="ml-2 text-sm text-gray-600">
                  {formatTime(event.startAt)} - {formatTime(event.endAt)}
                </Text>
              </View>
            )}
            {!!event.city && (
              <View className="flex-row items-center">
                <MapPin size={16} color={we.red} />
                <Text className="ml-2 text-sm text-gray-600">
                  {event.city}
                  {event.location ? `, ${event.location}` : ""}
                </Text>
              </View>
            )}
          </View>

          {/* Tabs */}
          <View className="mb-8 flex-row border-b border-gray-200">
            {tabBtn("info", "Information")}
            {showFileDrive && tabBtn("files", "Files")}
            {showMemory && tabBtn("memory", "Memory")}
          </View>

          {/* Information */}
          {tab === "info" && (
            <View>
              <Text className="text-lg leading-relaxed text-gray-700">
                {event.description || "No detailed description provided for this event."}
              </Text>

              {!isPast && (
                <View className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <Text className="mb-3 text-sm font-bold uppercase tracking-wider text-we-ink">
                    Registration Details
                  </Text>
                  <View className="mb-4 flex-row flex-wrap">
                    <View className="mb-4 w-1/2">
                      <Text className="mb-0.5 text-sm text-gray-500">Spots</Text>
                      <Text className="font-bold text-we-ink">
                        {regNow} / {totalSpots}
                      </Text>
                    </View>
                    <View className="mb-4 w-1/2">
                      <Text className="mb-0.5 text-sm text-gray-500">Spots Left</Text>
                      <Text className={cn("font-bold", spotsLeft <= 5 ? "text-orange-600" : "text-green-600")}>
                        {spotsLeft - (applied ? 1 : 0)}
                      </Text>
                    </View>
                    <View className="w-1/2">
                      <Text className="mb-0.5 text-sm text-gray-500">Format</Text>
                      <Text className="font-bold text-we-ink">
                        {event.type === "hackathon" ? "In-Person" : seed % 3 === 0 ? "Hybrid" : "In-Person"}
                      </Text>
                    </View>
                  </View>
                  <View className="h-2 w-full rounded-full bg-gray-200">
                    <View
                      className="h-2 rounded-full bg-we-red"
                      style={{ width: `${Math.min(100, (regNow / totalSpots) * 100)}%` }}
                    />
                  </View>
                </View>
              )}

              {/* Actions */}
              <View className="mt-8 gap-3 border-t border-gray-100 pt-6">
                {windowText && !isPast && (
                  <Text className="text-sm text-gray-500">{windowText}</Text>
                )}
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={onShare}
                    className="flex-1 flex-row items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3"
                  >
                    <Share2 size={16} color="#374151" />
                    <Text className="ml-2 font-medium text-gray-700">Share</Text>
                  </Pressable>

                  {isStarted && !attended && (
                    <Pressable
                      onPress={onCheckIn}
                      className="flex-1 flex-row items-center justify-center rounded-xl border border-we-red px-6 py-3"
                    >
                      <Text className="font-bold text-we-red">Check In</Text>
                    </Pressable>
                  )}

                  {isStarted && attended && (
                    <Pressable
                      disabled
                      className="flex-1 flex-row items-center justify-center rounded-xl border border-green-200 bg-green-100 px-6 py-3"
                    >
                      <Text className="font-bold text-green-800">Checked-in ✓</Text>
                    </Pressable>
                  )}

                  {isPast && (
                    <Pressable
                      onPress={() => setFbOpen(true)}
                      className="flex-1 flex-row items-center justify-center rounded-xl border border-we-red px-6 py-3"
                    >
                      <Star size={16} color={we.red} />
                      <Text className="ml-2 font-bold text-we-red">Leave feedback</Text>
                    </Pressable>
                  )}
                </View>

                <Pressable
                  onPress={onPrimaryAction}
                  disabled={primaryDisabled}
                  className={cn(
                    "flex-row items-center justify-center rounded-xl px-8 py-3",
                    applied && !isPast
                      ? "border border-green-200 bg-green-100"
                      : primaryDisabled
                        ? "bg-gray-200"
                        : "bg-we-ink"
                  )}
                >
                  <Text
                    className={cn(
                      "font-medium",
                      applied && !isPast
                        ? "text-green-800"
                        : primaryDisabled
                          ? "text-gray-500"
                          : "text-white"
                    )}
                  >
                    {primaryLabel}
                  </Text>
                </Pressable>
              </View>

              {/* Express interest */}
              <View className="mt-8 border-t border-gray-100 pt-6">
                <Text className="mb-3 text-sm font-bold uppercase tracking-wider text-we-ink">
                  Express Interest
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {INTERESTS.map((it) => (
                    <Pressable
                      key={it.type}
                      onPress={() => onInterest(it.type, it.label)}
                      className="rounded-full border border-gray-200 bg-white px-4 py-2 active:bg-gray-50"
                    >
                      <Text className="text-sm font-medium text-gray-700">{it.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* File Drive */}
          {tab === "files" && (
            <View className="gap-4">
              {files?.hiddenReason ? (
                <View className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <Text className="text-sm text-gray-600">{files.hiddenReason}</Text>
                </View>
              ) : (files?.items.length ?? 0) === 0 ? (
                <Text className="py-8 text-center text-gray-400">No files available yet.</Text>
              ) : (
                files!.items.map((m) => (
                  <View
                    key={m.id}
                    className="flex-row items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <Pressable className="flex-1 flex-row items-center" onPress={() => onOpenFile(m)}>
                      <View className="h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                        <FileText size={20} color={we.red} />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="font-bold text-sm text-we-ink" numberOfLines={1}>
                          {m.title}
                        </Text>
                        <Text className="text-xs text-gray-500">{m.type.toUpperCase()}</Text>
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => onDownloadFile(m)}
                      className="h-9 w-9 items-center justify-center rounded-lg bg-red-50"
                    >
                      <Download size={18} color={we.red} />
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Capture a Memory */}
          {tab === "memory" && (
            <View className="gap-6">
              <View className="gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3">
                {replyTo && (
                  <View className="flex-row items-center justify-between rounded-lg bg-white px-3 py-1.5">
                    <Text className="text-xs text-gray-500">Replying to {replyTo.name}</Text>
                    <Pressable onPress={() => setReplyTo(null)}>
                      <X size={14} color="#9ca3af" />
                    </Pressable>
                  </View>
                )}
                <View className="flex-row items-center gap-2">
                  <TextInput
                    value={memoryText}
                    onChangeText={setMemoryText}
                    editable={canPostMemory}
                    placeholder={
                      canPostMemory
                        ? replyTo
                          ? "Write a reply..."
                          : "Share your experience..."
                        : "Posting is closed for this event."
                    }
                    placeholderTextColor="#9ca3af"
                    className="flex-1 px-2 text-sm text-we-ink"
                  />
                  <Pressable
                    onPress={() => setShowImageInput((v) => !v)}
                    disabled={!canPostMemory}
                    className={cn(
                      "h-10 w-10 items-center justify-center rounded-full bg-gray-200",
                      !canPostMemory && "opacity-40"
                    )}
                  >
                    <ImagePlus size={20} color="#4b5563" />
                  </Pressable>
                  <Pressable
                    onPress={() => onPostMemory(showImageInput && !!imageUrl)}
                    disabled={!canPostMemory}
                    className={cn(
                      "h-10 w-10 items-center justify-center rounded-full bg-we-red",
                      !canPostMemory && "opacity-40"
                    )}
                  >
                    <Send size={16} color="#fff" />
                  </Pressable>
                </View>
                {showImageInput && (
                  <TextInput
                    value={imageUrl}
                    onChangeText={setImageUrl}
                    placeholder="Paste an image URL…"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-we-ink"
                  />
                )}
              </View>

              <View className="gap-4">
                {topLevelMemories.length === 0 ? (
                  <Text className="py-8 text-center text-gray-400">Be the first to share a memory!</Text>
                ) : (
                  topLevelMemories.map((m) => (
                    <View key={m.id} className="gap-2">
                      {renderMemory(m)}
                      {(repliesByParent[m.id] ?? []).map((r) => renderMemory(r, true))}
                    </View>
                  ))
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Application form sheet */}
      <BottomSheet open={appOpen} onClose={() => setAppOpen(false)} title="Submit Application" scrollable>
        <View className="gap-4 pt-1">
          {appInfo?.questions.length ? (
            appInfo.questions.map((q) => (
              <View key={q.id}>
                <Text className="mb-1.5 text-sm font-semibold text-we-ink">{q.questionText}</Text>
                <TextInput
                  value={answers[q.id] ?? ""}
                  onChangeText={(t) => setAnswers((a) => ({ ...a, [q.id]: t }))}
                  placeholder="Your answer…"
                  placeholderTextColor="#9ca3af"
                  multiline
                  className="min-h-[64px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-we-ink"
                />
              </View>
            ))
          ) : (
            <Text className="text-sm text-gray-500">
              No questions for this event — confirm to submit your application.
            </Text>
          )}
          <Button onPress={submitApplicationForm} block size="lg">
            Submit Application
          </Button>
        </View>
      </BottomSheet>

      {/* Feedback sheet */}
      <BottomSheet open={fbOpen} onClose={() => setFbOpen(false)} title="Event feedback" scrollable>
        <View className="gap-5 pt-1">
          <View>
            <Text className="mb-2 text-sm font-semibold text-we-ink">
              How likely are you to recommend this event?
            </Text>
            <View className="flex-row gap-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <Pressable
                  key={v}
                  onPress={() => setRec(v)}
                  className={cn(
                    "h-11 flex-1 items-center justify-center rounded-xl border",
                    rec >= v ? "border-we-red bg-red-50" : "border-gray-200 bg-white"
                  )}
                >
                  <Star
                    size={20}
                    color={rec >= v ? we.red : "#9ca3af"}
                    fill={rec >= v ? we.red : "transparent"}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          <View>
            <Text className="mb-2 text-sm font-semibold text-we-ink">
              NPS — would you recommend Würth as an employer? (optional)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1.5">
              {Array.from({ length: 11 }).map((_, v) => (
                <Pressable
                  key={v}
                  onPress={() => setNps(nps === v ? null : v)}
                  className={cn(
                    "h-9 w-9 items-center justify-center rounded-lg border",
                    nps === v ? "border-we-red bg-we-red" : "border-gray-200 bg-white"
                  )}
                >
                  <Text className={cn("text-xs font-bold", nps === v ? "text-white" : "text-gray-600")}>
                    {v}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View>
            <Text className="mb-1.5 text-sm font-semibold text-we-ink">Anything to add? (optional)</Text>
            <TextInput
              value={fbText}
              onChangeText={setFbText}
              placeholder="Your thoughts…"
              placeholderTextColor="#9ca3af"
              multiline
              className="min-h-[64px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-we-ink"
            />
          </View>

          <Button onPress={onSubmitFeedback} block size="lg">
            Submit feedback
          </Button>
        </View>
      </BottomSheet>
    </View>
  );
}
