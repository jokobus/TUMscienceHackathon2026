# WEave — Master Specification & Shared Contract

> **TUM Science Hackathon · Würth Elektronik Challenge**

## 0. Resolved Conflicts & Architecture Notes

- **Client stack (resolved):** the **Würth Dashboard** is Next.js (App Router) on Vercel; the **Student App** and **Employee App** are **Expo / React-Native** (iOS native + RN-web), **not** Next.js. All three consume the same §6 contract and convert snake_case⇄camelCase at the network boundary.
- **AGENT specs:** `AGENT_BACKEND.md` and `AGENT_WUERTH_DASHBOARD.md` exist; the Student and Employee apps live directly under `Student_App_RN/` and `Employee_App_RN/` (no separate `AGENT_STUDENT_APP.md` / `AGENT_EMPLOYEE_APP.md`).
- **Named decisions (implemented in code):** 5-tab bottom nav with a center camera FAB (Student); a single event-detail `analysis` path (no separate analytics screen); "Invoices" renamed to the Communication Hub.

## 1. System Architecture

```
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   Student App     │   │  Würth Dashboard │   │   Employee App    │
│  Expo/React-Native│   │  Next.js / React │   │  Expo/React-Native│
│  iOS + RN-web     │   │  desktop web     │   │  iOS              │
│  PUBLIC-facing    │   │  INTERNAL        │   │  INTERNAL         │
└────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │                      │                      │
         │   REST (HTTP/JSON)   │   +   WebSocket (chat)│
         └──────────────┬───────┴──────────────────────┘
                        │
              ┌─────────▼──────────┐
              │  Backend — Python   │
              │  FastAPI            │
              │  • REST endpoints   │
              │  • WebSocket server │
              │  • Engagement/KPI   │
              │  • AI (search/LLM)  │
              │  • Scraper + Seed   │
              └─────────┬──────────┘
                        │
              ┌─────────▼──────────┐
              │  Database (SQLite   │
              │  for hackathon;     │
              │  Postgres-ready)    │
              └────────────────────┘
```

**Stack**
- **Frontend:** the **Würth Dashboard** is Next.js (App Router) + React + Tailwind on **Vercel**; the **Student** and **Employee** apps are **Expo / React-Native** (NativeWind/Tailwind), running on iOS and RN-web. All three share the §6 REST + §7 WS contract.
- **Backend:** Python + **FastAPI** (REST) and an ASGI **WebSocket** endpoint for chat. Hosted separately (Railway/Render) or run locally for the demo.
- **DB:** **SQLite** for the hackathon (single file, zero-setup) — schema is Postgres-compatible. Optionally Supabase.
- **AI:** one LLM provider (Anthropic or Gemini) for AI event search + Opportunity-Explorer assistant.

**Golden rule:** Frontends hold **no business logic**. They fetch from / report to the backend. The **backend is the brain**, the clients are the faces. The API contract (§6) is what lets all four parts be built in parallel.

---

## 2. Module Ownership Map (so agents don't collide)

| Module | Owner agent | Folders it owns | Owns these endpoints |
|--------|-------------|-----------------|----------------------|
| **Student App** (Expo/RN) | owned in-repo (no AGENT spec) | `Student_App_RN/src/**` | none (consumes) |
| **Würth Dashboard** (Next.js) | `AGENT_WUERTH_DASHBOARD.md` | `Dashboard_App/**` | none (consumes) |
| **Employee App** (Expo/RN) | owned in-repo (no AGENT spec) | `Employee_App_RN/src/**` | none (consumes) |
| **Backend** | `AGENT_BACKEND.md` | `Backend/app/**` | **all** endpoints + WS server + DB + seed |
| **Shared (read-only for FE)** | Backend owns the contract | each client's `lib/types.ts` (`Dashboard_App/lib`, `*_App_RN/src/lib`) | — |

**No-collision rules**
1. Each human + their agent works on **one Git branch** (`student-app`, `dashboard`, `employee-app`, `backend`). Never push directly to `main`; merge via Pull Request.
2. Stay inside your owned folders. **Shared UI primitives** (Button, Card, Chip, Tabs, Avatar, BottomSheet, Toast) live in `frontend/components/ui/**` — coordinate before editing those.
3. `frontend/lib/types.ts` is the **typed mirror of this contract**. Backend owns its shape; all frontends import from it. Change types here first, then code.
4. The backend is the only module allowed to define new endpoints/fields/enums — and it records them in §5/§6 of this file.

