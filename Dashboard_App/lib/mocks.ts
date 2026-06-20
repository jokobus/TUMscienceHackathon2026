/**
 * mocks.ts — dummy data for every /internal/** endpoint the dashboard consumes.
 *
 * This is the ONLY place that fabricates data. lib/api.ts decides (via the
 * NEXT_PUBLIC_USE_MOCKS flag) whether to return these or hit the real backend.
 * When the backend is ready you do NOT touch this file or any page — you just
 * flip the flag. Shapes here match lib/types.ts exactly.
 *
 * Seed roster from WEAVE_MASTER.md §9.
 */
import type {
  AssistantReply,
  AssistantTurn,
  Attendee,
  ChatMessage,
  EmployeeRef,
  EventDetail,
  EventPrediction,
  EventSummary,
  ExecutiveSummary,
  FollowUp,
  HostReport,
  InteractionLogEntry,
  KpiSet,
  Material,
  NextBestEvent,
  NextBestStep,
  Opportunity,
  PerformanceDimension,
  PerformancePoint,
  PerformanceSeries,
  PriorityQueueItem,
  StudentConversation,
  StudentDetail,
  StudentRow,
  StudentTimelineEntry,
  ChatThread,
  TimelineBar,
} from "./types";

// ── Employees (Würth side) ──────────────────────────────────────────────────
export const EMP = {
  simon: { user_id: "emp-simon", display_name: "Simon Häckner" },
  jana: { user_id: "emp-jana", display_name: "Jana Donges" },
  christian: { user_id: "emp-christian", display_name: "Christian Kapusta" },
} satisfies Record<string, EmployeeRef>;

// ── Events ───────────────────────────────────────────────────────────────────
export const MOCK_EVENTS: EventSummary[] = [
  {
    id: "ev-tum-hack",
    title: "TUM Science Hackathon 2026",
    type: "hackathon",
    status: "past",
    city: "Munich",
    location: "TUM Garching",
    start_at: "2026-06-19T08:00:00Z",
    end_at: "2026-06-21T18:00:00Z",
    partner_university: "TU München",
    owner: EMP.simon,
    health: "high_relationship_roi",
    relationship_roi: 88,
    image_url:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "ev-kit-talk",
    title: "Power Electronics Tech Talk",
    type: "technical_talk",
    status: "past",
    city: "Karlsruhe",
    location: "KIT Campus South",
    start_at: "2026-05-12T16:00:00Z",
    end_at: "2026-05-12T18:30:00Z",
    partner_university: "KIT",
    owner: EMP.jana,
    health: "strong_brand_retention",
    relationship_roi: 74,
    image_url:
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "ev-rwth-fair",
    title: "RWTH Career Fair Booth",
    type: "career_fair_booth",
    status: "past",
    city: "Aachen",
    location: "RWTH Aachen",
    start_at: "2026-04-22T09:00:00Z",
    end_at: "2026-04-22T17:00:00Z",
    partner_university: "RWTH Aachen",
    owner: EMP.christian,
    health: "good_awareness",
    relationship_roi: 51,
    image_url:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "ev-stuttgart-lecture",
    title: "Guest Lecture: EMC in Practice",
    type: "guest_lecture",
    status: "past",
    city: "Stuttgart",
    location: "Uni Stuttgart",
    start_at: "2026-03-18T10:00:00Z",
    end_at: "2026-03-18T12:00:00Z",
    partner_university: "Uni Stuttgart",
    owner: EMP.jana,
    health: "weak_followup",
    relationship_roi: 38,
    image_url:
      "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "ev-we-excursion",
    title: "Würth Elektronik Plant Excursion",
    type: "excursion",
    status: "ongoing",
    city: "Niedernhall",
    location: "WE HQ",
    start_at: "2026-06-20T09:00:00Z",
    end_at: "2026-06-20T15:00:00Z",
    partner_university: "TU München",
    owner: EMP.simon,
    health: "high_engagement_needs_followup",
    relationship_roi: 69,
    image_url:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "ev-tum-seminar",
    title: "Embedded Systems Seminar",
    type: "seminar",
    status: "upcoming",
    city: "Munich",
    location: "TUM Main Campus",
    start_at: "2026-07-04T13:00:00Z",
    end_at: "2026-07-04T17:00:00Z",
    partner_university: "TU München",
    owner: EMP.christian,
    health: "insufficient_data",
    relationship_roi: 0,
    image_url:
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "ev-darmstadt-webinar",
    title: "Webinar: REDEXPERT Deep Dive",
    type: "webinar",
    status: "planned",
    city: "Online",
    location: "Remote",
    start_at: "2026-07-15T15:00:00Z",
    end_at: "2026-07-15T16:30:00Z",
    partner_university: "TU Darmstadt",
    owner: EMP.jana,
    health: "insufficient_data",
    relationship_roi: 0,
    image_url:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=60",
  },
];

