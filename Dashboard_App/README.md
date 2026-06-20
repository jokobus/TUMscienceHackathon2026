# WEave — Würth Dashboard

The internal **Event Intelligence & Relationship-ROI control center** for Würth
Elektronik. Standalone Next.js app (App Router + React + Tailwind), part of the
WEave ecosystem. Reads `/internal/**` endpoints; see `/WEAVE_MASTER.md` (shared
contract) and `AGENT_WUERTH_DASHBOARD.md` (module spec).

## Run

```bash
npm install
npm run dev          # http://localhost:3000  → redirects to /dashboard
```

Ships with **mock data** so it runs with zero backend. A "Mock data" pill in the
top bar shows when mocks are active.

## Pages

| Route | Page |
|-------|------|
| `/dashboard` | Event Dashboard — Executive Summary, Performance Chart, Next Best Events, Timeline/Gantt, KPIs, event table |
| `/events/[eventId]` | Event Detail — local KPIs, Next Best Steps, prediction, materials, editable description, attendees, interactions, follow-ups, host report |
| `/create` | Manual Event Creation + Opportunity Explorer (LLM assistant) |
| `/communication` | Communication Hub — internal chats + priority-sorted student conversations |
| `/students` | Student Explorer table + priority queue |
| `/students/[studentId]` | Student Detail — relationship history + interaction timeline |

## Swapping mocks for the real backend

This is the whole point of the data layer — **you only touch env + `lib/api.ts`**,
never the pages.

1. Set env (copy `.env.local.example` → `.env.local`):
   ```
   NEXT_PUBLIC_USE_MOCKS=false
   NEXT_PUBLIC_API_BASE_URL=https://your-backend
   ```
2. Each function in [`lib/api.ts`](lib/api.ts) already has the real call wired
   under the mock branch:
   ```ts
   export function getDashboardSummary(): Promise<ExecutiveSummary> {
     if (USE_MOCKS) return delay(M.MOCK_SUMMARY);     // ← delete this line…
     return request("GET", "/internal/dashboard/summary"); // …and this is live
   }
   ```
   With `USE_MOCKS=false` every call routes through `request()` (auth header,
   `/internal` base URL, JSON, error envelope per Master §3). Adjust a path or
   query param if the backend differs — signatures and return types stay fixed.

## Data layer map

- [`lib/types.ts`](lib/types.ts) — typed mirror of the contract (enums + shapes). **Change here first.**
- [`lib/api.ts`](lib/api.ts) — the single client; mock/real switch lives here.
- [`lib/mocks.ts`](lib/mocks.ts) — all dummy data (seed roster from Master §9). The only file that fabricates data.
- [`lib/format.ts`](lib/format.ts) — enum → label / badge-tone helpers.
- [`lib/useAsync.ts`](lib/useAsync.ts) — loading/error/empty hook used by every page.

## Design

Würth Elektronik design language (see `/wuerth-elektronik-design.md`): technical
B2B, WE-Red accent, modular grid, high clarity. Tokens in `tailwind.config.ts`
and `app/globals.css`.

## Real-time chat

History is fetched over REST; live delivery runs over WebSocket
(`NEXT_PUBLIC_WS_URL`, Master §7). The send handlers in the Communication Hub are
marked with `TODO` where the WS `send_message` frame plugs in.