---

## 3. Data-Transmission Methods (READ THIS)

There are exactly **two** transport mechanisms. Pick by this rule:

> **Conversation / real-time push → WebSocket. Everything else → REST.**

### 3.1 REST (HTTP, request → response, stateless)
- **Used for:** all data fetches and mutations — events, feed, event detail, applications, suggestions + votes, memories, materials, check-ins, interactions logging, feedback, profiles, all KPIs, dashboard data, follow-ups, student explorer, opportunity assistant.
- **Format:** JSON over HTTPS. `Content-Type: application/json`.
- **Auth:** `Authorization: Bearer <token>` header. Guest tokens are valid but role-limited.
- **File uploads** (materials, memory images, avatars): `multipart/form-data` (or signed-URL upload to object storage). Treated as REST.
- **Errors:** consistent envelope `{ "error": { "code": string, "message": string } }`, proper HTTP status (400/401/403/404/409/422/500).

### 3.2 WebSocket (persistent, bidirectional, stateful)
- **Endpoint:** `wss://api.weave.de/chat` (dev: `ws://localhost:8000/ws/chat`).
- **Used for:** **all real-time messaging** — student DMs, event channels, internal employee chats, "student conversations", and broadcasts; plus presence and the live event-channel highlight.
- **Auth:** token sent in the connect handshake (query param `?token=` or first `authenticate` frame).
- **Envelope (canonical):**
  ```json
  { "action": "<string>", "payload": { "chatId": 123, "from": "<UUID>", "to": ["<UUID>"], "message": "<string>" } }
  ```
- Full protocol in §7.

### 3.3 Live event sentiment / analytics
- **MVP:** REST **polling** — `GET /internal/events/{eventId}/live-analytics` every N seconds.
- **Optional upgrade:** a WebSocket topic. Not required for the demo.

---

## 4. Shared Conventions

- **IDs:** UUID (v4) for `users`, `events`, `chats`, `interactions`, `materials`, etc. Suggestion/vote/message IDs may be UUID or auto-int — be consistent per table.
- **Timestamps:** ISO-8601 UTC strings (`2026-06-24T10:30:00Z`). Field suffix `_at`.
- **Naming:** `snake_case` in DB and JSON payloads; `camelCase` allowed only inside TypeScript types if mapped. Pick one and keep it — **default: `snake_case` everywhere in the API**.
- **Enums:** all enum values are defined centrally in §5.1. Clients must not invent values.
- **Pagination:** cursor-based — `?limit=20&cursor=<opaque>`; responses return `{ items: [...], next_cursor: string|null }`.
- **Roles:** `student | employee | guest`. Server derives role from the token; `/internal/**` requires `employee`.
- **Empty states:** every list endpoint may return `items: []`. Frontends must render a defined **Empty State**, never a blank screen.

---

## 5. Database Schema

SQLite/Postgres-compatible. Field lists below; FK = foreign key, PK = primary key, `?` = nullable.

### 5.1 Enums (central — do not invent values elsewhere)

