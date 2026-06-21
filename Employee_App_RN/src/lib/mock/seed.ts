/**
 * seed.ts — bundled demo data in the WEave §6 contract shapes.
 *
 * The backend (AGENT_BACKEND) owns the real seed; this mirrors it so the
 * Employee App runs and demos with zero backend. Today's reference date in the
 * spec context is 2026-06-20, so events are dated around it.
 */
import type {
  Application,
  Attendee,
  ChatSummary,
  EmployeeProfile,
  EventDetail,
  EventNote,
  EventSentiment,
  HostReport,
  Interaction,
  Material,
  Message,
  NotificationItem,
  StudentRef,
} from "@/lib/types";

export const CURRENT_EMPLOYEE_ID = "emp-1";

// ── Employees (MASTER §9) ────────────────────────────────────────────────────
export const employees: EmployeeProfile[] = [
  {
    id: "emp-1",
    role: "employee",
    email: "simon.haeckner@we-online.de",
    displayName: "Simon Häckner",
    firstName: "Simon",
    surname: "Häckner",
    seniority: "Senior Field Application Engineer",
    branchOffice: "Waldenburg (HQ)",
    createdAt: "2021-03-01T08:00:00Z",
  },
  {
    id: "emp-2",
    role: "employee",
    email: "jana.donges@we-online.com",
    displayName: "Jana Donges",
    firstName: "Jana",
    surname: "Donges",
    seniority: "Technical Sales Manager",
    branchOffice: "München",
    createdAt: "2020-09-15T08:00:00Z",
  },
  {
    id: "emp-3",
    role: "employee",
    email: "christian.kapusta@we-online.com",
    displayName: "Christian Kapusta",
    firstName: "Christian",
    surname: "Kapusta",
    seniority: "Product Manager",
    branchOffice: "Berlin",
    createdAt: "2019-06-20T08:00:00Z",
  },
];

// Demo login credentials (employees must log in — no guest mode here).
export const credentials: Record<string, string> = {
  "simon.haeckner@we-online.de": "wuerth",
  "jana.donges@we-online.com": "wuerth",
  "christian.kapusta@we-online.com": "wuerth",
};

// ── Students (MASTER §9) ─────────────────────────────────────────────────────
export const students: StudentRef[] = [
  { id: "stu-1", displayName: "Nakulan Sundarraju", university: "TU München", studyDegree: "M.Sc. Electrical Engineering" },
  { id: "stu-2", displayName: "Michael Brandt", university: "TU München", studyDegree: "M.Sc. Mechatronics" },
  { id: "stu-3", displayName: "Lenni Frank", university: "TU Berlin", studyDegree: "B.Sc. Computer Engineering" },
  { id: "stu-4", displayName: "Thiviyan Saravanamuthu", university: "TU München", studyDegree: "M.Sc. Robotics" },
  { id: "stu-5", displayName: "Jakob Weber", university: "LMU München", studyDegree: "M.Sc. Data Science" },
];

export const studentById = (id: string) => students.find((s) => s.id === id);
export const employeeById = (id: string) => employees.find((e) => e.id === id);

