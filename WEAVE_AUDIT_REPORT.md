# WEave — End-to-End Test & Integration Audit

**Date:** 2026-06-20 · **Scope:** Backend (FastAPI) · Würth Dashboard (Next.js) · Student App (Expo/RN) · Employee App (Expo/RN)
**Method:** empirical — fresh SQLite backend on **:8001** for the API/WS/data-flow/seed sweeps; the user's **live stack** (backend :8000, Dashboard :3000, Student Expo :8081, Employee Expo :8082) driven with real HTTP, a real WebSocket client, and headless Chrome. Every "works" claim below is backed by a captured request/response or screenshot.

> **Contract:** `WEAVE_MASTER.md` §1–§10 treated as source of truth. (Note: the mission references a "§0 resolved-conflicts log" — **no §0 exists** in the file; the three named decisions were verified against code instead.)

> **Audit conditions (read this):** the repo had **substantial uncommitted in-flight work** present during the audit (≈35 files modified/deleted by ongoing development — e.g. `Backend/app/seed.py`, several `Student_App_RN` files incl. `camera.tsx`/`feed/*`, `Dashboard_App/lib/*`, and the deletion of the old Next.js `Student_App/`). Findings reflect the code state at the time each was tested; **some may already be addressed by that in-flight work** — re-run the targeted checks once the demo branch is frozen. **My footprint is isolated**: exactly the 3 fix files below + this report. (`expo lint`, run for the static pass, auto-generated eslint configs/devDeps in the two RN apps; those byproducts were reverted, leaving the apps as found.)

---

## 1. Demo-readiness verdict

**YES — the critical path works end-to-end, after one blocker fix that is now applied and verified.**

The backend data pipeline is solid: a student check-in writes a `check_in` interaction and moves the Würth-side KPIs; a memory raises the engagement signal; file/application/scan interactions log with the correct types; the §8 engagement score is computed from the exact §8.1 weights, the qualified-lead rule holds, and the score **never leaks to students** (verified both directions). The Würth Dashboard and both Expo apps run against the live backend with real seeded data. The **one demo-breaker** was the Dashboard event-detail page crashing on every ongoing/past event (`analysis.highlights` undefined) — it has been **fixed and re-verified green** in the live browser. With that fix, the live flows a juror would click through all render and reflect real data. Remaining issues are non-blocking drifts and seed-richness gaps (below), the most demo-relevant being the **Employee login default password** (also fixed) and a few **empty seed tables** (memories/suggestions/applications) that make those screens show empty states.

**Data-flow (Phase 6): 22/22 checks pass. WebSocket (Phase 7 §7): 12/13 pass. Backend §6 endpoints: all registered, every endpoint exercised, none 500 on the happy path (one query-param case 500 — fixed).**