// ── KPI sets per event (and a global aggregate) ─────────────────────────────
const KPI_BY_EVENT: Record<string, KpiSet> = {
  "ev-tum-hack": {
    visitor_count: 142, registered: 160, appeared: 142, full_session: 121,
    recommendation_score: 9.1, nps_score: 64, new_users: 88, returning_users: 54,
    qualified_leads: 73, cost_per_lead: 41, avg_engagement: 82,
    avg_follow_up_actions: 2.4, host_experience: 4.6,
  },
  "ev-kit-talk": {
    visitor_count: 67, registered: 80, appeared: 67, full_session: 58,
    recommendation_score: 8.4, nps_score: 51, new_users: 39, returning_users: 28,
    qualified_leads: 34, cost_per_lead: 33, avg_engagement: 71,
    avg_follow_up_actions: 1.9, host_experience: 4.2,
  },
  "ev-rwth-fair": {
    visitor_count: 210, registered: 0, appeared: 210, full_session: 0,
    recommendation_score: 7.0, nps_score: 28, new_users: 171, returning_users: 39,
    qualified_leads: 22, cost_per_lead: 96, avg_engagement: 44,
    avg_follow_up_actions: 0.6, host_experience: 3.8,
  },
  "ev-stuttgart-lecture": {
    visitor_count: 54, registered: 70, appeared: 54, full_session: 41,
    recommendation_score: 6.6, nps_score: 12, new_users: 33, returning_users: 21,
    qualified_leads: 9, cost_per_lead: 88, avg_engagement: 39,
    avg_follow_up_actions: 0.3, host_experience: 3.4,
  },
  "ev-we-excursion": {
    visitor_count: 31, registered: 34, appeared: 31, full_session: 27,
    recommendation_score: 8.8, nps_score: 58, new_users: 12, returning_users: 19,
    qualified_leads: 18, cost_per_lead: 52, avg_engagement: 77,
    avg_follow_up_actions: 1.2, host_experience: 4.5,
  },
};

const GLOBAL_KPIS: KpiSet = {
  visitor_count: 504, registered: 344, appeared: 504, full_session: 347,
  recommendation_score: 8.1, nps_score: 47, new_users: 343, returning_users: 161,
  qualified_leads: 156, cost_per_lead: 58, avg_engagement: 64,
  avg_follow_up_actions: 1.4, host_experience: 4.1,
};

export function mockKpis(eventId?: string): KpiSet {
  if (eventId && KPI_BY_EVENT[eventId]) return KPI_BY_EVENT[eventId];
  return GLOBAL_KPIS;
}

// ── Executive summary ────────────────────────────────────────────────────────
export const MOCK_SUMMARY: ExecutiveSummary = {
  best_event: { event_id: "ev-tum-hack", title: "TUM Science Hackathon 2026", metric: "88 Relationship-ROI" },
  weakest_event: { event_id: "ev-stuttgart-lecture", title: "Guest Lecture: EMC in Practice", metric: "38 Relationship-ROI" },
  strongest_brand_retention: { event_id: "ev-kit-talk", title: "Power Electronics Tech Talk", value: 79 },
  highest_relationship_roi: { event_id: "ev-tum-hack", title: "TUM Science Hackathon 2026", value: 88 },
  most_urgent_follow_up_cluster: { label: "Plant Excursion — high-engagement attendees", count: 19 },
  next_best_event: { title: "Technical workshop at KIT", reason: "High-engagement KIT students, no dedicated KIT workshop yet." },
  pipeline_status: { planned: 1, upcoming: 1, ongoing: 1, past: 4 },
  avg_relationship_engagement: 64,
  returning_user_trend: { delta_pct: 12, direction: "up" },
};

