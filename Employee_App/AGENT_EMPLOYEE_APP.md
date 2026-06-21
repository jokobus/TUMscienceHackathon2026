# AGENT — Würth Employee App (Mobile)

> **Module of WEave.** Read this file **plus** `/WEAVE_MASTER.md` (shared contract). You consume `/internal/**` + the chat WS; you never define endpoints. Stay inside your owned folders.

## Ownership
- **Folders:** `frontend/app/(employee)/**`, `frontend/components/employee/**`
- **Shared (coordinate):** `frontend/components/ui/**`, `frontend/lib/types.ts`, `frontend/lib/api.ts`
- **Branch:** `employee-app` → PR into `main`.

## Scope
The mobile counterpart of the student app — a handy on-site extension of the Würth Web Dashboard. Employees run events, capture signals, message attendees/peers, and view per-event KPIs on the go. **Full reports live on the Web Dashboard**, not here.

## Transmission methods you use
- **REST** for events, KPIs, QR generation, scans, sentiment, notes, broadcast, profile (`/internal/**`, role `employee`).
- **WebSocket** (`wss://api.weave.de/chat`) for instant messaging + broadcasts; history via REST. (Master §3 + §7.)

## Auth
Employees **must log in** (unlike students — no guest mode here). Login via `POST /api/auth/login`; the token carries role `employee`. All `/internal/**` calls require it.

---

## Feature-Set
- **Instant Messaging** for Würth events (event channels).
- **Instant Messaging** employee↔employee, and employee↔users / student clubs.
- **Upcoming Event tool** — future events the employee is scheduled for appear in an Upcoming tab.
- **Event notes** — take private notes for an event.
- **Live crowd sentiment** — capture a description of the room's sentiment.
- **File area** — share files, text, etc. for an event.
- **Check-In / Check-Out QR creation** — generate scan codes for an event.
- **Live analytics** about event sentiment (if enabled).
- **Push messages / reports** — engagement, improvement tips, retention, attention.
- **Broadcast** — one instant message to all attendees.
- **Past events** — viewable in a timeline (reference); **KPIs viewable in-app**, full reports only on Web.
- **Scan a student's QR** — create a connection (enables instant messaging).
- **Profile** — view own details (name, surname, seniority, branch/office), edit picture/name.

---

## User Journey
1. Open the app → **must log in**.
2. See the **main page**: events the employee is involved in + past events they were involved in (backend returns these from the auth'd profile).
   → `GET /internal/employees/{employeeId}/events`.
3. Tap a **scheduled event** to act on it (features above), **or** open a **past event** to view its KPIs / attendees.
   → `GET /internal/events/{eventId}` (incl. `analysis` when past/ongoing), `GET /internal/events/{eventId}/attendees`, `GET /internal/events/{eventId}/interactions`.
4. Switch (Tab Bar) to **Instant Messaging** and search intelligently (other employees in the event space, attendees, users).
   → `GET /internal/chats`, `GET /api/chats/search-people` (or internal equivalent), **WS**.
5. Switch (Tab Bar) to **Profile** to review/edit own details.
   → `GET/PATCH /internal/employees/me`.

---

## Screens (suggested tabs)
- **Events** (main): "My events" + past, with an **Upcoming** filter. Tap → Event Detail (mobile).
- **Event Detail (mobile):** in-app **KPIs** (compact; full reports on Web), **attendees**, **interactions**, **notes**, **live sentiment** capture, **QR generation** (check-in / check-out), **broadcast**, **file sharing**, **host report**.
- **Messages:** event channels + DMs + internal employee chats; intelligent people search; **broadcast** action.
- **Profile:** own details; edit picture/name.

---

## Per-feature endpoints
| Feature | Endpoint(s) |
|--------|-------------|
| My events / past | `GET /internal/employees/{employeeId}/events` |
| Event detail + KPIs | `GET /internal/events/{eventId}`, `GET /internal/events/{eventId}/kpis` |
| Attendees | `GET /internal/events/{eventId}/attendees` |
| Event interactions | `GET /internal/events/{eventId}/interactions` |
| Generate check-in QR | `POST /internal/events/{eventId}/qr/check-in` |
| Generate check-out QR (full session) | `POST /internal/events/{eventId}/qr/check-out` |
| Scan a student → connection/IM | `POST /internal/scan/student/{studentUserId}` |
| Private notes | `GET/POST /internal/events/{eventId}/notes` |
| Live crowd sentiment | `POST /internal/events/{eventId}/sentiment` |
| Live analytics (if enabled) | `GET /internal/events/{eventId}/live-analytics` (polling) |
| Broadcast to attendees | `POST /internal/events/{eventId}/broadcast` (fans out over WS) |
| Share files | `GET/POST /internal/events/{eventId}/materials` |
| Host report | `GET/POST /internal/events/{eventId}/host-report` |
| Notifications / reports | `GET /internal/notifications` |
| Messaging | **WS** `wss://api.weave.de/chat`; history `GET /internal/chats/{chatId}/messages` |
| Profile | `GET/PATCH /internal/employees/me` |

## QR & scan model (master §6.11)
- Check-in / check-out tokens are generated server-side and returned as a `token`; the app renders the QR. Students scanning a check-in token hit `POST /api/events/{id}/check-in`; a check-out token records full-session.
- An employee scanning a **student** QR calls `POST /internal/scan/student/{studentUserId}` → creates a `connection` and enables IM.

## What you do NOT own
- The student app, the dashboard, the backend, the engagement-score math, the WebSocket server, the DB/seed. Full reports/analytics rendering belongs to the **Web Dashboard** — keep this app to compact in-app KPIs.

## UI vocabulary
Bottom Tab Bar · Event List · Event Detail · KPI Card (compact) · Attendee List · QR Code (check-in/check-out) · Scanner View (scan student) · Note input · Sentiment capture · Broadcast action · Messages (channels + DMs + internal) · Profile · Empty State · Skeleton · Badge (unread).
