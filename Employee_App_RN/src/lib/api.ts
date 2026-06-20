/**
 * api.ts — the single data boundary for the Employee App.
 *
 * Dual-mode: when EXPO_PUBLIC_API_BASE_URL is set (USE_BACKEND), every function
 * calls the real REST endpoint (WEAVE_MASTER §6) via lib/http.ts; otherwise it
 * resolves against bundled mock data (lib/mock/seed.ts) so the demo runs offline.
 * Return shapes are identical in both modes.
 */
import type {
  Attendee,
  AuthResponse,
  ChatSummary,
  EmployeeProfile,
  EventDetail,
  EventKpis,
  EventNote,
  EventSentiment,
  EventSummary,
  HostReport,
  Interaction,
  LiveAnalytics,
  Material,
  MaterialType,
  Message,
  NotificationItem,
  PersonSearchResult,
  QrToken,
} from "@/lib/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as seed from "@/lib/mock/seed";
import { publishBroadcast, publishMessage } from "@/lib/ws";
import { USE_BACKEND, clearSession, getToken, request, setSession } from "@/lib/http";

export { API_BASE_URL, USE_BACKEND } from "@/lib/http";

const EMPLOYEE_KEY = "weave.employee.id";

/** Deep clone (replaces structuredClone, which Hermes may not expose). */
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

// The current employee id is cached in memory so the many synchronous callers of
// currentEmployeeId() keep working; AsyncStorage is the async source of truth,
// hydrated on app start by me().
let cachedEmployeeId: string | null = null;

// ── Mutable in-memory stores (cloned from seed so the demo persists per session) ──
const store = {
  employees: clone(seed.employees),
  events: clone(seed.events),
  attendees: clone(seed.attendeesByEvent),
  interactions: clone(seed.interactionsByEvent),
  materials: clone(seed.materialsByEvent),
  notes: clone(seed.notesByEvent),
  sentiment: clone(seed.sentimentByEvent),
  hostReports: clone(seed.hostReportsByEvent),
  chats: clone(seed.chats),
  messages: clone(seed.messagesByChat),
  notifications: clone(seed.notifications),
};

const delay = (min = 150, max = 380) =>
  new Promise<void>((r) => setTimeout(r, min + Math.random() * (max - min)));

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

function nowIso() {
  return new Date().toISOString();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function login(email: string, password: string): Promise<AuthResponse> {
  if (USE_BACKEND) {
    const res = await request<AuthResponse>("POST", "/api/auth/login", { email, password });
    cachedEmployeeId = res.user.id;
    await setSession(res.token, res.user.id);
    return res;
  }
  await delay();
  const normalized = email.trim().toLowerCase();
  const employee = store.employees.find((e) => e.email.toLowerCase() === normalized);
  if (!employee || seed.credentials[normalized] !== password) {
    throw new Error("Invalid email or password.");
  }
  const token = `emp-token-${employee.id}-${Date.now().toString(36)}`;
  cachedEmployeeId = employee.id;
  await setSession(token, employee.id);
  return { token, user: clone(employee) };
}

export async function logout(): Promise<void> {
  cachedEmployeeId = null;
  if (USE_BACKEND) {
    try {
      await request("POST", "/api/auth/logout");
    } catch {
      // ignore network errors on logout
    }
  } else {
    await delay(60, 120);
  }
  await clearSession();
}

/** Synchronous read of the cached id (hydrated by me() on app start). */
export function currentEmployeeId(): string | null {
  return cachedEmployeeId;
}

export async function me(): Promise<EmployeeProfile | null> {
  if (USE_BACKEND) {
    const token = await getToken();
    if (!token) return null;
    try {
      const user = await request<EmployeeProfile>("GET", "/api/auth/me");
      cachedEmployeeId = user.id;
      return user;
    } catch {
      // stale/expired token (e.g. a leftover mock token) → drop the session
      // and fall back to the login screen instead of crashing the bootstrap.
      cachedEmployeeId = null;
      await clearSession();
      return null;
    }
  }
  await delay(80, 160);
  if (!cachedEmployeeId) {
    cachedEmployeeId = await AsyncStorage.getItem(EMPLOYEE_KEY);
  }
  if (!cachedEmployeeId) return null;
  const employee = store.employees.find((e) => e.id === cachedEmployeeId);
  return employee ? clone(employee) : null;
}

// ── Events ──────────────────────────────────────────────────────────────────
function toSummary(e: EventDetail, employeeId: string): EventSummary {
  return {
    id: e.id,
    title: e.title,
    type: e.type,
    city: e.city,
    location: e.location,
    startAt: e.startAt,
    endAt: e.endAt,
    status: e.status,
    attendeeCount: e.attendeeCount,
    health: e.health,
    isOwner: e.ownerEmployeeId === employeeId,
    images: e.images,
  };
}

/** GET /internal/employees/{employeeId}/events */
export async function getMyEvents(employeeId: string): Promise<EventSummary[]> {
  if (USE_BACKEND) return request("GET", `/internal/employees/${employeeId}/events`);
  await delay();
  return store.events
    .filter(
      (e) =>
        e.ownerEmployeeId === employeeId ||
        e.responsibleEmployeeIds.includes(employeeId)
    )
    .map((e) => toSummary(e, employeeId))
    .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));
}

