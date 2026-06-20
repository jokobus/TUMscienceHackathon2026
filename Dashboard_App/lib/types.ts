/**
 * types.ts — typed mirror of the WEave shared contract (WEAVE_MASTER.md §5/§6)
 * for the parts the Würth Dashboard consumes.
 *
 * The backend owns the canonical shape. If the contract changes, update here
 * first, then the code. JSON is snake_case on the wire (Master §4); we keep
 * snake_case in these types so payloads map 1:1 with no remapping layer.
 */

// ──────────────────────────────────────────────────────────────────────────
// Enums (Master §5.1 — do not invent values elsewhere)
// ──────────────────────────────────────────────────────────────────────────

export type UserRole = "student" | "employee" | "guest";

export type EventType =
  | "hackathon"
  | "guest_lecture"
  | "career_fair_booth"
  | "excursion"
  | "student_team"
  | "technical_talk"
  | "one_on_one"
  | "seminar"
  | "webinar"
  | "conference"
  | "trade_fair"
  | "other";

export type EventStatus =
  | "draft"
  | "planned"
  | "upcoming"
  | "ongoing"
  | "past"
  | "cancelled";

export type EventSource = "manual" | "scraped";

export type InteractionType =
  | "check_in"
  | "check_out"
  | "full_session"
  | "file_view"
  | "file_download"
  | "memory_post"
  | "question_asked"
  | "chat_activity"
  | "application_submitted"
  | "sample_interest"
  | "project_interest"
  | "career_interest"
  | "follow_up_request"
  | "recommendation_submitted"
  | "connection"
  | "re_engagement"
  | "repost";

export type MaterialType =
  | "slides"
  | "pdf"
  | "image"
  | "link"
  | "qa_summary"
  | "product_info"
  | "project_doc"
  | "follow_up_resource";

export type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "accepted"
  | "rejected";

export type FollowUpStatus = "open" | "in_progress" | "done" | "closed";

export type HostRecommendation = "repeat" | "improve" | "stop";

export type ChatType = "dm" | "event_channel" | "internal" | "student_conversation";

export type EventHealth =
  | "high_relationship_roi"
  | "strong_brand_retention"
  | "high_engagement_needs_followup"
  | "good_awareness"
  | "low_continuity"
  | "weak_followup"
  | "likely_underperforming"
  | "needs_review"
  | "insufficient_data";

export type PredictionOutcome =
  | "high_confidence_success"
  | "promising_uncertain"
  | "relationship_potential"
  | "risk_low_engagement"
  | "likely_underperforming"
  | "insufficient_data";

/** Neutral statuses students may see (Master §8.4) — surfaced read-only here. */
export type NeutralStudentStatus =
  | "connected"
  | "material_available"
  | "follow_up_open"
  | "project_support_requested"
  | "career_interest_submitted"
  | "application_context_available";

/** Performance-chart dimensions (AGENT §1.2 / endpoint query param). */
export type PerformanceDimension =
  | "relationship_roi"
  | "brand_retention"
  | "engagement"
  | "returning_rate"
  | "recommendation"
  | "full_session"
  | "follow_ups"
  | "cost_per_lead"
  | "host_experience"
  | "health";

// ──────────────────────────────────────────────────────────────────────────
// Core entities
// ──────────────────────────────────────────────────────────────────────────

export interface EmployeeRef {
  user_id: string;
  display_name: string;
  avatar_url?: string | null;
}

export interface EventSummary {
  id: string;
  title: string;
  type: EventType;
  status: EventStatus;
  city?: string | null;
  location?: string | null;
  start_at: string; // ISO-8601 UTC
  end_at: string;
  partner_university?: string | null;
  owner?: EmployeeRef | null;
  health: EventHealth;
  relationship_roi: number; // 0–100 index
  image_url?: string | null; // host-city / event image for the card
}

export interface EventDetail extends EventSummary {
  description: string; // student-facing, editable
  target_group?: string | null;
  goal?: string | null;
  cost?: number | null;
  human_capital?: string | null;
  application_required: boolean;
  application_open_at?: string | null;
  application_close_at?: string | null;
  files_after_event: boolean;
  source: EventSource;
  responsible_employees: EmployeeRef[];
  /** Present when status is `ongoing` or `past`. */
  analysis?: EventAnalysis | null;
}