| Enum | Values |
|------|--------|
| `user_role` | `student`, `employee`, `guest` |
| `event_type` | `hackathon`, `guest_lecture`, `career_fair_booth`, `excursion`, `student_team`, `technical_talk`, `one_on_one`, `seminar`, `webinar`, `conference`, `trade_fair`, `other` |
| `event_status` | `draft`, `planned`, `upcoming`, `ongoing`, `past`, `cancelled` |
| `event_source` | `manual`, `scraped` |
| `registration_source` | `applied`, `scanned`, `imported`, `manual` |
| `interaction_type` | `check_in`, `check_out`, `full_session`, `file_view`, `file_download`, `memory_post`, `question_asked`, `chat_activity`, `application_submitted`, `sample_interest`, `project_interest`, `career_interest`, `follow_up_request`, `recommendation_submitted`, `connection`, `re_engagement`, `repost` |
| `interaction_source` | `student_app`, `employee_app`, `dashboard`, `external_scan`, `registration_import`, `manual` |
| `material_type` | `slides`, `pdf`, `image`, `link`, `qa_summary`, `product_info`, `project_doc`, `follow_up_resource` |
| `application_status` | `submitted`, `under_review`, `accepted`, `rejected` |
| `follow_up_status` | `open`, `in_progress`, `done`, `closed` |
| `host_recommendation` | `repeat`, `improve`, `stop` |
| `chat_type` | `dm`, `event_channel`, `internal`, `student_conversation` |
| `qr_kind` | `check_in`, `check_out`, `connection` |
| `event_health` | `high_relationship_roi`, `strong_brand_retention`, `high_engagement_needs_followup`, `good_awareness`, `low_continuity`, `weak_followup`, `likely_underperforming`, `needs_review`, `insufficient_data` |
| `prediction_outcome` | `high_confidence_success`, `promising_uncertain`, `relationship_potential`, `risk_low_engagement`, `likely_underperforming`, `insufficient_data` |

### 5.2 Tables

**Identity & profiles**

`users`
- `id` UUID PK
- `role` user_role
- `email` text UNIQUE
- `password_hash` text? (null for guests)
- `display_name` text
- `avatar_url` text?
- `created_at` timestamp

`student_profiles` (1:1 with users where role=student)
- `user_id` UUID PK/FK → users
- `university` text?
- `study_degree` text?
- `hometown` text?
- `consent_visible_to_recruiters` bool default false
- `created_at` timestamp

`employee_profiles` (1:1 with users where role=employee)
- `user_id` UUID PK/FK → users
- `first_name` text
- `surname` text
- `seniority` text?
- `branch_office` text?

`interest_tags`
- `id` int PK
- `name` text
- `category` text  *(Hardware & Core Engineering | Industrial & Manufacturing Tech | Technical Business & Customer Support | Operations, Supply Chain & Digital)*

`user_interests` (M:N)
- `user_id` FK → users
- `tag_id` FK → interest_tags
- PK (`user_id`, `tag_id`)

**Events**

`events`
- `id` UUID PK
- `title` text
- `type` event_type
- `description` text  *(student-facing, editable by owner)*
- `city` text?
- `location` text?
- `start_at` timestamp
- `end_at` timestamp
- `target_group` text?
- `goal` text?
- `cost` numeric?
- `human_capital` text?  *(broad: owners, effort, follow-up workload — see Dashboard §8.2)*
- `partner_university` text?
- `owner_employee_id` UUID FK → users
- `status` event_status
- `application_required` bool default false
- `application_open_at` timestamp?
- `application_close_at` timestamp?
- `files_after_event` bool default false  *(the "Files will be provided after the event" checkbox)*
- `source` event_source default `manual`
- `created_at` timestamp

`event_responsible_employees` (M:N — multiple responsible employees)
- `event_id` FK → events
- `employee_id` FK → users
- PK (`event_id`, `employee_id`)

**Applications**

`application_questions`
- `id` UUID PK
- `event_id` FK → events
- `question_text` text
- `position` int

`applications`
- `id` UUID PK
- `event_id` FK → events
- `applicant_user_id` UUID? FK → users  *(null for guest)*
- `applicant_email` text
- `status` application_status default `submitted`
- `submitted_at` timestamp

`application_answers`
- `id` UUID PK
- `application_id` FK → applications
- `question_id` FK → application_questions
- `answer_text` text

**Attendance lifecycle (registered → appeared → full-session)**

`event_registrations`
- `id` UUID PK
- `event_id` FK → events
- `user_id` UUID? FK → users
- `email` text  *(for guest tracking)*
- `source` registration_source
- `registered_at` timestamp
- `checked_in_at` timestamp?  *(appeared)*
- `checked_out_at` timestamp?  *(full session if present)*
- UNIQUE (`event_id`, `user_id`)

**Interactions (central engagement log)**

