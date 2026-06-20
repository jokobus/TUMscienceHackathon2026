/**
 * format.ts — display helpers: enum → human label, status → badge tone, dates.
 * Pure functions, no data fetching.
 */
import type {
  EventHealth,
  EventStatus,
  EventType,
  FollowUpStatus,
  NeutralStudentStatus,
  PerformanceDimension,
  PredictionOutcome,
} from "./types";

export type BadgeTone = "good" | "warn" | "risk" | "neutral" | "info";

// ── Event health ─────────────────────────────────────────────────────────────
export const EVENT_HEALTH_LABEL: Record<EventHealth, string> = {
  high_relationship_roi: "High Relationship ROI",
  strong_brand_retention: "Strong Brand Retention",
  high_engagement_needs_followup: "High Engagement · Needs Follow-Up",
  good_awareness: "Good Awareness Event",
  low_continuity: "Low Continuity Event",
  weak_followup: "Weak Follow-Up Event",
  likely_underperforming: "Likely Underperforming Format",
  needs_review: "Needs Review",
  insufficient_data: "Insufficient Data",
};

export const EVENT_HEALTH_TONE: Record<EventHealth, BadgeTone> = {
  high_relationship_roi: "good",
  strong_brand_retention: "good",
  high_engagement_needs_followup: "warn",
  good_awareness: "info",
  low_continuity: "warn",
  weak_followup: "warn",
  likely_underperforming: "risk",
  needs_review: "neutral",
  insufficient_data: "neutral",
};

// ── Prediction ───────────────────────────────────────────────────────────────
export const PREDICTION_LABEL: Record<PredictionOutcome, string> = {
  high_confidence_success: "High-Confidence Success",
  promising_uncertain: "Promising but Uncertain",
  relationship_potential: "Relationship Potential Detected",
  risk_low_engagement: "Risk of Low Engagement",
  likely_underperforming: "Likely Underperforming",
  insufficient_data: "Insufficient Data",
};

export const PREDICTION_TONE: Record<PredictionOutcome, BadgeTone> = {
  high_confidence_success: "good",
  promising_uncertain: "warn",
  relationship_potential: "info",
  risk_low_engagement: "risk",
  likely_underperforming: "risk",
  insufficient_data: "neutral",
};

// ── Event type / status ──────────────────────────────────────────────────────
export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  hackathon: "Hackathon",
  guest_lecture: "Guest Lecture",
  career_fair_booth: "Career Fair Booth",
  excursion: "Excursion",
  student_team: "Student Team",
  technical_talk: "Technical Talk",
  one_on_one: "1:1",
  seminar: "Seminar",
  webinar: "Webinar",
  conference: "Conference",
  trade_fair: "Trade Fair",
  other: "Other",
};

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  draft: "Draft",
  planned: "Planned",
  upcoming: "Upcoming",
  ongoing: "Ongoing",
  past: "Past",
  cancelled: "Cancelled",
};

export const EVENT_STATUS_TONE: Record<EventStatus, BadgeTone> = {
  draft: "neutral",
  planned: "info",
  upcoming: "info",
  ongoing: "good",
  past: "neutral",
  cancelled: "risk",
};

// ── Follow-up status ─────────────────────────────────────────────────────────
export const FOLLOW_UP_LABEL: Record<FollowUpStatus | "none", string> = {
  open: "Open",
  in_progress: "In Progress",
  done: "Done",
  closed: "Closed",
  none: "—",
};

export const FOLLOW_UP_TONE: Record<FollowUpStatus | "none", BadgeTone> = {
  open: "warn",
  in_progress: "info",
  done: "good",
  closed: "neutral",
  none: "neutral",
};

// ── Neutral student status (the only thing students ever see) ────────────────
export const NEUTRAL_STATUS_LABEL: Record<NeutralStudentStatus, string> = {
  connected: "Connected",
  material_available: "Material Available",
  follow_up_open: "Follow-Up Open",
  project_support_requested: "Project Support Requested",
  career_interest_submitted: "Career Interest Submitted",
  application_context_available: "Application Context Available",
};

// ── Performance dimensions ───────────────────────────────────────────────────
export const DIMENSION_LABEL: Record<PerformanceDimension, string> = {
  relationship_roi: "Relationship ROI",
  brand_retention: "Brand Retention Signal",
  engagement: "Average Engagement",
  returning_rate: "Returning-User Rate",
  recommendation: "Recommendation Score",
  full_session: "Full-Session Attendance",
  follow_ups: "Follow-Up Actions",
  cost_per_lead: "Cost per Qualified Lead",
  host_experience: "Host Experience",
  health: "Event-Health Index",
};

export const PRIORITY_TONE: Record<"high" | "medium" | "low", BadgeTone> = {
  high: "risk",
  medium: "warn",
  low: "neutral",
};

// ── Dates ────────────────────────────────────────────────────────────────────
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export function pct(n: number): string {
  return `${Math.round(n)}%`;
}
