/**
 * mockData.ts — demo data for the pitch (offline-safe).
 *
 * Served by lib/api.ts whenever USE_MOCKS is on. Shapes match lib/types.ts
 * exactly so the UI behaves identically with or without the backend.
 * Dates are computed relative to "now" so the dashboard always looks current.
 */
import type {
  Attendee,
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

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();

// ── KPI presets ───────────────────────────────────────────────────────────────
const kpis = (over: Partial<KpiSet> = {}): KpiSet => ({
  registered: 180,
  checked_in: 142,
  check_in_rate: 0.79,
  full_session_rate: 0.64,
  recommendation_score: 8.4,
  qualified_leads: 37,
  engagement_index: 72,
  follow_ups_open: 9,
  nps_score: 48,
  returning_users: 21,
  cost_per_lead: 34,
  ...over,
});

export const MOCK_DASHBOARD_KPIS: KpiSet = kpis({
  registered: 642,
  checked_in: 489,
  check_in_rate: 0.76,
  full_session_rate: 0.61,
  qualified_leads: 128,
  engagement_index: 74,
  follow_ups_open: 23,
  returning_users: 87,
  cost_per_lead: 41,
});

// ── Events ──────────────────────────────────────────────────────────────────
export const MOCK_EVENTS: EventSummary[] = [
  {
    id: "ev-1",
    title: "Embedded Systems Workshop @ TUM",
    status: "live",
    type: "workshop",
    health: "healthy",
    start_at: iso(-2 * HOUR),
    city: "Munich",
    location: "TUM Garching, MW 0001",
    partner_university: "Technical University of Munich",
    relationship_roi: 87,
    image_url: null,
    attendee_count: 142,
    kpis: kpis({ registered: 180, checked_in: 142 }),
  },
  {
    id: "ev-2",
    title: "Würth Elektronik Tech Talk: Power Magnetics",
    status: "completed",
    type: "technical_talk",
    health: "completed",
    start_at: iso(-9 * DAY),
    city: "Stuttgart",
    location: "Uni Stuttgart, V7.01",
    partner_university: "University of Stuttgart",
    relationship_roi: 71,
    image_url: null,
    attendee_count: 96,
    kpis: kpis({ registered: 110, checked_in: 96, qualified_leads: 22, follow_ups_open: 4 }),
  },
  {
    id: "ev-3",
    title: "RedExpert Hackathon",
    status: "planned",
    type: "hackathon",
    health: "at_risk",
    start_at: iso(12 * DAY),
    city: "Munich",
    location: "TUM Think Tank",
    partner_university: "Technical University of Munich",
    relationship_roi: 0,
    image_url: null,
    attendee_count: 64,
    kpis: kpis({ registered: 64, checked_in: 0, qualified_leads: 0, follow_ups_open: 0, recommendation_score: 0 }),
  },
  {
    id: "ev-4",
    title: "Career Fair — Electronics & Mechatronics",
    status: "planned",
    type: "career_fair",
    health: "on_track",
    start_at: iso(26 * DAY),
    city: "Karlsruhe",
    location: "KIT Audimax Foyer",
    partner_university: "Karlsruhe Institute of Technology",
    relationship_roi: 0,
    image_url: null,
    attendee_count: 0,
    kpis: kpis({ registered: 0, checked_in: 0, qualified_leads: 0, follow_ups_open: 0, recommendation_score: 0 }),
  },
  {
    id: "ev-5",
    title: "Lab Tour: EMC & Antenna Design",
    status: "completed",
    type: "lab_tour",
    health: "critical",
    start_at: iso(-21 * DAY),
    city: "Munich",
    location: "Würth Elektronik Munich Office",
    partner_university: "Technical University of Munich",
    relationship_roi: 44,
    image_url: null,
    attendee_count: 28,
    kpis: kpis({ registered: 40, checked_in: 28, check_in_rate: 0.7, qualified_leads: 6, follow_ups_open: 11, recommendation_score: 6.1 }),
  },
];

export const MOCK_EVENT_DETAIL: Record<string, EventDetail> = {
  "ev-1": {
    id: "ev-1",
    title: "Embedded Systems Workshop @ TUM",
    type: "workshop",
    city: "Munich",
    location: "TUM Garching, MW 0001",
    start_at: iso(-2 * HOUR),
    health: "healthy",
    status: "live",
    description:
      "Hands-on workshop on power-efficient embedded design using Würth Elektronik components. Students build and measure a buck-converter reference design.",
    goal: "Convert 30+ qualified leads and seed the RedExpert Hackathon pipeline.",
    target_group: "EE / Mechatronics MSc, 3rd semester+",
    cost: 4800,
    human_capital: "3 engineers, 1 recruiter",
    owner: { display_name: "Lena Hoffmann" },
    analysis: {
      summary:
        "Check-in pace is 12% ahead of the workshop benchmark; engagement is strong but follow-up capacity is the bottleneck.",
      highlights: [
        "79% check-in rate — best workshop this quarter",
        "37 qualified leads already logged",
        "9 open follow-ups need owners before end of week",
      ],
    },
  },
};

// ── Students ──────────────────────────────────────────────────────────────────
export const MOCK_STUDENTS: StudentRow[] = [
  {
    user_id: "st-1",
    display_name: "Jonas Becker",
    university: "Technical University of Munich",
    target_group: "EE MSc",
    last_event: { title: "Embedded Systems Workshop @ TUM", type: "workshop" },
    interest_tags: ["embedded", "power electronics", "internship"],
    interaction_status: "qualified",
    latest_activity_at: iso(-3 * HOUR),
    follow_up_status: "open",
    recommended_next_step: "Send internship JD for Embedded Design (Munich) within 48h.",
    study_degree: "MSc Electrical Engineering",
    first_interaction_at: iso(-21 * DAY),
    latest_interaction_at: iso(-3 * HOUR),
    event_history: [
      { event_id: "ev-5", title: "Lab Tour: EMC & Antenna Design", date: iso(-21 * DAY) },
      { event_id: "ev-1", title: "Embedded Systems Workshop @ TUM", date: iso(-2 * HOUR) },
    ],
    open_follow_ups: [
      {
        id: "fu-1",
        next_action: "Send internship JD (Embedded Design, Munich)",
        assigned_owner: { display_name: "Lena Hoffmann" },
        due_date: iso(2 * DAY),
        status: "open",
      },
    ],
    project_interest: true,
    career_interest: true,
    returning: true,
    engagement_score: 91,
    lead_status: "qualified",
  },
  {
    user_id: "st-2",
    display_name: "Sophie Wagner",
    university: "University of Stuttgart",
    target_group: "Mechatronics BSc",
    last_event: { title: "Würth Elektronik Tech Talk: Power Magnetics", type: "technical_talk" },
    interest_tags: ["magnetics", "simulation"],
    interaction_status: "engaged",
    latest_activity_at: iso(-2 * DAY),
    follow_up_status: "in_progress",
    recommended_next_step: "Invite to RedExpert Hackathon — strong simulation interest.",
    study_degree: "BSc Mechatronics",
    first_interaction_at: iso(-9 * DAY),
    latest_interaction_at: iso(-2 * DAY),
    event_history: [
      { event_id: "ev-2", title: "Würth Elektronik Tech Talk: Power Magnetics", date: iso(-9 * DAY) },
    ],
    open_follow_ups: [
      {
        id: "fu-2",
        next_action: "Send RedExpert Hackathon invite",
        assigned_owner: { display_name: "Marco Klein" },
        due_date: iso(4 * DAY),
        status: "in_progress",
      },
    ],
    project_interest: true,
    career_interest: false,
    returning: false,
    engagement_score: 76,
    lead_status: "checked_in",
  },
  {
    user_id: "st-3",
    display_name: "Ahmed Khan",
    university: "Technical University of Munich",
    target_group: "EE MSc",
    last_event: { title: "Lab Tour: EMC & Antenna Design", type: "lab_tour" },
    interest_tags: ["RF", "antenna", "EMC"],
    interaction_status: "interested",
    latest_activity_at: iso(-19 * DAY),
    follow_up_status: "overdue",
    recommended_next_step: "Overdue: re-engage with EMC application note + office-hours invite.",
    study_degree: "MSc Electrical Engineering",
    first_interaction_at: iso(-21 * DAY),
    latest_interaction_at: iso(-19 * DAY),
    event_history: [
      { event_id: "ev-5", title: "Lab Tour: EMC & Antenna Design", date: iso(-21 * DAY) },
    ],
    open_follow_ups: [
      {
        id: "fu-3",
        next_action: "Re-engage — send EMC application note",
        assigned_owner: { display_name: "Lena Hoffmann" },
        due_date: iso(-5 * DAY),
        status: "overdue",
      },
    ],
    project_interest: false,
    career_interest: true,
    returning: false,
    engagement_score: 58,
    lead_status: "registered",
  },
  {
    user_id: "st-4",
    display_name: "Marie Schäfer",
    university: "Karlsruhe Institute of Technology",
    target_group: "CS BSc",
    last_event: null,
    interest_tags: ["software", "tooling"],
    interaction_status: "new",
    latest_activity_at: iso(-1 * DAY),
    follow_up_status: "none",
    recommended_next_step: "New signup for Career Fair — no action needed yet.",
    study_degree: "BSc Computer Science",
    first_interaction_at: iso(-1 * DAY),
    latest_interaction_at: iso(-1 * DAY),
    event_history: [],
    open_follow_ups: [],
    project_interest: false,
    career_interest: true,
    returning: false,
    engagement_score: 31,
    lead_status: "registered",
  },
  {
    user_id: "st-5",
    display_name: "Lukas Bauer",
    university: "Technical University of Munich",
    target_group: "EE MSc",
    last_event: { title: "Embedded Systems Workshop @ TUM", type: "workshop" },
    interest_tags: ["embedded", "firmware", "thesis"],
    interaction_status: "qualified",
    latest_activity_at: iso(-1 * HOUR),
    follow_up_status: "open",
    recommended_next_step: "Discuss Master's thesis collaboration on motor control.",
    study_degree: "MSc Electrical Engineering",
    first_interaction_at: iso(-2 * HOUR),
    latest_interaction_at: iso(-1 * HOUR),
    event_history: [
      { event_id: "ev-1", title: "Embedded Systems Workshop @ TUM", date: iso(-2 * HOUR) },
    ],
    open_follow_ups: [
      {
        id: "fu-4",
        next_action: "Schedule thesis collaboration call",
        assigned_owner: { display_name: "Marco Klein" },
        due_date: iso(3 * DAY),
        status: "open",
      },
    ],
    project_interest: true,
    career_interest: true,
    returning: false,
    engagement_score: 84,
    lead_status: "qualified",
  },
  {
    user_id: "st-6",
    display_name: "Elena Petrova",
    university: "University of Stuttgart",
    target_group: "Mechatronics MSc",
    last_event: { title: "Würth Elektronik Tech Talk: Power Magnetics", type: "technical_talk" },
    interest_tags: ["power", "research"],
    interaction_status: "contacted",
    latest_activity_at: iso(-6 * DAY),
    follow_up_status: "scheduled",
    recommended_next_step: "Follow-up call scheduled — confirm research topic fit.",
    study_degree: "MSc Mechatronics",
    first_interaction_at: iso(-9 * DAY),
    latest_interaction_at: iso(-6 * DAY),
    event_history: [
      { event_id: "ev-2", title: "Würth Elektronik Tech Talk: Power Magnetics", date: iso(-9 * DAY) },
    ],
    open_follow_ups: [],
    project_interest: true,
    career_interest: false,
    returning: true,
    engagement_score: 69,
    lead_status: "checked_in",
  },
];

export const MOCK_PRIORITY_QUEUE: PriorityItem[] = [
  {
    user_id: "st-3",
    display_name: "Ahmed Khan",
    urgency: "high",
    recommended_action: "Re-engage — follow-up is 5 days overdue",
    reason: "High RF/EMC fit but no contact since the lab tour.",
    confidence: 0.82,
  },
  {
    user_id: "st-1",
    display_name: "Jonas Becker",
    urgency: "high",
    recommended_action: "Send internship JD within 48h",
    reason: "Qualified lead, explicit internship interest, returning attendee.",
    confidence: 0.9,
  },
  {
    user_id: "st-5",
    display_name: "Lukas Bauer",
    urgency: "medium",
    recommended_action: "Schedule thesis collaboration call",
    reason: "Strong thesis signal captured during today's workshop.",
    confidence: 0.74,
  },
  {
    user_id: "st-6",
    display_name: "Elena Petrova",
    urgency: "low",
    recommended_action: "Confirm scheduled follow-up call",
    reason: "Already in motion; just needs confirmation.",
    confidence: 0.6,
  },
];

export const MOCK_STUDENT_TIMELINE: Record<string, StudentTimelineEntry[]> = {
  "st-1": [
    { id: "t1", type: "registered", detail: null, event_title: "Lab Tour: EMC & Antenna Design", timestamp: iso(-21 * DAY) },
    { id: "t2", type: "checked_in", detail: null, event_title: "Lab Tour: EMC & Antenna Design", timestamp: iso(-21 * DAY + HOUR) },
    { id: "t3", type: "click_cta", detail: "Downloaded EMC application note", event_title: "Lab Tour: EMC & Antenna Design", timestamp: iso(-20 * DAY) },
    { id: "t4", type: "checked_in", detail: null, event_title: "Embedded Systems Workshop @ TUM", timestamp: iso(-2 * HOUR) },
    { id: "t5", type: "qualified_lead", detail: "Asked about embedded internships", event_title: "Embedded Systems Workshop @ TUM", timestamp: iso(-3 * HOUR) },
  ],
};

// ── Communication ─────────────────────────────────────────────────────────────
export const MOCK_INTERNAL_CHATS: InternalChat[] = [
  { id: "ic-1", title: "Workshop Crew (TUM)", unread: 2, last_message_preview: "Lena: Need a 4th badge scanner at the door" },
  { id: "ic-2", title: "Recruiting — Munich", unread: 0, last_message_preview: "Marco: 37 leads tagged, splitting follow-ups now" },
  { id: "ic-3", title: "Hackathon Planning", unread: 5, last_message_preview: "Sara: Venue confirmed, catering still open" },
];

export const MOCK_STUDENT_CONVERSATIONS: StudentConversation[] = [
  {
    id: "sc-1",
    title: "Jonas Becker",
    follow_up_needed: true,
    unread: 1,
    last_message_preview: "Thanks! Could you send the internship details?",
    priority_signals: ["qualified", "internship", "returning"],
  },
  {
    id: "sc-2",
    title: "Lukas Bauer",
    follow_up_needed: true,
    unread: 0,
    last_message_preview: "I'd love to discuss a thesis on motor control.",
    priority_signals: ["thesis", "qualified"],
  },
  {
    id: "sc-3",
    title: "Sophie Wagner",
    follow_up_needed: false,
    unread: 0,
    last_message_preview: "Looking forward to the hackathon invite!",
    priority_signals: ["simulation"],
  },
];

export const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  "sc-1": [
    { id: "m1", mine: false, sender: { display_name: "Jonas Becker" }, body: "Great workshop today — really enjoyed the buck-converter lab.", sent_at: iso(-90 * 60 * 1000) },
    { id: "m2", mine: true, sender: { display_name: "Lena Hoffmann" }, body: "Glad you liked it, Jonas! You mentioned embedded internships?", sent_at: iso(-80 * 60 * 1000) },
    { id: "m3", mine: false, sender: { display_name: "Jonas Becker" }, body: "Thanks! Could you send the internship details?", sent_at: iso(-20 * 60 * 1000) },
  ],
  "sc-2": [
    { id: "m4", mine: false, sender: { display_name: "Lukas Bauer" }, body: "I'd love to discuss a thesis on motor control.", sent_at: iso(-40 * 60 * 1000) },
  ],
  "sc-3": [
    { id: "m5", mine: false, sender: { display_name: "Sophie Wagner" }, body: "Looking forward to the hackathon invite!", sent_at: iso(-3 * HOUR) },
  ],
  "ic-1": [
    { id: "m6", mine: false, sender: { display_name: "Lena Hoffmann" }, body: "Need a 4th badge scanner at the door", sent_at: iso(-30 * 60 * 1000) },
  ],
  "ic-2": [
    { id: "m7", mine: false, sender: { display_name: "Marco Klein" }, body: "37 leads tagged, splitting follow-ups now", sent_at: iso(-2 * HOUR) },
  ],
  "ic-3": [
    { id: "m8", mine: false, sender: { display_name: "Sara Vogel" }, body: "Venue confirmed, catering still open", sent_at: iso(-5 * HOUR) },
  ],
};