// ── Events ───────────────────────────────────────────────────────────────────
// Reference "now" ≈ 2026-06-20.
export const events: EventDetail[] = [
  {
    id: "evt-3",
    title: "Würth Hardware Hackathon 2026",
    type: "hackathon",
    city: "Waldenburg",
    location: "Würth Elektronik Campus, Innovation Hub",
    startAt: "2026-06-19T08:00:00Z",
    endAt: "2026-06-21T18:00:00Z",
    status: "ongoing",
    attendeeCount: 48,
    health: "high_engagement_needs_followup",
    isOwner: true,
    images: [
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=70",
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=70",
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=70",
    ],
    description:
      "48h hardware hackathon around power management & RF. Teams prototype with Würth Elektronik components, mentored by our FAEs.",
    targetGroup: "EE / CE Master students",
    goal: "Talent pipeline + product feedback",
    partnerUniversity: "TU München",
    ownerEmployeeId: "emp-1",
    responsibleEmployeeIds: ["emp-1", "emp-3"],
    liveAnalyticsEnabled: true,
    kpis: {
      registered: 52,
      checkedIn: 48,
      fullSessions: 0,
      checkInRate: 0.92,
      fullSessionRate: 0,
      qualifiedLeads: 21,
      engagementIndex: 78,
      recommendationScore: 0,
      followUpsOpen: 4,
    },
  },
  {
    id: "evt-1",
    title: "Würth Elektronik @ embedded world 2026",
    type: "trade_fair",
    city: "Nürnberg",
    location: "Messe Nürnberg · Hall 1 · Booth 1-360",
    startAt: "2026-03-11T08:00:00Z",
    endAt: "2026-03-13T17:00:00Z",
    status: "past",
    attendeeCount: 214,
    health: "high_relationship_roi",
    isOwner: true,
    images: [
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=70",
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=70",
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=70",
    ],
    description:
      "Würth Elektronik's flagship booth at embedded world — live demos of the latest passives, RedExpert tooling and design-in support.",
    targetGroup: "Engineers, students, partners",
    goal: "Brand awareness + qualified leads",
    ownerEmployeeId: "emp-1",
    responsibleEmployeeIds: ["emp-1", "emp-2", "emp-3"],
    liveAnalyticsEnabled: false,
    kpis: {
      registered: 240,
      checkedIn: 214,
      fullSessions: 132,
      checkInRate: 0.89,
      fullSessionRate: 0.62,
      qualifiedLeads: 73,
      engagementIndex: 84,
      recommendationScore: 8.6,
      npsScore: 54,
      followUpsOpen: 9,
    },
  },
  {
    id: "evt-8",
    title: "WE Student Team Kickoff — eMobility",
    type: "student_team",
    city: "Stuttgart",
    location: "Uni Stuttgart · Formula Student Garage",
    startAt: "2026-02-20T15:00:00Z",
    endAt: "2026-02-20T18:00:00Z",
    status: "past",
    attendeeCount: 34,
    health: "strong_brand_retention",
    isOwner: true,
    images: [
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=70",
      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=70",
    ],
    description:
      "Kickoff sponsoring session with the Formula Student eMobility team — component support, design-in workshop and Q&A.",
    targetGroup: "Formula Student team members",
    goal: "Long-term sponsoring relationship",
    ownerEmployeeId: "emp-1",
    responsibleEmployeeIds: ["emp-1"],
    liveAnalyticsEnabled: false,
    kpis: {
      registered: 36,
      checkedIn: 34,
      fullSessions: 30,
      checkInRate: 0.94,
      fullSessionRate: 0.88,
      qualifiedLeads: 18,
      engagementIndex: 80,
      recommendationScore: 9.1,
      npsScore: 67,
      followUpsOpen: 2,
    },
  },
  {
    id: "evt-4",
    title: "Career Fair Booth — TUM Industry Day",
    type: "career_fair_booth",
    city: "München",
    location: "TU München · Galileo Forum",
    startAt: "2026-07-02T09:00:00Z",
    endAt: "2026-07-02T16:00:00Z",
    status: "upcoming",
    attendeeCount: 0,
    isOwner: false,
    images: [
      "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=900&q=70",
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=70",
    ],
    description:
      "Recruiting booth at TUM Industry Day. Focus on working-student & thesis opportunities in hardware and FAE roles.",
    targetGroup: "TUM students (all levels)",
    goal: "Recruiting pipeline",
    partnerUniversity: "TU München",
    ownerEmployeeId: "emp-2",
    responsibleEmployeeIds: ["emp-2", "emp-1"],
    liveAnalyticsEnabled: false,
    kpis: {
      registered: 0,
      checkedIn: 0,
      fullSessions: 0,
      checkInRate: 0,
      fullSessionRate: 0,
      qualifiedLeads: 0,
      engagementIndex: 0,
      recommendationScore: 0,
      followUpsOpen: 0,
    },
  },
  {
    id: "evt-6",
    title: "Excursion: Würth Elektronik Plant Tour",
    type: "excursion",
    city: "Niedernhall",
    location: "Würth Elektronik eiSos · Production Niedernhall",
    startAt: "2026-09-10T09:00:00Z",
    endAt: "2026-09-10T15:00:00Z",
    status: "upcoming",
    attendeeCount: 0,
    isOwner: true,
    images: [
      "https://images.unsplash.com/photo-1565514020179-026b92b84bb6?auto=format&fit=crop&w=900&q=70",
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=70",
    ],
    description:
      "Guided plant tour for partner-university students: SMT lines, magnetics production and a sustainability deep-dive.",
    targetGroup: "Partner-university students",
    goal: "Employer branding",
    partnerUniversity: "TU München",
    ownerEmployeeId: "emp-1",
    responsibleEmployeeIds: ["emp-1"],
    liveAnalyticsEnabled: false,
    kpis: {
      registered: 12,
      checkedIn: 0,
      fullSessions: 0,
      checkInRate: 0,
      fullSessionRate: 0,
      qualifiedLeads: 0,
      engagementIndex: 0,
      recommendationScore: 0,
      followUpsOpen: 0,
    },
  },
];

