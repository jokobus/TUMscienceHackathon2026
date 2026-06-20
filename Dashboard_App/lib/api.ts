/**
 * api.ts — the ONE place every page talks to for /internal/** data.
 *
 * ┌─ How the swap works ──────────────────────────────────────────────────┐
 * │ Every function below is shaped like the real endpoint it represents.   │
 * │ While NEXT_PUBLIC_USE_MOCKS is "true" it returns dummy data from        │
 * │ lib/mocks.ts. Flip the flag to "false" (env) and the SAME function      │
 * │ instead does `request<T>(method, path, ...)` against the FastAPI        │
 * │ backend. Pages never change — only this file's branch does.            │
 * │                                                                         │
 * │ To wire a real endpoint: delete the `if (USE_MOCKS) return …` line and  │
 * │ the `request(...)` call underneath is already correct, or tweak the     │
 * │ path/params. Signatures and return types are the contract.             │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
import * as M from "./mocks";
import type {
  AssistantReply,
  AssistantTurn,
  Attendee,
  ChatMessage,
  ChatThread,
  CreateEventInput,
  EventDetail,
  EventPrediction,
  EventSummary,
  ExecutiveSummary,
  FollowUp,
  FollowUpStatus,
  HostReport,
  InteractionLogEntry,
  KpiSet,
  Material,
  NextBestEvent,
  NextBestStep,
  Opportunity,
  PerformanceDimension,
  PerformanceSeries,
  PriorityQueueItem,
  StudentConversation,
  StudentDetail,
  StudentRow,
  StudentTimelineEntry,
  TimelineBar,
} from "./types";
import { MOCK_EVENTS } from "./mocks";

// ── Config ───────────────────────────────────────────────────────────────────
export const USE_MOCKS =
  (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true").toLowerCase() !== "false";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

/** Simulated network latency so loading/skeleton states are exercised in mock mode. */
function delay<T>(value: T, ms = 220): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/**
 * The real transport. Used by every function once mocks are off.
 * Adds the auth header, the /internal base, JSON parsing and the §3 error envelope.
 */
async function request<T>(
  method: string,
  path: string,
  opts: { query?: Record<string, string | number | undefined>; body?: unknown } = {}
): Promise<T> {
  const url = new URL(API_BASE + path);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    // Consistent error envelope per Master §3.1
    let message = res.statusText;
    try {
      const j = await res.json();
      message = j?.error?.message ?? message;
    } catch {
      /* ignore */
    }
    throw new Error(`[${res.status}] ${message}`);
  }
  return (await res.json()) as T;
}