// ── Dashboard timeline (Gantt) ──────────────────────────────────────────────
export const MOCK_TIMELINE: TimelineBar[] = [
  {
    event_id: "ev-3",
    title: "RedExpert Hackathon",
    owner: { display_name: "Sara Vogel" },
    human_capital_load: "high",
    segments: [
      { kind: "preparation", start_at: iso(-2 * DAY), end_at: iso(12 * DAY) },
      { kind: "material_deadline", start_at: iso(8 * DAY), end_at: iso(9 * DAY) },
      { kind: "event", start_at: iso(12 * DAY), end_at: iso(14 * DAY) },
      { kind: "follow_up", start_at: iso(14 * DAY), end_at: iso(21 * DAY) },
    ],
  },
  {
    event_id: "ev-4",
    title: "Career Fair — Electronics & Mechatronics",
    owner: { display_name: "Marco Klein" },
    human_capital_load: "medium",
    segments: [
      { kind: "preparation", start_at: iso(5 * DAY), end_at: iso(26 * DAY) },
      { kind: "communication", start_at: iso(18 * DAY), end_at: iso(26 * DAY) },
      { kind: "event", start_at: iso(26 * DAY), end_at: iso(27 * DAY) },
      { kind: "host_report_deadline", start_at: iso(28 * DAY), end_at: iso(29 * DAY) },
    ],
  },
  {
    event_id: "ev-1",
    title: "Embedded Systems Workshop @ TUM",
    owner: { display_name: "Lena Hoffmann" },
    human_capital_load: "low",
    segments: [
      { kind: "event", start_at: iso(-2 * HOUR), end_at: iso(2 * HOUR) },
      { kind: "follow_up", start_at: iso(4 * HOUR), end_at: iso(7 * DAY) },
    ],
  },
];

