/**
 * api.ts — the dashboard's data access layer.
 *
 * MOCK-FIRST: with USE_MOCKS on (default), every call resolves from
 * lib/mockData.ts so the pitch demo runs fully offline. With
 * NEXT_PUBLIC_USE_MOCKS=false, calls that have a clean backend mapping hit the
 * FastAPI `/internal/**` API; the remaining (dashboard-only view models that the
 * backend doesn't expose yet) fall back to mocks with a console warning. Wiring
 * those last endpoints to the backend is the only remaining REST work.
 */
import { USE_MOCKS, apiGet, apiSend } from "@/lib/http";
import * as M from "@/lib/mockData";
import type {
  Attendee,
  AssistantReply,
  AssistantTurn,
  ChatMessage,
  CreateEventInput,
  EventDetail,
  EventFollowUp,
  EventInteraction,
  EventPrediction,
  EventSummary,
  HostReport,
  InternalChat,
  KpiSet,
  Material,
  MaterialType,
  NextBestEvent,
  NextBestStep,
  Opportunity,
  PerformanceDimension,
  PerformanceSeries,
  PriorityItem,
  StudentConversation,
  StudentRow,
  StudentTimelineEntry,
  TimelineBar,
} from "@/lib/types";

export { USE_MOCKS };

/** Resolve a mock value with a small delay so loading states are visible. */
function mock<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 180));
}

/** REST mode for an endpoint we haven't mapped yet → mock + warn. */
function notWired<T>(fn: string, value: T): Promise<T> {
  if (typeof console !== "undefined") {
    console.warn(`[api] ${fn}: no backend mapping yet — serving mock data.`);
  }
  return Promise.resolve(value);
}

// ── Backend wire shapes (subset of Backend/app/schemas.py) ───────────────────
interface EventSummaryOut {
  id: string;
  title: string;
  type: string;
  city: string | null;
  location: string | null;
  start_at: string;
  status: string;
  attendee_count: number;
  health: string | null;
  relationship_roi: number;
  image_url: string | null;
  partner_university?: string | null;
}
interface EventKpisOut {
  registered: number;
  checked_in: number;
  full_sessions: number;
  check_in_rate: number;
  full_session_rate: number;
  qualified_leads: number;
  engagement_index: number;
  recommendation_score: number;
  nps_score: number | null;
  follow_ups_open: number;
}

function mapKpis(k: EventKpisOut): KpiSet {
  return {
    registered: k.registered,
    checked_in: k.checked_in,
    check_in_rate: k.check_in_rate,
    full_session_rate: k.full_session_rate,
    recommendation_score: k.recommendation_score,
    qualified_leads: k.qualified_leads,
    engagement_index: k.engagement_index,
    follow_ups_open: k.follow_ups_open,
    nps_score: k.nps_score,
    returning_users: null,
    cost_per_lead: null,
  };
}

function mapEventSummary(e: EventSummaryOut): EventSummary {
  return {
    id: e.id,
    title: e.title,
    status: (e.status as EventSummary["status"]) ?? "planned",
    type: (e.type as EventSummary["type"]) ?? "workshop",
    health: (e.health as EventSummary["health"]) ?? "on_track",
    start_at: e.start_at,
    city: e.city,
    location: e.location,
    partner_university: e.partner_university ?? null,
    relationship_roi: e.relationship_roi ?? 0,
    image_url: e.image_url ?? null,
    attendee_count: e.attendee_count ?? 0,
  };
}

// ── Dashboard overview ────────────────────────────────────────────────────────
export function getDashboardKpis(): Promise<KpiSet> {
  if (USE_MOCKS) return mock(M.MOCK_DASHBOARD_KPIS);
  return notWired("getDashboardKpis", M.MOCK_DASHBOARD_KPIS);
}

export function getDashboardTimeline(): Promise<TimelineBar[]> {
  if (USE_MOCKS) return mock(M.MOCK_TIMELINE);
  return notWired("getDashboardTimeline", M.MOCK_TIMELINE);
}

export function getDashboardPerformance(
  dimension: PerformanceDimension
): Promise<PerformanceSeries> {
  if (USE_MOCKS) return mock(M.mockPerformance(dimension));
  return notWired("getDashboardPerformance", M.mockPerformance(dimension));
}

export function getNextBestEvents(): Promise<NextBestEvent[]> {
  if (USE_MOCKS) return mock(M.MOCK_NEXT_BEST_EVENTS);
  return notWired("getNextBestEvents", M.MOCK_NEXT_BEST_EVENTS);
}

export function getOpportunities(): Promise<Opportunity[]> {
  if (USE_MOCKS) return mock(M.MOCK_OPPORTUNITIES);
  return notWired("getOpportunities", M.MOCK_OPPORTUNITIES);
}

// ── Events ──────────────────────────────────────────────────────────────────
export async function getEvents(): Promise<EventSummary[]> {
  if (USE_MOCKS) return mock(M.MOCK_EVENTS);
  const data = await apiGet<EventSummaryOut[]>("/internal/events");
  return data.map(mapEventSummary);
}

