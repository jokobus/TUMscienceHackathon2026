/**
 * types.ts — the dashboard's view-model contract.
 *
 * These are the shapes the UI consumes. They are intentionally a touch richer
 * than the raw backend wire schema (see Backend/app/schemas.py): the API layer
 * (lib/api.ts) maps backend responses onto these, and the mock layer
 * (lib/mockData.ts) produces them directly. JSON stays snake_case end-to-end.
 */

// ── Enums / unions (verbatim from WEAVE_MASTER.md §5.1) ──────────────────────────
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

export type EventStatus =
  | "draft"
  | "planned"
  | "upcoming"
  | "ongoing"
  | "past"
  | "cancelled";

export type MaterialType =
  | "slides"
  | "pdf"
  | "image"
  | "link"
  | "qa_summary"
  | "product_info"
  | "project_doc"
  | "follow_up_resource";

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

// ── Small shared shapes ─────────────────────────────────────────────────────
export interface Person {
  display_name: string;
}

// ── KPIs ──────────────────────────────────────────────────────────────────────
export interface KpiSet {
  registered: number;
  checked_in: number;
  check_in_rate: number; // 0..1
  full_session_rate: number; // 0..1
  recommendation_score: number;
  qualified_leads: number;
  engagement_index: number;
  follow_ups_open: number;
  nps_score: number | null;
  returning_users: number | null;
  cost_per_lead: number | null;
}

// ── Events ──────────────────────────────────────────────────────────────────
export interface EventSummary {
  id: string;
  title: string;
  status: EventStatus;
  type: EventType;
  health: EventHealth;
  start_at: string;
  city: string | null;
  location: string | null;
  partner_university: string | null;
  relationship_roi: number;
  image_url: string | null;
  attendee_count: number;
  kpis?: KpiSet;
}

export interface EventDetail {
  id: string;
  title: string;
  type: EventType;
  city: string | null;
  location: string | null;
  start_at: string;
  health: EventHealth;
  status: EventStatus;
  description: string;
  goal: string | null;
  target_group: string | null;
  cost: number | null;
  human_capital: string | null;
  owner: Person | null;
  owner_name: string | null;
  partner_university: string | null;
  image_url: string | null;
  images: string[];
  application_required: boolean;
  analysis: { summary: string; highlights: string[] } | null;
}

export interface CreateEventInput {
  title: string;
  type: EventType;
  start_at: string;
  end_at: string;
  location: string;
  city: string;
  goal: string;
  target_group: string;
  cost: number | undefined;
  human_capital: string;
  partner_university: string;
}

export interface Attendee {
  user_id: string;
  display_name: string;
  university: string | null;
  returning: boolean;
  checked_in_at: string | null;
  full_session: boolean;
}

export interface EventInteraction {
  id: string;
  user: Person;
  type: string;
  timestamp: string;
}

// ── Students ──────────────────────────────────────────────────────────────────
export interface StudentRow {
  user_id: string;
  display_name: string;
  university: string | null;
  target_group: string | null;
  last_event: { title: string; type: EventType } | null;
  interest_tags: string[];
  interaction_status: string;
  latest_activity_at: string;
  follow_up_status: string;
  recommended_next_step: string;
  study_degree: string | null;
  first_interaction_at: string;
  latest_interaction_at: string;
  event_history: Array<{ event_id: string; title: string; date: string }>;
  open_follow_ups: Array<{
    id: string;
    next_action: string;
    assigned_owner: Person;
    due_date: string | null;
    status: string;
  }>;
  project_interest: boolean;
  career_interest: boolean;
  returning: boolean;
  // Used by the AI assistant context (app/api/assistant/route.ts)
  engagement_score: number;
  lead_status: string;
}

export interface StudentTimelineEntry {
  id: string;
  type: string;
  detail: string | null;
  event_title: string | null;
  timestamp: string;
}

export interface PriorityItem {
  user_id: string;
  display_name: string;
  urgency: string;
  recommended_action: string;
  reason: string;
  confidence: number;
}