// ── Performance ───────────────────────────────────────────────────────────────
export function mockPerformance(dimension: PerformanceDimension): PerformanceSeries {
  const unit =
    dimension === "cost_per_lead"
      ? "€"
      : ["check_in_rate", "full_session", "returning_rate"].includes(dimension)
        ? "%"
        : "";
  const base = [
    { event_id: "ev-5", label: "Lab Tour", value: 44 },
    { event_id: "ev-2", label: "Power Magnetics", value: 71 },
    { event_id: "ev-1", label: "ES Workshop", value: 87 },
  ];
  return { dimension, unit, points: base };
}

// ── Opportunities & next best events ──────────────────────────────────────────
export const MOCK_OPPORTUNITIES: Opportunity[] = [
  { id: "op-1", title: "Repeat the Embedded Workshop at RWTH Aachen", reason: "Highest ROI format this quarter; Aachen has an untapped EE cohort.", category: "expansion" },
  { id: "op-2", title: "Convert 11 stalled EMC leads", reason: "Lab Tour generated leads that went cold — a single application note could re-warm them.", category: "recovery" },
  { id: "op-3", title: "Co-host a thesis program with TUM", reason: "Two qualified thesis signals in one day indicate demand.", category: "partnership" },
];

export const MOCK_NEXT_BEST_EVENTS: NextBestEvent[] = [
  { id: "nb-1", title: "Embedded Workshop @ RWTH Aachen", confidence: 0.83, suggested_type: "workshop", suggested_location: "Aachen", target_group: "EE MSc", reason: "Mirrors your best-performing format in a region with no recent presence." },
  { id: "nb-2", title: "RF & Antenna Deep-Dive @ TUM", confidence: 0.71, suggested_type: "technical_talk", suggested_location: "Munich", target_group: "EE MSc", reason: "Strong RF interest cluster from the EMC lab tour." },
  { id: "nb-3", title: "Power Magnetics Workshop @ Uni Stuttgart", confidence: 0.66, suggested_type: "workshop", suggested_location: "Stuttgart", target_group: "Mechatronics", reason: "Tech-talk attendees asked for a hands-on follow-up." },
];