export async function getEvent(eventId: string): Promise<EventDetail> {
  if (USE_MOCKS) {
    const detail = M.MOCK_EVENT_DETAIL[eventId];
    if (detail) return mock(detail);
    // Derive a minimal detail from the summary for events without a full mock.
    const s = M.MOCK_EVENTS.find((e) => e.id === eventId) ?? M.MOCK_EVENTS[0];
    return mock<EventDetail>({
      id: s.id,
      title: s.title,
      type: s.type,
      city: s.city,
      location: s.location,
      start_at: s.start_at,
      health: s.health,
      status: s.status,
      description: "Event details are being finalised.",
      goal: null,
      target_group: null,
      cost: null,
      human_capital: null,
      owner: null,
      analysis: null,
    });
  }
  const e = await apiGet<EventSummaryOut & { description: string; goal: string | null; target_group: string | null; cost: number | null; human_capital: string | null; analysis: EventDetail["analysis"] }>(
    `/internal/events/${eventId}`
  );
  return {
    id: e.id,
    title: e.title,
    type: (e.type as EventDetail["type"]) ?? "workshop",
    city: e.city,
    location: e.location,
    start_at: e.start_at,
    health: (e.health as EventDetail["health"]) ?? "on_track",
    status: (e.status as EventDetail["status"]) ?? "planned",
    description: e.description ?? "",
    goal: e.goal ?? null,
    target_group: e.target_group ?? null,
    cost: e.cost ?? null,
    human_capital: e.human_capital ?? null,
    owner: null,
    analysis: e.analysis ?? null,
  };
}

export async function getEventKpis(eventId: string): Promise<KpiSet> {
  if (USE_MOCKS) {
    const ev = M.MOCK_EVENTS.find((e) => e.id === eventId);
    return mock(ev?.kpis ?? M.MOCK_DASHBOARD_KPIS);
  }
  const k = await apiGet<EventKpisOut>(`/internal/events/${eventId}/kpis`);
  return mapKpis(k);
}

export async function getEventAttendees(eventId: string): Promise<Attendee[]> {
  if (USE_MOCKS) return mock(M.MOCK_ATTENDEES[eventId] ?? []);
  const rows = await apiGet<Array<{ user_id: string; display_name: string; university: string | null; checked_in_at: string | null }>>(
    `/internal/events/${eventId}/attendees`
  );
  return rows.map((r) => ({
    user_id: r.user_id,
    display_name: r.display_name,
    university: r.university,
    returning: false,
    checked_in_at: r.checked_in_at,
    checked_out_at: null,
  }));
}

export async function getEventInteractions(eventId: string): Promise<EventInteraction[]> {
  if (USE_MOCKS) return mock(M.MOCK_INTERACTIONS[eventId] ?? []);
  const rows = await apiGet<Array<{ id: string; user_name: string | null; type: string; timestamp: string }>>(
    `/internal/events/${eventId}/interactions`
  );
  return rows.map((r) => ({
    id: r.id,
    user: { display_name: r.user_name ?? "Unknown" },
    type: r.type,
    timestamp: r.timestamp,
  }));
}

export function getEventFollowUps(eventId: string): Promise<EventFollowUp[]> {
  if (USE_MOCKS) return mock(M.MOCK_FOLLOWUPS[eventId] ?? []);
  return notWired("getEventFollowUps", M.MOCK_FOLLOWUPS[eventId] ?? []);
}

export function getHostReport(eventId: string): Promise<HostReport | null> {
  if (USE_MOCKS) return mock(M.MOCK_HOST_REPORT[eventId] ?? null);
  return notWired("getHostReport", M.MOCK_HOST_REPORT[eventId] ?? null);
}

export function getEventPrediction(eventId: string): Promise<EventPrediction> {
  const fallback = M.MOCK_PREDICTION[eventId] ?? M.MOCK_PREDICTION["ev-1"];
  if (USE_MOCKS) return mock(fallback);
  return notWired("getEventPrediction", fallback);
}

export function getEventNextBestSteps(eventId: string): Promise<NextBestStep[]> {
  if (USE_MOCKS) return mock(M.MOCK_NEXT_BEST_STEPS[eventId] ?? M.MOCK_NEXT_BEST_STEPS["ev-1"]);
  return notWired("getEventNextBestSteps", M.MOCK_NEXT_BEST_STEPS[eventId] ?? []);
}

export async function getEventMaterials(eventId: string): Promise<Material[]> {
  if (USE_MOCKS) return mock(M.MOCK_MATERIALS[eventId] ?? []);
  const rows = await apiGet<Array<{ id: string; title: string; type: string; upload_date: string; uploaded_by: string; access_count: number }>>(
    `/internal/events/${eventId}/materials`
  );
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type as MaterialType,
    upload_date: r.upload_date,
    uploaded_by: { display_name: r.uploaded_by },
    access_count: r.access_count,
    download_count: r.access_count,
  }));
}