export const eventById = (id: string) => events.find((e) => e.id === id);

// ── Per-event attendees ──────────────────────────────────────────────────────
export const attendeesByEvent: Record<string, Attendee[]> = {
  "evt-3": [
    { userId: "stu-1", displayName: "Nakulan Sundarraju", university: "TU München", studyDegree: "M.Sc. EE", checkedInAt: "2026-06-19T08:12:00Z", fullSession: false, leadStatus: "qualified" },
    { userId: "stu-2", displayName: "Michael Brandt", university: "TU München", studyDegree: "M.Sc. Mechatronics", checkedInAt: "2026-06-19T08:20:00Z", fullSession: false, leadStatus: "qualified" },
    { userId: "stu-4", displayName: "Thiviyan Saravanamuthu", university: "TU München", studyDegree: "M.Sc. Robotics", checkedInAt: "2026-06-19T08:31:00Z", fullSession: false, leadStatus: "checked_in" },
    { userId: "stu-3", displayName: "Lenni Frank", university: "TU Berlin", studyDegree: "B.Sc. CE", checkedInAt: "2026-06-19T09:05:00Z", fullSession: false, leadStatus: "checked_in" },
  ],
  "evt-1": [
    { userId: "stu-1", displayName: "Nakulan Sundarraju", university: "TU München", studyDegree: "M.Sc. EE", checkedInAt: "2026-03-11T10:02:00Z", fullSession: true, leadStatus: "qualified" },
    { userId: "stu-4", displayName: "Thiviyan Saravanamuthu", university: "TU München", studyDegree: "M.Sc. Robotics", checkedInAt: "2026-03-11T11:20:00Z", fullSession: true, leadStatus: "qualified" },
    { userId: "stu-5", displayName: "Jakob Weber", university: "LMU München", studyDegree: "M.Sc. Data Science", checkedInAt: "2026-03-12T14:10:00Z", fullSession: false, leadStatus: "checked_in" },
    { userId: "stu-2", displayName: "Michael Brandt", university: "TU München", studyDegree: "M.Sc. Mechatronics", checkedInAt: "2026-03-12T09:45:00Z", fullSession: true, leadStatus: "qualified" },
  ],
  "evt-8": [
    { userId: "stu-2", displayName: "Michael Brandt", university: "TU München", studyDegree: "M.Sc. Mechatronics", checkedInAt: "2026-02-20T15:05:00Z", fullSession: true, leadStatus: "qualified" },
    { userId: "stu-3", displayName: "Lenni Frank", university: "TU Berlin", studyDegree: "B.Sc. CE", checkedInAt: "2026-02-20T15:08:00Z", fullSession: true, leadStatus: "checked_in" },
  ],
  "evt-4": [],
  "evt-6": [],
};