`interactions`
- `id` UUID PK
- `event_id` UUID? FK → events
- `user_id` UUID? FK → users
- `type` interaction_type
- `timestamp` timestamp
- `source` interaction_source
- `confidence_level` real?  *(0–1; default 1 for explicit actions)*
- `related_material_id` UUID? FK → materials
- `related_chat_id` UUID? FK → chats
- `related_followup_id` UUID? FK → follow_ups
- `metadata` json?

**Content**

`materials`
- `id` UUID PK
- `event_id` FK → events
- `type` material_type
- `title` text
- `url` text
- `uploaded_by` UUID FK → users
- `upload_date` timestamp
- `access_count` int default 0
- `download_count` int default 0
- `related_topic` text?

`memories`  *(Capture a Memory — Twitter-thread style)*
- `id` UUID PK
- `event_id` FK → events
- `author_user_id` UUID FK → users
- `parent_id` UUID? FK → memories  *(null = top-level; set = reply in thread)*
- `body` text
- `is_public` bool default true  *(shown on student profile to recruiters if consent + this flag)*
- `created_at` timestamp

`memory_images`
- `id` UUID PK
- `memory_id` FK → memories
- `image_url` text

**Suggestions / Requests (Reddit-style)**

`event_suggestions`
- `id` UUID PK
- `title` text
- `description` text
- `proposer_user_id` UUID FK → users
- `proposer_email` text  *(visible to employees only)*
- `source_event_id` UUID? FK → events  *(set if created via "repost" of a past event)*
- `repost_count` int default 0
- `created_at` timestamp  *(auto-delete entries older than 1 year — cleanup job)*

`suggestion_votes`
- `id` UUID PK
- `suggestion_id` FK → event_suggestions
- `user_id` FK → users
- `value` smallint CHECK in (`-1`, `1`)
- UNIQUE (`suggestion_id`, `user_id`)

**Feedback / KPI source tables**

`feedback`  *(recommendation / referral / NPS)*
- `id` UUID PK
- `event_id` FK → events
- `user_id` UUID? FK → users
- `recommendation_score` int  *(e.g. 0–10)*
- `nps_score` int?
- `text` text?
- `submitted_at` timestamp

`host_reports`  *(Host Experience Reports)*
- `id` UUID PK
- `event_id` FK → events
- `host_user_id` UUID FK → users
- `organization_rating` int
- `audience_relevance_rating` int
- `interaction_quality_rating` int
- `repeat_recommendation` host_recommendation
- `notes` text?
- `suggested_improvements` text?
- `created_at` timestamp

**Follow-ups (Next Best Steps / continuity)**

`follow_ups`
- `id` UUID PK
- `event_id` FK → events
- `contact_user_id` UUID FK → users
- `assigned_owner_id` UUID FK → users  *(employee)*
- `next_action` text
- `type` text?
- `due_date` timestamp?
- `status` follow_up_status default `open`
- `outcome` text?
- `created_at` timestamp
- `completed_at` timestamp?

**Messaging**

`chats`
- `id` UUID PK
- `type` chat_type
- `event_id` UUID? FK → events  *(set for event_channel)*
- `created_at` timestamp

`chat_participants`
- `chat_id` FK → chats
- `user_id` FK → users
- PK (`chat_id`, `user_id`)

`messages`
- `id` UUID PK
- `chat_id` FK → chats
- `sender_user_id` UUID FK → users
- `body` text
- `sent_at` timestamp
- `read_by` json?  *(array of user_ids; optional read receipts)*

**Employee live tools**

`event_notes`  *(private employee notes per event)*
- `id` UUID PK
- `event_id` FK → events
- `author_employee_id` UUID FK → users
- `body` text
- `created_at` timestamp

`event_sentiment`  *(live crowd sentiment capture)*
- `id` UUID PK
- `event_id` FK → events
- `author_employee_id` UUID FK → users
- `description` text
- `sentiment_value` real?  *(optional numeric)*
- `created_at` timestamp

**Scan tokens & prioritization & notifications**

`qr_tokens`
- `id` UUID PK
- `event_id` UUID? FK → events
- `kind` qr_kind
- `token` text UNIQUE
- `created_by` UUID FK → users
- `expires_at` timestamp?

