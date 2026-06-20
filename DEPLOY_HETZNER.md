# Deploying WEave to Hetzner

A single Hetzner Cloud VM runs the whole stack with one `docker compose` command.
Caddy handles HTTPS automatically, so there are no certificates to manage.

```
                        ┌──────────────── Hetzner VM ────────────────┐
  app.<domain>  ─443──▶ │  Caddy ──▶ dashboard (Next.js, :3000)        │
  api.<domain>  ─443──▶ │    │   ──▶ api (FastAPI, :8000) ──▶ Postgres │
                        └─────────────────────────────────────────────┘
```

## 1. Provision the server

- Hetzner Cloud → **CPX21** (3 vCPU / 4 GB) is plenty; **CX22** works for a demo.
- Image: **Ubuntu 24.04**.
- Add your SSH key, create the server, note its public IPv4.

## 2. DNS

Create two **A records** pointing at the server IP:

| Record                | Type | Value (server IP) |
|-----------------------|------|-------------------|
| `app.your-domain.com` | A    | `203.0.113.10`    |
| `api.your-domain.com` | A    | `203.0.113.10`    |

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

- Dashboard → `https://app.your-domain.com`
- API docs  → `https://api.your-domain.com/docs`
- Health    → `https://api.your-domain.com/health`

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