// ── Performance series (per dimension) ──────────────────────────────────────
const DIMENSION_META: Record<PerformanceDimension, { unit: string; values: Record<string, number> }> = {
  relationship_roi: { unit: "index", values: { "ev-tum-hack": 88, "ev-kit-talk": 74, "ev-rwth-fair": 51, "ev-stuttgart-lecture": 38, "ev-we-excursion": 69 } },
  brand_retention: { unit: "index", values: { "ev-tum-hack": 81, "ev-kit-talk": 79, "ev-rwth-fair": 62, "ev-stuttgart-lecture": 35, "ev-we-excursion": 71 } },
  engagement: { unit: "%", values: { "ev-tum-hack": 82, "ev-kit-talk": 71, "ev-rwth-fair": 44, "ev-stuttgart-lecture": 39, "ev-we-excursion": 77 } },
  returning_rate: { unit: "%", values: { "ev-tum-hack": 38, "ev-kit-talk": 42, "ev-rwth-fair": 19, "ev-stuttgart-lecture": 39, "ev-we-excursion": 61 } },
  recommendation: { unit: "score", values: { "ev-tum-hack": 9.1, "ev-kit-talk": 8.4, "ev-rwth-fair": 7.0, "ev-stuttgart-lecture": 6.6, "ev-we-excursion": 8.8 } },
  full_session: { unit: "%", values: { "ev-tum-hack": 85, "ev-kit-talk": 87, "ev-rwth-fair": 0, "ev-stuttgart-lecture": 76, "ev-we-excursion": 87 } },
  follow_ups: { unit: "count", values: { "ev-tum-hack": 2.4, "ev-kit-talk": 1.9, "ev-rwth-fair": 0.6, "ev-stuttgart-lecture": 0.3, "ev-we-excursion": 1.2 } },
  cost_per_lead: { unit: "€", values: { "ev-tum-hack": 41, "ev-kit-talk": 33, "ev-rwth-fair": 96, "ev-stuttgart-lecture": 88, "ev-we-excursion": 52 } },
  host_experience: { unit: "score", values: { "ev-tum-hack": 4.6, "ev-kit-talk": 4.2, "ev-rwth-fair": 3.8, "ev-stuttgart-lecture": 3.4, "ev-we-excursion": 4.5 } },
  health: { unit: "index", values: { "ev-tum-hack": 88, "ev-kit-talk": 74, "ev-rwth-fair": 51, "ev-stuttgart-lecture": 38, "ev-we-excursion": 69 } },
};

export function mockPerformance(dimension: PerformanceDimension): PerformanceSeries {
  const meta = DIMENSION_META[dimension];
  const points: PerformancePoint[] = Object.entries(meta.values).map(([eventId, value]) => {
    const ev = MOCK_EVENTS.find((e) => e.id === eventId)!;
    return {
      event_id: eventId,
      label: shortTitle(ev.title),
      type: ev.type,
      target_group: ev.partner_university,
      value,
      health: ev.health,
    };
  });
  return { dimension, unit: meta.unit, points };
}

function shortTitle(t: string): string {
  return t.length > 22 ? t.slice(0, 21) + "…" : t;
}

// ── Next Best Events (with reasons) ─────────────────────────────────────────
export const MOCK_NEXT_BEST_EVENTS: NextBestEvent[] = [
  {
    id: "nbe-kit",
    title: "Technical workshop at KIT",
    reason:
      "A relevant share of high-engagement student interactions comes from KIT, but no dedicated KIT workshop exists in the current event history — an untapped relationship & brand-retention opportunity.",
    confidence: 0.82,
    suggested_type: "technical_talk",
    suggested_location: "Karlsruhe",
    target_group: "Electrical Engineering",
  },
  {
    id: "nbe-tum-repeat",
    title: "Repeat the hackathon format at TU München",
    reason:
      "The hackathon produced the highest returning-user rate and strongest host feedback of any past format. Repeating it should compound existing relationships.",
    confidence: 0.74,
    suggested_type: "hackathon",
    suggested_location: "Munich",
    target_group: "TU München",
  },
  {
    id: "nbe-followup",
    title: "Follow-up session for returning excursion attendees",
    reason:
      "A cluster of students engaged repeatedly across the excursion and earlier events. A focused follow-up keeps continuity warm before interest cools.",
    confidence: 0.68,
    suggested_type: "seminar",
    target_group: "Returning participants",
  },
];