/** GET /internal/events/{eventId} */
export async function getEvent(eventId: string): Promise<EventDetail> {
  if (USE_BACKEND) return request("GET", `/internal/events/${eventId}`);
  await delay();
  const event = store.events.find((e) => e.id === eventId);
  if (!event) throw new Error("Event not found.");
  return clone(event);
}

/** GET /internal/events/{eventId}/kpis */
export async function getEventKpis(eventId: string): Promise<EventKpis> {
  if (USE_BACKEND) return request("GET", `/internal/events/${eventId}/kpis`);
  await delay(100, 220);
  const event = store.events.find((e) => e.id === eventId);
  if (!event) throw new Error("Event not found.");
  return clone(event.kpis);
}

/** GET /internal/events/{eventId}/attendees */
export async function getAttendees(eventId: string): Promise<Attendee[]> {
  if (USE_BACKEND) return request("GET", `/internal/events/${eventId}/attendees`);
  await delay();
  return clone(store.attendees[eventId] ?? []);
}

/** GET /internal/events/{eventId}/interactions */
export async function getInteractions(eventId: string): Promise<Interaction[]> {
  if (USE_BACKEND) return request("GET", `/internal/events/${eventId}/interactions`);
  await delay();
  return clone(store.interactions[eventId] ?? []).sort(
    (a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)
  );
}

// ── Notes ─────────────────────────────────────────────────────────────────────
export async function getNotes(eventId: string): Promise<EventNote[]> {
  if (USE_BACKEND) return request("GET", `/internal/events/${eventId}/notes`);
  await delay();
  return clone(store.notes[eventId] ?? []).sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
  );
}

export async function addNote(eventId: string, body: string): Promise<EventNote> {
  if (USE_BACKEND) return request("POST", `/internal/events/${eventId}/notes`, { body });
  await delay(120, 240);
  const note: EventNote = {
    id: uid("n"),
    eventId,
    authorEmployeeId: currentEmployeeId() ?? "emp-1",
    body,
    createdAt: nowIso(),
  };
  store.notes[eventId] = [...(store.notes[eventId] ?? []), note];
  return clone(note);
}

// ── Sentiment / live analytics ─────────────────────────────────────────────────
export async function getSentiment(eventId: string): Promise<EventSentiment[]> {
  if (USE_BACKEND) return request("GET", `/internal/events/${eventId}/sentiment`);
  await delay();
  return clone(store.sentiment[eventId] ?? []).sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
  );
}