// ── Per-event collections ─────────────────────────────────────────────────────
export const MOCK_ATTENDEES: Record<string, Attendee[]> = {
  "ev-1": [
    { user_id: "st-1", display_name: "Jonas Becker", university: "TU Munich", returning: true, checked_in_at: iso(-2 * HOUR), checked_out_at: null },
    { user_id: "st-5", display_name: "Lukas Bauer", university: "TU Munich", returning: false, checked_in_at: iso(-2 * HOUR + 5 * 60 * 1000), checked_out_at: null },
  ],
};

export const MOCK_INTERACTIONS: Record<string, EventInteraction[]> = {
  "ev-1": [
    { id: "ix-1", user: { display_name: "Jonas Becker" }, type: "qualified_lead", timestamp: iso(-3 * HOUR) },
    { id: "ix-2", user: { display_name: "Lukas Bauer" }, type: "click_cta", timestamp: iso(-90 * 60 * 1000) },
    { id: "ix-3", user: { display_name: "Jonas Becker" }, type: "check_in", timestamp: iso(-2 * HOUR) },
  ],
};

export const MOCK_FOLLOWUPS: Record<string, EventFollowUp[]> = {
  "ev-1": [
    { id: "fu-1", next_action: "Send internship JD (Embedded Design)", contact: { display_name: "Jonas Becker" }, assigned_owner: { display_name: "Lena Hoffmann" }, due_date: iso(2 * DAY), status: "open" },
    { id: "fu-4", next_action: "Schedule thesis collaboration call", contact: { display_name: "Lukas Bauer" }, assigned_owner: { display_name: "Marco Klein" }, due_date: iso(3 * DAY), status: "open" },
  ],
};

