/**
 * format.ts — display helpers: enum→label maps, enum→tone maps, date formatters.
 *
 * Tone values mirror the Badge component's accepted tones (components/ui/Badge.tsx).
 * Label/tone maps are keyed by the snake_case enum values used across the API and
 * mock layers; lookups of an unknown key fall back gracefully (undefined tone →
 * Badge renders "neutral"; undefined label → see `labelize`).
 */
import type {
  EventHealth,
  EventStatus,
  EventType,
  PerformanceDimension,
} from "@/lib/types";

export type BadgeTone = "good" | "warn" | "risk" | "neutral" | "info";

// ── Event type ────────────────────────────────────────────────────────────────
export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  technical_talk: "Technical Talk",
  workshop: "Workshop",
  hackathon: "Hackathon",
  recruiting_talk: "Recruiting Talk",
  lab_tour: "Lab Tour",
  career_fair: "Career Fair",
  networking: "Networking",
};

// ── Event health ──────────────────────────────────────────────────────────────
export const EVENT_HEALTH_LABEL: Record<EventHealth, string> = {
  healthy: "Healthy",
  on_track: "On Track",
  at_risk: "At Risk",
  critical: "Needs Attention",
  completed: "Completed",
};

export const EVENT_HEALTH_TONE: Record<EventHealth, BadgeTone> = {
  healthy: "good",
  on_track: "good",
  at_risk: "warn",
  critical: "risk",
  completed: "neutral",
};

// ── Event status ──────────────────────────────────────────────────────────────
export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  planned: "Planned",
  live: "Live",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const EVENT_STATUS_TONE: Record<EventStatus, BadgeTone> = {
  planned: "info",
  live: "good",
  completed: "neutral",
  cancelled: "risk",
};

// ── Interaction / engagement status (neutral, descriptive) ────────────────────
export const NEUTRAL_STATUS_LABEL: Record<string, string> = {
  new: "New Contact",
  interested: "Interested",
  engaged: "Engaged",
  contacted: "Contacted",
  qualified: "Qualified Lead",
  dormant: "Dormant",
};

// ── Follow-up status ──────────────────────────────────────────────────────────
export const FOLLOW_UP_LABEL: Record<string, string> = {
  none: "No Follow-up",
  open: "Open",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Done",
  overdue: "Overdue",
};

export const FOLLOW_UP_TONE: Record<string, BadgeTone> = {
  none: "neutral",
  open: "info",
  scheduled: "info",
  in_progress: "warn",
  completed: "good",
  overdue: "risk",
};

// ── Priority / urgency ────────────────────────────────────────────────────────
export const PRIORITY_TONE: Record<string, BadgeTone> = {
  high: "risk",
  medium: "warn",
  low: "neutral",
};

// ── Performance dimensions ────────────────────────────────────────────────────
export const DIMENSION_LABEL: Record<PerformanceDimension, string> = {
  relationship_roi: "Relationship ROI",
  brand_retention: "Brand Retention",
  engagement: "Engagement",
  returning_rate: "Returning Rate",
  recommendation: "Recommendation Score",
  full_session: "Full-Session Rate",
  follow_ups: "Follow-ups Closed",
  cost_per_lead: "Cost per Lead",
  host_experience: "Host Experience",
  health: "Event Health",
};

// ── Prediction outcomes ───────────────────────────────────────────────────────
export const PREDICTION_LABEL: Record<string, string> = {
  outperform: "Likely to Outperform",
  on_track: "On Track to Target",
  underperform: "Risk of Underperforming",
};

export const PREDICTION_TONE: Record<string, BadgeTone> = {
  outperform: "good",
  on_track: "info",
  underperform: "risk",
};

// ── Generic fallback labelizer (snake_case → Title Case) ──────────────────────
export function labelize(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Date formatting ───────────────────────────────────────────────────────────
function toDate(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** e.g. "21 Jun 2026" */
export function fmtDate(iso: string): string {
  const d = toDate(iso);
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** e.g. "21 Jun, 14:30" */
export function fmtDateTime(iso: string): string {
  const d = toDate(iso);
  if (!d) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** e.g. "2 hours ago", "in 3 days", "just now" */
export function relativeTime(iso: string): string {
  const d = toDate(iso);
  if (!d) return "—";
  const diffMs = d.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const future = diffMs > 0;

  const units: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [1000 * 60, "minute"],
    [1000 * 60 * 60, "hour"],
    [1000 * 60 * 60 * 24, "day"],
    [1000 * 60 * 60 * 24 * 7, "week"],
    [1000 * 60 * 60 * 24 * 30, "month"],
    [1000 * 60 * 60 * 24 * 365, "year"],
  ];

  if (abs < units[0][0]) return "just now";

  let value = abs;
  let unit: Intl.RelativeTimeFormatUnit = "minute";
  for (let i = units.length - 1; i >= 0; i--) {
    if (abs >= units[i][0]) {
      value = Math.round(abs / units[i][0]);
      unit = units[i][1];
      break;
    }
  }
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  return rtf.format(future ? value : -value, unit);
}
