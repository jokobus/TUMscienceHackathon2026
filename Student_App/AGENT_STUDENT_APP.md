# AGENT — Student App

> **Module of WEave.** Read this file **plus** `/WEAVE_MASTER.md` (the shared contract: endpoints, types, transmission methods, DB). You consume the API; you never define endpoints. Stay inside your owned folders.

## Ownership
- **Folders:** `frontend/app/(student)/**`, `frontend/components/student/**`
- **Shared (coordinate before editing):** `frontend/components/ui/**`, `frontend/lib/types.ts`, `frontend/lib/api.ts`
- **Branch:** `student-app` → PR into `main`. Never push to `main` directly.

## Scope (one sentence)
The student-facing app + mobile-friendly web page: the main contact point between students and Würth — browse/search events, build a profile, capture event memories, and chat with Würth employees and peers.

## Transmission methods you use
- **REST** for everything (events, feed, profile, suggestions, applications, memories, files, check-ins, interactions).
- **WebSocket** (`wss://api.weave.de/chat`) for chat only. History via REST helper. (See master §3 + §7.)
- Render an **Empty State** for every list — never a blank screen.

---

## Navigation (RESOLVED — see master §0)
- **Bottom Tab Bar = 5 tabs:** `Feed` · `Requests` · `Camera (center, larger)` · `Chat` · `Profile`. On large screens the same items render as a left **Sidebar**.
- The **center Camera tab** opens a full-screen **Scanner View** (the primary scan entry).
- **Current Event FAB** (separate, bottom-right): appears **only** when the user is registered to a **live** event (now is within `start_at − 2h … end_at + 2h`, having applied online or scanned in). Tapping it jumps straight into that ongoing event, saving a trip through the Feed. It is **not** a tab and is distinct from the Camera tab.
- `Settings` is **inside Profile** (gear Icon Button, top-right of the Profile screen) — not a tab.
- "Capture a Memory" and "File Drive" are **not** tabs — they live inside the **Event Page**.

## Auth & guest (master §6.1)
- The Feed is available **without login**. All other features need at least an email.
- Scanning an event while logged out → choose **Sign In** / **Sign Up** / **Continue as Guest** (small, grey). Sign In & Sign Up = email + password (no email verification code for the hackathon). Guest = email only.
- **Guest permissions:** browse Feed, check in, view event content. Guests **cannot** chat, post a public Memory, or appear in recruiter-visible profiles.
- Scan/login must work even when an **external system camera** scans the QR and forwards the user into the app or mobile web page; if already logged in, check-in completes automatically (Toast "Checked in ✓").

---

## Screens

### TAB · Feed
- A **Search Bar** at top (AI-assisted via `GET /api/events/search`).
- A chronological **Feed** of event preview **Cards** (newest at top). Each preview shows General Information: title, time period, place, type, optional tags, and — if applicable — the **Submit Application / Applications Upcoming / Applications Closed** button incl. the application window.
- Scroll **up** = future events, **down** = past events.
- **Filter Chips** (open a **Bottom Sheet** for detail): attended · event type (see master `event_type`) · city · date range.
- Tap a Card → the **Event Page** opens **full screen**.
- **Empty State** when no results · Pull-to-Refresh.
- Endpoints: `GET /api/events` (list/filter), `GET /api/events/search` (AI search).

### Event Page (full-screen detail; not a tab)
Exists for **every** event. Always shows an **Information** tab. **File Drive** and **Capture a Memory** tabs appear **only** for past events the student attended. Switch tabs via a **Segmented Control**.

- **Information tab**
  - General Information (title, time period, place, type, optional tags) + a Description set by the organising Würth employee.
  - If an application is required: a **Submit Application** Primary Button. When closed, it is less prominently coloured and reads **Applications Upcoming** / **Applications Closed**, with small text for the open window. The application asks open text-box questions posed by the event creator. Works as **guest or logged-in student**.
  - The Event Page has an **AI-assisted search** that can search through future and past events.
  - Endpoints: `GET /api/events/{id}`, `GET /api/events/{id}/application`, `POST /api/events/{id}/application`.

- **File Drive tab** (past, attended)
  - View attached slides, PDFs, summaries etc. for this event, provided by the organising employee.
  - If the employee ticked "Files will be provided after the event", show that note instead. If there are no files and no info → **hide this bar**.
  - Endpoint: `GET /api/events/{id}/files`. Opening a file emits `file_view` via `POST /api/interactions`.

- **Capture a Memory tab** (past + during; attendees only)
  - Comment **text and pictures** under the event — like little Twitter threads (top-level posts + replies) where discussion thrives.
  - Possible **from event start onward** (during and after). **Before start, the tab is hidden.**
  - Every top-level Memory appears on the student's account (if allowed in Settings) for recruiters/employees to see whether to reach out.
  - **Re-request / "repost":** a past event can be reposted → it is added as a suggestion in the Requests tab; multiple reposts add upvotes.
  - Endpoints: `GET /api/events/{id}/memories`, `POST /api/events/{id}/memories`, `POST /api/events/{id}/repost`. Posting emits `memory_post`.

### TAB · Requests (event suggestions, Reddit-style)
- Students post ideas for events that don't exist yet — each needs a **Title** and **description**.
- Sort by **recency** or **popularity** (a **Segmented Control**).
- Exactly two buttons per item: **(↑) upvote** and **(↓) downvote** (**Vote Buttons**). Most popular suggestions are surfaced to Würth as inspiration.
- The **proposer** can **edit and delete** their own suggestion; employees can only delete.
- Würth employees can see the proposer's email; other students cannot.
- Suggestions older than **one year** are auto-deleted (backend cleanup).
- **Empty State** when none exist.
- Endpoints: `GET /api/suggestions`, `POST /api/suggestions`, `PATCH /api/suggestions/{id}`, `DELETE /api/suggestions/{id}`, `POST /api/suggestions/{id}/vote`.