// ── Per-event applications (participation requests awaiting review) ───────────
export const applicationsByEvent: Record<string, Application[]> = {
  "evt-3": [
    {
      id: "app-301",
      eventId: "evt-3",
      applicantUserId: "stu-5",
      applicantEmail: "jakob.weber@lmu.de",
      status: "submitted",
      submittedAt: "2026-06-15T09:30:00Z",
      answers: [
        { questionId: "q-motivation", answerText: "I want to learn embedded systems hands-on and meet the Würth FAE team." },
        { questionId: "q-experience", answerText: "Built two STM32 projects during my data-science master." },
      ],
    },
    {
      id: "app-302",
      eventId: "evt-3",
      applicantUserId: "stu-3",
      applicantEmail: "lenni.frank@tu-berlin.de",
      status: "under_review",
      submittedAt: "2026-06-16T14:05:00Z",
      answers: [
        { questionId: "q-motivation", answerText: "Looking for a working-student role in hardware." },
      ],
    },
  ],
  "evt-6": [
    {
      id: "app-601",
      eventId: "evt-6",
      applicantEmail: "anna.koch@tum.de",
      status: "submitted",
      submittedAt: "2026-06-18T11:00:00Z",
      answers: [
        { questionId: "q-motivation", answerText: "Excited about the excursion to the Würth campus." },
      ],
    },
  ],
};

// ── Per-event interactions (engagement spine) ────────────────────────────────
export const interactionsByEvent: Record<string, Interaction[]> = {
  "evt-3": [
    { id: "i-301", eventId: "evt-3", userId: "stu-1", userName: "Nakulan Sundarraju", type: "check_in", timestamp: "2026-06-19T08:12:00Z" },
    { id: "i-302", eventId: "evt-3", userId: "stu-1", userName: "Nakulan Sundarraju", type: "project_interest", timestamp: "2026-06-19T13:40:00Z" },
    { id: "i-303", eventId: "evt-3", userId: "stu-2", userName: "Michael Brandt", type: "check_in", timestamp: "2026-06-19T08:20:00Z" },
    { id: "i-304", eventId: "evt-3", userId: "stu-2", userName: "Michael Brandt", type: "sample_interest", timestamp: "2026-06-19T16:05:00Z" },
    { id: "i-305", eventId: "evt-3", userId: "stu-4", userName: "Thiviyan Saravanamuthu", type: "check_in", timestamp: "2026-06-19T08:31:00Z" },
    { id: "i-306", eventId: "evt-3", userId: "stu-4", userName: "Thiviyan Saravanamuthu", type: "question_asked", timestamp: "2026-06-20T10:15:00Z" },
    { id: "i-307", eventId: "evt-3", userId: "stu-3", userName: "Lenni Frank", type: "check_in", timestamp: "2026-06-19T09:05:00Z" },
    { id: "i-308", eventId: "evt-3", userId: "stu-1", userName: "Nakulan Sundarraju", type: "memory_post", timestamp: "2026-06-20T12:02:00Z" },
  ],
  "evt-1": [
    { id: "i-101", eventId: "evt-1", userId: "stu-1", userName: "Nakulan Sundarraju", type: "check_in", timestamp: "2026-03-11T10:02:00Z" },
    { id: "i-102", eventId: "evt-1", userId: "stu-1", userName: "Nakulan Sundarraju", type: "career_interest", timestamp: "2026-03-11T10:40:00Z" },
    { id: "i-103", eventId: "evt-1", userId: "stu-4", userName: "Thiviyan Saravanamuthu", type: "full_session", timestamp: "2026-03-11T16:50:00Z" },
    { id: "i-104", eventId: "evt-1", userId: "stu-4", userName: "Thiviyan Saravanamuthu", type: "application_submitted", timestamp: "2026-03-13T09:10:00Z" },
    { id: "i-105", eventId: "evt-1", userId: "stu-2", userName: "Michael Brandt", type: "sample_interest", timestamp: "2026-03-12T11:00:00Z" },
    { id: "i-106", eventId: "evt-1", userId: "stu-5", userName: "Jakob Weber", type: "file_download", timestamp: "2026-03-12T14:30:00Z" },
    { id: "i-107", eventId: "evt-1", userId: "stu-1", userName: "Nakulan Sundarraju", type: "recommendation_submitted", timestamp: "2026-03-13T16:00:00Z" },
  ],
  "evt-8": [
    { id: "i-801", eventId: "evt-8", userId: "stu-2", userName: "Michael Brandt", type: "check_in", timestamp: "2026-02-20T15:05:00Z" },
    { id: "i-802", eventId: "evt-8", userId: "stu-2", userName: "Michael Brandt", type: "project_interest", timestamp: "2026-02-20T16:20:00Z" },
    { id: "i-803", eventId: "evt-8", userId: "stu-3", userName: "Lenni Frank", type: "check_in", timestamp: "2026-02-20T15:08:00Z" },
    { id: "i-804", eventId: "evt-8", userId: "stu-2", userName: "Michael Brandt", type: "re_engagement", timestamp: "2026-06-19T08:20:00Z" },
  ],
  "evt-4": [],
  "evt-6": [],
};