// ── Timeline / Gantt ─────────────────────────────────────────────────────────
export const MOCK_TIMELINE: TimelineBar[] = [
  {
    event_id: "ev-we-excursion",
    title: "WE Plant Excursion",
    status: "ongoing",
    owner: EMP.simon,
    human_capital_load: "medium",
    segments: [
      { kind: "preparation", start_at: "2026-06-10", end_at: "2026-06-19", label: "Prep" },
      { kind: "event", start_at: "2026-06-20", end_at: "2026-06-20", label: "Event" },
      { kind: "follow_up", start_at: "2026-06-21", end_at: "2026-07-05", label: "Follow-up" },
      { kind: "host_report_deadline", start_at: "2026-06-23", end_at: "2026-06-23", label: "Host report" },
    ],
  },
  {
    event_id: "ev-tum-seminar",
    title: "Embedded Systems Seminar",
    status: "upcoming",
    owner: EMP.christian,
    human_capital_load: "high",
    segments: [
      { kind: "preparation", start_at: "2026-06-18", end_at: "2026-07-03", label: "Prep" },
      { kind: "communication", start_at: "2026-06-25", end_at: "2026-07-04", label: "Comms" },
      { kind: "event", start_at: "2026-07-04", end_at: "2026-07-04", label: "Event" },
      { kind: "material_deadline", start_at: "2026-07-06", end_at: "2026-07-06", label: "Materials" },
      { kind: "follow_up", start_at: "2026-07-05", end_at: "2026-07-18", label: "Follow-up" },
    ],
  },
  {
    event_id: "ev-darmstadt-webinar",
    title: "REDEXPERT Webinar",
    status: "planned",
    owner: EMP.jana,
    human_capital_load: "low",
    segments: [
      { kind: "preparation", start_at: "2026-07-01", end_at: "2026-07-14", label: "Prep" },
      { kind: "event", start_at: "2026-07-15", end_at: "2026-07-15", label: "Event" },
      { kind: "follow_up", start_at: "2026-07-16", end_at: "2026-07-25", label: "Follow-up" },
    ],
  },
];

// ── Predictions ──────────────────────────────────────────────────────────────
const PREDICTIONS: Record<string, EventPrediction> = {
  "ev-tum-seminar": {
    event_id: "ev-tum-seminar",
    outcome: "promising_uncertain",
    confidence: 0.61,
    reason:
      "Similar seminars at TU München showed solid full-session attendance but mixed follow-up rates. Engagement depends heavily on the assigned technical host.",
    compared_against: 4,
  },
  "ev-darmstadt-webinar": {
    event_id: "ev-darmstadt-webinar",
    outcome: "risk_low_engagement",
    confidence: 0.55,
    reason:
      "Past webinars with this target group had low full-session attendance and few follow-up actions. Confidence: medium.",
    compared_against: 3,
  },
};

export function mockPrediction(eventId: string): EventPrediction {
  return (
    PREDICTIONS[eventId] ?? {
      event_id: eventId,
      outcome: "insufficient_data",
      confidence: 0,
      reason: "Not enough comparable historical events to form a confident prediction yet.",
      compared_against: 0,
    }
  );
}

// ── Next Best Steps (per event) ──────────────────────────────────────────────
export function mockNextBestSteps(eventId: string): NextBestStep[] {
  void eventId;
  return [
    { id: "nbs-1", action: "Follow up with the 19 high-engagement attendees", rationale: "They hit project- or career-interest signals but have no open follow-up yet.", priority: "high", creates_follow_up: true },
    { id: "nbs-2", action: "Send the session materials to full-session attendees", rationale: "Material access correlates strongly with returning-user rate.", priority: "high", creates_follow_up: true },
    { id: "nbs-3", action: "Assign Christian as owner for 3 open student conversations", rationale: "Open questions older than 48h reduce response likelihood.", priority: "medium" },
    { id: "nbs-4", action: "Request the missing host report", rationale: "Host experience is required for the event-health classification.", priority: "medium" },
    { id: "nbs-5", action: "Add TU München to the Opportunity Explorer watch list", rationale: "Repeated cross-event engagement is visible from this university.", priority: "low" },
  ];
}

// ── Follow-ups ───────────────────────────────────────────────────────────────
export const MOCK_FOLLOW_UPS: FollowUp[] = [
  { id: "fu-1", event_id: "ev-we-excursion", event_title: "WE Plant Excursion", contact: { user_id: "stu-lenni", display_name: "Lenni" }, assigned_owner: EMP.simon, next_action: "Share power-module sample info", type: "sample", due_date: "2026-06-24", status: "open", created_at: "2026-06-20T10:00:00Z" },
  { id: "fu-2", event_id: "ev-tum-hack", event_title: "TUM Science Hackathon 2026", contact: { user_id: "stu-jakob", display_name: "Jakob" }, assigned_owner: EMP.jana, next_action: "Invite to embedded seminar", type: "invite", due_date: "2026-06-28", status: "in_progress", created_at: "2026-06-21T09:00:00Z" },
  { id: "fu-3", event_id: "ev-kit-talk", event_title: "Power Electronics Tech Talk", contact: { user_id: "stu-thiviyan", display_name: "Thiviyan" }, assigned_owner: EMP.christian, next_action: "Send project-support documentation", type: "project", due_date: "2026-06-22", status: "open", created_at: "2026-05-13T08:00:00Z" },
];