export async function uploadMaterial(
  eventId: string,
  data: { title: string; type: MaterialType; url: string }
): Promise<Material> {
  if (USE_MOCKS) {
    return mock<Material>({
      id: `mat-${data.title.toLowerCase().replace(/\s+/g, "-")}`,
      title: data.title,
      type: data.type,
      upload_date: new Date().toISOString(),
      uploaded_by: { display_name: "You" },
      access_count: 0,
      download_count: 0,
    });
  }
  const r = await apiSend<{ id: string; title: string; type: string; upload_date: string; uploaded_by: string; access_count: number }>(
    "POST",
    `/internal/events/${eventId}/materials`,
    data
  );
  return {
    id: r.id,
    title: r.title,
    type: r.type as MaterialType,
    upload_date: r.upload_date,
    uploaded_by: { display_name: r.uploaded_by },
    access_count: r.access_count,
    download_count: 0,
  };
}

export async function createEvent(input: CreateEventInput): Promise<{ id: string }> {
  if (USE_MOCKS) return mock({ id: `ev-${Date.now()}` });
  const r = await apiSend<{ id: string }>("POST", "/internal/events", {
    title: input.title,
    type: input.type,
    start_at: input.start_at,
    end_at: input.end_at,
    location: input.location,
    city: input.city,
    goal: input.goal,
    target_group: input.target_group,
    cost: input.cost ?? null,
    human_capital: input.human_capital,
    partner_university: input.partner_university,
  });
  return { id: r.id };
}

export async function updateEventDescription(
  eventId: string,
  description: string
): Promise<void> {
  if (USE_MOCKS) {
    await mock(null);
    return;
  }
  await apiSend<void>("PATCH", `/internal/events/${eventId}`, { description });
}

// ── Students ──────────────────────────────────────────────────────────────────
export function getStudents(opts: { sort: "priority" | "engagement" | "recency" }): Promise<StudentRow[]> {
  const sorted = [...M.MOCK_STUDENTS].sort((a, b) => {
    if (opts.sort === "engagement") return b.engagement_score - a.engagement_score;
    if (opts.sort === "recency")
      return new Date(b.latest_activity_at).getTime() - new Date(a.latest_activity_at).getTime();
    // priority: open/overdue follow-ups first, then engagement
    const score = (s: StudentRow) =>
      (s.follow_up_status === "overdue" ? 100 : s.follow_up_status === "open" ? 50 : 0) +
      s.engagement_score;
    return score(b) - score(a);
  });
  if (USE_MOCKS) return mock(sorted);
  return notWired("getStudents", sorted);
}

export function getPriorityQueue(): Promise<PriorityItem[]> {
  if (USE_MOCKS) return mock(M.MOCK_PRIORITY_QUEUE);
  return notWired("getPriorityQueue", M.MOCK_PRIORITY_QUEUE);
}

export function getStudentDetail(studentId: string): Promise<StudentRow> {
  const s = M.MOCK_STUDENTS.find((x) => x.user_id === studentId) ?? M.MOCK_STUDENTS[0];
  if (USE_MOCKS) return mock(s);
  return notWired("getStudentDetail", s);
}

export function getStudentTimeline(studentId: string): Promise<StudentTimelineEntry[]> {
  const t = M.MOCK_STUDENT_TIMELINE[studentId] ?? [];
  if (USE_MOCKS) return mock(t);
  return notWired("getStudentTimeline", t);
}

// ── Communication ─────────────────────────────────────────────────────────────
export function getInternalChats(): Promise<InternalChat[]> {
  if (USE_MOCKS) return mock(M.MOCK_INTERNAL_CHATS);
  return notWired("getInternalChats", M.MOCK_INTERNAL_CHATS);
}

export function getStudentConversations(): Promise<StudentConversation[]> {
  if (USE_MOCKS) return mock(M.MOCK_STUDENT_CONVERSATIONS);
  return notWired("getStudentConversations", M.MOCK_STUDENT_CONVERSATIONS);
}

export function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  if (USE_MOCKS) return mock(M.MOCK_MESSAGES[chatId] ?? []);
  return notWired("getChatMessages", M.MOCK_MESSAGES[chatId] ?? []);
}

// ── Assistant ─────────────────────────────────────────────────────────────────
/**
 * The opportunity-creation assistant. Calls the Next.js route (/api/assistant),
 * which proxies OpenRouter and returns { answer, actions }. We surface the answer
 * as a recommendation. Works identically in mock and backend mode.
 */
export async function askOpportunityAssistant(prompt: string): Promise<AssistantReply> {
  const turn = await askAssistant(prompt);
  return { recommendation: turn.answer, reasoning: turn.actions.map((a) => a.label).join(", ") };
}

export async function askAssistant(prompt: string): Promise<AssistantTurn> {
  try {
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    return {
      answer: data.answer ?? "No answer.",
      actions: Array.isArray(data.actions) ? data.actions : [],
    };
  } catch {
    return { answer: "The assistant is unavailable right now.", actions: [] };
  }
}