// ── Communication ─────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  mine: boolean;
  sender: Person;
  body: string;
  sent_at: string;
  /** Client-generated id for optimistic reconciliation (set on send/echo). */
  client_msg_id?: string | null;
  /** True while an optimistic message is awaiting its server echo. */
  pending?: boolean;
}

export interface InternalChat {
  id: string;
  title: string;
  unread: number;
  last_message_preview: string;
}

export interface StudentConversation {
  id: string;
  title: string;
  follow_up_needed: boolean;
  unread: number;
  last_message_preview: string;
  priority_signals: string[];
}

// ── Follow-ups ──────────────────────────────────────────────────────────────
export interface EventFollowUp {
  id: string;
  next_action: string;
  contact: Person;
  assigned_owner: Person;
  due_date: string | null;
  status: string;
}

// ── Memories (public event wall) ──────────────────────────────────────────────
export interface EventMemory {
  id: string;
  author_name: string;
  parent_id: string | null;
  body: string;
  images: string[];
  created_at: string;
}

// ── Applications ──────────────────────────────────────────────────────────────
export type ApplicationStatus = "submitted" | "accepted" | "rejected" | "under_review";

export interface EventApplication {
  id: string;
  event_id: string;
  applicant_user_id: string | null;
  applicant_email: string | null;
  status: string;
  submitted_at: string;
  answers: Array<{ question_id: string; answer_text: string }>;
}

// ── Live sentiment ────────────────────────────────────────────────────────────
export interface LiveAnalytics {
  enabled: boolean;
  average_sentiment: number;
  sample_count: number;
  mood: string;
  recent: Array<{ id: string; description: string; sentiment_value: number | null; created_at: string }>;
}

// ── Private notes ─────────────────────────────────────────────────────────────
export interface EventNote {
  id: string;
  body: string;
  author_employee_id: string;
  created_at: string;
}

// ── Host report ──────────────────────────────────────────────────────────────
export interface HostReport {
  organization_rating: number;
  audience_relevance_rating: number;
  interaction_quality_rating: number;
  repeat_recommendation: "repeat" | "improve" | "stop";
  notes: string | null;
  suggested_improvements: string | null;
}

// ── Opportunities & recommendations ───────────────────────────────────────────
export interface Opportunity {
  id: string;
  title: string;
  reason: string;
  category: string;
}

export interface NextBestEvent {
  id: string;
  title: string;
  confidence: number;
  suggested_type: EventType | null;
  suggested_location: string | null;
  target_group: string | null;
  reason: string;
}

export interface NextBestStep {
  id: string;
  kind: "contact" | "upload_slides";
  action: string;
  rationale: string;
  priority: string;
  creates_follow_up: boolean;
  contact_user_id: string | null;
  contact_name: string | null;
}

export interface EventPrediction {
  outcome: string;
  confidence: number;
  compared_against: number;
  reason: string;
}

// ── Dashboard timeline (Gantt) ──────────────────────────────────────────────
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
}

export interface TimelineBar {
  event_id: string;
  title: string;
  owner: Person | null;
  human_capital_load: "low" | "medium" | "high";
  segments: TimelineSegment[];
}

// ── Performance chart ─────────────────────────────────────────────────────────
export interface PerformanceSeries {
  dimension: PerformanceDimension;
  unit: string;
  points: Array<{ event_id: string; label: string; value: number }>;
}

// ── Materials ─────────────────────────────────────────────────────────────────
export interface Material {
  id: string;
  title: string;
  type: MaterialType;
  upload_date: string;
  uploaded_by: Person;
  access_count: number;
  download_count: number;
}

// ── Assistant ─────────────────────────────────────────────────────────────────
export interface AssistantReply {
  recommendation: string;
  reasoning: string;
}

export interface AssistantAction {
  label: string;
  href: string;
}

export interface AssistantTurn {
  answer: string;
  actions: AssistantAction[];
}