export interface EventAnalysis {
  summary: string;
  brand_retention_signal: number; // 0–100
  relationship_roi: number; // 0–100
  highlights: string[];
}

// ── KPIs ──────────────────────────────────────────────────────────────────
// Mirrors PDF §13 KPI mapping. Used by both global and per-event KPI views.

export interface KpiSet {
  visitor_count: number;
  registered: number;
  appeared: number; // checked-in
  full_session: number; // checked-out / stayed whole session
  recommendation_score: number; // 0–10
  nps_score?: number | null;
  new_users: number;
  returning_users: number;
  qualified_leads: number;
  cost_per_lead?: number | null; // currency
  avg_engagement: number; // 0–100
  avg_follow_up_actions: number;
  host_experience?: number | null; // 0–5
}

// ── Dashboard (global) ─────────────────────────────────────────────────────

export interface ExecutiveSummary {
  best_event?: { event_id: string; title: string; metric: string } | null;
  weakest_event?: { event_id: string; title: string; metric: string } | null;
  strongest_brand_retention?: { event_id: string; title: string; value: number } | null;
  highest_relationship_roi?: { event_id: string; title: string; value: number } | null;
  most_urgent_follow_up_cluster?: { label: string; count: number } | null;
  next_best_event?: { title: string; reason: string } | null;
  pipeline_status: { planned: number; upcoming: number; ongoing: number; past: number };
  avg_relationship_engagement: number; // 0–100
  returning_user_trend: { delta_pct: number; direction: "up" | "down" | "flat" };
}

export interface PerformancePoint {
  event_id: string;
  label: string; // event title (short)
  type: EventType;
  target_group?: string | null;
  value: number; // value for the requested dimension
  health: EventHealth;
}

export interface PerformanceSeries {
  dimension: PerformanceDimension;
  unit: string; // "%", "index", "score", "€", "count"
  points: PerformancePoint[];
}

export interface NextBestEvent {
  id: string;
  title: string; // recommended event/format
  reason: string; // WHY — always present (AGENT §1.3)
  confidence: number; // 0–1
  suggested_type?: EventType | null;
  suggested_location?: string | null;
  target_group?: string | null;
}

export interface TimelineBar {
  event_id: string;
  title: string;
  status: EventStatus;
  /** Phase bars within the event lifecycle (prep → event → follow-up). */
  segments: TimelineSegment[];
  owner?: EmployeeRef | null;
  human_capital_load: "low" | "medium" | "high";
}

export interface TimelineSegment {
  kind:
    | "preparation"
    | "event"
    | "follow_up"
    | "material_deadline"
    | "host_report_deadline"
    | "communication";
  start_at: string;
  end_at: string;
  label?: string;
}

// ── Predictions / health ───────────────────────────────────────────────────

export interface EventPrediction {
  event_id: string;
  outcome: PredictionOutcome;
  confidence: number; // 0–1
  reason: string;
  compared_against: number; // # of similar past events used
}

// ── Next Best Steps ─────────────────────────────────────────────────────────

export interface NextBestStep {
  id: string;
  action: string;
  rationale: string;
  priority: "high" | "medium" | "low";
  /** Optional: pre-fills a follow-up when actioned. */
  creates_follow_up?: boolean;
}

// ── Follow-ups ──────────────────────────────────────────────────────────────

export interface FollowUp {
  id: string;
  event_id: string;
  event_title?: string;
  contact: { user_id: string; display_name: string };
  assigned_owner: EmployeeRef;
  next_action: string;
  type?: string | null;
  due_date?: string | null;
  status: FollowUpStatus;
  outcome?: string | null;
  created_at: string;
  completed_at?: string | null;
}

// ── Materials ───────────────────────────────────────────────────────────────

export interface Material {
  id: string;
  event_id: string;
  type: MaterialType;
  title: string;
  url: string;
  uploaded_by: EmployeeRef;
  upload_date: string;
  access_count: number;
  download_count: number;
  related_topic?: string | null;
}

// ── Attendees & interactions ─────────────────────────────────────────────────

export interface Attendee {
  user_id: string;
  display_name: string;
  university?: string | null;
  registered_at: string;
  checked_in_at?: string | null;
  checked_out_at?: string | null;
  returning: boolean;
  engagement_band: "high" | "medium" | "low";
}

