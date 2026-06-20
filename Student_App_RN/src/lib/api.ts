/**
 * api.ts — the single data boundary for the Student App.
 *
 * Every function calls the real backend (WEAVE_MASTER §6) through lib/http.ts.
 * The Feed is reachable without auth; protected calls require a token (set on
 * login/signup/guest). Responses are camelCased at the http boundary.
 */
import type {
  ApplicationInfo,
  AuthResponse,
  AuthUser,
  ChatSummary,
  FilesResponse,
  InterestTagGroup,
  InteractionType,
  Material,
  Memory,
  Message,
  PersonSearchResult,
  StudentProfile,
  Suggestion,
  WeaveEvent,
} from "@/lib/types";
import { clearSession, getToken, request, setSession, USE_BACKEND } from "@/lib/http";
import { MOCK_EVENTS, getMockEvent } from "@/lib/mock/events";

export { API_BASE_URL } from "@/lib/http";
export { USE_BACKEND };

// Cached synchronously for callers that need "who am I" without awaiting.
let cachedUserId: string | null = null;
let cachedRole: string | null = null;

export function currentUserId(): string | null {
  return cachedUserId;
}
export function currentRole(): string | null {
  return cachedRole;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await request<AuthResponse>("POST", "/api/auth/login", { email, password });
  cachedUserId = res.user.id;
  cachedRole = res.user.role;
  await setSession(res.token, res.user.id);
  return res;
}

export async function signup(
  email: string,
  password: string,
  displayName: string
): Promise<AuthResponse> {
  const res = await request<AuthResponse>("POST", "/api/auth/signup", {
    email,
    password,
    displayName,
    role: "student",
  });
  cachedUserId = res.user.id;
  cachedRole = res.user.role;
  await setSession(res.token, res.user.id);
  return res;
}

export async function guest(email: string, displayName?: string): Promise<AuthResponse> {
  const res = await request<AuthResponse>("POST", "/api/auth/guest", { email, displayName });
  cachedUserId = res.user.id;
  cachedRole = res.user.role;
  await setSession(res.token, res.user.id);
  return res;
}

export async function logout(): Promise<void> {
  cachedUserId = null;
  cachedRole = null;
  try {
    await request("POST", "/api/auth/logout");
  } catch {
    // ignore network errors on logout
  }
  await clearSession();
}

export async function me(): Promise<AuthUser | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const user = await request<AuthUser>("GET", "/api/auth/me");
    cachedUserId = user.id;
    cachedRole = user.role;
    return user;
  } catch {
    // stale/expired token → drop the session and fall back to anonymous/login.
    cachedUserId = null;
    cachedRole = null;
    await clearSession();
    return null;
  }
}

// ── Events / feed ─────────────────────────────────────────────────────────────
type ListResponse<T> = { items: T[]; nextCursor: string | null };

export async function getEvents(): Promise<WeaveEvent[]> {
  // Feed data source: real scraped Würth events when there's no backend,
  // and as a fallback if the backend is reachable but returns nothing / errors.
  if (!USE_BACKEND) return MOCK_EVENTS;
  try {
    const res = await request<ListResponse<WeaveEvent>>("GET", "/api/events?limit=200");
    return res.items.length ? res.items : MOCK_EVENTS;
  } catch {
    return MOCK_EVENTS;
  }
}

export async function searchEvents(query: string): Promise<WeaveEvent[]> {
  const res = await request<ListResponse<WeaveEvent>>(
    "GET",
    `/api/events/search?q=${encodeURIComponent(query)}`
  );
  return res.items;
}

export async function getCurrentEvent(): Promise<WeaveEvent | null> {
  return request<WeaveEvent | null>("GET", "/api/events/current");
}

export async function getEvent(eventId: string): Promise<WeaveEvent> {
  if (!USE_BACKEND) {
    const ev = getMockEvent(eventId);
    if (ev) return ev;
    throw new Error("Event not found");
  }
  try {
    return await request<WeaveEvent>("GET", `/api/events/${eventId}`);
  } catch (e) {
    const ev = getMockEvent(eventId);
    if (ev) return ev;
    throw e;
  }
}

export async function getEventFiles(eventId: string): Promise<FilesResponse> {
  return request<FilesResponse>("GET", `/api/events/${eventId}/files`);
}

// ── Memories ──────────────────────────────────────────────────────────────────
export async function getMemories(eventId: string): Promise<Memory[]> {
  const res = await request<ListResponse<Memory>>("GET", `/api/events/${eventId}/memories`);
  return res.items;
}

export async function postMemory(
  eventId: string,
  body: string,
  images: string[] = [],
  parentId?: string
): Promise<{ id: string }> {
  return request("POST", `/api/events/${eventId}/memories`, { body, images, parentId });
}