`engagement_scores`  *(cached; backend-only — never sent to students)*
- `user_id` FK → users
- `event_id` UUID? FK → events  *(null = global score)*
- `score` int
- `computed_at` timestamp
- PK (`user_id`, `event_id`)

`notifications`  *(employee app: engagement reports, retention tips)*
- `id` UUID PK
- `user_id` FK → users
- `type` text
- `payload` json
- `created_at` timestamp
- `read_at` timestamp?

### 5.3 Relationship summary
- `users` 1—1 `student_profiles` / `employee_profiles`; M—N `interest_tags` via `user_interests`.
- `events` 1—N `materials`, `memories`, `application_questions`, `event_registrations`, `interactions`, `feedback`, `host_reports`, `follow_ups`, `event_notes`, `event_sentiment`; M—N employees via `event_responsible_employees`.
- `event_suggestions` 1—N `suggestion_votes`; optionally references a `source_event_id`.
- `chats` M—N `users` via `chat_participants`; 1—N `messages`.
- `interactions` is the spine for all KPI + engagement computation.

---

## 6. Complete Endpoint Catalogue

All paths are REST unless marked **WS**. `/api/**` = public/student-facing; `/internal/**` = Würth-side (role `employee`). Auth column: `public` (no auth needed), `auth` (any logged-in incl. guest), `student`, `employee`.

### 6.1 Auth (shared by all clients) — REST
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/signup` | public | email + password → `{ token, user }` |
| POST | `/api/auth/login` | public | email + password → `{ token, user }` (role-aware; employees log in here too) |
| POST | `/api/auth/guest` | public | email only → guest `{ token, user }` |
| GET | `/api/auth/me` | auth | current user + role |
| POST | `/api/auth/logout` | auth | invalidate session |

**Scan/login flow (consolidated):** scanning an event QR opens a deep link (`/scan?event={id}` or `/e/{id}`). If the user is already logged in → check-in completes automatically (Toast "Checked in ✓"). If not → present **Sign In / Sign Up / Continue as Guest (small, grey)**, then return to the triggering event and check in. Must work even when the **external system camera** scans and forwards into the app or mobile web page.

### 6.2 Student / Public — Events & Feed — REST
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/events` | public | Feed list. Query: `type`, `city`, `from`, `to`, `attended`(auth), `timeframe=future\|past`, `sort`, `limit`, `cursor`. Returns short previews + application status/window. |
| GET | `/api/events/search` | public | **AI-assisted** semantic search over future + past events. Query `q`. |
| GET | `/api/events/current` | auth | The user's currently-live registered event, or `null` (drives the **Current Event FAB**). Live window = `start_at − 2h … end_at + 2h`. |
| GET | `/api/events/{id}` | public | Full event detail (Information tab). |
| GET | `/api/events/{id}/files` | auth | Materials (File Drive). Empty/hidden logic; respects `files_after_event`. |
| GET | `/api/events/{id}/memories` | public | Memory thread (top-level + replies). |
| POST | `/api/events/{id}/memories` | student | Post a Memory (text + images). Attendees only, from `start_at` onward. Body `{ body, images[], parent_id? }`. Emits `memory_post`. |
| POST | `/api/events/{id}/repost` | student | Repost a past event → creates/【increments】a suggestion (adds an upvote if it already exists). Emits `repost`. |
| GET | `/api/events/{id}/application` | public | Application questions + window + status. |
| POST | `/api/events/{id}/application` | auth | Submit application (answers + email). Guest or student. Emits `application_submitted`. |
| POST | `/api/events/{id}/feedback` | auth | Recommendation / NPS / text (end-of-event QR). Emits `recommendation_submitted`. |

### 6.3 Student — Check-in / Scan / Interactions — REST
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/events/{id}/check-in` | auth | Scan event QR → register + check-in. Guest or student. Emits `check_in`. |
| POST | `/api/scan/employee/{employeeId}` | student | Student scans an employee's QR → `connection` + opens/creates a DM. |
| POST | `/api/interactions` | auth | **Generic interaction logger** for actions without a dedicated endpoint: `file_view`, `file_download`, `question_asked`, `sample_interest`, `project_interest`, `career_interest`, `follow_up_request`. Body `{ event_id, type, metadata? }`. |

### 6.4 Student — Profile & Settings — REST
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/users/me/profile` | student | Own profile. |
| PATCH | `/api/users/me/profile` | student | Update university, degree, hometown, avatar. |
| PUT | `/api/users/me/password` | student | Change password. |
| GET | `/api/interest-tags` | public | Full taxonomy (grouped by category). |
| PUT | `/api/users/me/interests` | student | Set selected interest tag IDs. |
| GET | `/api/users/me/memories` | student | Own public Memories (profile display). |