export interface InteractionLogEntry {
  id: string;
  event_id?: string | null;
  user: { user_id: string; display_name: string };
  type: InteractionType;
  timestamp: string;
  source: string;
  confidence_level?: number | null;
}

// ── Host report ──────────────────────────────────────────────────────────────

export interface HostReport {
  id: string;
  event_id: string;
  host: EmployeeRef;
  organization_rating: number; // 1–5
  audience_relevance_rating: number;
  interaction_quality_rating: number;
  repeat_recommendation: HostRecommendation;
  notes?: string | null;
  suggested_improvements?: string | null;
  created_at: string;
}

// ── Students (Explorer + Detail) ─────────────────────────────────────────────

export interface StudentRow {
  user_id: string;
  display_name: string;
  university?: string | null;
  last_event?: { event_id: string; title: string; type: EventType } | null;
  target_group?: string | null;
  interaction_status: NeutralStudentStatus;
  interest_tags: string[];
  latest_activity_at: string;
  follow_up_status: FollowUpStatus | "none";
  recommended_next_step: string;
  /** Backend-only priority signal — never shown as a number to students. */
  priority_band: "high" | "medium" | "low";
}

export interface StudentDetail {
  user_id: string;
  display_name: string;
  university?: string | null;
  study_degree?: string | null;
  hometown?: string | null;
  interest_tags: string[];
  first_interaction_at: string;
  latest_interaction_at: string;
  returning: boolean;
  interaction_status: NeutralStudentStatus;
  recommended_next_step: string;
  event_history: { event_id: string; title: string; type: EventType; date: string }[];
  open_follow_ups: FollowUp[];
  project_interest: boolean;
  career_interest: boolean;
}

export interface StudentTimelineEntry {
  id: string;
  timestamp: string;
  type: InteractionType;
  event_title?: string | null;
  detail?: string | null;
}

export interface PriorityQueueItem {
  user_id: string;
  display_name: string;
  recommended_action: string;
  urgency: "high" | "medium" | "low";
  confidence: number; // 0–1
  reason: string;
}

// ── Opportunities (Create page) ──────────────────────────────────────────────

export interface Opportunity {
  id: string;
  title: string;
  reason: string;
  category:
    | "untapped_university"
    | "format_to_repeat"
    | "weak_format_redesign"
    | "long_unhosted"
    | "underdeveloped_community";
  suggested_type?: EventType | null;
  suggested_location?: string | null;
}

export interface AssistantReply {
  recommendation: string;
  reasoning: string;
  suggested_event?: Partial<CreateEventInput> | null;
}

export interface CreateEventInput {
  title: string;
  type: EventType;
  start_at: string;
  end_at: string;
  location?: string;
  city?: string;
  goal?: string;
  target_group?: string;
  cost?: number;
  human_capital?: string;
  partner_university?: string;
}

// ── Communication Hub ────────────────────────────────────────────────────────

export interface ChatThread {
  id: string;
  type: ChatType;
  title: string; // counterpart name or event channel name
  last_message_preview?: string | null;
  last_message_at?: string | null;
  unread: number;
  event_id?: string | null;
}

export interface StudentConversation extends ChatThread {
  /** Why this conversation is ranked where it is (AGENT §4.2 sorting signals). */
  priority_signals: string[];
  engagement_band: "high" | "medium" | "low";
  follow_up_needed: boolean;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender: { user_id: string; display_name: string };
  body: string;
  sent_at: string;
  mine: boolean;
}

// ── Global Assistant (top-bar co-pilot) ─────────────────────────────────────
// A conversational assistant that answers questions over the dashboard data AND
// can jump/filter the UI. Backed by POST /internal/assistant (mockable).

export type AssistantActionKind =
  | "navigate"
  | "open_event"
  | "open_student"
  | "filter_students";

export interface AssistantAction {
  kind: AssistantActionKind;
  label: string; // e.g. "Open →", "Show in Student Explorer"
  href: string; // route to push when clicked
}

export interface AssistantTurn {
  answer: string;
  actions: AssistantAction[];
}

// ──────────────────────────────────────────────────────────────────────────
// Generic envelopes (Master §4)
// ──────────────────────────────────────────────────────────────────────────

export interface Paginated<T> {
  items: T[];
  next_cursor: string | null;
}

export interface ApiError {
  error: { code: string; message: string };
}