// ── Materials ────────────────────────────────────────────────────────────────
export const materialsByEvent: Record<string, Material[]> = {
  "evt-3": [
    { id: "m-301", eventId: "evt-3", type: "slides", title: "Hackathon Briefing Deck", url: "#", uploadedBy: "emp-1", uploadDate: "2026-06-19T07:30:00Z", accessCount: 41 },
    { id: "m-302", eventId: "evt-3", type: "product_info", title: "WE Power Modules — Cheat Sheet", url: "#", uploadedBy: "emp-3", uploadDate: "2026-06-19T07:35:00Z", accessCount: 33 },
  ],
  "evt-1": [
    { id: "m-101", eventId: "evt-1", type: "pdf", title: "embedded world Demo Catalogue", url: "#", uploadedBy: "emp-1", uploadDate: "2026-03-11T07:00:00Z", accessCount: 188 },
    { id: "m-102", eventId: "evt-1", type: "link", title: "RedExpert Online Tool", url: "https://redexpert.we-online.com", uploadedBy: "emp-3", uploadDate: "2026-03-11T07:05:00Z", accessCount: 96 },
    { id: "m-103", eventId: "evt-1", type: "qa_summary", title: "Booth Q&A Summary", url: "#", uploadedBy: "emp-2", uploadDate: "2026-03-14T09:00:00Z", accessCount: 54 },
  ],
  "evt-8": [
    { id: "m-801", eventId: "evt-8", type: "project_doc", title: "eMobility Design-in Guide", url: "#", uploadedBy: "emp-1", uploadDate: "2026-02-20T14:00:00Z", accessCount: 29 },
  ],
  "evt-4": [],
  "evt-6": [],
};

// ── Private notes ────────────────────────────────────────────────────────────
export const notesByEvent: Record<string, EventNote[]> = {
  "evt-3": [
    { id: "n-301", eventId: "evt-3", authorEmployeeId: "emp-1", body: "Team 4 (Nakulan) building a GaN power stage — strong design-in candidate, follow up after demo.", createdAt: "2026-06-19T14:00:00Z" },
    { id: "n-302", eventId: "evt-3", authorEmployeeId: "emp-1", body: "Need more dev boards for day 2 — Christian bringing extras.", createdAt: "2026-06-19T18:30:00Z" },
  ],
  "evt-1": [
    { id: "n-101", eventId: "evt-1", authorEmployeeId: "emp-1", body: "Thiviyan asked about FAE working-student role — sent application link, applied same day.", createdAt: "2026-03-11T11:00:00Z" },
  ],
  "evt-8": [],
  "evt-4": [],
  "evt-6": [],
};