export function mockFollowUps(eventId?: string): FollowUp[] {
  return eventId ? MOCK_FOLLOW_UPS.filter((f) => f.event_id === eventId) : MOCK_FOLLOW_UPS;
}

// ── Materials ────────────────────────────────────────────────────────────────
export function mockMaterials(eventId: string): Material[] {
  return [
    { id: "mat-1", event_id: eventId, type: "slides", title: "Keynote — Power Electronics 101", url: "#", uploaded_by: EMP.simon, upload_date: "2026-06-20T12:00:00Z", access_count: 84, download_count: 51, related_topic: "Power" },
    { id: "mat-2", event_id: eventId, type: "pdf", title: "REDEXPERT Quick-Start Guide", url: "#", uploaded_by: EMP.jana, upload_date: "2026-06-20T12:30:00Z", access_count: 47, download_count: 39, related_topic: "Tools" },
    { id: "mat-3", event_id: eventId, type: "qa_summary", title: "Live Q&A Summary", url: "#", uploaded_by: EMP.christian, upload_date: "2026-06-21T09:00:00Z", access_count: 22, download_count: 8 },
  ];
}

// ── Attendees ────────────────────────────────────────────────────────────────
export function mockAttendees(eventId: string): Attendee[] {
  void eventId;
  return [
    { user_id: "stu-lenni", display_name: "Lenni", university: "TU München", registered_at: "2026-06-15", checked_in_at: "2026-06-20T09:05:00Z", checked_out_at: "2026-06-20T14:50:00Z", returning: true, engagement_band: "high" },
    { user_id: "stu-jakob", display_name: "Jakob", university: "TU München", registered_at: "2026-06-15", checked_in_at: "2026-06-20T09:12:00Z", checked_out_at: "2026-06-20T14:45:00Z", returning: true, engagement_band: "high" },
    { user_id: "stu-michael", display_name: "Michael", university: "KIT", registered_at: "2026-06-16", checked_in_at: "2026-06-20T09:30:00Z", checked_out_at: null, returning: false, engagement_band: "medium" },
    { user_id: "stu-nakulan", display_name: "Nakulan", university: "RWTH Aachen", registered_at: "2026-06-17", checked_in_at: "2026-06-20T10:02:00Z", checked_out_at: "2026-06-20T14:55:00Z", returning: false, engagement_band: "medium" },
    { user_id: "stu-thiviyan", display_name: "Thiviyan", university: "Uni Stuttgart", registered_at: "2026-06-18", checked_in_at: null, checked_out_at: null, returning: true, engagement_band: "low" },
  ];
}

// ── Interaction log ──────────────────────────────────────────────────────────
export function mockInteractions(eventId: string): InteractionLogEntry[] {
  return [
    { id: "int-1", event_id: eventId, user: { user_id: "stu-lenni", display_name: "Lenni" }, type: "career_interest", timestamp: "2026-06-20T13:10:00Z", source: "student_app", confidence_level: 1 },
    { id: "int-2", event_id: eventId, user: { user_id: "stu-jakob", display_name: "Jakob" }, type: "sample_interest", timestamp: "2026-06-20T12:40:00Z", source: "student_app", confidence_level: 1 },
    { id: "int-3", event_id: eventId, user: { user_id: "stu-michael", display_name: "Michael" }, type: "file_download", timestamp: "2026-06-20T12:05:00Z", source: "student_app", confidence_level: 1 },
    { id: "int-4", event_id: eventId, user: { user_id: "stu-nakulan", display_name: "Nakulan" }, type: "question_asked", timestamp: "2026-06-20T11:30:00Z", source: "employee_app", confidence_level: 1 },
    { id: "int-5", event_id: eventId, user: { user_id: "stu-lenni", display_name: "Lenni" }, type: "check_in", timestamp: "2026-06-20T09:05:00Z", source: "external_scan", confidence_level: 1 },
  ];
}

