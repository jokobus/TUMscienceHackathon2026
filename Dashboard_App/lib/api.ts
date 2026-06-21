/**
 * api.ts — the dashboard's data access layer (DB-backed).
 *
 * DEFAULT: every call hits the FastAPI backend (`/internal/**`) so the dashboard
 * shows the same DB data as the mobile clients — atomic, no contradictions. Each
 * call falls back to bundled mock data if the request fails, so the demo never
 * hard-breaks. Set NEXT_PUBLIC_USE_MOCKS=true to force offline mock mode.
 */
import { USE_MOCKS, apiGet, apiSend, getCurrentUserId } from "@/lib/http";
import * as M from "@/lib/mockData";
import type {
  Attendee,
  AssistantReply,
  AssistantTurn,
  ChatMessage,
  CreateEventInput,
  EventApplication,
  EventDetail,
  EventFollowUp,
  EventInteraction,
  EventMemory,
  EventNote,
  EventPrediction,
  EventSummary,
  HostReport,
  InternalChat,
  LiveAnalytics,
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

const DAY = 24 * 60 * 60 * 1000;

function mock<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 120));
}

/**
 * Backend-first data access.
 *
 * With NEXT_PUBLIC_USE_MOCKS=true the bundled mock is served (offline demo mode).
 * With it false (default, live DB) the live DB is AUTHORITATIVE: a failed backend
 * call propagates the error so the UI shows a real error/empty state (States.tsx)
 * instead of silently fabricating mock data that contradicts the database.
 *
 * `fallback` is therefore only used in mock mode.
 */
