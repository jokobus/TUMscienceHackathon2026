# AGENT — Würth Dashboard (Web)

> **Module of WEave.** Read this file **plus** `/WEAVE_MASTER.md` (shared contract). You consume `/internal/**` endpoints; you never define endpoints. Stay inside your owned folders.

## Ownership
- **Folders:** `frontend/app/(dashboard)/**`, `frontend/components/dashboard/**`
- **Shared (coordinate):** `frontend/components/ui/**`, `frontend/lib/types.ts`, `frontend/lib/api.ts`
- **Branch:** `dashboard` → PR into `main`.

## Scope
The internal **Event Intelligence & Relationship-ROI control center**. It does **not** own the student experience or primary data capture. It **receives** structured data and turns it into business insight: event performance, comparison, relationship/brand-retention ROI, follow-up prioritization, future-event recommendations, communication, student exploration, operational planning, timeline overview.

**ROI framing:** success here is **not** primarily commercial. It is the return Würth gets from stronger student relationships, brand awareness, repeated engagement and long-term connection. Interpret all KPIs through a **relationship + brand-retention** lens.

## Transmission methods you use
- **REST** for all dashboard data and actions (`/internal/**`, role `employee`).
- **WebSocket** (`wss://api.weave.de/chat`) for the Communication Hub's live messaging; history via REST. (Master §3 + §7.)

---

## App-Shell Structure
Internal web app with a clear shell:
- a **logo placeholder** top-left
- a **smart Search Bar** next to the logo
- a **navigation area** below the logo
- a central **content area** for the selected page

**Main navigation (4 core pages):** `Event Dashboard` · `Create Event` · `Communication Hub` · `Student Explorer`.
Goal: see event performance, plan events, handle communication and identify follow-ups without scattered tools/inboxes/spreadsheets.

---

## 1) Event Dashboard (global overview)
A **graphical event-performance control center** (not just a static KPI board). Answers: which events performed well/poorly, which types create relationship value, which improved brand retention, which generated meaningful follow-up, which student groups/universities show repeated engagement, what to plan next, where opportunities are missing.

Five main elements:

**1.1 Executive Summary Strip** — compact orientation for management: best/weakest event, strongest brand-retention signal, highest relationship-ROI event, most urgent follow-up cluster, next best recommended event, current pipeline status, average relationship engagement, returning-user trend. Highlight insights and actions, don't overload with raw numbers.
→ `GET /internal/dashboard/summary`.

**1.2 Graphical Event-Performance Chart** — visualize success across time / type / target group; compare on relationship & brand performance, not only commercial. Dimensions: relationship ROI, brand-retention signal, average engagement, returning-user rate, recommendation score, full-session attendance, follow-up actions, cost per qualified relationship lead, host experience, event-health status.
→ `GET /internal/dashboard/performance?dimension=...`.

**1.3 Next Best Events** — which events to plan next, based on historical data, current engagement, target groups, locations, types and gaps. **Each recommendation includes a short reason**, e.g. *"Host a technical workshop at KIT — a relevant share of high-engagement interactions come from KIT, but no dedicated KIT event exists; an untapped relationship/brand opportunity."*
→ `GET /internal/dashboard/next-best-events`.

**1.4 Event Timeline / Gantt Chart** — visual overview of planned/ongoing/past events: preparation phases, event dates, post-event follow-up windows, material-upload & host-report deadlines, communication phases, human-capital allocation, overlapping periods, strategic clusters. (University relationship work spans before/after the event, not one day.)
→ `GET /internal/dashboard/timeline`.

**1.5 KPI & Relationship-ROI Context** — global KPIs that support the performance view: host experience, visitor count, recommendation/referral, registered vs. appeared, attended full session, first/new users, returning users, cost per lead, average engagement, average follow-up actions.
→ `GET /internal/dashboard/kpis`.

### Relationship-ROI & Event-Health logic
Classify events with **event-health labels** (enum `event_health`): High Relationship ROI · Strong Brand Retention · High Engagement, Needs Follow-Up · Good Awareness Event · Low Continuity Event · Weak Follow-Up Event · Likely Underperforming Format · Needs Review · Insufficient Data. These let Würth grasp quality without reading every KPI.