### TAB · Camera (center, larger)
- Opens a full-screen **Scanner View**.
- Scanning logs you into an event (check-in) **or** registers an interaction with an employee.
- Endpoints: `POST /api/events/{id}/check-in` (event QR), `POST /api/scan/employee/{employeeId}` (employee QR → connection + DM).

### TAB · Chat
- **Direct Messages** with people you met, recruiters, etc.
- A highlighted **event channel** for an event the student is attending **if it is currently ongoing** — for quick announcements (location/time changes, organiser notices) and live attendee connection. Highlighted from **2h before start to 2h after end**; afterwards it moves to an **Archive** section.
- **Search people** in your chats: find only people you've already chatted with, **or** start a chat with someone who **attended an event together with you**.
- **Empty State** when no conversations.
- Real-time over **WebSocket** (master §7); history via `GET /api/chats/{chatId}/messages`. Other endpoints: `GET /api/chats`, `POST /api/chats`, `GET /api/chats/search-people`.

### TAB · Profile (+ Settings)
- Shows the student's profile and their public Memories.
- **Settings** (gear Icon Button, top-right): 1) **Profile Picture**, 2) **Personal information** — University, Study Degree, special **interest areas**, Hometown (all optional but nice to have), 3) **Security** — change password.
- **Interest areas are selected from the predefined taxonomy below as multi-select Chips** — not free text.
- Endpoints: `GET /api/users/me/profile`, `PATCH /api/users/me/profile`, `PUT /api/users/me/password`, `GET /api/interest-tags`, `PUT /api/users/me/interests`, `GET /api/users/me/memories`.

#### Interest-area taxonomy (Würth Elektronik focus)
- **Hardware & Core Engineering:** Hardware Design, PCB Design, Embedded Systems, EMC, Power Electronics, Signal Integrity, Microelectronics, RF Engineering, Sensors & Actuators, Optoelectronics
- **Industrial & Manufacturing Tech:** Industrial Automation, Smart Factory, Robotics, Mechatronics, Additive Manufacturing, Thermal Management, Quality Management, Automotive Electronics
- **Technical Business & Customer Support:** Field Application Engineering, Technical Sales, Product Management, Business Development, Technical Training, Inside Sales
- **Operations, Supply Chain & Digital:** SCM, Global Logistics, Procurement, Industrial Engineering, Sustainable Management, E-Commerce, Data Analytics, IT Systems

---

## Endpoints you CONSUME (quick reference)
`GET /api/events` · `GET /api/events/search` · `GET /api/events/current` · `GET /api/events/{id}` · `GET /api/events/{id}/files` · `GET/POST /api/events/{id}/memories` · `POST /api/events/{id}/repost` · `GET/POST /api/events/{id}/application` · `POST /api/events/{id}/feedback` · `POST /api/events/{id}/check-in` · `POST /api/scan/employee/{employeeId}` · `POST /api/interactions` · `GET/PATCH /api/users/me/profile` · `PUT /api/users/me/password` · `GET /api/interest-tags` · `PUT /api/users/me/interests` · `GET /api/users/me/memories` · `GET/POST/PATCH/DELETE /api/suggestions...` · `POST /api/suggestions/{id}/vote` · `GET/POST /api/chats...` · `GET /api/chats/search-people` · **WS** `wss://api.weave.de/chat`

## Interactions you EMIT (feeds the KPIs — master §8)
| User action (screen) | interaction_type | How |
|----------------------|------------------|-----|
| Join / check in to an event (Camera, Feed) | `check_in` | `POST /api/events/{id}/check-in` |
| Open a file (Event Page → File Drive) | `file_view` / `file_download` | `POST /api/interactions` |
| Post a Memory (Event Page) | `memory_post` | `POST /api/events/{id}/memories` |
| Submit an application (Event Page) | `application_submitted` | `POST /api/events/{id}/application` |
| Submit feedback (end-of-event QR) | `recommendation_submitted` | `POST /api/events/{id}/feedback` |
| Scan an employee (Camera) | `connection` | `POST /api/scan/employee/{employeeId}` |
| Repost a past event | `repost` | `POST /api/events/{id}/repost` |
| Express sample/project/career interest, ask a question | `sample_interest` / `project_interest` / `career_interest` / `question_asked` | `POST /api/interactions` |

> **Privacy:** never display an engagement score or ranking to the student. Show only neutral statuses (`connected`, `material_available`, `follow_up_open`, `project_support_requested`, `career_interest_submitted`, `application_context_available`).

## What you do NOT own
- Any `/internal/**` endpoint, KPIs, the engagement-score math, event creation, the dashboard, the employee app, the backend, the WebSocket server, the DB/seed.

## UI vocabulary (use these exact terms)
Bottom Tab Bar · Tab Item · Active Tab · Sidebar (large screens) · Camera tab (center, larger) · Scanner View · Current Event FAB (bottom-right, live only) · Top App Bar · Search Bar · Card · Feed · List Item / Row · Avatar · Thumbnail · Segmented Control (Event Page tabs; Requests sort) · Filter Chip · Bottom Sheet (filters, memory input) · Vote Buttons (↑/↓) · Primary/Secondary Button · Toast ("Saved ✓", "Checked in ✓") · Empty State · Skeleton / Spinner · Pull-to-Refresh · Badge (unread chats).