// ── Host report ──────────────────────────────────────────────────────────────
export function mockHostReport(eventId: string): HostReport | null {
  if (eventId === "ev-we-excursion") return null; // demonstrates "request missing host report"
  return {
    id: "hr-1",
    event_id: eventId,
    host: EMP.simon,
    organization_rating: 5,
    audience_relevance_rating: 4,
    interaction_quality_rating: 5,
    repeat_recommendation: "repeat",
    notes: "Strong technical audience, lots of hands-on questions.",
    suggested_improvements: "More power for the demo bench; ran out of sample kits.",
    created_at: "2026-06-22T08:00:00Z",
  };
}

// ── Students (Explorer rows) ────────────────────────────────────────────────
export const MOCK_STUDENT_ROWS: StudentRow[] = [
  { user_id: "stu-lenni", display_name: "Lenni", university: "TU München", last_event: { event_id: "ev-we-excursion", title: "WE Plant Excursion", type: "excursion" }, target_group: "EE", interaction_status: "career_interest_submitted", interest_tags: ["Power Electronics", "Embedded"], latest_activity_at: "2026-06-20T13:10:00Z", follow_up_status: "open", recommended_next_step: "Send career-track info + assign owner", priority_band: "high" },
  { user_id: "stu-jakob", display_name: "Jakob", university: "TU München", last_event: { event_id: "ev-tum-hack", title: "TUM Science Hackathon", type: "hackathon" }, target_group: "CS", interaction_status: "project_support_requested", interest_tags: ["Firmware", "IoT"], latest_activity_at: "2026-06-21T09:00:00Z", follow_up_status: "in_progress", recommended_next_step: "Share project-support docs", priority_band: "high" },
  { user_id: "stu-thiviyan", display_name: "Thiviyan", university: "Uni Stuttgart", last_event: { event_id: "ev-kit-talk", title: "Power Electronics Tech Talk", type: "technical_talk" }, target_group: "EE", interaction_status: "follow_up_open", interest_tags: ["Magnetics"], latest_activity_at: "2026-05-12T18:00:00Z", follow_up_status: "open", recommended_next_step: "Re-engage — interest may be cooling", priority_band: "medium" },
  { user_id: "stu-michael", display_name: "Michael", university: "KIT", last_event: { event_id: "ev-kit-talk", title: "Power Electronics Tech Talk", type: "technical_talk" }, target_group: "EE", interaction_status: "material_available", interest_tags: ["Power Electronics"], latest_activity_at: "2026-05-12T17:30:00Z", follow_up_status: "none", recommended_next_step: "Invite to KIT workshop (Opportunity)", priority_band: "medium" },
  { user_id: "stu-nakulan", display_name: "Nakulan", university: "RWTH Aachen", last_event: { event_id: "ev-rwth-fair", title: "RWTH Career Fair Booth", type: "career_fair_booth" }, target_group: "Mechatronics", interaction_status: "connected", interest_tags: ["Sensors"], latest_activity_at: "2026-04-22T16:00:00Z", follow_up_status: "none", recommended_next_step: "Light touch — share newsletter", priority_band: "low" },
];

export function mockStudentDetail(studentId: string): StudentDetail {
  const row = MOCK_STUDENT_ROWS.find((s) => s.user_id === studentId) ?? MOCK_STUDENT_ROWS[0];
  return {
    user_id: row.user_id,
    display_name: row.display_name,
    university: row.university,
    study_degree: "M.Sc. Electrical Engineering",
    hometown: "Munich",
    interest_tags: row.interest_tags,
    first_interaction_at: "2026-04-22T16:00:00Z",
    latest_interaction_at: row.latest_activity_at,
    returning: true,
    interaction_status: row.interaction_status,
    recommended_next_step: row.recommended_next_step,
    event_history: [
      { event_id: "ev-tum-hack", title: "TUM Science Hackathon 2026", type: "hackathon", date: "2026-06-19" },
      { event_id: "ev-we-excursion", title: "WE Plant Excursion", type: "excursion", date: "2026-06-20" },
    ],
    open_follow_ups: MOCK_FOLLOW_UPS.filter((f) => f.contact.user_id === row.user_id),
    project_interest: row.interaction_status === "project_support_requested",
    career_interest: row.interaction_status === "career_interest_submitted",
  };
}

