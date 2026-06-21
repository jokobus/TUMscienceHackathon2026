# WEave — Würth Employee App (mobile)

The on-site companion for Würth event teams. Part of **WEave** (TUM Science Hackathon · Würth Elektronik challenge). See `/WEAVE_MASTER.md` (shared contract) and `AGENT_EMPLOYEE_APP.md` (module spec).

Employees run events, capture signals, message attendees & peers, and view compact per-event KPIs on the go. **Full reports live on the Web Dashboard**, not here.

## Run it

```bash
cd Employee_App
npm install
npm run dev          # http://localhost:3000
```

Build check: `npm run build`.

## Deploy (mobile) — Vercel + Add to Home Screen

It's a standard Next.js app and an **installable PWA**.

1. Push the repo and import it on [Vercel](https://vercel.com), setting the project **root directory** to `Employee_App/` (or run `npx vercel` from this folder).
2. Open the deployed URL on a phone → the browser offers **Install / Add to Home Screen**.
3. It launches **full-screen (standalone)** with the Würth-red status bar — icons and theme come from `app/manifest.ts`, `app/icon.svg` and `app/apple-icon.tsx`.

No backend is required — the app ships with bundled mock data (see below).

## Demo login

Employees **must** log in (no guest mode). Pre-filled on the login screen:

| Email | Password |
|-------|----------|
| `simon.haeckner@we-online.de` | `wuerth` |
| `jana.donges@we-online.com` | `wuerth` |
| `christian.kapusta@we-online.com` | `wuerth` |

## What's inside

- **Tabs:** Events · Messages · **Scan** (center) · Profile.
- **Events:** "My events" with an Upcoming/Past filter; tap into an **Event Detail** with segmented tabs — compact **KPIs**, **Attendees**, **Interactions**, **QR** (check-in / check-out generation), live **Sentiment** capture + polling analytics, **Broadcast**, private **Notes**, **Files** (materials), and **Host report**.
- **Messages:** event channels (live highlight), DMs and internal team chats; intelligent people search; live delivery + channel broadcasts.
- **Scan:** scan a student's QR → creates a connection and opens a DM.
- **Profile:** own details, edit name/picture, notifications & reports, logout.

## Architecture

- **Next.js (App Router) + TypeScript + Tailwind**, mobile-first (centered phone-width shell).
- **Würth corporate design:** Würth Red `#CC0000` brand colour over neutral anthracite/greys, WÜRTH wordmark header. Tokens in `tailwind.config.ts`.
- **No backend required.** Per `WEAVE_MASTER §10` (Phase 1) the app runs against bundled mock data in the §6 contract shapes:
  - `lib/types.ts` — typed mirror of the contract (enums + entities).
  - `lib/api.ts` — the single data boundary; every `/internal/**` endpoint the app consumes is implemented against `lib/mock/seed.ts`. Set `NEXT_PUBLIC_API_BASE_URL` and swap the bodies for `fetch` to go live — return shapes are unchanged.
  - `lib/ws.ts` — in-memory mock of `wss://…/chat` (MASTER §7 envelope) for live chat & broadcasts.
- **Golden rule honoured:** no business logic in the frontend — KPIs/sentiment values come precomputed from the data layer; enum values come only from `lib/types.ts`.

## Folder map

```
app/
  login/                      employee login (required)
  (employee)/
    layout.tsx                auth guard + bottom tab bar
    events/                   list + [eventId] detail
    messages/                 list + [chatId] thread
    scan/                     scanner view
    profile/                  profile + notifications
components/ui/                Button, Card, Chip, SegmentedControl, Avatar, BottomSheet,
                             Toast, Badge, EmptyState, Skeleton, Input, QRCode, …
components/employee/          EventCard, KpiPanel, AttendeesPanel, InteractionsPanel,
                             NotesPanel, SentimentPanel, QrPanel, BroadcastPanel,
                             MaterialsPanel, HostReportPanel, ChatListItem, PeopleSearch,
                             NotificationsBell, TabBar, TopAppBar, …
lib/                          types · api · ws · auth · utils · mock/seed
```
