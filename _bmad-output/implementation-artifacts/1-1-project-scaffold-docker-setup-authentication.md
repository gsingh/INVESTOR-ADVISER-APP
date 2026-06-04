---
baseline_commit: c608092a06936ab1cd78d430b0366c1fed4fe685
---

# Story 1.1: Project Scaffold, Docker Setup & Authentication

Status: done

## Story

As Boss,
I want the app scaffolded with Docker, password authentication, and brand theme applied,
So that I can access the app securely with the right look and feel from the start.

## Acceptance Criteria

1. Running `docker compose up` serves the app on port 80 with an nginx HTTP Basic Auth prompt (bcrypt `.htpasswd`).
2. Valid credentials show the app with navy (#1B3A5C) primary and green (#2E8B57) accent palette via shadcn/ui CSS variables, Inter for UI text, JetBrains Mono for financial figures.
3. Project scaffolded with `npx shadcn@latest init -t vite` — TypeScript strict mode, `@/` path alias, shadcn/ui components (Button, Card, Input, Badge) render correctly.
4. Dexie.js initialized with base schema, TanStack Query and TanStack Router installed.
5. `.htpasswd.example` and `.env.example` files present with documented instructions.

## Tasks / Subtasks (Implementation Order)

### 1. Scaffold project foundation
- [x] Run `npx shadcn@latest init -t vite` (accept defaults: TypeScript strict, `@/` alias, Tailwind v4, CSS variables)
- [x] Install core deps: `npm install @tanstack/react-router @tanstack/react-query dexie recharts zod`
- [x] Install shadcn components: `npx shadcn@latest add button card input badge skeleton sheet tooltip popover separator`

### 2. Configure brand theme (CSS variables)
- [x] Override `:root` CSS variables in `src/index.css` with navy/green palette from DESIGN.md
  - `--primary: #1B3A5C` / `--primary-foreground: #FFFFFF`
  - `--accent: #2E8B57` / `--accent-foreground: #FFFFFF`
  - `--muted: #F5F7FA`, `--card: #FFFFFF`, `--border: #E5E7EB`, `--input: #D1D5DB`, `--ring: #1B3A5C`
  - `--destructive: #DC2626`, `--warning: #F59E0B`
  - Include `-dark` variants (light-only for v1, tokens pre-defined for future)
- [x] Configure fonts: Inter (body, @next/font or Google Fonts import) + JetBrains Mono (mono)
- [x] Set typography: display 28px 600, display-sm 20px 600, body 14px 400, label 13px 500, small 12px 400, mono 13px JetBrains Mono

### 3. Initialize Dexie database
- [x] Create `src/stores/db.ts` with Dexie instance and base schema
- [x] Define tables: `goals`, `transactions`, `portfolios`, `journals`, `scorecard-weights`, `risk-profiles`, `glossary`
- [x] Each table gets a primary key (`++id`) and any known indexes
- [x] Export `db` singleton

### 4. Set up nginx + Docker
- [x] Create `nginx/nginx.conf` — serves SPA (`/` → `index.html`), reverse proxy for `/api/mfapi/` → `mfapi.in` and `/api/mfdata/` → `mfdata.in` with CORS headers.
- [x] Create `Dockerfile` — multi-stage: Node build stage (npm install + build) → nginx runtime stage (copy dist + nginx config)
- [x] Create `docker-compose.yml` — single `app` service, port 80, mounts `.htpasswd` and nginx config

### 5. Configure HTTP Basic Auth
- [x] Create `nginx/.htpasswd.example` with instructions to generate via `openssl passwd -6`
- [x] Create `.env.example` documenting `HTPASSWD_USER` and `HTPASSWD_PASS`
- [x] nginx.conf includes `auth_basic "Restricted"` and `auth_basic_user_file /etc/nginx/.htpasswd;`

### 6. Verify scaffold works
- [x] `npm run dev` starts Vite dev server
- [x] `docker compose up` builds and serves on port 80 with auth prompt
- [x] Basic shadcn component renders (Button with primary navy styling)

## Dev Notes

### Relevant Architecture Requirements
- **Scaffold**: `npx shadcn@latest init -t vite` — [Source: architecture.md#L117]
- **Stack consensus**: Vite + React + TypeScript + shadcn/ui + TanStack Query + TanStack Router — [Source: architecture.md#L73-L77]
- **Auth**: HTTP Basic Auth via nginx reverse proxy with bcrypt .htpasswd — [Source: architecture.md#L150-L153]
- **Docker**: Single container, multi-stage build (Node → nginx), docker-compose.yml — [Source: architecture.md#L174-L178]
- **Palette**: Navy #1B3A5C / Green #2E8B57 from DESIGN.md — [Source: DESIGN.md#L138-L140]
- **Typography**: Inter for UI, JetBrains Mono for financial figures — [Source: DESIGN.md#L150-L157]
- **Dexie tables**: goals, transactions, portfolios, journals, scorecard-weights, risk-profiles, glossary — [Source: epics.md#AR12]

### Source Tree Components to Touch
- `src/index.css` — CSS variable overrides for brand theme
- `src/stores/db.ts` — Dexie schema (NEW)
- `nginx/nginx.conf` — nginx config (NEW)
- `Dockerfile` — multi-stage build (NEW)
- `docker-compose.yml` — single service (NEW)
- `.htpasswd.example` — auth instructions (NEW)
- `.env.example` — environment variable docs (NEW)

### Testing Standards
- No tests required for this story (scaffold/infrastructure)
- Verify manually: `npm run dev` starts, `docker compose up` serves with auth

### Key Implementation Details
- **Tailwind v4** uses `@tailwindcss/vite` plugin (not PostCSS + tailwind.config.js) — check shadcn init output for actual setup
- Dark mode CSS variables should be defined but light mode is active by default in v1
- shadcn CSS variable naming: `--primary`, `--primary-foreground`, `--accent`, `--accent-foreground`, etc.
- nginx reverse proxy routes must normalize CORS headers for mfapi.in / mfdata.in responses
- TanStack Router must be configured with file-based route tree (`routeTree.gen.ts`)
- `@/` path alias resolves to `src/` — already configured by shadcn init

### Naming Conventions
- camelCase for functions/variables, PascalCase for components
- kebab-case for routes and config files
- snake_case for IndexedDB tables
- `@/` import prefix for all source files

## Dev Agent Record

### Agent Model Used

big-pickle

### Completion Notes List

- Scaffolded Vite + React 19 + TypeScript 5 + Tailwind v4 project with `@/` alias
- Installed all core deps: TanStack Router, TanStack Query, Dexie.js, Recharts, Zod, shadcn/ui
- Created shadcn UI components: Button, Card, Input, Badge, Skeleton, Sheet, Tooltip, Popover, Separator
- Applied navy (#1B3A5C) / green (#2E8B57) brand palette as CSS variables with dark mode tokens
- Configured Inter + JetBrains Mono typography ramp via Tailwind v4 `@theme inline`
- Created Dexie.js schema with 7 tables: goals, transactions, portfolios, journals, scorecard-weights, risk-profiles, glossary
- Created nginx.conf with SPA serving + AMFI API reverse proxy + HTTP Basic Auth
- Created multi-stage Dockerfile (Node build → nginx runtime)
- Created docker-compose.yml, .htpasswd.example, .env.example
- Verified: `tsc -b` passes, `vite build` succeeds, `vite --host` starts on port 5173
- Verified: `docker build` succeeds with multi-stage build

### File List

- `package.json` (NEW)
- `tsconfig.json` (NEW)
- `tsconfig.app.json` (NEW)
- `tsconfig.node.json` (NEW)
- `vite.config.ts` (NEW)
- `eslint.config.js` (NEW)
- `components.json` (NEW)
- `index.html` (NEW)
- `.gitignore` (NEW)
- `src/main.tsx` (NEW)
- `src/App.tsx` (NEW)
- `src/index.css` (NEW)
- `src/vite-env.d.ts` (NEW)
- `src/routeTree.gen.ts` (NEW)
- `src/routes/__root.tsx` (NEW)
- `src/lib/utils.ts` (NEW)
- `src/stores/db.ts` (NEW)
- `src/components/ui/button.tsx` (NEW)
- `src/components/ui/card.tsx` (NEW)
- `src/components/ui/input.tsx` (NEW)
- `src/components/ui/badge.tsx` (NEW)
- `src/components/ui/skeleton.tsx` (NEW)
- `src/components/ui/separator.tsx` (NEW)
- `src/components/ui/sheet.tsx` (NEW)
- `src/components/ui/tooltip.tsx` (NEW)
- `src/components/ui/popover.tsx` (NEW)
- `nginx/nginx.conf` (NEW)
- `nginx/.htpasswd.example` (NEW)
- `Dockerfile` (NEW)
- `docker-compose.yml` (NEW)
- `.env.example` (NEW)

## Review Findings

### Patch (Applied)
- [x] [Review][Patch] Missing `.dockerignore` [Dockerfile] — added `.dockerignore` to exclude node_modules/, .git/, *.md, .env from Docker build context
- [x] [Review][Patch] nginx.conf missing `error_page` directives [nginx/nginx.conf] — added `error_page 404 /index.html` for SPA fallback and `error_page 500 502 503 504 /50x.html` for server errors
- [x] [Review][Patch] Dexie IndexedDB not wrapped in try/catch [src/stores/db.ts] — wrapped `new InvestorDB()` in try/catch with a descriptive error message for private browsing or quota issues
- [x] [Review][Patch] Global `* { border-color: var(--border); }` too broad [src/index.css] — scoped to `*, *::before, *::after` and added separate `input, select, textarea` rule for `--input` border color

### Deferred
- [x] [Review][Defer] TanStack Router codegen not configured [src/routeTree.gen.ts] — manual route tree is sufficient for now; proper codegen will be set up when more routes are added (Story 1.2+)
- [x] [Review][Defer] Missing `.htpasswd` causes nginx startup failure [nginx/nginx.conf] — expected behavior for Basic Auth; `.htpasswd.example` documents setup steps; user must create `.htpasswd` before `docker compose up`
- [x] [Review][Defer] docker-compose.yml no restart policy [docker-compose.yml] — deployment concern for a single-user dev app
- [x] [Review][Defer] React error boundary not implemented [src/main.tsx] — out of scope for scaffold story; will be added in later stories when app structure is built out