**Frontend runtime (Phase 5 — web + iOS):** Student-web **PASS** (all 13 routes, 0 console errors, styled empty states, tab-gating + 5-tab/center-camera nav verified). Employee-web **WARN** (clean runtime; only the login-password issue, now fixed). Dashboard **FAIL→PASS** after the blocker fix. **iOS native:** the Student app **built (0 errors) and boots clean on an iPhone 16 Pro simulator** (no redbox), renders live data, and the 5-tab + center-camera nav is confirmed on-device; the `weave://` deep-link opens the app but does not check in (finding #8).

---

## 2. Findings

Severity scale: **BLOCKER** (breaks the live demo) · **MAJOR** (a spec'd feature is broken/missing) · **MINOR** (works but wrong/at-risk) · **NIT** (cosmetic/polish). `kind` = broken / drift (code vs spec) / deliberate-stub / ok.

| # | Sev | Module | What | Where | Why it matters | Repro | Fix |
|---|-----|--------|------|-------|----------------|-------|-----|
| 1 | **BLOCKER** ✅FIXED | Dashboard | Event-detail page crashed for **every ongoing/past event** — renders `ev.analysis.highlights.map()` but backend's `analysis` block has no `highlights` key (only in `mockData.ts`) | `app/events/[eventId]/page.tsx:78`; type `lib/types.ts:98`; BE `services.py` build_event_detail | The entire event detail (KPIs, next-best-steps, attendees, materials, the headline "analysis" block) was unreachable for past/ongoing events; upcoming escaped only because `analysis=null` | Open `/events/evt-1` or `/events/evt-3` → white screen + `Cannot read properties of undefined (reading 'map')` | **Applied:** guard `(ev.analysis.highlights ?? []).map(...)` |
| 2 | **MAJOR** ✅FIXED | Employee | Login screen prefills + advertises password **`wuerth`**, but the backend only accepts **`weave`** → UI login returns **401** | `src/app/login.tsx:13` (default) + `:103` (demo card) | A juror tapping the prefilled "Sign in" gets "login failed". Token path works, but the documented creds don't | `POST :8000/api/auth/login {…, "wuerth"}` → 401; `"weave"` → 200 | **Applied:** `wuerth`→`weave` in both spots |
| 3 | **MAJOR** ✅FIXED | Backend | `GET /internal/students?sort=recency` → **HTTP 500** (sorts a `datetime` against `""` when a student has no interactions) | `app/routers/students.py:75` | A contracted sort value (§6.14) crashes the Student-Explorer "recency" tab whenever any student has no interactions | `curl '…/internal/students?sort=recency'` → 500 | **Applied:** None/tz-safe `isoformat()` sort key |
| 4 | MAJOR | Dashboard | `EventStatus`/`EventHealth`/`EventType`/`host_recommendation` enums diverge from §5.1 → real backend values (`past`, `likely_underperforming`, `career_fair_booth`, `excursion`…) render as **blank/`undefined`** badges | `lib/types.ts:11-22,219`, `lib/format.ts:19-59` | Every real event card/detail shows empty status & health badges and "undefined" type label; cosmetic but pervasive on the demo screen | `/events/evt-4` subtitle = "undefined · München · …" | Replace the three enums + label/tone maps with the §5.1 value sets (reported, not auto-fixed — broader change) |
| 5 | MAJOR | Backend | Materials upload accepts **JSON link only**, not `multipart/form-data` (§6.10 mandates file upload) | `routers/internal_events.py:255` `add_material` (`body: MaterialCreateRequest`) | Slides/PDF/image **file** upload is impossible; only a URL/link reference can be stored | multipart POST → 422; JSON `{title,type,url}` → 201 | Accept `UploadFile`+`Form`, or declare the contract link-only |
| 6 | MAJOR | Backend | `GET /api/events?attended` filter is silently ignored (auth user discarded) | `routers/events.py:55` `feed()` | "My Events" / attended filter returns all events; student "my events" view can't filter server-side | `…/api/events?attended=true` returns all 5 | Add `attended` param + use the optional user |
| 7 | MAJOR | Backend | Memory posting is **not attendee-gated** (§6.2 = "attendee-only, from start_at onward") | `routers/events.py:159` `post_memory()` | Any student can post a memory to an event they never attended | student with no reg POSTed to evt-4 → 201 | Require an `EventRegistration` (ideally checked-in) before insert |
| 8 | MAJOR | Student | **External-camera QR deep-link not wired** — no `/e/…` or `/scan` route and no incoming-URL `Linking` handler; logged-out in-app scan redirects to `/login` but **loses the pending event** (no return-and-complete, no guest choice) | `src/app/` route tree; `src/app/camera.tsx:31-37,40`; `app.json:8` (`scheme:"weave"`, no link config) | §6.1/§Phase 6.6 explicitly require the external system-camera `weave://e/{id}/check_in/{token}` path to work; only the **in-app** scanner + "Simulate Scan" works | **iOS sim (empirical):** `xcrun simctl openurl … weave://e/evt-6/check_in/t-audit` → OS "Open in 'WEave Student'?" dialog → app foregrounds at the Discover Events feed, **no check-in, no `/e` routing** | Add a `+native-intent`/linking route that maps `weave://e/{id}/…` into `camera.parseScan`→check-in; persist pending event across login |
| 9 | MINOR | Backend | Chat message read/write has **no participant membership check** — any authenticated user can `GET`/`POST` any chat by id | `routers/chats.py:140-157` | A student could read/post to a chat they're not in (creation is gated; message access is not) | `GET /api/chats/<any-id>/messages` as non-member → 200 | Verify `ChatParticipant` before read/write |
| 10 | MINOR | Backend | `/api/events/search` is **heuristic-only**; never calls the LLM even with a key (§6 labels it "AI-assisted semantic search") | `app/ai.py:33` `search_events()` | The "AI search" is keyword ranking; fine offline, but not AI | `q=hackathon`→[evt-3] via keyword rank; no LLM call | Wire `_call_anthropic` behind the key, or relabel |
| 11 | MINOR | Backend | Datetime serialization inconsistent: hand-built dicts omit the trailing `Z` (events/files/memories/auth/timeline) while Pydantic models include it | `routers/events.py:33-52` + `dashboard.py:88` etc. | Strict client parsers that branch on tz-presence can mis-handle the same wire contract two ways | `events.start_at`="…T15:00:00" (no Z) vs suggestions `created_at`="…Z" | Route all datetimes through one `Z` serializer |
| 12 | MINOR | Backend | `dashboard/performance?dimension=health` (and `brand_retention`/`cost_per_lead`/`host_experience`) silently fall back to `engagement_index` while echoing the requested dimension | `routers/dashboard.py:69-76` | The chart shows wrong data labeled as the requested dimension; caller can't tell | `?dimension=health` == `?dimension=engagement` output | Add the dimensions or 422 on unsupported |
| 13 | MINOR | Backend | `PATCH /internal/applications/{id}` doesn't validate `application_status` (accepts `bogus_status`) | `routers/internal_events.py:232` | Invalid statuses persist | PATCH `{status:"bogus_status"}` → 200 | Typed `Literal[...]` body |
| 14 | MINOR | Backend | `GET /internal/students` ignores contracted `interest_tag` & `follow_up_status` query params | `routers/students.py:61` | Student-Explorer filters from §6.14 have no effect | adding params doesn't change the result count | Implement or drop from contract |
| 15 | MINOR | Backend/DB | `engagement_scores.event_id` stored as **`''`** (empty string) for global scores; column is `NOT NULL` + FK → events | `engagement_scores` rows; `scoring.py:54` | Latent FK violation: breaks under Postgres / `PRAGMA foreign_keys=ON` (the contract's Postgres target) | `SELECT length(event_id)`=0 for all 5 rows | Make nullable + store `NULL`, or a real sentinel |
| 16 | MINOR | Backend | Student-scoped `GET/PATCH /api/users/me/profile` + `PUT /api/users/me/interests` accept a **guest** token (§6.4 = student) | `routers/profile.py` (`require_student` admits guests) | Role-gating drift vs contract (harmless — own empty record; no FE uses it) | guest token → 200 | Gate on `role==student` or relax §6.4 to `auth` |
| 17 | MINOR | Dashboard | ESLint is unconfigured — `npm run lint` drops to an interactive prompt and lints nothing | `package.json` `scripts.lint`; no `eslint.config.*` | Zero lint coverage in CI | `npm run lint` → "How would you like to configure ESLint?" | Add `eslint.config.mjs` extending `eslint-config-next` |
| 18 | MINOR | Backend/Seed | All 5 seed events are `source=manual`; §9 mandates ingest as `source=scraped` from the WE events page | `events.source`; `app/seed.py` | The scrape-ingestion path is unproven by seed; `source` field can't be demoed | `SELECT DISTINCT source FROM events` → `manual` | Run the scraper or mark a subset `scraped` |
| 19 | NIT | Student | `chat/[chatId].tsx:40` strict-equality `payload.chatId !== chatId` — **defensive only**; backend always sends a *string* chat id (verified `dm-thivi`), so frames are **not** dropped in practice | `src/app/(tabs)/chat/[chatId].tsx:40` | Would only bite if the backend ever sent a numeric `chatId` | WS `new_message.chatId`=`"dm-thivi"` (string) | Optional: `String(a)!==String(b)` for safety |
| 20 | NIT | Backend | `channel_highlight` WS event (§7) is **never emitted**; live-window highlight is surfaced via REST `/api/chats` `live_highlight` flag instead | `routers/ws.py` (no emit); `chats` summary has `live_highlight` | §7 documents a WS event that doesn't exist; the feature still works over REST | no `channel_highlight` frame ever received | Emit it on the channel, or update §7 |
| 21 | NIT | Backend | `presence` only echoes `presence_update` to the sender, not fanned to contacts (naive vs §7) | `routers/ws.py:101-106` | Others don't see presence changes | self receives own presence echo only | Fan out to chat contacts |
| 22 | NIT | Backend | check-in not idempotent: repeat calls log duplicate `check_in` interactions and return a fresh `now` | `routers/interactions.py:20-56` | Inflates interaction counts on re-scan | 2× check-in → 2 `check_in` rows | Guard repeat; return stored `checked_in_at` |
| 23 | NIT | Backend | `broadcast` accepts an empty body (no min-length) | `internal_events.py:480` | Empty broadcast fans out to all attendees | `POST …/broadcast {}` → 200, body `''` | `Field(min_length=1)` |
| 24 | NIT | Seed | Demo-richness gaps: `memories`, `event_suggestions`/`votes`, `applications`/`questions` all **empty**; a `memory_post` & `application_submitted` interaction exist with **no backing row**; one `feedback.nps_score=8` looks misplaced; interaction/registration `source` has no spread; owner skew (emp-1=4, emp-2=1, **emp-3=0** — though emp-3 is responsible via the M:N table) | `weave_audit.db` | Capture-a-Memory, Requests board, and Apply flow render **empty states** in the demo; a few scores reference non-existent content | row counts = 0 | Seed a few memories/suggestions/applications |
| 25 | NIT | Dashboard | `favicon.ico` 404 on every route; `/api/assistant` uses **OpenRouter** (spec says Anthropic/Gemini), degrades gracefully without a key | `app/` (no favicon); `app/api/assistant/route.ts` | Console noise; provider drift (deliberate stub) | console 404; assistant returns "configure key" msg | Add `app/icon.png`; align provider |
| 26 | NIT | Cross-cutting | **Architecture drift vs spec:** §1/§2 call all 3 clients "Next.js" but Student & Employee are **Expo/React-Native**; `AGENT_STUDENT_APP.md`/`AGENT_EMPLOYEE_APP.md` don't exist (only Backend + Dashboard AGENT specs); **no §0** resolved-conflicts section | `WEAVE_MASTER.md` §1/§2/§0 | Spec ≠ reality for two modules; the three named decisions are nonetheless implemented in code | — | Update the master spec |
| 27 | NIT | Student | Event-detail route is `/feed/<id>` not `/events/<id>`; tab-gating (`attended`) is session-local and resets on reload | `src/app/(tabs)/feed/[id].tsx` | Spec-wording drift + minor UX (must re-check-in after reload to see File Drive) | reload `/feed/evt-1` → Information-only until re-check-in | Hydrate `attended` from backend on mount |

**Verified-OK (affirmative checks, not defects):** §8 engagement score never leaks to students and is correctly exposed internally; cached `engagement_scores` match §8.1 weights **exactly** (45/47/2/33/3); all §5.1 enums & §8.1 weights match the backend verbatim; referential integrity clean (zero orphans); the 3 named decisions (5-tab + center camera, single event-detail `analysis` path, Invoices→Communication Hub) are implemented; RN apps do snake⇄camel conversion at the boundary; KPI computation is **deterministic** (the earlier "jitter" was concurrent-mutation during the audit, re-verified identical on back-to-back calls).

---

## 3. Backend endpoint coverage (Phase 2 — every §6 group exercised on :8001)

All ~89 registered routes were enumerated; **every §6 endpoint exists and was hit with real requests.** Auth/role gating verified: `/internal/**` → 401 (no token) / 403 (student or guest) / 200 (employee); error envelope `{error:{code,message}}` consistent across 400/401/403/404/409/422.

| §6 group | Endpoints | Result |
|----------|-----------|--------|
| 6.1 Auth | signup, login (student+employee), guest, me, logout | ✅ all work (signup/guest return 200 not 201 — NIT) |
| 6.2 Events/Feed | events, search, current, {id}, files, memories(GET/POST), repost, application(GET/POST), feedback | ✅ work — except `attended` ignored (#6), memory not attendee-gated (#7), search heuristic-only (#10), datetime `Z` (#11) |
| 6.3 Check-in/Scan/Interactions | check-in, scan/employee, interactions | ✅ work (check-in non-idempotent — NIT #22) |
| 6.4 Profile/Settings | profile GET/PATCH, password, interest-tags, interests, my memories | ✅ work (guest accepted #16) |
| 6.5 Suggestions | list/create/patch/delete/vote | ✅ work (proposer-only edit, vote upsert, enum-validated) |
| 6.6 Chat REST | chats GET/POST, messages GET/POST, search-people | ✅ work — **message read/write lacks membership check (#9)**; create is correctly contact-gated |
| 6.7 Dashboard | summary, performance, next-best-events, timeline, kpis | ✅ work — `dimension=health` silent fallback (#12) |
| 6.8 Internal Events | list, per-employee, detail(+`analysis`), kpis, attendees, interactions, next-best-steps, prediction, create/patch/delete | ✅ work — **`analysis` block present for ongoing/past, null for upcoming** as specified |
| 6.9 Applications | application-questions(PUT), applications(GET), application PATCH | ✅ work — PATCH doesn't validate status enum (#13) |
| 6.10 Materials | list, **upload**, delete | ⚠️ **upload is JSON-link only, not multipart (#5)** |
| 6.11 QR & Scan | qr/check-in, qr/check-out, scan/student | ✅ work — returns `weave://e/{id}/{kind}/{token}` tokens |
| 6.12 Host/Live/Notes/Broadcast | host-report GET/POST, sentiment POST(+GET bonus), live-analytics, broadcast, notes GET/POST | ✅ work — broadcast empty-body (#23); host-report enum-validated |
| 6.13 Follow-ups | list/create/patch, per-event | ✅ work (status/owner filters work) |
| 6.14 Students/Priority | students, {id}, timeline, priority-queue | ⚠️ **`sort=recency` 500 (#3, fixed)**; `interest_tag`/`follow_up_status` ignored (#14) |
| 6.15 Internal Suggestions | list (email visible), delete | ✅ work (proposer email correctly visible to employees, null to students) |
| 6.16 Comm Hub | chats, messages, create, student-conversations | ✅ work (sorted by engagement) |
| 6.17 Opportunities | opportunities, assistant | ✅ work — assistant is heuristic/prompt-agnostic without a key (deliberate stub) |
| 6.18 Profile/Notifications | employees/me GET/PATCH, notifications | ✅ work |
| 6.19 WS `/ws/chat` | §7 protocol | ✅ 12/13 (see §below) |

Extra (beyond §6, sensible): `GET /internal/chats/{id}`, `GET /internal/events/{id}/sentiment`, `PATCH /internal/notifications/{id}`, `POST /internal/chats/{id}/messages`.

---

## 4. Data-flow traces (Phase 6) — **22/22 PASS** (real requests on :8001)

| Path | Result | Evidence |
|------|--------|----------|
| 1. check-in → interaction → KPI | ✅ works | guest check-in on evt-6: `registered 1→2`, `checked_in 0→1`; `check_in` interaction logged; returning user (Thiviyan) also logs `re_engagement` |
| 2. memory → interaction → thread + engagement | ✅ works | `POST memories` → 201; appears in thread; reply threaded via `parent_id`; `memory_post` logged; `engagement_index 22→28` |
| 3. file_view / application / employee-scan → interaction types | ✅ works | `file_view`, `career_interest`, `application_submitted` visible in event interactions; `connection` visible in student timeline |
| 4. engagement scoring §8 | ✅ works | `qualified_leads`≥1 (check_in + strong signal); event-scoped weighted score = **65** from §8.1; **§8.4 privacy: zero leak** to 5 student endpoints; internal detail exposes `engagement_score` |
| 5. dashboard reflects live data (not hardcoded) | ✅ works | summary/priority-queue/student-explorer/next-best-events all moved with the new interactions (Thiviyan score=191, now in priority queue); Dashboard confirmed serving **live** :8000 data (all `/internal/**` 200, no mock fallback) |
| 6. QR external-camera deep-link | ⚠️ **backend works, app link unwired** | organiser QR token generated; logged-out check-in → 401 (forces auth); guest check-in → 200. **But** the Student app has no route/handler for the `weave://e/…` deep link (#8) |

---

## 5. Contract mismatches (Phase 7)

- **FE→BE coverage:** every endpoint the three frontends call exists in the backend with matching path/method; `/api/**` and `/internal/**` prefixes line up. Only orphan: `POST /internal/opportunities/assistant` — the Dashboard deliberately calls its own `/api/assistant` (OpenRouter) Next route instead.
- **RN apps:** `types.ts` enums match §5.1 exactly; the snake⇄camel converter is real and applied at the network boundary (README claim true).
- **Dashboard:** the divergent client — `EventStatus`/`EventHealth`/`EventType`/`host_recommendation` enums are stale/invented vs §5.1 (#4), and it expected `analysis.highlights` the backend never sends (#1, the BLOCKER). It uses manual snake_case mapping (no converter) — consistent.
- **§0 / named decisions:** no §0 section exists; the three decisions are implemented (5-tab + center camera, single event-detail `analysis` path, Invoices→Communication Hub — zero "Invoice" hits).
- **REST broadcast key:** REST `POST …/broadcast` takes `{body}` and the Employee app sends `{body}` — consistent (the WS frame uses `message`; both verified working).

---

## 6. Fixes applied (3 — all unambiguous, in-module, re-verified)

| Fix | File | Diff | Verified |
|-----|------|------|----------|
| **#1 BLOCKER** — guard optional `highlights` | `Dashboard_App/app/events/[eventId]/page.tsx:78` | `ev.analysis.highlights.map(` → `(ev.analysis.highlights ?? []).map(` | headless Chrome on live :3000: `/events/evt-1` & `/events/evt-3` → **0 pageerrors, no crash, KPI content renders** (was: crash); `tsc --noEmit` exit 0 |
| **#2 MAJOR** — demo password | `Employee_App_RN/src/app/login.tsx:13` + `:103` | `"wuerth"` → `"weave"` (default + demo card) | `tsc --noEmit` exit 0; matches the only password the backend accepts |
| **#3 MAJOR** — recency 500 | `Backend/app/routers/students.py:75` | `r["last_interaction_at"] or ""` → None/tz-safe `…isoformat() if … else ""` | restarted :8001 → `GET /internal/students?sort=recency` = **200**, 6 rows correctly ordered (null-interaction student sorts last) |

No refactors, no behavior/architecture changes, no cross-module edits beyond each fix's own module. All other findings are **reported, not changed**.

---

## 7. Prioritized action list for the last hours (by demo impact)

1. **DONE ✅ — Dashboard event-detail crash (#1).** This was the single demo-breaker; fixed + verified. (Pull the change into whatever branch the demo runs from.)
2. **DONE ✅ — Employee login password (#2).** If a juror logs into the Employee app on screen, it now works.
3. **Seed a little life into empty tables (#24)** — 2–3 `memories` (one with the existing `memory_post`), 2–3 `event_suggestions` + votes, 1 event with `application_required=true` + a couple applications. Biggest *visible* win: Capture-a-Memory, Requests, and Apply screens stop showing empty states. ~30 min in `seed.py`.
4. **Dashboard enum labels (#4)** — add the §5.1 values to `EVENT_*_LABEL`/`TONE` maps (start with `career_fair_booth` and the real `status`/`health` values) so event cards/detail stop showing blank/"undefined" badges. Cosmetic but it's on the main Würth screen.
5. **Decide the QR story (#8)** — for the demo, lean on the **in-app scanner + "Simulate Scan"** (works). If the external-camera `weave://` deep-link is part of the pitch, add the linking route; otherwise don't claim it.
6. **Lower-risk hardening if time allows:** chat membership check (#9), `attended` filter (#6), materials multipart (#5), `recency` already fixed. None block the demo.

> The backend "brain" is in good shape — enums, weights, scoring privacy, KPIs, and the full interaction→KPI→dashboard pipeline all verified working against real requests. Focus the remaining time on **seed richness** and the **Dashboard enum labels** for visual polish.

---

### Appendix — how to reproduce
- Audit backend: `cd Backend && DATABASE_URL=sqlite:///./weave_audit.db .venv/bin/uvicorn app.main:app --port 8001` (seeds §9 on empty DB).
- Tokens: `POST /api/auth/login {email, "weave"}` (employees `…@we-online.de/.com`, students `…@tum.de` etc.).
- Scripts used (in scratchpad): `mint.py` (tokens+seed), `ws_test.py` (§7), `dataflow.py` (Phase 6); headless-Chrome route sweeps + screenshots under `scratchpad/shots/`.
