# Deploying WEave to Hetzner

A single Hetzner Cloud VM runs the whole stack with one `docker compose` command.
Caddy handles HTTPS automatically, so there are no certificates to manage.

```
                        ┌──────────────── Hetzner VM ──────────────────┐
  dash.<domain> ─443──▶ │  Caddy ──▶ dashboard (Würth, Next.js :3000)   │
  app.<domain>  ─443──▶ │    │   ──▶ student  (RN web export :3000)     │
  api.<domain>  ─443──▶ │    │   ──▶ api (FastAPI :8000) ──▶ Postgres   │
                        └───────────────────────────────────────────────┘
                              ▲
   Expo mobile apps (Student + Würth/Employee, React Native) ──┘  point at https://api.<domain>
```

Both **web** apps are served so anyone — including the jury — can open them in a
browser, no install needed. The Würth dashboard is a Next.js app; the **student web
app is the React Native app exported to web** (`expo export -p web`) — the same client
as the mobile build, so there's a single student codebase. Natively, the Student &
Würth apps run in Expo Go / via EAS. Everything talks to the same `https://api.<domain>`
backend — one DB, no data contradictions.

## 1. Provision the server

- Hetzner Cloud → **CPX21** (3 vCPU / 4 GB) is plenty; **CX22** works for a demo.
- Image: **Ubuntu 24.04**.
- Add your SSH key, create the server, note its public IPv4.

## 2. DNS

Create three **A records** pointing at the server IP:

| Record                 | Type | Value (server IP) | Serves          |
|------------------------|------|-------------------|-----------------|
| `dash.your-domain.com` | A    | `203.0.113.10`    | Würth dashboard |
| `app.your-domain.com`  | A    | `203.0.113.10`    | Student web app |
| `api.your-domain.com`  | A    | `203.0.113.10`    | Backend + WS    |

HTTPS will not issue until DNS resolves, so do this first.

## 3. Install Docker

```bash
ssh root@<server-ip>
curl -fsSL https://get.docker.com | sh
```

## 4. Get the code + configure

```bash
git clone <your-repo-url> weave && cd weave
cp deploy/.env.example deploy/.env
nano deploy/.env        # set DOMAIN_APP, DOMAIN_API, JWT_SECRET, passwords, API keys
```

Generate a strong JWT secret:

```bash
openssl rand -hex 32
```

## 5. Launch

```bash
docker compose -f deploy/docker-compose.yml up -d --build
```

First boot: Caddy fetches Let's Encrypt certs (a few seconds once DNS is live),
the backend seeds demo data, Postgres initialises its volume.

- Würth dashboard → `https://dash.your-domain.com`
- Student web app → `https://app.your-domain.com`
- API docs        → `https://api.your-domain.com/docs`
- Health          → `https://api.your-domain.com/health`

## Mobile apps (Expo / React Native)

The native Student & Würth apps point at the same backend. In each app's `.env`:

```bash
EXPO_PUBLIC_API_BASE_URL=https://api.your-domain.com
# WS is derived automatically (https→wss). Override only if needed:
# EXPO_PUBLIC_WS_URL=wss://api.your-domain.com/ws/chat
```

- Quick demo: `npx expo start` and scan the QR with Expo Go.
- Distributable build: `eas build -p ios` / `-p android` (Expo EAS).
- The Student app's feed falls back to bundled real Würth events when no backend is set,
  so it always has content even offline.

## 6. Open the firewall

In the Hetzner Cloud firewall (or `ufw`) allow inbound **80** and **443** only.
Postgres (5432), the API (8000) and the dashboard (3000) stay on the internal
Docker network and are never exposed publicly.

## Mock vs. live data

The dashboard ships **mock-first** — `NEXT_PUBLIC_USE_MOCKS=true` serves the
built-in demo dataset and needs no backend. **This is the safest mode for the
pitch.** To run against the live backend:

1. Set `NEXT_PUBLIC_USE_MOCKS=false` in `deploy/.env`.
2. Rebuild the dashboard (the flag is baked at build time):
   ```bash
   docker compose -f deploy/docker-compose.yml up -d --build dashboard
   ```

> Note: a few dashboard views (aggregate KPIs, the planning Gantt, performance
> trends, opportunity suggestions) are not yet mapped to backend endpoints and
> fall back to mock data with a console warning even when `USE_MOCKS=false`.
> Event detail, KPIs, attendees, interactions, materials, create-event and the
> AI assistant are fully wired. See `Dashboard_App/lib/api.ts`.

## Updating after a code change

```bash
git pull
docker compose -f deploy/docker-compose.yml up -d --build
```

## Useful commands

```bash
docker compose -f deploy/docker-compose.yml ps           # status
docker compose -f deploy/docker-compose.yml logs -f api  # backend logs
docker compose -f deploy/docker-compose.yml down         # stop (keeps volumes)
```

## Backups

The database lives in the `weave_pgdata` Docker volume. Dump it with:

```bash
docker compose -f deploy/docker-compose.yml exec db \
  pg_dump -U weave weave > weave-$(date +%F).sql
```
