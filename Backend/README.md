# WEave Backend

The **brain** of the WEave system — a Python + FastAPI service implementing the
full shared contract in [`/WEAVE_MASTER.md`](../WEAVE_MASTER.md): the REST API
(`/api/**` public/student, `/internal/**` employee), the WebSocket chat server,
the database schema, engagement scoring, KPI computation, recommendations and
the demo seed. All three clients (Student App, Würth Dashboard, Employee App)
consume it.

## Quick start

### Option A — Docker (Postgres + API, recommended)

```bash
cd Backend
cp .env.example .env          # optional; sensible defaults work out of the box
docker compose up --build
```

- API: <http://localhost:8000>  · interactive docs: <http://localhost:8000/docs>
- Postgres: `localhost:5432` (`weave` / `weave` / db `weave`), data in a named volume
- The DB is created from `schema.sql` **and** the ORM; the demo data is seeded on first boot.

### Option B — Local, zero-setup (SQLite)

```bash
cd Backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload          # uses ./weave.db (SQLite) by default
```

## Connecting the Employee App

The Employee App (`/Employee_App` and `/Employee_App_RN`) talks to a real backend
when its API base URL is set. The app converts snake_case ⇄ camelCase at its
network boundary, so the wire format here is **snake_case** per the contract.

- Next.js web: `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`
- Expo RN:     `EXPO_PUBLIC_API_BASE_URL=http://localhost:8000`
- WebSocket:   `ws://localhost:8000/ws/chat?token=<JWT>`

## Demo logins

| Role | Email | Password |
|------|-------|----------|
| Employee | `simon.haeckner@we-online.de` | `wuerth` |
| Employee | `jana.donges@we-online.com` | `wuerth` |
| Employee | `christian.kapusta@we-online.com` | `wuerth` |
| Student | `thiviyan.saravanamuthu@tum.de` | `weave` |

## Layout

```
Backend/
├── Dockerfile · docker-compose.yml · requirements.txt · schema.sql · .env.example
└── app/
    ├── main.py            FastAPI app + router includes + WS mount + lifespan
    ├── config.py          settings (env / .env)
    ├── db.py              engine/session (SQLite local · Postgres in Docker)
    ├── models.py          ORM models = MASTER §5 schema
    ├── schemas.py         Pydantic request/response = the contract (snake_case)
    ├── enums.py           central enums + engagement weights (§5.1, §8.1)
    ├── security.py        password hashing + JWT
    ├── deps.py            auth dependencies + role guards (/internal → employee)
    ├── errors.py          consistent { error: { code, message } } envelope
    ├── scoring.py         engagement weights + qualified-lead logic (§8)
    ├── kpis.py            KPI + event-health derivation
    ├── recommend.py       next-best-steps/events, predictions, priority queue
    ├── ai.py              AI event search + opportunity assistant (LLM optional)
    ├── services.py        ORM → contract-shape builders
    ├── messaging.py       message persistence + WS fan-out
    ├── realtime.py        WebSocket connection manager
    ├── seed.py            demo data (mirrors the Employee App seed)
    └── routers/           one module per endpoint group (MASTER §6)
```

## Auth & transport (MASTER §3)

- **REST** — JSON over HTTP, `Authorization: Bearer <JWT>`. `/internal/**` requires
  role `employee`. Errors use `{ "error": { "code", "message" } }`.
- **WebSocket** — the only real-time channel (chat, broadcast, presence, typing).
  Envelope `{ "action", "payload" }`. Every `send_message` is persisted; history
  is fetched over REST.

## Engagement scoring (MASTER §8) — backend-only

Weighted sum of a contact's interactions (cached in `engagement_scores`,
recomputed on insert). A **qualified lead** = `check_in` + ≥1 stronger signal.
The raw number is **never** exposed to students — student-facing responses map it
to neutral statuses.

## Environment variables

| Var | Default | Purpose |
|-----|---------|---------|
| `DATABASE_URL` | `sqlite:///./weave.db` | Postgres in Docker; SQLite locally |
| `JWT_SECRET` | `dev-secret-change-me` | token signing — **change in prod** |
| `JWT_EXPIRE_MINUTES` | `10080` | token lifetime |
| `CORS_ORIGINS` | `*` | comma-separated allowed origins |
| `SEED_ON_STARTUP` | `true` | seed demo data when DB is empty |
| `ANTHROPIC_API_KEY` | _(empty)_ | enables real LLM search/assistant; falls back to heuristics |
```
