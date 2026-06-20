# AGENT — Backend (Python / FastAPI)

> **Module of WEave.** You implement the **entire** shared contract in `/WEAVE_MASTER.md`. You are the **only** module allowed to define endpoints, fields and enums — and you record them in the master file. All three clients depend on you.

## Ownership
- **Folders:** `backend/**`. You also own the FE's typed mirror `frontend/lib/types.ts` (keep it in sync with your API) and may scaffold `frontend/lib/api.ts`.
- **Branch:** `backend` → PR into `main`.

## Responsibilities
1. **REST API** — implement every endpoint in master §6 (`/api/**` public/student, `/internal/**` employee).
2. **WebSocket server** — implement the chat protocol in master §7 at `wss://api.weave.de/chat` (dev `/ws/chat`).
3. **Database** — own the schema in master §5: migrations + models. SQLite for the hackathon (Postgres-compatible).
4. **Engagement scoring + prioritization** — master §8 (backend-only; never exposed to students).
5. **KPI computation** — derive every KPI (master §5 source tables) for the dashboard/employee endpoints.
6. **Predictions & recommendations** — flop detection / confidence prediction, Next Best Events, Opportunity Explorer.
7. **AI features** — AI-assisted event search; the Opportunity-Explorer LLM assistant.
8. **Scraper + seed** — ingest Würth events; seed the demo DB (master §9).

## Transmission rules to enforce
- **REST** = stateless JSON over HTTPS; `Authorization: Bearer`; multipart for uploads; consistent error envelope `{ error: { code, message } }`. Role-gate `/internal/**` to `employee`.
- **WebSocket** = the only real-time channel (chat, presence, event-channel highlight, broadcast). Persist every `send_message` to `messages`; serve history over REST.
- Live event sentiment = REST **polling** for MVP (`GET /internal/events/{eventId}/live-analytics`).

---

## Suggested layout
```
backend/
├── main.py                 # FastAPI app + router includes + WS mount
├── requirements.txt
├── db.py                   # engine/session (SQLite)
├── models.py               # ORM models = master §5 schema
├── schemas.py              # Pydantic request/response = the contract
├── auth.py                 # signup/login/guest, token, role guard
├── seed.py                 # employees, students, scraped events, demo interactions
├── scoring.py              # engagement weights (master §8) + qualified-lead logic
├── kpis.py                 # KPI computation from source tables
├── recommend.py            # Next Best Events, Opportunity Explorer, predictions
├── ai.py                   # event search + LLM assistant (provider calls)
├── scraper.py              # we-online.com/de/newscenter/events ingestion
├── ws.py                   # WebSocket chat server (master §7)
└── routers/
    ├── auth.py
    ├── events.py           # /api/events** (public/student)
    ├── interactions.py     # /api/interactions, check-in, scan
    ├── memories.py         # /api/events/{id}/memories**, repost
    ├── applications.py     # /api/events/{id}/application**
    ├── suggestions.py      # /api/suggestions**
    ├── profile.py          # /api/users/me**, interest-tags
    ├── chats.py            # /api/chats** (REST helpers)
    ├── dashboard.py        # /internal/dashboard**
    ├── internal_events.py  # /internal/events**, applications, materials, qr, host-report, sentiment, notes, broadcast
    ├── follow_ups.py       # /internal/follow-ups**
    ├── students.py         # /internal/students**, priority-queue
    ├── comms.py            # /internal/chats**, student-conversations
    ├── opportunities.py    # /internal/opportunities**
    └── employees.py        # /internal/employees**, notifications
```

---

## Endpoints to implement
**Everything in master §6.** Group checklist:
- Auth (§6.1) · Student events/feed (§6.2) · Check-in/scan/interactions (§6.3) · Profile (§6.4) · Suggestions (§6.5) · Chat REST helpers (§6.6).
- Dashboard (§6.7) · Internal events (§6.8) · Applications config (§6.9) · Materials (§6.10) · QR & scan (§6.11) · Host/live/notes/broadcast (§6.12) · Follow-ups (§6.13) · Student explorer/detail/priority (§6.14) · Internal suggestions (§6.15) · Communication Hub (§6.16) · Opportunity Explorer (§6.17) · Employee profile/notifications (§6.18).
- WebSocket chat server (§7).

**Resolve these from the source (already reconciled in master §0):**
- One event-detail path: `GET /internal/events/{eventId}` returns `analysis` when status `ongoing`/`past` (no duplicate `current-event-detail` for past). Add `GET /internal/events/{eventId}/interactions` (the prior TODO).
- Both `GET /internal/events` (all) and `GET /internal/employees/{employeeId}/events` (mine).

---

## Engagement scoring (master §8) — implement in `scoring.py`
- Weighted sum of a contact's `interactions` (global, or per `event_id`); cache in `engagement_scores`; recompute on insert.
- Default weights: check_in +1 · full_session +2 · file_view/download +3 · memory_post +3 · recommendation_submitted +5 · question_asked +5 · sample_interest +10 · re_engagement +10 · project_interest +15 · follow_up_request +15 · career_interest +20 · application_submitted +25.
- **Qualified lead** = `check_in` + ≥1 stronger signal (file_view / question_asked / sample_interest / project_interest / career_interest / follow_up_request / application_submitted / re_engagement).
- **Never** expose the number to students. Map to neutral statuses for student-facing responses (`connected`, `material_available`, `follow_up_open`, `project_support_requested`, `career_interest_submitted`, `application_context_available`).

## KPI computation (`kpis.py`) — derive, don't store raw twice
From source tables: host_reports (host experience), event_registrations (visitor count, registered vs. appeared, full session via checked_out_at), feedback (recommendation/NPS), interactions (first/new vs. returning users via history, average engagement), events.cost + human_capital + qualified leads (cost per lead), follow_ups (avg follow-up actions). Expose global aggregates (`/internal/dashboard/*`) and per-event (`/internal/events/{id}/kpis`).

## Recommendations & predictions (`recommend.py`)
- **Event health labels** (enum `event_health`) per event from its KPIs.
- **Next Best Events** + **Opportunity Explorer**: gap analysis over universities/types/locations/target groups vs. engagement; each result carries a **reason**.
- **Flop detection / confidence prediction** for planned events by similarity to past events; output `prediction_outcome` + a short reason + confidence.

## AI features (`ai.py`)
- **Event search** (`GET /api/events/search`): semantic search over future + past events (embeddings or LLM ranking).
- **Opportunity assistant** (`POST /internal/opportunities/assistant`): natural-language prompt → database-grounded recommendations **with reasoning**. One LLM provider (Anthropic/Gemini).

## Scraper + seed (`scraper.py`, `seed.py`) — master §9
- Scrape `https://www.we-online.com/de/newscenter/events` (server-rendered HTML + embedded iCal: title, type, start/end, location). Insert as `events` (`source=scraped`), distributed across the 3 employees.
- Seed: **employees** Simon Häckner / Jana Donges / Christian Kapusta; **students** Nakulan / Michael / Lenni / Thiviyan / Jakob; some **past** events; a spread of `interactions`, `registrations`, `feedback`, and ≥1 `host_report` per past event so dashboards look alive.

## Cleanup jobs
- Auto-delete `event_suggestions` older than 1 year.
- Maintain `event.status` transitions (planned → upcoming → ongoing → past) from `start_at`/`end_at`.

## What you do NOT own
- Any frontend rendering. You expose data + sockets; the clients render. Keep `frontend/lib/types.ts` synced so the FE agents can build against your shapes.