export function mockStudentTimeline(studentId: string): StudentTimelineEntry[] {
  void studentId;
  return [
    { id: "t-1", timestamp: "2026-06-20T13:10:00Z", type: "career_interest", event_title: "WE Plant Excursion", detail: "Submitted career interest" },
    { id: "t-2", timestamp: "2026-06-20T12:40:00Z", type: "sample_interest", event_title: "WE Plant Excursion", detail: "Requested a sample kit" },
    { id: "t-3", timestamp: "2026-06-20T09:05:00Z", type: "check_in", event_title: "WE Plant Excursion" },
    { id: "t-4", timestamp: "2026-06-19T08:30:00Z", type: "re_engagement", event_title: "TUM Science Hackathon 2026", detail: "Returned for a second event" },
  ];
}

export const MOCK_PRIORITY_QUEUE: PriorityQueueItem[] = [
  { user_id: "stu-lenni", display_name: "Lenni", recommended_action: "Assign owner + send career-track info", urgency: "high", confidence: 0.86, reason: "Career interest submitted, no owner assigned, 0 open follow-ups." },
  { user_id: "stu-jakob", display_name: "Jakob", recommended_action: "Deliver project-support docs", urgency: "high", confidence: 0.79, reason: "Project support requested 18h ago; response window closing." },
  { user_id: "stu-thiviyan", display_name: "Thiviyan", recommended_action: "Re-engage before interest cools", urgency: "medium", confidence: 0.64, reason: "5 weeks since last interaction; previously high engagement." },
];

// ── Opportunities ────────────────────────────────────────────────────────────
export const MOCK_OPPORTUNITIES: Opportunity[] = [
  { id: "opp-kit", title: "Dedicated KIT technical workshop", reason: "High-engagement KIT students exist but no KIT-hosted event in the history.", category: "untapped_university", suggested_type: "technical_talk", suggested_location: "Karlsruhe" },
  { id: "opp-hack-repeat", title: "Repeat the hackathon format", reason: "Highest returning-user rate and host feedback of all past formats.", category: "format_to_repeat", suggested_type: "hackathon" },
  { id: "opp-lecture-redesign", title: "Redesign the guest-lecture format", reason: "EMC lecture showed weak engagement and almost no follow-up.", category: "weak_format_redesign", suggested_type: "guest_lecture" },
  { id: "opp-darmstadt", title: "Re-establish presence at TU Darmstadt", reason: "No on-site event in over a year despite a sizeable EE cohort.", category: "long_unhosted", suggested_location: "Darmstadt" },
];

export function mockAssistantReply(prompt: string): AssistantReply {
  return {
    recommendation: "Technical workshop for Electrical Engineering students in Munich.",
    reasoning:
      `Based on your prompt "${prompt.slice(0, 80)}": similar events showed strong full-session attendance, high material interaction and above-average returning-user rates. Recommended follow-up: invite previous high-engagement participants and assign a technical Würth host.`,
    suggested_event: {
      title: "EE Technical Workshop",
      type: "technical_talk",
      city: "Munich",
      target_group: "Electrical Engineering",
    },
  };
}

// ── Communication Hub ────────────────────────────────────────────────────────
export const MOCK_INTERNAL_CHATS: ChatThread[] = [
  { id: "chat-int-1", type: "internal", title: "Simon Häckner", last_message_preview: "Can you take the excursion follow-ups?", last_message_at: "2026-06-20T11:20:00Z", unread: 2 },
  { id: "chat-int-2", type: "internal", title: "Jana Donges", last_message_preview: "KIT workshop budget approved.", last_message_at: "2026-06-19T16:00:00Z", unread: 0 },
  { id: "chat-evt-1", type: "event_channel", title: "# WE Plant Excursion", last_message_preview: "Demo bench is set up.", last_message_at: "2026-06-20T08:55:00Z", unread: 1, event_id: "ev-we-excursion" },
];

export const MOCK_STUDENT_CONVERSATIONS: StudentConversation[] = [
  { id: "chat-stu-lenni", type: "student_conversation", title: "Lenni", last_message_preview: "Thanks! Where can I find the sample specs?", last_message_at: "2026-06-20T13:15:00Z", unread: 1, priority_signals: ["career interest", "open question", "high engagement"], engagement_band: "high", follow_up_needed: true },
  { id: "chat-stu-jakob", type: "student_conversation", title: "Jakob", last_message_preview: "Looking forward to the project docs.", last_message_at: "2026-06-21T09:05:00Z", unread: 0, priority_signals: ["project interest", "returning user"], engagement_band: "high", follow_up_needed: true },
  { id: "chat-stu-thiviyan", type: "student_conversation", title: "Thiviyan", last_message_preview: "(no reply for 5 weeks)", last_message_at: "2026-05-12T18:30:00Z", unread: 0, priority_signals: ["time since last response"], engagement_band: "low", follow_up_needed: true },
];