export async function addSentiment(
  eventId: string,
  description: string,
  sentimentValue?: number
): Promise<EventSentiment> {
  if (USE_BACKEND)
    return request("POST", `/internal/events/${eventId}/sentiment`, { description, sentimentValue });
  await delay(120, 240);
  const entry: EventSentiment = {
    id: uid("s"),
    eventId,
    authorEmployeeId: currentEmployeeId() ?? "emp-1",
    description,
    sentimentValue,
    createdAt: nowIso(),
  };
  store.sentiment[eventId] = [...(store.sentiment[eventId] ?? []), entry];
  return clone(entry);
}

/** GET /internal/events/{eventId}/live-analytics (polling) */
export async function getLiveAnalytics(eventId: string): Promise<LiveAnalytics> {
  if (USE_BACKEND) return request("GET", `/internal/events/${eventId}/live-analytics`);
  await delay(100, 200);
  const event = store.events.find((e) => e.id === eventId);
  const recent = (store.sentiment[eventId] ?? []).slice().sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
  );
  const values = recent.map((s) => s.sentimentValue ?? 0);
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const mood: LiveAnalytics["mood"] =
    avg > 0.6 ? "energised" : avg > 0.3 ? "engaged" : avg > -0.1 ? "neutral" : avg > -0.4 ? "flat" : "tense";
  return {
    enabled: event?.liveAnalyticsEnabled ?? false,
    averageSentiment: avg,
    sampleCount: recent.length,
    recent: clone(recent.slice(0, 5)),
    mood,
  };
}

// ── QR & scan ──────────────────────────────────────────────────────────────────
export async function generateCheckInQr(eventId: string): Promise<QrToken> {
  if (USE_BACKEND) return request("POST", `/internal/events/${eventId}/qr/check-in`);
  await delay(120, 220);
  return {
    token: `weave://e/${eventId}/check-in/${uid("t")}`,
    kind: "check_in",
    eventId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
  };
}

export async function generateCheckOutQr(eventId: string): Promise<QrToken> {
  if (USE_BACKEND) return request("POST", `/internal/events/${eventId}/qr/check-out`);
  await delay(120, 220);
  return {
    token: `weave://e/${eventId}/check-out/${uid("t")}`,
    kind: "check_out",
    eventId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
  };
}

/** POST /internal/scan/student/{studentUserId} → connection + DM. */
export async function scanStudent(
  studentUserId: string
): Promise<{ chatId: string; studentName: string }> {
  if (USE_BACKEND) return request("POST", `/internal/scan/student/${studentUserId}`);
  await delay(200, 400);
  const student = seed.studentById(studentUserId);
  if (!student) throw new Error("Student not found.");
  const existing = store.chats.find(
    (c) => c.type === "dm" && c.title === student.displayName
  );
  if (existing) return { chatId: existing.id, studentName: student.displayName };

  const chatId = uid("dm");
  store.chats = [
    {
      id: chatId,
      type: "dm",
      title: student.displayName,
      subtitle: [student.university, student.studyDegree].filter(Boolean).join(" · "),
      lastMessage: "Connection created — say hi 👋",
      lastMessageAt: nowIso(),
      unread: 0,
      liveHighlight: false,
    },
    ...store.chats,
  ];
  store.messages[chatId] = [];
  return { chatId, studentName: student.displayName };
}