// ── Live sentiment captures ──────────────────────────────────────────────────
export const sentimentByEvent: Record<string, EventSentiment[]> = {
  "evt-3": [
    { id: "s-301", eventId: "evt-3", authorEmployeeId: "emp-1", description: "Room is buzzing — teams deep in soldering, lots of questions at the WE booth.", sentimentValue: 0.7, createdAt: "2026-06-19T11:30:00Z" },
    { id: "s-302", eventId: "evt-3", authorEmployeeId: "emp-3", description: "Slight energy dip after lunch but picking back up, mentors well utilised.", sentimentValue: 0.4, createdAt: "2026-06-19T14:15:00Z" },
    { id: "s-303", eventId: "evt-3", authorEmployeeId: "emp-1", description: "Day 2 morning: high focus, several teams near working prototypes.", sentimentValue: 0.8, createdAt: "2026-06-20T09:30:00Z" },
  ],
};

// ── Host reports ─────────────────────────────────────────────────────────────
export const hostReportsByEvent: Record<string, HostReport[]> = {
  "evt-1": [
    { id: "h-101", eventId: "evt-1", hostUserId: "emp-1", organizationRating: 5, audienceRelevanceRating: 5, interactionQualityRating: 4, repeatRecommendation: "repeat", notes: "Booth traffic excellent, RedExpert demo was the magnet.", suggestedImprovements: "More seating for design-in conversations.", createdAt: "2026-03-13T18:00:00Z" },
  ],
  "evt-8": [
    { id: "h-801", eventId: "evt-8", hostUserId: "emp-1", organizationRating: 4, audienceRelevanceRating: 5, interactionQualityRating: 5, repeatRecommendation: "repeat", notes: "Tight-knit, very engaged team. Clear long-term sponsoring value.", createdAt: "2026-02-20T19:00:00Z" },
  ],
};

// ── Chats + messages ─────────────────────────────────────────────────────────
export const chats: ChatSummary[] = [
  { id: "chat-evt3", type: "event_channel", title: "Hardware Hackathon 2026", subtitle: "Event channel · 48 attendees", eventId: "evt-3", lastMessage: "Reminder: final demos at 16:00 in the Innovation Hub.", lastMessageAt: "2026-06-20T10:30:00Z", unread: 2, liveHighlight: true },
  { id: "dm-naku", type: "dm", title: "Nakulan Sundarraju", subtitle: "TU München · M.Sc. EE", lastMessage: "Thanks! I'll send the schematic over.", lastMessageAt: "2026-06-20T09:50:00Z", unread: 1, liveHighlight: false },
  { id: "dm-thivi", type: "dm", title: "Thiviyan Saravanamuthu", subtitle: "TU München · M.Sc. Robotics", lastMessage: "Great talking at embedded world!", lastMessageAt: "2026-03-13T17:30:00Z", unread: 0, liveHighlight: false },
  { id: "int-jana", type: "internal", title: "Jana Donges", subtitle: "Würth · Technical Sales", lastMessage: "Booth shift swap works for me 👍", lastMessageAt: "2026-06-19T20:10:00Z", unread: 0, liveHighlight: false },
  { id: "int-christian", type: "internal", title: "Christian Kapusta", subtitle: "Würth · Product Management", lastMessage: "Bringing 10 more dev boards tomorrow.", lastMessageAt: "2026-06-19T19:00:00Z", unread: 0, liveHighlight: false },
  { id: "chat-evt1", type: "event_channel", title: "embedded world 2026", subtitle: "Event channel · archived", eventId: "evt-1", lastMessage: "Thanks everyone — see the Q&A summary in Files.", lastMessageAt: "2026-03-13T18:05:00Z", unread: 0, liveHighlight: false },
];