export async function repostEvent(
  eventId: string
): Promise<{ suggestionId: string; repostCount: number }> {
  return request("POST", `/api/events/${eventId}/repost`);
}

// ── Applications / feedback ─────────────────────────────────────────────────────
export async function getApplication(eventId: string): Promise<ApplicationInfo> {
  return request<ApplicationInfo>("GET", `/api/events/${eventId}/application`);
}

export async function submitApplication(
  eventId: string,
  email: string,
  answers: { questionId: string; answerText: string }[]
): Promise<{ id: string; status: string }> {
  return request("POST", `/api/events/${eventId}/application`, { email, answers });
}

export async function submitFeedback(
  eventId: string,
  recommendationScore: number,
  npsScore?: number,
  text?: string
): Promise<{ id: string }> {
  return request("POST", `/api/events/${eventId}/feedback`, {
    recommendationScore,
    npsScore,
    text,
  });
}

// ── Check-in / scan / interactions ──────────────────────────────────────────────
export async function checkInEvent(eventId: string): Promise<{ ok: boolean; eventId: string }> {
  return request("POST", `/api/events/${eventId}/check-in`);
}

export async function scanEmployee(
  employeeId: string
): Promise<{ chatId: string; employeeName: string }> {
  return request("POST", `/api/scan/employee/${employeeId}`);
}

export async function logInteraction(
  type: InteractionType,
  eventId?: string,
  metadata?: Record<string, unknown>
): Promise<{ id: string }> {
  return request("POST", "/api/interactions", { type, eventId, metadata });
}

// ── Profile / interests ─────────────────────────────────────────────────────────
export async function getProfile(): Promise<StudentProfile> {
  return request<StudentProfile>("GET", "/api/users/me/profile");
}

export async function updateProfile(
  patch: Partial<
    Pick<
      StudentProfile,
      "displayName" | "avatarUrl" | "university" | "studyDegree" | "hometown" | "consentVisibleToRecruiters"
    >
  >
): Promise<StudentProfile> {
  return request<StudentProfile>("PATCH", "/api/users/me/profile", patch);
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ ok: boolean }> {
  return request("PUT", "/api/users/me/password", { currentPassword, newPassword });
}

export async function getInterestTags(): Promise<InterestTagGroup[]> {
  return request<InterestTagGroup[]>("GET", "/api/interest-tags");
}

export async function setInterests(tagIds: number[]): Promise<{ ok: boolean; tagIds: number[] }> {
  return request("PUT", "/api/users/me/interests", { tagIds });
}

export async function getMyMemories(): Promise<Memory[]> {
  const res = await request<ListResponse<Memory>>("GET", "/api/users/me/memories");
  return res.items;
}

// ── Suggestions ────────────────────────────────────────────────────────────────
export async function getSuggestions(
  sort: "popularity" | "recency" = "popularity"
): Promise<Suggestion[]> {
  return request<Suggestion[]>("GET", `/api/suggestions?sort=${sort}`);
}

export async function createSuggestion(title: string, description: string): Promise<Suggestion> {
  return request<Suggestion>("POST", "/api/suggestions", { title, description });
}

export async function editSuggestion(
  id: string,
  patch: { title?: string; description?: string }
): Promise<Suggestion> {
  return request<Suggestion>("PATCH", `/api/suggestions/${id}`, patch);
}

export async function deleteSuggestion(id: string): Promise<void> {
  await request("DELETE", `/api/suggestions/${id}`);
}

export async function voteSuggestion(id: string, value: 1 | -1): Promise<Suggestion> {
  return request<Suggestion>("POST", `/api/suggestions/${id}/vote`, { value });
}

// ── Chats / messages ─────────────────────────────────────────────────────────────
export async function getChats(): Promise<ChatSummary[]> {
  return request<ChatSummary[]>("GET", "/api/chats");
}

/** No single-chat endpoint for students — resolve from the chat list. */
export async function getChat(chatId: string): Promise<ChatSummary | null> {
  const chats = await getChats();
  return chats.find((c) => c.id === chatId) ?? null;
}

export async function createChat(userId: string): Promise<ChatSummary> {
  return request<ChatSummary>("POST", "/api/chats", { userId });
}

export async function getMessages(chatId: string): Promise<Message[]> {
  return request<Message[]>("GET", `/api/chats/${chatId}/messages`);
}

export async function sendMessage(chatId: string, body: string): Promise<Message> {
  return request<Message>("POST", `/api/chats/${chatId}/messages`, { body });
}

export async function searchPeople(query: string): Promise<PersonSearchResult[]> {
  return request<PersonSearchResult[]>(
    "GET",
    `/api/chats/search-people?q=${encodeURIComponent(query)}`
  );
}