async function backed<T>(label: string, fallback: T, fn: () => Promise<T>): Promise<T> {
  if (USE_MOCKS) return mock(fallback);
  try {
    return await fn();
  } catch (e) {
    if (typeof console !== "undefined") console.warn(`[api] ${label} failed:`, e);
    throw e;
  }
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// ── Backend wire shapes ───────────────────────────────────────────────────────
interface EventSummaryOut {
  id: string; title: string; type: string; city: string | null; location: string | null;
  start_at: string; end_at?: string; status: string; attendee_count: number;
  health: string | null; relationship_roi: number; image_url: string | null;
  partner_university?: string | null;
}
interface EventKpisOut {
  registered: number; checked_in: number; full_sessions: number; check_in_rate: number;
  full_session_rate: number; qualified_leads: number; engagement_index: number;
  recommendation_score: number; nps_score: number | null; follow_ups_open: number;
  returning_users: number | null; cost_per_lead: number | null;
}
interface ChatSummaryOut {
  id: string; type: string; title: string; subtitle: string | null;
  last_message: string | null; last_message_at: string | null; unread: number;
  live_highlight: boolean; event_id: string | null;
}
interface MessageOut {
  id: string; chat_id: string; sender_user_id: string; sender_name: string;
  body: string; sent_at: string; is_broadcast: boolean;
}

function mapKpis(k: EventKpisOut): KpiSet {
  return {
    registered: k.registered, checked_in: k.checked_in, check_in_rate: k.check_in_rate,
    full_session_rate: k.full_session_rate, recommendation_score: k.recommendation_score,
    qualified_leads: k.qualified_leads, engagement_index: k.engagement_index,
    follow_ups_open: k.follow_ups_open, nps_score: k.nps_score,
    returning_users: k.returning_users ?? null, cost_per_lead: k.cost_per_lead ?? null,
  };
}

function mapEventSummary(e: EventSummaryOut): EventSummary {
  return {
    id: e.id, title: e.title,
    status: (e.status as EventSummary["status"]) ?? "planned",
    type: (e.type as EventSummary["type"]) ?? "other",
    health: (e.health as EventSummary["health"]) ?? "insufficient_data",
    start_at: e.start_at, city: e.city, location: e.location,
    partner_university: e.partner_university ?? null,
    relationship_roi: e.relationship_roi ?? 0, image_url: e.image_url ?? null,
    attendee_count: e.attendee_count ?? 0,
  };
}

// lead_status (qualified|checked_in|registered) → interaction_status label key
function leadToStatus(lead: string): string {
  if (lead === "qualified") return "qualified";
  if (lead === "checked_in") return "engaged";
  if (lead === "registered") return "interested";
  return lead || "new";
}

// ── Dashboard overview ────────────────────────────────────────────────────────
export function getDashboardKpis(): Promise<KpiSet> {
  return backed("getDashboardKpis", M.MOCK_DASHBOARD_KPIS, async () => {
    const d = await apiGet<{ aggregate: { registered: number; checked_in: number; qualified_leads: number; returning_users: number | null; cost_per_lead: number | null }; per_event: EventKpisOut[] }>(
      "/internal/dashboard/kpis"
    );
    const pe = d.per_event ?? [];
    const reg = d.aggregate.registered;
    return {
      registered: reg, checked_in: d.aggregate.checked_in,
      check_in_rate: reg ? d.aggregate.checked_in / reg : 0,
      full_session_rate: avg(pe.map((p) => p.full_session_rate)),
      recommendation_score: avg(pe.map((p) => p.recommendation_score)),
      qualified_leads: d.aggregate.qualified_leads,
      engagement_index: Math.round(avg(pe.map((p) => p.engagement_index))),
      follow_ups_open: pe.reduce((a, p) => a + p.follow_ups_open, 0),
      nps_score: pe.some((p) => p.nps_score != null) ? Math.round(avg(pe.filter((p) => p.nps_score != null).map((p) => p.nps_score as number))) : null,
      returning_users: d.aggregate.returning_users ?? null, cost_per_lead: d.aggregate.cost_per_lead ?? null,
    };
  });
}

export function getDashboardTimeline(): Promise<TimelineBar[]> {
  return backed("getDashboardTimeline", M.MOCK_TIMELINE, async () => {
    const events = await apiGet<EventSummaryOut[]>("/internal/dashboard/timeline");
    return events.map((e) => {
      const start = new Date(e.start_at).getTime();
      const end = e.end_at ? new Date(e.end_at).getTime() : start + DAY;
      const load: TimelineBar["human_capital_load"] =
        e.type === "hackathon" || e.type === "career_fair_booth" || e.type === "trade_fair"
          ? "high"
          : e.type === "seminar" || e.type === "technical_talk" || e.type === "conference"
            ? "medium"
            : "low";
      return {
        event_id: e.id, title: e.title, owner: null, human_capital_load: load,
        segments: [
          { kind: "preparation", start_at: new Date(start - 7 * DAY).toISOString(), end_at: e.start_at },
          { kind: "event", start_at: e.start_at, end_at: new Date(end).toISOString() },
          { kind: "follow_up", start_at: new Date(end).toISOString(), end_at: new Date(end + 7 * DAY).toISOString() },
        ],
      };
    });
  });
}

export function getDashboardPerformance(dimension: PerformanceDimension): Promise<PerformanceSeries> {
  const unit = dimension === "cost_per_lead" ? "€" : ["full_session", "returning_rate", "recommendation"].includes(dimension) ? "%" : "";
  return backed("getDashboardPerformance", M.mockPerformance(dimension), async () => {
    const d = await apiGet<{ dimension: string; points: Array<{ event_id: string; title: string; value: number }> }>(
      `/internal/dashboard/performance?dimension=${encodeURIComponent(dimension)}`
    );
    return { dimension, unit, points: d.points.map((p) => ({ event_id: p.event_id, label: p.title, value: p.value })) };
  });
}

export function getNextBestEvents(): Promise<NextBestEvent[]> {
  return backed("getNextBestEvents", M.MOCK_NEXT_BEST_EVENTS, async () => {
    const d = await apiGet<Array<{ id: string; title: string; detail: string; reason: string; category: string }>>(
      "/internal/dashboard/next-best-events"
    );
    return d.map((o) => ({
      id: o.id, title: o.title, confidence: 0.72, suggested_type: null,
      suggested_location: null, target_group: null, reason: o.reason || o.detail,
    }));
  });
}

export function getOpportunities(): Promise<Opportunity[]> {
  return backed("getOpportunities", M.MOCK_OPPORTUNITIES, async () => {
    const d = await apiGet<Array<{ id: string; title: string; detail: string; reason: string; category: string }>>(
      "/internal/opportunities"
    );
    return d.map((o) => ({ id: o.id, title: o.title, reason: o.reason || o.detail, category: o.category }));
  });
}

// ── Events ──────────────────────────────────────────────────────────────────
export function getEvents(): Promise<EventSummary[]> {
  return backed("getEvents", M.MOCK_EVENTS, async () => {
    const d = await apiGet<EventSummaryOut[]>("/internal/events");
    return d.map(mapEventSummary);
  });
}

interface EventDetailOut extends EventSummaryOut {
  description: string; goal: string | null; target_group: string | null;
  cost: number | null; human_capital: string | null;
  owner_name: string | null; partner_university: string | null;
  image_url: string | null; images: string[] | null;
  application_required?: boolean | null;
  analysis: EventDetail["analysis"];
}

export function getEvent(eventId: string): Promise<EventDetail> {
  const fallback = (): EventDetail => {
    const d = M.MOCK_EVENT_DETAIL[eventId];
    if (d) return d;
    const s = M.MOCK_EVENTS.find((e) => e.id === eventId) ?? M.MOCK_EVENTS[0];
    return { id: s.id, title: s.title, type: s.type, city: s.city, location: s.location, start_at: s.start_at, health: s.health, status: s.status, description: "", goal: null, target_group: null, cost: null, human_capital: null, owner: null, owner_name: null, partner_university: s.partner_university, image_url: s.image_url, images: s.image_url ? [s.image_url] : [], application_required: false, analysis: null };
  };
  return backed("getEvent", fallback(), async () => {
    const e = await apiGet<EventDetailOut>(`/internal/events/${eventId}`);
    // `application_required` lives on the public event payload, not the internal
    // detail; enrich best-effort so the Applications section can gate on it.
    let applicationRequired = e.application_required ?? false;
    if (e.application_required == null) {
      try {
        const pub = await apiGet<{ application_required?: boolean }>(`/api/events/${eventId}`);
        applicationRequired = Boolean(pub.application_required);
      } catch {
        /* keep default */
      }
    }
    const images = e.images ?? (e.image_url ? [e.image_url] : []);
    return {
      id: e.id, title: e.title, type: (e.type as EventDetail["type"]) ?? "other",
      city: e.city, location: e.location, start_at: e.start_at,
      health: (e.health as EventDetail["health"]) ?? "insufficient_data",
      status: (e.status as EventDetail["status"]) ?? "planned",
      description: e.description ?? "", goal: e.goal ?? null, target_group: e.target_group ?? null,
      cost: e.cost ?? null, human_capital: e.human_capital ?? null,
      owner: e.owner_name ? { display_name: e.owner_name } : null,
      owner_name: e.owner_name ?? null,
      partner_university: e.partner_university ?? null,
      image_url: e.image_url ?? null, images,
      application_required: applicationRequired,
      analysis: e.analysis ?? null,
    };
  });
}

const EMPTY_KPIS: KpiSet = {
  registered: 0, checked_in: 0, check_in_rate: 0, full_session_rate: 0,
  recommendation_score: 0, qualified_leads: 0, engagement_index: 0,
  follow_ups_open: 0, nps_score: null, returning_users: null, cost_per_lead: null,
};

export function getEventKpis(eventId: string): Promise<KpiSet> {
  // Mock-mode default only: the event's own mock KPIs, or a zeroed set for unknown
  // ids (never the dashboard aggregate). Live mode always uses the backend response.
  const fb = M.MOCK_EVENTS.find((e) => e.id === eventId)?.kpis ?? EMPTY_KPIS;
  return backed("getEventKpis", fb, async () => mapKpis(await apiGet<EventKpisOut>(`/internal/events/${eventId}/kpis`)));
}

export function getEventAttendees(eventId: string): Promise<Attendee[]> {
  return backed("getEventAttendees", M.MOCK_ATTENDEES[eventId] ?? [], async () => {
    const rows = await apiGet<Array<{ user_id: string; display_name: string; university: string | null; checked_in_at: string | null; full_session?: boolean; returning?: boolean }>>(
      `/internal/events/${eventId}/attendees`
    );
    return rows.map((r) => ({
      user_id: r.user_id, display_name: r.display_name, university: r.university,
      returning: Boolean(r.returning), checked_in_at: r.checked_in_at, full_session: Boolean(r.full_session),
    }));
  });
}

export function getEventInteractions(eventId: string): Promise<EventInteraction[]> {
  return backed("getEventInteractions", M.MOCK_INTERACTIONS[eventId] ?? [], async () => {
    const rows = await apiGet<Array<{ id: string; user_name: string | null; type: string; timestamp: string }>>(
      `/internal/events/${eventId}/interactions`
    );
    return rows.map((r) => ({ id: r.id, user: { display_name: r.user_name ?? "Unknown" }, type: r.type, timestamp: r.timestamp }));
  });
}

export function getEventFollowUps(eventId: string): Promise<EventFollowUp[]> {
  return backed("getEventFollowUps", M.MOCK_FOLLOWUPS[eventId] ?? [], async () => {
    const [rows, ev] = await Promise.all([
      apiGet<Array<{ id: string; next_action: string; contact_name: string | null; assigned_owner_id: string | null; owner_employee_id?: string | null; due_date: string | null; status: string }>>(
        `/internal/events/${eventId}/follow-ups`
      ),
      apiGet<{ owner_employee_id: string | null; owner_name: string | null }>(`/internal/events/${eventId}`).catch(() => null),
    ]);
    // The follow-up payload carries only an owner id; resolve the real owner name
    // from the event owner when it matches (the only owner-name source available),
    // otherwise fall back to a neutral label — never the hardcoded "Team".
    const ownerName = (id: string | null) =>
      ev && id && id === ev.owner_employee_id && ev.owner_name ? ev.owner_name : id ? "Assigned" : "Unassigned";
    return rows.map((r) => ({
      id: r.id, next_action: r.next_action,
      contact: { display_name: r.contact_name ?? "—" },
      assigned_owner: { display_name: ownerName(r.assigned_owner_id) },
      due_date: r.due_date, status: r.status,
    }));
  });
}

export function getHostReport(eventId: string): Promise<HostReport | null> {
  return backed("getHostReport", M.MOCK_HOST_REPORT[eventId] ?? null, async () => {
    const r = await apiGet<{ organization_rating: number; audience_relevance_rating: number; interaction_quality_rating: number; repeat_recommendation: string; notes: string | null; suggested_improvements: string | null } | null>(
      `/internal/events/${eventId}/host-report`
    );
    if (!r) return null;
    // Backend uses the §5.1 `host_recommendation` values verbatim (repeat | improve | stop).
    const rec = r.repeat_recommendation as HostReport["repeat_recommendation"];
    return { organization_rating: r.organization_rating, audience_relevance_rating: r.audience_relevance_rating, interaction_quality_rating: r.interaction_quality_rating, repeat_recommendation: rec, notes: r.notes, suggested_improvements: r.suggested_improvements };
  });
}

export async function submitHostReport(
  eventId: string,
  data: {
    organization_rating: number;
    audience_relevance_rating: number;
    interaction_quality_rating: number;
    repeat_recommendation: HostReport["repeat_recommendation"];
    notes: string | null;
    suggested_improvements: string | null;
  }
): Promise<HostReport> {
  if (USE_MOCKS) return mock<HostReport>({ ...data });
  const r = await apiSend<{ organization_rating: number; audience_relevance_rating: number; interaction_quality_rating: number; repeat_recommendation: string; notes: string | null; suggested_improvements: string | null }>(
    "POST",
    `/internal/events/${eventId}/host-report`,
    data
  );
  return {
    organization_rating: r.organization_rating,
    audience_relevance_rating: r.audience_relevance_rating,
    interaction_quality_rating: r.interaction_quality_rating,
    repeat_recommendation: r.repeat_recommendation as HostReport["repeat_recommendation"],
    notes: r.notes,
    suggested_improvements: r.suggested_improvements,
  };
}

// ── Memories (public event wall) ───────────────────────────────────────────────
export function getEventMemories(eventId: string): Promise<EventMemory[]> {
  return backed("getEventMemories", [], async () => {
    const d = await apiGet<{ items: Array<{ id: string; author_name: string | null; parent_id: string | null; body: string; images: string[] | null; created_at: string }> }>(
      `/api/events/${eventId}/memories`
    );
    return (d.items ?? []).map((m) => ({
      id: m.id, author_name: m.author_name ?? "Anonymous", parent_id: m.parent_id ?? null,
      body: m.body, images: m.images ?? [], created_at: m.created_at,
    }));
  });
}

// ── Applications ────────────────────────────────────────────────────────────────
export function getEventApplications(eventId: string): Promise<EventApplication[]> {
  return backed("getEventApplications", [], async () =>
    apiGet<EventApplication[]>(`/internal/events/${eventId}/applications`)
  );
}

export async function updateApplicationStatus(
  applicationId: string,
  status: "accepted" | "rejected" | "under_review"
): Promise<{ id: string; status: string }> {
  if (USE_MOCKS) return mock({ id: applicationId, status });
  return apiSend<{ id: string; status: string }>("PATCH", `/internal/applications/${applicationId}`, { status });
}

// ── Broadcast ───────────────────────────────────────────────────────────────────
export async function broadcastToEvent(eventId: string, body: string): Promise<void> {
  if (USE_MOCKS) { await mock(null); return; }
  await apiSend<unknown>("POST", `/internal/events/${eventId}/broadcast`, { body });
}

// ── Live sentiment ──────────────────────────────────────────────────────────────
export function getLiveAnalytics(eventId: string): Promise<LiveAnalytics> {
  const fb: LiveAnalytics = { enabled: false, average_sentiment: 0, sample_count: 0, mood: "neutral", recent: [] };
  return backed("getLiveAnalytics", fb, async () => {
    const d = await apiGet<{ enabled: boolean; average_sentiment: number; sample_count: number; mood: string; recent: Array<{ id: string; description: string; sentiment_value: number | null; created_at: string }> }>(
      `/internal/events/${eventId}/live-analytics`
    );
    return {
      enabled: d.enabled, average_sentiment: d.average_sentiment, sample_count: d.sample_count,
      mood: d.mood, recent: d.recent ?? [],
    };
  });
}

// ── Private notes ─────────────────────────────────────────────────────────────
export function getEventNotes(eventId: string): Promise<EventNote[]> {
  return backed("getEventNotes", [], async () =>
    apiGet<EventNote[]>(`/internal/events/${eventId}/notes`)
  );
}

export async function addNote(eventId: string, body: string): Promise<EventNote> {
  if (USE_MOCKS) {
    return mock<EventNote>({ id: `n-${Date.now()}`, body, author_employee_id: "you", created_at: new Date().toISOString() });
  }
  return apiSend<EventNote>("POST", `/internal/events/${eventId}/notes`, { body });
}

// ── Follow-ups (create) ─────────────────────────────────────────────────────────
export async function createFollowUp(data: {
  event_id: string;
  contact_user_id?: string | null;
  next_action: string;
  type?: string | null;
}): Promise<{ id: string }> {
  if (USE_MOCKS) return mock({ id: `fu-${Date.now()}` });
  const r = await apiSend<{ id: string }>("POST", "/internal/follow-ups", data);
  return { id: r.id };
}

// ── Contact a person (find/create a 1:1 chat, then send a message) ───────────────
/** Find-or-create a DM with the given user and post a message; returns the chat id. */
export async function messageContact(userId: string, body: string): Promise<{ chatId: string }> {
  if (USE_MOCKS) return mock({ chatId: `chat-${userId}` });
  const chat = await apiSend<{ id: string }>("POST", "/internal/chats", { user_id: userId });
  await apiSend<unknown>("POST", `/internal/chats/${chat.id}/messages`, { body });
  return { chatId: chat.id };
}

export function getEventPrediction(eventId: string): Promise<EventPrediction> {
  // Mock-mode default only: a neutral prediction for unknown ids (never another
  // event's data). Live mode always uses the backend response.
  const fb = M.MOCK_PREDICTION[eventId] ?? { outcome: "on_track", confidence: 0.5, compared_against: 0, reason: "Insufficient comparable history." };
  return backed("getEventPrediction", fb, async () => {
    const p = await apiGet<{ outcome: string; reason: string; confidence: number }>(`/internal/events/${eventId}/prediction`);
    return { outcome: p.outcome, confidence: p.confidence, compared_against: 0, reason: p.reason };
  });
}

export function getEventNextBestSteps(eventId: string): Promise<NextBestStep[]> {
  // Mock-mode default only: empty for unknown ids (never another event's steps).
  const fb = M.MOCK_NEXT_BEST_STEPS[eventId] ?? [];
  return backed("getEventNextBestSteps", fb, async () => {
    const rows = await apiGet<Array<{ kind?: string; contact_user_id: string | null; contact_name: string | null; recommended_action: string; reason: string; urgency: string }>>(
      `/internal/events/${eventId}/next-best-steps`
    );
    return rows.map((r, i) => ({
      id: `${r.contact_user_id ?? r.kind ?? "step"}-${i}`,
      kind: (r.kind as NextBestStep["kind"]) ?? "contact",
      action: r.recommended_action, rationale: r.reason, priority: r.urgency,
      creates_follow_up: true,
      contact_user_id: r.contact_user_id ?? null, contact_name: r.contact_name ?? null,
    }));
  });
}

export function getEventMaterials(eventId: string): Promise<Material[]> {
  return backed("getEventMaterials", M.MOCK_MATERIALS[eventId] ?? [], async () => {
    const rows = await apiGet<Array<{ id: string; title: string; type: string; upload_date: string; uploaded_by: string; access_count: number }>>(
      `/internal/events/${eventId}/materials`
    );
    return rows.map((r) => ({ id: r.id, title: r.title, type: r.type as MaterialType, upload_date: r.upload_date, uploaded_by: { display_name: r.uploaded_by }, access_count: r.access_count, download_count: r.access_count }));
  });
}

export async function uploadMaterial(eventId: string, data: { title: string; type: MaterialType; url: string }): Promise<Material> {
  if (USE_MOCKS) {
    return mock<Material>({ id: `mat-${Date.now()}`, title: data.title, type: data.type, upload_date: new Date().toISOString(), uploaded_by: { display_name: "You" }, access_count: 0, download_count: 0 });
  }
  const r = await apiSend<{ id: string; title: string; type: string; upload_date: string; uploaded_by: string; access_count: number }>("POST", `/internal/events/${eventId}/materials`, data);
  return { id: r.id, title: r.title, type: r.type as MaterialType, upload_date: r.upload_date, uploaded_by: { display_name: r.uploaded_by }, access_count: r.access_count, download_count: 0 };
}

export async function createEvent(input: CreateEventInput): Promise<{ id: string }> {
  if (USE_MOCKS) {
    const { id } = M.addMockEvent(input);
    return mock({ id });
  }
  const r = await apiSend<{ id: string }>("POST", "/internal/events", {
    title: input.title, type: input.type, description: input.goal ?? "",
    start_at: input.start_at, end_at: input.end_at, location: input.location, city: input.city,
    goal: input.goal, target_group: input.target_group, cost: input.cost ?? null,
    human_capital: input.human_capital, partner_university: input.partner_university, status: "planned",
  });
  return { id: r.id };
}

export async function updateEventDescription(eventId: string, description: string): Promise<void> {
  if (USE_MOCKS) { await mock(null); return; }
  await apiSend<void>("PATCH", `/internal/events/${eventId}`, { description });
}

// ── Students ──────────────────────────────────────────────────────────────────
interface StudentRowOut {
  user_id: string; display_name: string; university: string | null; study_degree: string | null;
  engagement_score: number; lead_status: string; events_attended: number;
  last_interaction_at: string | null; open_follow_ups: number;
}

function mapStudentRow(s: StudentRowOut): StudentRow {
  const activity = s.last_interaction_at ?? new Date().toISOString();
  return {
    user_id: s.user_id, display_name: s.display_name, university: s.university,
    target_group: s.study_degree, last_event: null, interest_tags: [],
    interaction_status: leadToStatus(s.lead_status), latest_activity_at: activity,
    follow_up_status: s.open_follow_ups > 0 ? "open" : "none", recommended_next_step: "",
    study_degree: s.study_degree, first_interaction_at: activity, latest_interaction_at: activity,
    event_history: [], open_follow_ups: [], project_interest: false, career_interest: false,
    returning: s.events_attended > 1, engagement_score: s.engagement_score, lead_status: s.lead_status,
  };
}

export function getStudents(opts: { sort: "priority" | "engagement" | "recency" }): Promise<StudentRow[]> {
  const sortRows = (rows: StudentRow[]) =>
    [...rows].sort((a, b) => {
      if (opts.sort === "engagement") return b.engagement_score - a.engagement_score;
      if (opts.sort === "recency") return new Date(b.latest_activity_at).getTime() - new Date(a.latest_activity_at).getTime();
      const score = (s: StudentRow) => (s.follow_up_status === "overdue" ? 100 : s.follow_up_status === "open" ? 50 : 0) + s.engagement_score;
      return score(b) - score(a);
    });
  return backed("getStudents", sortRows(M.MOCK_STUDENTS), async () => {
    const rows = await apiGet<StudentRowOut[]>("/internal/students");
    return sortRows(rows.map(mapStudentRow));
  });
}

export function getPriorityQueue(): Promise<PriorityItem[]> {
  return backed("getPriorityQueue", M.MOCK_PRIORITY_QUEUE, async () => {
    const rows = await apiGet<Array<{ user_id: string; display_name: string; urgency: string; recommended_action: string; reason: string; confidence: number }>>(
      "/internal/priority-queue"
    );
    return rows.map((r) => ({ user_id: r.user_id, display_name: r.display_name, urgency: r.urgency, recommended_action: r.recommended_action, reason: r.reason, confidence: r.confidence }));
  });
}

export function getStudentDetail(studentId: string): Promise<StudentRow> {
  const fb = M.MOCK_STUDENTS.find((x) => x.user_id === studentId) ?? M.MOCK_STUDENTS[0];
  return backed("getStudentDetail", fb, async () => {
    const s = await apiGet<StudentRowOut & { hometown: string | null; interests: string[]; recommended_next_action: string | null; follow_ups: Array<{ id: string; next_action: string; due_date: string | null; status: string }> }>(
      `/internal/students/${studentId}`
    );
    const base = mapStudentRow(s);
    return {
      ...base,
      interest_tags: s.interests ?? [],
      recommended_next_step: s.recommended_next_action ?? "",
      follow_up_status: (s.follow_ups?.length ?? 0) > 0 ? "open" : "none",
      open_follow_ups: (s.follow_ups ?? []).map((f) => ({ id: f.id, next_action: f.next_action, assigned_owner: { display_name: "Team" }, due_date: f.due_date, status: f.status })),
    };
  });
}

export function getStudentTimeline(studentId: string): Promise<StudentTimelineEntry[]> {
  return backed("getStudentTimeline", M.MOCK_STUDENT_TIMELINE[studentId] ?? [], async () => {
    const rows = await apiGet<Array<{ id: string; event_title: string | null; type: string; timestamp: string }>>(
      `/internal/students/${studentId}/timeline`
    );
    return rows.map((r) => ({ id: r.id, type: r.type, detail: null, event_title: r.event_title, timestamp: r.timestamp }));
  });
}

// ── Communication ─────────────────────────────────────────────────────────────
export function getInternalChats(): Promise<InternalChat[]> {
  return backed("getInternalChats", M.MOCK_INTERNAL_CHATS, async () => {
    const rows = await apiGet<ChatSummaryOut[]>("/internal/chats");
    return rows.map((c) => ({ id: c.id, title: c.title, unread: c.unread, last_message_preview: c.last_message ?? "" }));
  });
}

export function getStudentConversations(): Promise<StudentConversation[]> {
  return backed("getStudentConversations", M.MOCK_STUDENT_CONVERSATIONS, async () => {
    const rows = await apiGet<ChatSummaryOut[]>("/internal/student-conversations");
    return rows.map((c) => ({ id: c.id, title: c.title, follow_up_needed: c.live_highlight, unread: c.unread, last_message_preview: c.last_message ?? "", priority_signals: c.subtitle ? [c.subtitle] : [] }));
  });
}

export function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  return backed("getChatMessages", M.MOCK_MESSAGES[chatId] ?? [], async () => {
    const rows = await apiGet<MessageOut[]>(`/internal/chats/${chatId}/messages`);
    const me = getCurrentUserId();
    return rows.map((m) => ({ id: m.id, mine: m.sender_user_id === me, sender: { display_name: m.sender_name }, body: m.body, sent_at: m.sent_at }));
  });
}

// ── Assistant ─────────────────────────────────────────────────────────────────
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
    return { answer: data.answer ?? "No answer.", actions: Array.isArray(data.actions) ? data.actions : [] };
  } catch {
    return { answer: "The assistant is unavailable right now.", actions: [] };
  }
}