// ── Broadcast ───────────────────────────────────────────────────────────────
/** POST /internal/events/{eventId}/broadcast → fans out over WS. */
export async function broadcast(eventId: string, body: string): Promise<Message> {
  if (USE_BACKEND) return request("POST", `/internal/events/${eventId}/broadcast`, { body });
  await delay(150, 300);
  const channel = store.chats.find((c) => c.eventId === eventId && c.type === "event_channel");
  const employee = store.employees.find((e) => e.id === (currentEmployeeId() ?? "emp-1"));
  const message: Message = {
    id: uid("msg"),
    chatId: channel?.id ?? `chan-${eventId}`,
    senderUserId: employee?.id ?? "emp-1",
    senderName: employee?.displayName ?? "Würth",
    body,
    sentAt: nowIso(),
    isBroadcast: true,
  };
  if (channel) {
    store.messages[channel.id] = [...(store.messages[channel.id] ?? []), message];
    channel.lastMessage = body;
    channel.lastMessageAt = message.sentAt;
    publishBroadcast(eventId, channel.id, message);
  }
  return clone(message);
}

// ── Materials ──────────────────────────────────────────────────────────────────
export async function getMaterials(eventId: string): Promise<Material[]> {
  if (USE_BACKEND) return request("GET", `/internal/events/${eventId}/materials`);
  await delay();
  return clone(store.materials[eventId] ?? []);
}

export async function addMaterial(
  eventId: string,
  input: { title: string; type: MaterialType; url: string }
): Promise<Material> {
  if (USE_BACKEND) return request("POST", `/internal/events/${eventId}/materials`, input);
  await delay(150, 300);
  const material: Material = {
    id: uid("m"),
    eventId,
    type: input.type,
    title: input.title,
    url: input.url || "#",
    uploadedBy: currentEmployeeId() ?? "emp-1",
    uploadDate: nowIso(),
    accessCount: 0,
  };
  store.materials[eventId] = [...(store.materials[eventId] ?? []), material];
  return clone(material);
}

// ── Host report ────────────────────────────────────────────────────────────────
export async function getHostReport(eventId: string): Promise<HostReport | null> {
  if (USE_BACKEND) return request("GET", `/internal/events/${eventId}/host-report`);
  await delay();
  const reports = store.hostReports[eventId] ?? [];
  const mine = reports.find((r) => r.hostUserId === (currentEmployeeId() ?? "emp-1"));
  return mine ? clone(mine) : null;
}

export async function submitHostReport(
  eventId: string,
  input: Omit<HostReport, "id" | "eventId" | "hostUserId" | "createdAt">
): Promise<HostReport> {
  if (USE_BACKEND) return request("POST", `/internal/events/${eventId}/host-report`, input);
  await delay(150, 320);
  const report: HostReport = {
    id: uid("h"),
    eventId,
    hostUserId: currentEmployeeId() ?? "emp-1",
    createdAt: nowIso(),
    ...input,
  };
  const list = (store.hostReports[eventId] ?? []).filter(
    (r) => r.hostUserId !== report.hostUserId
  );
  store.hostReports[eventId] = [...list, report];
  return clone(report);
}

// ── Chats / messages ───────────────────────────────────────────────────────────
export async function getChats(): Promise<ChatSummary[]> {
  if (USE_BACKEND) return request("GET", "/internal/chats");
  await delay();
  return clone(store.chats).sort(
    (a, b) => +new Date(b.lastMessageAt ?? 0) - +new Date(a.lastMessageAt ?? 0)
  );
}

export async function getChat(chatId: string): Promise<ChatSummary | null> {
  if (USE_BACKEND) return request("GET", `/internal/chats/${chatId}`);
  await delay(60, 140);
  const chat = store.chats.find((c) => c.id === chatId);
  if (chat) chat.unread = 0;
  return chat ? clone(chat) : null;
}

export async function getMessages(chatId: string): Promise<Message[]> {
  if (USE_BACKEND) {
    const r = await request<Message[] | { items: Message[] }>(
      "GET",
      `/internal/chats/${chatId}/messages`
    );
    return Array.isArray(r) ? r : r.items;
  }
  await delay();
  return clone(store.messages[chatId] ?? []);
}