export function mockMessages(chatId: string): ChatMessage[] {
  return [
    { id: "m-1", chat_id: chatId, sender: { user_id: "stu-lenni", display_name: "Lenni" }, body: "Hi! Great session today.", sent_at: "2026-06-20T13:05:00Z", mine: false },
    { id: "m-2", chat_id: chatId, sender: EMP.simon, body: "Thanks for coming, Lenni! Want the power-module sample specs?", sent_at: "2026-06-20T13:08:00Z", mine: true },
    { id: "m-3", chat_id: chatId, sender: { user_id: "stu-lenni", display_name: "Lenni" }, body: "Thanks! Where can I find the sample specs?", sent_at: "2026-06-20T13:15:00Z", mine: false },
  ];
}

// ── Global Assistant (top-bar co-pilot) ─────────────────────────────────────
// Lightweight intent matching so the demo feels alive. The real /internal/assistant
// (LLM-backed) returns the same { answer, actions } shape — pages won't change.
export function mockAssistant(prompt: string): AssistantTurn {
  const q = prompt.toLowerCase();
  const has = (...words: string[]) => words.some((w) => q.includes(w));

  // Best / strongest event
  if (has("best", "top", "highest", "strongest") && has("roi", "event", "perform", "relationship")) {
    return {
      answer:
        "The TUM Science Hackathon 2026 is your best performer — Relationship-ROI 88, the highest returning-user rate of the quarter and strong host feedback.",
      actions: [{ kind: "open_event", label: "Open event →", href: "/events/ev-tum-hack" }],
    };
  }

  // Weakest / worst event
  if (has("weak", "worst", "lowest", "underperform", "flop")) {
    return {
      answer:
        "The EMC guest lecture in Stuttgart is the weakest — Relationship-ROI 38, low full-session attendance and almost no follow-up. Worth reviewing the format.",
      actions: [{ kind: "open_event", label: "Open event →", href: "/events/ev-stuttgart-lecture" }],
    };
  }

  // Students from a university (filter)
  const uniMatch = q.match(/\b(kit|tum|rwth|stuttgart|darmstadt|münchen|munich|aachen|karlsruhe)\b/);
  if (has("student", "students", "contacts") && uniMatch) {
    const term = uniMatch[1];
    return {
      answer: `Filtering the Student Explorer for "${term}". These are the contacts tied to that university with open follow-up potential.`,
      actions: [
        { kind: "filter_students", label: "Show in Student Explorer →", href: `/students?q=${encodeURIComponent(term)}` },
      ],
    };
  }

  // Urgent follow-ups / priority
  if (has("follow-up", "follow up", "followup", "urgent", "priority", "who should i")) {
    return {
      answer:
        "Most urgent right now: Lenni (career interest, no owner assigned) and Jakob (project-support requested 18h ago). Both are in the priority queue.",
      actions: [{ kind: "navigate", label: "Open Student Explorer →", href: "/students" }],
    };
  }

  // What to plan next / recommendations / opportunities
  if (has("next", "plan", "recommend", "opportunit", "where", "should we host")) {
    return {
      answer:
        "Top recommendation: host a technical workshop at KIT — high-engagement KIT students exist but there's no dedicated KIT event yet. An untapped relationship & brand opportunity.",
      actions: [{ kind: "navigate", label: "Open Opportunity Explorer →", href: "/create" }],
    };
  }

  // Timeline / schedule
  if (has("timeline", "gantt", "schedule", "deadline", "upcoming")) {
    return {
      answer:
        "You have 1 ongoing (WE Plant Excursion), 1 upcoming (Embedded Seminar, high human-capital load) and 1 planned event. The excursion's host-report deadline is in 3 days.",
      actions: [{ kind: "navigate", label: "Open Dashboard →", href: "/dashboard" }],
    };
  }

  // Fallback
  return {
    answer:
      `I can answer questions about event performance, relationship ROI, follow-ups and students — and jump you to the right page. Try "Which event had the best ROI?" or "Show me KIT students".`,
    actions: [{ kind: "navigate", label: "Open Dashboard →", href: "/dashboard" }],
  };
}