### 6.5 Student — Suggestions / Requests — REST
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/suggestions` | public | List. Query `sort=recency\|popularity`. |
| POST | `/api/suggestions` | student | Create `{ title, description }`. |
| PATCH | `/api/suggestions/{id}` | student | Edit (proposer only). |
| DELETE | `/api/suggestions/{id}` | student/employee | Proposer or employee may delete. |
| POST | `/api/suggestions/{id}/vote` | student | Body `{ value: 1 \| -1 }` (upsert; one per user). |

### 6.6 Chat — REST helpers (real-time via WS, §7)
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/chats` | student | My conversations (DMs + event channels) with live-highlight flags. |
| POST | `/api/chats` | student | Start a chat (only with prior contacts or co-attendees). |
| GET | `/api/chats/{chatId}/messages` | student | Message history (paginated). |
| POST | `/api/chats/{chatId}/messages` | student | Send (REST fallback; primary path is WS). |
| GET | `/api/chats/search-people` | student | Query `q`; returns people you may chat with (already chatted **or** co-attended an event). |

### 6.7 Internal — Dashboard (global) — REST · role `employee`
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/internal/dashboard/summary` | Executive Summary Strip fields. |
| GET | `/internal/dashboard/performance` | Graphical event-performance chart data. Query `dimension=relationship_roi\|brand_retention\|engagement\|returning_rate\|recommendation\|full_session\|follow_ups\|cost_per_lead\|host_experience\|health`. |
| GET | `/internal/dashboard/next-best-events` | Next Best Events recommendations + reasons. |
| GET | `/internal/dashboard/timeline` | Gantt data (planned/ongoing/past, follow-up windows, deadlines, human-capital load). |
| GET | `/internal/dashboard/kpis` | Global KPI aggregates. |

### 6.8 Internal — Events — REST · role `employee`
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/internal/events` | All events overview. |
| GET | `/internal/employees/{employeeId}/events` | Events a given employee is involved in (the doc's `events-overview`). |
| GET | `/internal/events/{eventId}` | Internal event detail: local KPIs, `health` label, relationship-ROI; includes `analysis` block when status `ongoing`/`past`. |
| GET | `/internal/events/{eventId}/kpis` | Local KPIs only. |
| GET | `/internal/events/{eventId}/attendees` | Attendee list (`allAttendees`). |
| GET | `/internal/events/{eventId}/interactions` | **Interactions for the event** (resolves the source TODO). |
| GET | `/internal/events/{eventId}/next-best-steps` | Next Best Steps for this event. |
| GET | `/internal/events/{eventId}/prediction` | Flop detection / confidence prediction (for planned events). |
| POST | `/internal/events` | Create event (manual creation form). |
| PATCH | `/internal/events/{eventId}` | Edit event, incl. the student-facing `description`. |
| DELETE | `/internal/events/{eventId}` | Delete. |

### 6.9 Internal — Applications config — REST · role `employee`
| Method | Path | Purpose |
|--------|------|---------|
| PUT | `/internal/events/{eventId}/application-questions` | Set questions + application window. |
| GET | `/internal/events/{eventId}/applications` | View submitted applications. |
| PATCH | `/internal/applications/{applicationId}` | Update status (accept/reject/under_review). |

### 6.10 Internal — Materials — REST · role `employee`
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/internal/events/{eventId}/materials` | List. |
| POST | `/internal/events/{eventId}/materials` | Upload (`multipart/form-data`): slides, pdf, image, link, etc. |
| DELETE | `/internal/materials/{materialId}` | Remove. |

### 6.11 Internal — QR & Scan — REST · role `employee`
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/internal/events/{eventId}/qr/check-in` | Generate a check-in QR token. |
| POST | `/internal/events/{eventId}/qr/check-out` | Generate a check-out (full-session) QR token. |
| POST | `/internal/scan/student/{studentUserId}` | Employee scans a student QR → `connection` + enable IM. |

### 6.12 Internal — Host reports / Live / Notes / Broadcast — REST · role `employee`
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/internal/events/{eventId}/host-report` | Submit host experience report. |
| GET | `/internal/events/{eventId}/host-report` | Read host report(s). |
| POST | `/internal/events/{eventId}/sentiment` | Capture live crowd sentiment (description). |
| GET | `/internal/events/{eventId}/live-analytics` | Live sentiment analytics (polling, if enabled). |
| POST | `/internal/events/{eventId}/broadcast` | Broadcast an instant message to all attendees (fans out over WS). |
| GET | `/internal/events/{eventId}/notes` | Read employee private notes. |
| POST | `/internal/events/{eventId}/notes` | Add a private note. |

### 6.13 Internal — Follow-ups — REST · role `employee`
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/internal/follow-ups` | List. Query `event_id`, `owner_id`, `status`. |
| POST | `/internal/follow-ups` | Create. |
| PATCH | `/internal/follow-ups/{id}` | Update status / outcome. |
| GET | `/internal/events/{eventId}/follow-ups` | Follow-ups for one event. |

### 6.14 Internal — Student Explorer / Detail / Priority — REST · role `employee`
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/internal/students` | Explorer table. Query `sort=priority\|engagement\|recency`, `university`, `interest_tag`, `follow_up_status`. |
| GET | `/internal/students/{studentUserId}` | Relationship detail (history, interests, follow-ups, recommended next action). |
| GET | `/internal/students/{studentUserId}/timeline` | Interaction timeline. |
| GET | `/internal/priority-queue` | Backend prioritization output (queues, recommended actions, urgency, confidence). |

### 6.15 Internal — Suggestions (employee view) — REST · role `employee`
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/internal/suggestions` | List with proposer **email** visible; sorted by popularity. |
| DELETE | `/internal/suggestions/{id}` | Delete a suggestion. |

### 6.16 Internal — Communication Hub — REST helpers (real-time via WS)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/internal/chats` | Internal employee chats + student conversations. |
| GET | `/internal/chats/{chatId}/messages` | History. |
| POST | `/internal/chats` | Start a chat. |
| GET | `/internal/student-conversations` | Student conversations sorted by engagement / follow-up signals. |

### 6.17 Internal — Create Page / Opportunity Explorer — REST · role `employee`
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/internal/opportunities` | Opportunity Explorer suggestions (untapped universities, formats to repeat, etc.). |
| POST | `/internal/opportunities/assistant` | **LLM planning assistant.** Body `{ prompt }` → reasoned recommendations with explanations. |

### 6.18 Internal — Employee profile / Notifications — REST · role `employee`
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/internal/employees/me` | Own profile (name, surname, seniority, branch). |
| PATCH | `/internal/employees/me` | Edit profile + avatar. |
| GET | `/internal/notifications` | Engagement reports, retention tips, improvement notices. |

### 6.19 WebSocket — Messaging (all clients) — **WS**
`wss://api.weave.de/chat` — see §7 for the full protocol.

---

## 7. WebSocket Protocol (Instant Messaging)

**Connect:** `wss://api.weave.de/chat?token=<JWT>` (dev `ws://localhost:8000/ws/chat`). The first frame may instead be `authenticate`.

**Canonical envelope (both directions):**
```json
{ "action": "<string>", "payload": { "chatId": 123, "from": "<UUID>", "to": ["<UUID>"], "message": "<string>" } }
```

**Client → Server actions**
| action | payload | effect |
|--------|---------|--------|
| `authenticate` | `{ token }` | authenticate the socket |
| `join_chat` | `{ chatId }` | subscribe to a conversation |
| `send_message` | `{ chatId, from, to[], message }` | persist message + fan out to participants |
| `typing` | `{ chatId, from }` | typing indicator |
| `read_receipt` | `{ chatId, from, messageId }` | mark read |
| `presence` | `{ from, status }` | online/away |

**Server → Client events**
| action | payload | meaning |
|--------|---------|---------|
| `new_message` | `{ chatId, from, message, sentAt, messageId }` | a new message arrived |
| `presence_update` | `{ userId, status }` | someone's presence changed |
| `channel_highlight` | `{ chatId, eventId, active }` | event channel entered/left its live window (`start−2h … end+2h`) |
| `broadcast` | `{ eventId, message, from }` | organiser broadcast to all attendees |
| `error` | `{ code, message }` | error frame |

**Used by:** Student DMs + event channels; Employee App chat + broadcasts; Dashboard Communication Hub. All three clients speak the **same** protocol.

**Persistence:** every `send_message` is written to `messages`; history is fetched via the REST `/…/chats/{chatId}/messages` helper. WS handles only the live delivery.

---

## 8. Engagement Scoring & Backend Prioritization (resolves "Engagementscore Logik fehlt noch")

**Principle:** the score is **backend-only**. Students **never** see a number or a ranking — they see neutral statuses. Würth sees prioritized signals.

**8.1 Per-interaction weights** (configurable; default map)
| interaction_type | weight |
|------------------|-------:|
| `check_in` | +1 |
| `full_session` (`check_out`) | +2 |
| `file_view` / `file_download` | +3 |
| `memory_post` | +3 |
| `recommendation_submitted` | +5 |
| `question_asked` | +5 |
| `sample_interest` | +10 |
| `re_engagement` (returning at a later event) | +10 |
| `project_interest` | +15 |
| `follow_up_request` | +15 |
| `career_interest` | +20 |
| `application_submitted` | +25 |

`engagement_scores.score` = weighted sum of a contact's interactions (global) or filtered by `event_id` (per-event). Cache in `engagement_scores`; recompute on new interactions.

**8.2 Qualified Lead definition** (for Cost-per-Lead etc.)
A contact is a **qualified relationship lead** when they have a `check_in` **plus at least one** stronger signal (any of: `file_view`, `question_asked`, `sample_interest`, `project_interest`, `career_interest`, `follow_up_request`, `application_submitted`, `re_engagement`). A bare check-in is **not** a qualified lead.

**8.3 What Würth sees** (priority output, via `/internal/priority-queue`, `/internal/students`)
priority queues · recommended next actions · relationship-strength indicators · event-level engagement patterns · follow-up urgency · confidence levels.

**8.4 What students see** (neutral statuses only)
`connected` · `material_available` · `follow_up_open` · `project_support_requested` · `career_interest_submitted` · `application_context_available`.

---

## 9. Seed Data (backend owns; for the demo)

- **3 Würth employees** (role `employee`): **Simon Häckner** `simon.haeckner@we-online.de`, **Jana Donges** `jana.donges@we-online.com`, **Christian Kapusta** `christian.kapusta@we-online.com`.
- **5 students** (role `student`): **Nakulan, Michael, Lenni, Thiviyan, Jakob** — names may stand in for emails for now (it's a hackathon).
- **Events:** scrape `https://www.we-online.com/de/newscenter/events`, ingest as `events` (`source=scraped`), and **distribute ownership** across the three employees. (The page is server-rendered HTML + embedded iCal; parse title, type, start/end, location.) Add a few **past** events so the timeline, memories, KPIs, and the returning-user logic have data.
- Generate a spread of `interactions`, `registrations`, `feedback`, and at least one `host_report` per past event so the dashboard looks alive.

---

## 10. Build Phases & Git Workflow (brief)

1. **Phase 0 (together, ~1h):** lock this contract, scaffold the repo, deploy an empty frontend to Vercel, agree branches. *Do this before any feature work.*
2. **Phase 1:** each module scaffolds against **mock data** in the §6 shapes (backend serves seed data early).
3. **Phase 2:** build features in parallel, each in its own branch/folder.
4. **Phase 3:** swap mocks for the live backend (the contract makes this clean).
5. **Phase 4:** seed, polish, drill the demo, record a backup video, rehearse the pitch.

**Rules:** never push to `main` (branch + PR) · small frequent commits · stay in your owned folders · change `types.ts`/this file before adding fields · test in the browser, not by reading code.