export const MOCK_HOST_REPORT: Record<string, HostReport> = {
  "ev-2": {
    organization_rating: 5,
    audience_relevance_rating: 4,
    interaction_quality_rating: 4,
    repeat_recommendation: "repeat",
    notes: "Room was a bit small for the turnout.",
    suggested_improvements: "Book a 120-seat lecture hall next time; add a hands-on segment.",
  },
};

export const MOCK_PREDICTION: Record<string, EventPrediction> = {
  "ev-3": {
    outcome: "underperform",
    confidence: 0.68,
    compared_against: 6,
    reason: "Registrations are 30% below the pace of comparable hackathons at this lead time.",
  },
  "ev-1": {
    outcome: "outperform",
    confidence: 0.81,
    compared_against: 8,
    reason: "Check-in and lead rates are ahead of every prior workshop.",
  },
};

export const MOCK_NEXT_BEST_STEPS: Record<string, NextBestStep[]> = {
  "ev-1": [
    { id: "ns-1", action: "Assign owners to the 9 open follow-ups", rationale: "Leads cool fast; same-day ownership doubles conversion.", priority: "high", creates_follow_up: false },
    { id: "ns-2", action: "Send the workshop slide deck to all attendees", rationale: "Keeps the brand top-of-mind and drives material engagement.", priority: "medium", creates_follow_up: true },
    { id: "ns-3", action: "Invite top 5 engaged students to the hackathon", rationale: "Warm pipeline for the at-risk RedExpert Hackathon.", priority: "medium", creates_follow_up: true },
  ],
};