export async function sendMessage(chatId: string, body: string): Promise<Message> {
  if (USE_BACKEND) return request("POST", `/internal/chats/${chatId}/messages`, { body });
  await delay(90, 200);
  const employee = store.employees.find((e) => e.id === (currentEmployeeId() ?? "emp-1"));
  const message: Message = {
    id: uid("msg"),
    chatId,
    senderUserId: employee?.id ?? "emp-1",
    senderName: employee?.displayName ?? "Me",
    body,
    sentAt: nowIso(),
  };
  store.messages[chatId] = [...(store.messages[chatId] ?? []), message];
  const chat = store.chats.find((c) => c.id === chatId);
  if (chat) {
    chat.lastMessage = body;
    chat.lastMessageAt = message.sentAt;
  }
  publishMessage(message);
  return clone(message);
}

/** GET /api/chats/search-people — co-attendees or prior contacts. */
export async function searchPeople(query: string): Promise<PersonSearchResult[]> {
  if (USE_BACKEND)
    return request("GET", `/api/chats/search-people?q=${encodeURIComponent(query)}`);
  await delay(120, 240);
  const q = query.trim().toLowerCase();
  const people: PersonSearchResult[] = [
    ...seed.students.map((s) => ({
      userId: s.id,
      displayName: s.displayName,
      role: "student" as const,
      context: [s.university, s.studyDegree].filter(Boolean).join(" · "),
      chatId: store.chats.find((c) => c.type === "dm" && c.title === s.displayName)?.id,
    })),
    ...store.employees
      .filter((e) => e.id !== (currentEmployeeId() ?? "emp-1"))
      .map((e) => ({
        userId: e.id,
        displayName: e.displayName,
        role: "employee" as const,
        context: `Würth · ${e.seniority ?? "Employee"}`,
        chatId: store.chats.find((c) => c.type === "internal" && c.title === e.displayName)?.id,
      })),
  ];
  if (!q) return people;
  return people.filter(
    (p) => p.displayName.toLowerCase().includes(q) || p.context.toLowerCase().includes(q)
  );
}

// ── Profile ────────────────────────────────────────────────────────────────────
export async function getProfile(): Promise<EmployeeProfile> {
  if (USE_BACKEND) return request("GET", "/internal/employees/me");
  await delay(80, 180);
  const id = currentEmployeeId() ?? "emp-1";
  const employee = store.employees.find((e) => e.id === id);
  if (!employee) throw new Error("Profile not found.");
  return clone(employee);
}

export async function updateProfile(
  patch: Partial<Pick<EmployeeProfile, "displayName" | "firstName" | "surname" | "avatarUrl">>
): Promise<EmployeeProfile> {
  if (USE_BACKEND) return request("PATCH", "/internal/employees/me", patch);
  await delay(150, 300);
  const id = currentEmployeeId() ?? "emp-1";
  const employee = store.employees.find((e) => e.id === id);
  if (!employee) throw new Error("Profile not found.");
  Object.assign(employee, patch);
  if (patch.firstName || patch.surname) {
    employee.displayName = `${employee.firstName} ${employee.surname}`.trim();
  }
  return clone(employee);
}

// ── Notifications ────────────────────────────────────────────────────────────────
export async function getNotifications(): Promise<NotificationItem[]> {
  if (USE_BACKEND) return request("GET", "/internal/notifications");
  await delay();
  return clone(store.notifications).sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
  );
}

export async function unreadNotificationCount(): Promise<number> {
  if (USE_BACKEND) {
    const items = await request<NotificationItem[]>("GET", "/internal/notifications");
    return items.filter((n) => !n.readAt).length;
  }
  await delay(40, 90);
  return store.notifications.filter((n) => !n.readAt).length;
}

export async function markNotificationRead(id: string): Promise<void> {
  if (USE_BACKEND) {
    await request("PATCH", `/internal/notifications/${id}`, { readAt: nowIso() });
    return;
  }
  await delay(40, 90);
  const n = store.notifications.find((x) => x.id === id);
  if (n && !n.readAt) n.readAt = nowIso();
}