### Flop detection & confidence-based prediction
With enough history, estimate whether a **planned** event will perform — framed as a **confidence-based prediction**, not a guarantee. Compares planned vs. similar past events (type, target group, location, timeframe, cost, human capital, host feedback, attendance ratio, full-session rate, returning-user rate, engagement, follow-ups, recommendation, prior health). Outputs (enum `prediction_outcome`): High-confidence success · Promising but uncertain · Relationship potential detected · Risk of low engagement · Likely underperforming · Insufficient data. Example: *"Risk of low engagement — similar past events with this target group/format had low full-session attendance and few follow-ups. Confidence: medium."*
→ `GET /internal/events/{eventId}/prediction`.

---

## 2) Event Detail Page (one event)
Opened by clicking an event. Answers: what happened, how it performed locally, what relationship value it created, which next steps to take, which communication/materials belong to it, which interactions to follow up.

**2.1 Local KPIs** — same logic as global, single-event: visitor count, registered vs. appeared, full-session attendance, recommendation, returning/new users, cost per relationship lead, average engagement, follow-up actions, host experience, event-health label, relationship-ROI signal, brand-retention signal.
→ `GET /internal/events/{eventId}` (incl. `analysis` block) and/or `GET /internal/events/{eventId}/kpis`.

**2.2 Next Best Steps** — turns analysis into action: follow up with high-engagement students; send materials to full-session attendees; assign a Würth owner to open conversations; create a follow-up event for returning participants; request a missing host report; share project-support info with technically interested students; mark as a strong relationship event despite moderate attendance; review the format if engagement was weak; invite the same target group to a focused session; add the university to the Opportunity Explorer.
→ `GET /internal/events/{eventId}/next-best-steps`; create/track via `POST /internal/follow-ups`, `PATCH /internal/follow-ups/{id}`.

**2.3 Material Upload** — upload slides, technical docs, product info, images, follow-up resources, links, Q&A summaries, project-support docs. These can be connected to the student-facing event page.
→ `GET/POST /internal/events/{eventId}/materials`, `DELETE /internal/materials/{materialId}`.

**2.4 Student-Facing Event Information** — an **editable description** shown to students externally. Lets Würth manage external presentation while keeping analytics internal.
→ `PATCH /internal/events/{eventId}`.

**2.5 Event Chat** — event-specific chat keeping communication in context (internal discussion, student questions linked to the event, organizational updates, follow-up coordination, post-event comms).
→ Communication Hub endpoints + **WS**.

**2.6 Follow-Up Context** — the event's follow-ups and their status.
→ `GET /internal/events/{eventId}/follow-ups`.

Also available on this page: attendees and the event interaction log → `GET /internal/events/{eventId}/attendees`, `GET /internal/events/{eventId}/interactions`. Host report → `GET/POST /internal/events/{eventId}/host-report`.

---

## 3) Create Page
Two entry points: **Manual Event Creation** and **Opportunity Explorer**.

**3.1 Manual Event Creation** — fields: title, timeframe, location, goal, target group, cost, human capital, event type, partner/university. (Not just admin — these drive comparison & prediction.)
→ `POST /internal/events`; configure application questions/window via `PUT /internal/events/{eventId}/application-questions`.

**3.2 Human Capital** — interpret **broadly**: not just headcount but internal resources to execute and follow up — assigned employees, owner, expected effort, preparation, post-event workload, required technical experts, communication owner, capacity for next steps. Lets the dashboard judge whether an event was worth the internal effort.

**3.3 Opportunity Explorer** — uses the DB to suggest future opportunities: long-unhosted formats, high-engagement-but-low-activity universities, locations with repeated interest, high brand-retention target groups, formats worth repeating, weak formats to redesign, underdeveloped communities. Includes an **LLM planning assistant** — employees describe goals in natural language (*"plan an event for EE students", "host in Munich", "which format creates the strongest relationship impact?", "where do we see engagement but no Würth event yet?"*) and get database-grounded recommendations **with reasoning**.
→ `GET /internal/opportunities`, `POST /internal/opportunities/assistant`.

---

