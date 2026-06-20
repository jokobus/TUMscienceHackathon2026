/**
 * types.ts — typed mirror of the WEave shared contract (WEAVE_MASTER.md §5–§6).
 *
 * The backend owns the wire shape (snake_case JSON). On the client we use
 * camelCase TS types; lib/api.ts is the single place where the two are mapped.
 * Enum string unions below come verbatim from MASTER §5.1 — never invent values.
 */

// ── §5.1 Enums ──────────────────────────────────────────────────────────────
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

export type HostRecommendation = "repeat" | "improve" | "stop";

export type ChatType = "dm" | "event_channel" | "internal" | "student_conversation";

export type QrKind = "check_in" | "check_out" | "connection";

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

// ── Identity ────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  role: UserRole;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface EmployeeProfile extends User {
  firstName: string;
  surname: string;
  seniority?: string;
  branchOffice?: string;
}

export interface StudentRef {
  id: string;
  displayName: string;
  avatarUrl?: string;
  university?: string;
  studyDegree?: string;
}

// ── Events ──────────────────────────────────────────────────────────────────
export interface EventSummary {
  id: string;
  title: string;
  type: EventType;
  city?: string;
  location?: string;
  startAt: string;
  endAt: string;
  status: EventStatus;
  attendeeCount: number;
  health?: EventHealth;
  isOwner: boolean;
  images?: string[];
}

export interface EventDetail extends EventSummary {
  description: string;
  targetGroup?: string;
  goal?: string;
  partnerUniversity?: string;
  ownerEmployeeId: string;
  responsibleEmployeeIds: string[];
  liveAnalyticsEnabled: boolean;
  kpis: EventKpis;
}

// Compact in-app KPIs (full reports live on the Web Dashboard).
export interface EventKpis {
  registered: number;
  checkedIn: number;
  fullSessions: number;
  checkInRate: number; // 0–1
  fullSessionRate: number; // 0–1
  qualifiedLeads: number;
  engagementIndex: number; // 0–100, relative
  recommendationScore: number; // avg 0–10
  npsScore?: number; // -100..100
  followUpsOpen: number;
}

export interface Attendee {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  university?: string;
  studyDegree?: string;
  checkedInAt?: string;
  fullSession: boolean;
  // Neutral relationship hint (no score is ever shown — MASTER §8).
  leadStatus: "qualified" | "checked_in" | "registered";
}

export interface Interaction {
  id: string;
  eventId: string;
  userId?: string;
  userName?: string;
  type: InteractionType;
  timestamp: string;
}

export interface EventNote {
  id: string;
  eventId: string;
  authorEmployeeId: string;
  body: string;
  createdAt: string;
}

export interface EventSentiment {
  id: string;
  eventId: string;
  authorEmployeeId: string;
  description: string;
  sentimentValue?: number; // -1..1
  createdAt: string;
}

export interface LiveAnalytics {
  enabled: boolean;
  averageSentiment: number; // -1..1
  sampleCount: number;
  recent: EventSentiment[];
  mood: "energised" | "engaged" | "neutral" | "flat" | "tense";
}

export interface Material {
  id: string;
  eventId: string;
  type: MaterialType;
  title: string;
  url: string;
  uploadedBy: string;
  uploadDate: string;
  accessCount: number;
}

export interface HostReport {
  id: string;
  eventId: string;
  hostUserId: string;
  organizationRating: number; // 1–5
  audienceRelevanceRating: number; // 1–5
  interactionQualityRating: number; // 1–5
  repeatRecommendation: HostRecommendation;
  notes?: string;
  suggestedImprovements?: string;
  createdAt: string;
}

export interface QrToken {
  token: string;
  kind: QrKind;
  eventId?: string;
  expiresAt?: string;
}

// ── Messaging ───────────────────────────────────────────────────────────────
export interface ChatSummary {
  id: string;
  type: ChatType;
  title: string;
  subtitle?: string;
  avatarUrl?: string;
  eventId?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unread: number;
  liveHighlight: boolean; // event channel within its live window
}

export interface Message {
  id: string;
  chatId: string;
  senderUserId: string;
  senderName: string;
  body: string;
  sentAt: string;
  isBroadcast?: boolean;
}

export interface PersonSearchResult {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  context: string; // "Co-attended Embedded World" / "Würth · Sales"
  chatId?: string;
}

// ── Notifications (engagement reports, retention tips …) ─────────────────────
export interface NotificationItem {
  id: string;
  type: "engagement" | "retention" | "improvement" | "attention" | "follow_up";
  title: string;
  body: string;
  eventId?: string;
  createdAt: string;
  readAt?: string;
}

// ── Auth ────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  token: string;
  user: EmployeeProfile;
}

// ── WebSocket envelope (MASTER §7) ──────────────────────────────────────────
export interface WsEvent {
  action:
    | "new_message"
    | "presence_update"
    | "channel_highlight"
    | "broadcast"
    | "error";
  payload: Record<string, unknown>;
}