// ── Mutable store: events created in the UI (mock mode) ───────────────────────
// MOCK_EVENTS / MOCK_EVENT_DETAIL are mutated here so a freshly created event
// shows up in the list (under "Planned") and on its own detail page during the
// session. State resets on a full page reload — fine for the demo.
let createdCount = 0;

export function addMockEvent(input: CreateEventInput): {
  id: string;
  summary: EventSummary;
  detail: EventDetail;
} {
  createdCount += 1;
  const id = `ev-new-${createdCount}`;
  const startIso = input.start_at ? new Date(input.start_at).toISOString() : iso(14 * DAY);
  const title = input.title.trim() || "Untitled event";

  const summary: EventSummary = {
    id,
    title,
    status: "planned",
    type: input.type,
    health: "on_track",
    start_at: startIso,
    city: input.city || null,
    location: input.location || null,
    partner_university: input.partner_university || null,
    relationship_roi: 0,
    image_url: null,
    attendee_count: 0,
    kpis: kpis({
      registered: 0,
      checked_in: 0,
      check_in_rate: 0,
      full_session_rate: 0,
      qualified_leads: 0,
      engagement_index: 0,
      follow_ups_open: 0,
      recommendation_score: 0,
      nps_score: null,
      returning_users: 0,
      cost_per_lead: null,
    }),
  };

  const detail: EventDetail = {
    id,
    title,
    type: input.type,
    city: summary.city,
    location: summary.location,
    start_at: startIso,
    health: "on_track",
    status: "planned",
    description: input.goal || "Newly planned event.",
    goal: input.goal || null,
    target_group: input.target_group || null,
    cost: input.cost ?? null,
    human_capital: input.human_capital || null,
    owner: null,
    analysis: null,
  };

  MOCK_EVENTS.unshift(summary); // appears first in the list
  MOCK_EVENT_DETAIL[id] = detail;
  return { id, summary, detail };
}

export const MOCK_MATERIALS: Record<string, Material[]> = {
  "ev-1": [
    { id: "mat-1", title: "Buck Converter Reference Design (slides)", type: "slides", upload_date: iso(-1 * DAY), uploaded_by: { display_name: "Lena Hoffmann" }, access_count: 88, download_count: 54 },
    { id: "mat-2", title: "WE Power Magnetics Selection Guide", type: "pdf", upload_date: iso(-1 * DAY), uploaded_by: { display_name: "Lena Hoffmann" }, access_count: 61, download_count: 39 },
    { id: "mat-3", title: "RedExpert Online Tool", type: "link", upload_date: iso(-2 * DAY), uploaded_by: { display_name: "Marco Klein" }, access_count: 120, download_count: 0 },
  ],
};