export const messagesByChat: Record<string, Message[]> = {
  "chat-evt3": [
    { id: "msg-e3-1", chatId: "chat-evt3", senderUserId: "emp-1", senderName: "Simon Häckner", body: "Welcome to the Würth Hardware Hackathon! Mentors are at the WE booth all day.", sentAt: "2026-06-19T08:00:00Z" },
    { id: "msg-e3-2", chatId: "chat-evt3", senderUserId: "stu-1", senderName: "Nakulan Sundarraju", body: "Where can we grab extra dev boards?", sentAt: "2026-06-19T10:20:00Z" },
    { id: "msg-e3-3", chatId: "chat-evt3", senderUserId: "emp-3", senderName: "Christian Kapusta", body: "Front desk — ask for the eval kits box.", sentAt: "2026-06-19T10:24:00Z" },
    { id: "msg-e3-4", chatId: "chat-evt3", senderUserId: "emp-1", senderName: "Simon Häckner", body: "Reminder: final demos at 16:00 in the Innovation Hub.", sentAt: "2026-06-20T10:30:00Z", isBroadcast: true },
  ],
  "dm-naku": [
    { id: "msg-n-1", chatId: "dm-naku", senderUserId: "stu-1", senderName: "Nakulan Sundarraju", body: "Hi Simon, quick question on the GaN half-bridge layout.", sentAt: "2026-06-20T09:40:00Z" },
    { id: "msg-n-2", chatId: "dm-naku", senderUserId: "emp-1", senderName: "Simon Häckner", body: "Sure — keep the gate loop tight and use our WE-MPSB bead on the supply.", sentAt: "2026-06-20T09:46:00Z" },
    { id: "msg-n-3", chatId: "dm-naku", senderUserId: "stu-1", senderName: "Nakulan Sundarraju", body: "Thanks! I'll send the schematic over.", sentAt: "2026-06-20T09:50:00Z" },
  ],
  "dm-thivi": [
    { id: "msg-t-1", chatId: "dm-thivi", senderUserId: "stu-4", senderName: "Thiviyan Saravanamuthu", body: "Great talking at embedded world!", sentAt: "2026-03-13T17:30:00Z" },
    { id: "msg-t-2", chatId: "dm-thivi", senderUserId: "emp-1", senderName: "Simon Häckner", body: "Likewise — good luck with the FAE application 🙌", sentAt: "2026-03-13T17:35:00Z" },
  ],
  "int-jana": [
    { id: "msg-j-1", chatId: "int-jana", senderUserId: "emp-1", senderName: "Simon Häckner", body: "Can you cover the 14:00 booth shift at TUM Industry Day?", sentAt: "2026-06-19T20:05:00Z" },
    { id: "msg-j-2", chatId: "int-jana", senderUserId: "emp-2", senderName: "Jana Donges", body: "Booth shift swap works for me 👍", sentAt: "2026-06-19T20:10:00Z" },
  ],
  "int-christian": [
    { id: "msg-c-1", chatId: "int-christian", senderUserId: "emp-3", senderName: "Christian Kapusta", body: "Bringing 10 more dev boards tomorrow.", sentAt: "2026-06-19T19:00:00Z" },
  ],
  "chat-evt1": [
    { id: "msg-e1-1", chatId: "chat-evt1", senderUserId: "emp-1", senderName: "Simon Häckner", body: "Thanks everyone — see the Q&A summary in Files.", sentAt: "2026-03-13T18:05:00Z" },
  ],
};

// ── Notifications (engagement reports, retention tips, …) ─────────────────────
export const notifications: NotificationItem[] = [
  { id: "no-1", type: "attention", title: "4 follow-ups open · Hackathon 2026", body: "Several qualified leads from the ongoing hackathon have no assigned next step yet.", eventId: "evt-3", createdAt: "2026-06-20T08:00:00Z" },
  { id: "no-2", type: "engagement", title: "embedded world: 73 qualified leads", body: "Engagement index 84/100 — your strongest brand event this year. Full report on the Web Dashboard.", eventId: "evt-1", createdAt: "2026-06-18T09:00:00Z", readAt: "2026-06-18T10:00:00Z" },
  { id: "no-3", type: "retention", title: "Michael Brandt re-engaged", body: "Attended the eMobility kickoff and returned for the hackathon — good moment for a personal follow-up.", eventId: "evt-3", createdAt: "2026-06-19T12:00:00Z" },
  { id: "no-4", type: "improvement", title: "Tip · Plant Tour registrations", body: "Only 12 of 30 slots filled for the Sept plant tour. Consider a reminder broadcast to past attendees.", eventId: "evt-6", createdAt: "2026-06-17T15:00:00Z", readAt: "2026-06-17T16:00:00Z" },
];