function authHeader(): Record<string, string> {
  // TODO: replace with the real employee token from the auth flow.
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("we_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ════════════════════════════════════════════════════════════════════════════
// 1) Dashboard (global) — §6.7
// ════════════════════════════════════════════════════════════════════════════

export function getDashboardSummary(): Promise<ExecutiveSummary> {
  if (USE_MOCKS) return delay(M.MOCK_SUMMARY);
  return request("GET", "/internal/dashboard/summary");
}

export function getDashboardPerformance(
  dimension: PerformanceDimension
): Promise<PerformanceSeries> {
  if (USE_MOCKS) return delay(M.mockPerformance(dimension));
  return request("GET", "/internal/dashboard/performance", { query: { dimension } });
}

export function getNextBestEvents(): Promise<NextBestEvent[]> {
  if (USE_MOCKS) return delay(M.MOCK_NEXT_BEST_EVENTS);
  return request("GET", "/internal/dashboard/next-best-events");
}

export function getDashboardTimeline(): Promise<TimelineBar[]> {
  if (USE_MOCKS) return delay(M.MOCK_TIMELINE);
  return request("GET", "/internal/dashboard/timeline");
}

export function getDashboardKpis(): Promise<KpiSet> {
  if (USE_MOCKS) return delay(M.mockKpis());
  return request("GET", "/internal/dashboard/kpis");
}

// ════════════════════════════════════════════════════════════════════════════
// 2) Events — §6.8
// ════════════════════════════════════════════════════════════════════════════

export function getEvents(): Promise<EventSummary[]> {
  if (USE_MOCKS) return delay(MOCK_EVENTS);
  return request("GET", "/internal/events");
}

export function getEvent(eventId: string): Promise<EventDetail> {
  if (USE_MOCKS) {
    const base = MOCK_EVENTS.find((e) => e.id === eventId) ?? MOCK_EVENTS[0];
    const detail: EventDetail = {
      ...base,
      description:
        "Join Würth Elektronik for a hands-on session on power electronics and component selection. Network with our engineers and explore sample & design-in support.",
      target_group: base.partner_university ?? "Engineering students",
      goal: "Strengthen relationships with high-potential EE/CS students.",
      cost: 6500,
      human_capital: "Owner + 2 technical experts; ~3 days prep, 2 weeks follow-up.",
      application_required: false,
      files_after_event: true,
      source: "scraped",
      responsible_employees: base.owner ? [base.owner] : [],
      analysis:
        base.status === "past" || base.status === "ongoing"
          ? {
              summary:
                "Strong technical engagement and above-average returning-user rate. Follow-up momentum is the main lever for ROI.",
              brand_retention_signal: 79,
              relationship_roi: base.relationship_roi,
              highlights: [
                "121 of 142 attendees stayed the full session",
                "54 returning users — highest of the quarter",
                "19 attendees triggered project/career interest",
              ],
            }
          : null,
    };
    return delay(detail);
  }
  return request("GET", `/internal/events/${eventId}`);
}

export function getEventKpis(eventId: string): Promise<KpiSet> {
  if (USE_MOCKS) return delay(M.mockKpis(eventId));
  return request("GET", `/internal/events/${eventId}/kpis`);
}

export function getEventAttendees(eventId: string): Promise<Attendee[]> {
  if (USE_MOCKS) return delay(M.mockAttendees(eventId));
  return request("GET", `/internal/events/${eventId}/attendees`);
}

export function getEventInteractions(eventId: string): Promise<InteractionLogEntry[]> {
  if (USE_MOCKS) return delay(M.mockInteractions(eventId));
  return request("GET", `/internal/events/${eventId}/interactions`);
}

export function getEventNextBestSteps(eventId: string): Promise<NextBestStep[]> {
  if (USE_MOCKS) return delay(M.mockNextBestSteps(eventId));
  return request("GET", `/internal/events/${eventId}/next-best-steps`);
}

export function getEventPrediction(eventId: string): Promise<EventPrediction> {
  if (USE_MOCKS) return delay(M.mockPrediction(eventId));
  return request("GET", `/internal/events/${eventId}/prediction`);
}

export function createEvent(input: CreateEventInput): Promise<EventDetail> {
  if (USE_MOCKS) {
    const created: EventSummary = {
      id: "ev-new-" + Math.random().toString(36).slice(2, 7),
      title: input.title,
      type: input.type,
      status: "planned",
      city: input.city ?? null,
      location: input.location ?? null,
      start_at: input.start_at,
      end_at: input.end_at,
      partner_university: input.partner_university ?? null,
      owner: M.EMP.simon,
      health: "insufficient_data",
      relationship_roi: 0,
    };
    return delay({
      ...created,
      description: input.goal ?? "",
      target_group: input.target_group ?? null,
      goal: input.goal ?? null,
      cost: input.cost ?? null,
      human_capital: input.human_capital ?? null,
      application_required: false,
      files_after_event: false,
      source: "manual",
      responsible_employees: [M.EMP.simon],
      analysis: null,
    });
  }
  return request("POST", "/internal/events", { body: input });
}

export function updateEventDescription(
  eventId: string,
  description: string
): Promise<EventDetail> {
  if (USE_MOCKS) return getEvent(eventId).then((e) => ({ ...e, description }));
  return request("PATCH", `/internal/events/${eventId}`, { body: { description } });
}

// ════════════════════════════════════════════════════════════════════════════
// Materials — §6.10
// ════════════════════════════════════════════════════════════════════════════

export function getEventMaterials(eventId: string): Promise<Material[]> {
  if (USE_MOCKS) return delay(M.mockMaterials(eventId));
  return request("GET", `/internal/events/${eventId}/materials`);
}

// Note: real upload is multipart/form-data (Master §3.1). Mock just echoes a row.
export function uploadMaterial(
  eventId: string,
  data: { title: string; type: Material["type"]; url: string }
): Promise<Material> {
  if (USE_MOCKS)
    return delay({
      id: "mat-" + Math.random().toString(36).slice(2, 7),
      event_id: eventId,
      type: data.type,
      title: data.title,
      url: data.url,
      uploaded_by: M.EMP.simon,
      upload_date: new Date().toISOString(),
      access_count: 0,
      download_count: 0,
    });
  return request("POST", `/internal/events/${eventId}/materials`, { body: data });
}

// ════════════════════════════════════════════════════════════════════════════
// Host report — §6.12
// ════════════════════════════════════════════════════════════════════════════

export function getHostReport(eventId: string): Promise<HostReport | null> {
  if (USE_MOCKS) return delay(M.mockHostReport(eventId));
  return request("GET", `/internal/events/${eventId}/host-report`);
}

// ════════════════════════════════════════════════════════════════════════════
// Follow-ups — §6.13
// ════════════════════════════════════════════════════════════════════════════

export function getFollowUps(query?: {
  event_id?: string;
  owner_id?: string;
  status?: FollowUpStatus;
}): Promise<FollowUp[]> {
  if (USE_MOCKS) return delay(M.mockFollowUps(query?.event_id));
  return request("GET", "/internal/follow-ups", { query });
}

export function getEventFollowUps(eventId: string): Promise<FollowUp[]> {
  if (USE_MOCKS) return delay(M.mockFollowUps(eventId));
  return request("GET", `/internal/events/${eventId}/follow-ups`);
}

export function createFollowUp(body: Partial<FollowUp>): Promise<FollowUp> {
  if (USE_MOCKS)
    return delay({
      id: "fu-" + Math.random().toString(36).slice(2, 7),
      event_id: body.event_id ?? "",
      contact: body.contact ?? { user_id: "", display_name: "" },
      assigned_owner: body.assigned_owner ?? M.EMP.simon,
      next_action: body.next_action ?? "",
      status: "open",
      created_at: new Date().toISOString(),
      ...body,
    } as FollowUp);
  return request("POST", "/internal/follow-ups", { body });
}

export function updateFollowUp(
  id: string,
  patch: { status?: FollowUpStatus; outcome?: string }
): Promise<FollowUp> {
  if (USE_MOCKS)
    return delay({ ...M.MOCK_FOLLOW_UPS[0], id, ...patch } as FollowUp);
  return request("PATCH", `/internal/follow-ups/${id}`, { body: patch });
}

// ════════════════════════════════════════════════════════════════════════════
// Students — §6.14
// ════════════════════════════════════════════════════════════════════════════

export function getStudents(query?: {
  sort?: "priority" | "engagement" | "recency";
  university?: string;
  interest_tag?: string;
  follow_up_status?: FollowUpStatus;
}): Promise<StudentRow[]> {
  if (USE_MOCKS) return delay(M.MOCK_STUDENT_ROWS);
  return request("GET", "/internal/students", { query });
}

export function getStudentDetail(studentId: string): Promise<StudentDetail> {
  if (USE_MOCKS) return delay(M.mockStudentDetail(studentId));
  return request("GET", `/internal/students/${studentId}`);
}

export function getStudentTimeline(studentId: string): Promise<StudentTimelineEntry[]> {
  if (USE_MOCKS) return delay(M.mockStudentTimeline(studentId));
  return request("GET", `/internal/students/${studentId}/timeline`);
}

export function getPriorityQueue(): Promise<PriorityQueueItem[]> {
  if (USE_MOCKS) return delay(M.MOCK_PRIORITY_QUEUE);
  return request("GET", "/internal/priority-queue");
}

// ════════════════════════════════════════════════════════════════════════════
// Opportunities / assistant — §6.17
// ════════════════════════════════════════════════════════════════════════════

export function getOpportunities(): Promise<Opportunity[]> {
  if (USE_MOCKS) return delay(M.MOCK_OPPORTUNITIES);
  return request("GET", "/internal/opportunities");
}

export function askOpportunityAssistant(prompt: string): Promise<AssistantReply> {
  if (USE_MOCKS) return delay(M.mockAssistantReply(prompt), 600);
  return request("POST", "/internal/opportunities/assistant", { body: { prompt } });
}

// ════════════════════════════════════════════════════════════════════════════
// Communication Hub — §6.16  (history via REST, live via WS §7)
// ════════════════════════════════════════════════════════════════════════════

export function getInternalChats(): Promise<ChatThread[]> {
  if (USE_MOCKS) return delay(M.MOCK_INTERNAL_CHATS);
  return request("GET", "/internal/chats");
}

export function getStudentConversations(): Promise<StudentConversation[]> {
  if (USE_MOCKS) return delay(M.MOCK_STUDENT_CONVERSATIONS);
  return request("GET", "/internal/student-conversations");
}

export function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  if (USE_MOCKS) return delay(M.mockMessages(chatId));
  return request("GET", `/internal/chats/${chatId}/messages`);
}

// ════════════════════════════════════════════════════════════════════════════
// Global Assistant (top-bar co-pilot)
// ════════════════════════════════════════════════════════════════════════════

export function askAssistant(prompt: string): Promise<AssistantTurn> {
  if (USE_MOCKS) return delay(M.mockAssistant(prompt), 550);
  return request("POST", "/internal/assistant", { body: { prompt } });
}
