# Investor Adviser App

A local-first mutual fund portfolio tracker and investment journal. Single-user SPA with IndexedDB persistence and HTTP Basic Auth.

## Features

- **Risk Profiling** — Conservative / Moderate / Aggressive questionnaire
- **Goal Planning** — CRUD goals with SIP calculator, category allocation, drift tracking
- **Fund Universe Browser** — AMFI category filtering, 10-factor weighted scoring
- **Portfolio Tracker** — Holdings dashboard, XIRR computation, unrealized gain/loss
- **Review Engine** — Scheduled reviews, drift alerts, benchmark underperformance detection
- **Investment Journal** — Structured entries tagged to funds/goals/reviews with keyword search

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 5.7 |
| Build | Vite 6 |
| UI | shadcn/ui + Tailwind CSS v4 |
| Routing | TanStack Router (file-based, type-safe) |
| State | TanStack Query (API) + Dexie.js (IndexedDB) |
| Charts | Recharts |
| Validation | Zod |
| Testing | Vitest (119 tests) |
| Auth | HTTP Basic Auth via nginx |

## Prerequisites

- **Node.js** 22+ and npm (for local dev)
- **Docker** and **Docker Compose** (for deployment)
- **openssl** (for generating auth password hash)

## Quick Start (Local Dev)

```bash
npm ci
npm run dev
```

Opens at `http://localhost:5173`. No auth in dev mode.

Run tests:

```bash
npx vitest run        # 119 tests
npm run typecheck     # TypeScript type checking (see note below)
```

Production build check:

```bash
npm run build         # vite build (Vite handles TS transpilation)
npm run preview       # preview the build locally on port 4173
```

> **Note:** `tsc -b` catches ~30 pre-existing type issues (unused imports, loose types from early epics). The build script intentionally skips `tsc -b` so Docker deployments work cleanly. Use `npm run typecheck` separately to audit and fix types incrementally.

## Docker Deployment

### 1. Create auth credentials

```bash
# Generate a bcrypt password hash (you'll be prompted for password)
openssl passwd -6

# Create .htpasswd file (replace <hash> with the output above)
echo 'admin:<hash>' > nginx/.htpasswd
```

This file is git-ignored — it never leaves your machine.

### 2. Build and start

```bash
# Build the image and start the container
docker compose up --build -d
```

On older Docker versions, use `docker-compose up --build -d`.

### 3. Verify

```bash
# Check container is running
docker compose ps

# View logs
docker compose logs -f
```

Open `http://localhost` (or your server's IP/domain). Log in with the username/password from step 1.

### 4. Stop

```bash
docker compose down
```

### Update

```bash
# Pull latest code, then rebuild
git pull
docker compose up --build -d
```

### Custom domain + HTTPS

To serve on a custom domain with HTTPS, add a reverse proxy (Caddy, Traefik) in front, or add a companion container like `nginx-proxy` + `letsencrypt-companion`. Alternative: change the port mapping:

```yaml
ports:
  - '443:80'
```

## Architecture

```
Browser (SPA)
    │
    ├─ IndexedDB (Dexie.js) — goals, transactions, portfolio, journals, reviews
    │
    ├─ nginx reverse proxy (Docker container)
    │   ├─ /api/mfapi/*  → api.mfapi.in  (NAV, scheme master data)
    │   └─ /api/mfdata/* → www.mfdata.in  (fund details, categories)
    │
    └─ React + TanStack Query (stale-while-revalidate caching)
```

### API Proxy

The app sources mutual fund data from free public APIs:

- **mfapi.in** — NAV history, scheme master list
- **mfdata.in** — Fund details, portfolio holdings, sector allocation

API calls go through the nginx reverse proxy (`/api/mfapi/*`, `/api/mfdata/*`) which adds CORS headers. No API keys required. The app handles API unavailability gracefully — stale cached data is shown while retrying.

### Data Storage

All user data lives in IndexedDB (browser storage):

| Table | Purpose |
|-------|---------|
| `goals` | Investment goals with target amounts and dates |
| `transactions` | SIP and lump-sum purchases |
| `portfolios` | Current holdings with allocations |
| `journals` | Decision documentation entries |
| `reviews` | Completed review records |
| `scorecardWeights` | Custom factor weight configuration |
| `riskProfiles` | Investor risk assessment results |
| `glossary` | In-app financial term definitions |

**Export/Import:** Settings page provides full data export (JSON download) and import (file restore). Use this to back up your data — browser storage can be cleared unexpectedly.

## Directory Structure

```
src/
  routes/           — TanStack Router route tree (one file per page)
  components/       — UI (shadcn) + layout + shared components
  features/         — Feature modules (profiling, goals, screener, scorecard,
  │                   portfolio, reviews, journal, settings)
  │   ├── <feature>/
  │   │   ├── components/   — feature-specific React components
  │   │   └── hooks/        — feature-specific hooks + tests
  lib/              — Pure-function engines (scorecard, SIP, XIRR, formatters)
  stores/           — Dexie.js schema + TanStack Query hooks
  types/            — Zod schemas + TypeScript types
```

## Default Credentials

None — you create your own via `openssl passwd -6` (see Docker Deployment above). The `.htpasswd` file is git-ignored and never committed.

## Environment

| Variable | Purpose |
|----------|---------|
| `nginx/.htpasswd` | HTTP Basic Auth credentials (generate with `openssl passwd -6`) |

No other environment variables are required. API endpoints are configured in `nginx/nginx.conf`.