## 4) Communication Hub (renamed from "Invoices")
Central communication area — **not** billing. Two areas:

**4.1 Internal Würth Chats** — employee↔employee: event coordination, follow-up assignment, results discussion, planning, owner↔expert coordination.
**4.2 Student Conversations** — student-related conversations, **sorted by engagement / priority** (not a flat chronological inbox). Sorting signals: follow-up needed, event context, engagement level, returning-user status, project interest, career interest, open questions, time since last response. Turns communication into an operational follow-up tool.
→ `GET /internal/chats`, `GET /internal/chats/{chatId}/messages`, `POST /internal/chats`, `GET /internal/student-conversations`; live via **WS**.

---

## 5) Student Explorer (Würth-internal)
A table-like overview of relevant student interactions — **not** a public ranking; goal is to surface follow-up opportunities from **consent-based** signals.
Columns: student name/contact ID, last event, event type, university/target group, interaction status, interest tags, latest activity, follow-up status, recommended next step, link to the Student Detail Page.
Answers: who showed repeated engagement, who has open follow-up potential, who interacted across several events, who is tied to technical/project/career interest, which contacts not to lose.
→ `GET /internal/students` (sort by priority/engagement), `GET /internal/priority-queue`.

## 6) Student Detail Page (drilldown)
The relationship history between a student and Würth: first/latest interaction, event history, interaction timeline, interest tags, material interactions, project interest, career interest, open follow-ups, current interaction status, recommended next Würth action. Supports continuity — Würth doesn't start from zero when a student reappears.
**Students never see an internal score.** Internally Würth uses prioritization; externally students see only neutral statuses (`connected`, `material available`, `follow-up open`, `project support requested`, `career interest submitted`, `application context available`).
→ `GET /internal/students/{studentUserId}`, `GET /internal/students/{studentUserId}/timeline`.

---

## KPI → Data mapping (reference; full detail in source, computation in backend)
For each KPI the dashboard reads aggregates from the backend, which derives them from the `interactions`, `event_registrations`, `feedback`, `host_reports`, `follow_ups`, `materials` tables (master §5). KPIs: **Host Experience Reports · Event Visitor Count · Recommendation/Referral · Registered vs. Appeared · Attended Full Session · First/New Users · Returning Users · Cost per Lead · Average Engagement · Average Follow-Up Actions.** "Qualified lead" is defined in master §8.2; engagement weighting in §8.1.

## Endpoints you CONSUME (quick reference)
`GET /internal/dashboard/summary|performance|next-best-events|timeline|kpis` · `GET /internal/events` · `GET /internal/events/{eventId}` · `GET /internal/events/{eventId}/kpis|attendees|interactions|next-best-steps|prediction|follow-ups` · `POST /internal/events` · `PATCH/DELETE /internal/events/{eventId}` · `PUT /internal/events/{eventId}/application-questions` · `GET /internal/events/{eventId}/applications` · `PATCH /internal/applications/{id}` · `GET/POST /internal/events/{eventId}/materials` · `DELETE /internal/materials/{id}` · `GET/POST /internal/events/{eventId}/host-report` · `GET /internal/follow-ups` · `POST /internal/follow-ups` · `PATCH /internal/follow-ups/{id}` · `GET /internal/students` · `GET /internal/students/{id}` · `GET /internal/students/{id}/timeline` · `GET /internal/priority-queue` · `GET /internal/suggestions` · `DELETE /internal/suggestions/{id}` · `GET /internal/chats` · `GET /internal/student-conversations` · `GET /internal/opportunities` · `POST /internal/opportunities/assistant` · **WS** `wss://api.weave.de/chat`

## What you do NOT own
- The student app, the employee app, the backend, primary data capture, the engagement-score math (backend), the WebSocket server, the DB/seed.

## UI vocabulary
App Shell · Sidebar Nav · Smart Search Bar · Executive Summary Strip · Performance Chart · Gantt/Timeline · KPI Card · Event-Health Label/Badge · Recommendation Card (with reason) · Data Table (Student Explorer) · Detail Page · Next Best Steps list · Material Upload · Communication Hub (Internal + Student Conversations) · Opportunity Explorer + Assistant chat · Empty State · Skeleton.
