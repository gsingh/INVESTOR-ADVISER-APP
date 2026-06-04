---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
status: 'complete'
completedAt: '2026-06-03'
inputDocuments:
  - '_bmad-output/planning-artifacts/prds/prd-Investor-adviser-app-2026-06-03/prd.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-Investor-adviser-app-2026-06-03/DESIGN.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-Investor-adviser-app-2026-06-03/EXPERIENCE.md'
workflowType: 'architecture'
lastStep: 8
project_name: 'Investor-adviser-app'
user_name: 'Boss'
date: '2026-06-03'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (13 FRs across 5 areas):**
- Investor Profiling: risk questionnaire → conservative/moderate/aggressive profile
- Goal Planning: CRUD goals with SIP calculator (3 return scenarios), gap display
- Fund Universe Browser: browse by AMFI category with 6 filter dimensions
- Fund Scorecard: configurable 10-factor weighted scoring with explainable breakdown
- Portfolio Tracker: holdings, XIRR, unrealized gain/loss, drift vs target
- Review Engine: quarterly prompts, event-based alerts, "no action needed" outcome
- Investment Journal: structured fields (why bought, role, exit trigger, next review)

**Non-Functional Requirements:**
- Single-user with password auth
- Deployed via Docker on personal domain
- Web-only (responsive, desktop-first)
- Data sourced from free public APIs (mfapi.in, mfdata.in) — no SLA, unpredictable latency
- Manual data refresh (MVP), automated post-MVP
- No compliance/regulatory requirements
- WCAG AA accessibility

**Scale & Complexity:**
- Primary domain: Web application
- Complexity: Low-Medium (single-user, no real-time, no multi-tenancy, no compliance)
- One portfolio, <1000 transactions/year, 5000+ funds in universe
- External API reliability is the primary risk factor

### Technical Constraints & Dependencies
- Docker deployment (per user decision)
- shadcn/ui + React confirmed (per UX)
- External API dependency: mfapi.in + mfdata.in (no API key, free tier, no SLA)
- Browser storage must support export/import to prevent data loss

### Cross-Cutting Concerns
- **API resilience:** stale-while-revalidate caching; app must work when APIs are down
- **Form state persistence:** goal forms and profiling must survive accidental navigation
- **Skeleton-first loading:** all data surfaces need layout-matched skeletons
- **Data consistency:** AMFI API response shapes vary — normalize at boundary
- **Category taxonomy as first-class entity:** not free text — structured and migration-aware

## Starter Template Evaluation

### Primary Technology Domain
Web application — Vite + React + TypeScript + shadcn/ui on Tailwind CSS.

### Starter Options Considered
- **Vite + React (shadcn init -t vite):** Scaffolds Vite, React 19, TypeScript, Tailwind v4, shadcn/ui, dark mode. Single command. Current as of shadcn CLI v4 (March 2026).
- **React Router template (shadcn init -t react-router):** Same base with React Router pre-configured.
- **TanStack Start (shadcn init -t start):** Full-stack metaframework with file-based routing, SSR. Heavier than needed for a client-side SPA with a thin backend.
- **create-react-shadcn-kit:** Community starter with Redux Toolkit pre-integrated. Redux is unnecessary with TanStack Query handling all server state.

### Selected Starter: Vite + shadcn/ui + TanStack Router

**Rationale for Selection:**
- `npx shadcn@latest init -t vite` provides the cleanest foundation: Vite + React + TypeScript + shadcn/ui in one command.
- TanStack Router added separately for type-safe SPA routing across 11 surfaces.
- No backend framework starter needed — the API caching layer is lightweight enough to add manually.
- Avoids opinionated full-stack frameworks (Next.js, TanStack Start) that add SSR complexity with no benefit for a single-user SPA.

### Architectural Decisions Provided by Starter

**Language & Runtime:**
- TypeScript 5.x (strict mode)
- Node.js 18.17+ for development
- React 19 with Vite 6

**Styling Solution:**
- Tailwind CSS v4 with `@tailwindcss/vite` plugin
- shadcn/ui CSS variables for theming (navy/green palette from DESIGN.md)
- Dark mode tokens pre-defined but light-only for v1

**Build Tooling:**
- Vite 6 with React plugin + Tailwind plugin
- TypeScript path alias `@/` configured
- Fast HMR for development

**Testing Framework:**
- Vitest (added separately) — for pure-function tests (scorecard, SIP calc, XIRR)

**Code Organization:**
```
src/
  routes/          — TanStack Router route tree
  components/     — shadcn/ui + app components
  features/       — feature modules (goals, screener, portfolio, reviews, journal)
  lib/            — pure functions (scorecard engine, SIP calc, XIRR)
  stores/         — TanStack Query + Dexie.js persistence
  types/          — Zod schemas + TypeScript types
  hooks/          — shared React hooks
```

**Development Experience:**
- Hot Module Replacement (HMR) via Vite
- TanStack Query Devtools for API debugging
- shadcn CLI for adding UI components on demand

**Note:** Project initialization using `npx shadcn@latest init -t vite` should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Architecture pattern: Local-first SPA with IndexedDB for user data, thin nginx proxy for AMFI API caching
- Auth: HTTP Basic Auth via nginx reverse proxy
- Data persistence: Dexie.js (IndexedDB) for goals, transactions, portfolio, journal
- State management: TanStack Query for API-sourced data + Dexie.js for local data + React context for transient UI state

**Important Decisions (Shape Architecture):**
- Docker: Single container with nginx serving SPA + reverse proxy to cached AMFI APIs
- Chart library: Recharts (shadcn ecosystem)
- Validation: Zod at API boundary for data normalization
- Pure-function engines: Scorecard, SIP calculator, XIRR as standalone TypeScript modules with Vitest

**Deferred Decisions (Post-MVP):**
- Automated data refresh scheduling (manual trigger for v1)
- Dark mode toggle (tokens defined, light-only v1)
- Service worker / PWA (not needed for v1)

### Data Architecture

**Storage layer:** Dexie.js (IndexedDB wrapper) for all user-created data. Tables: goals, transactions, portfolios, journals, scorecard-weights, risk-profiles. Browser-local — no server-side database.

**External data cache:** TanStack Query manages all AMFI API data with `staleTime` strategy: NAV data = 30min stale, scheme master = Infinity (cache forever with manual refresh).

**Category taxonomy:** Structured as a Zod schema + TypeScript type — not free text. Store as a static JSON asset in the project (updated manually when AMFI publishes changes). The categorization tree is the backbone of the category-first principle and the universe browser filters.

**Data export/import:** Single JSON dump button in Settings — serializes all IndexedDB tables. Import restores from file. Protects against browser storage loss.

### Authentication & Security
- **Method:** HTTP Basic Auth via nginx reverse proxy. Single username/password. No session management, no JWT, no registration flow.
- **Password storage:** bcrypt hash in an `.htpasswd` file mounted into the nginx container.
- **API security:** External APIs (mfapi.in, mfdata.in) are public and called from the client-side proxy — no API keys required.

### API & Communication Patterns
- **Pattern:** Client-side TanStack Query → Docker nginx proxy → external AMFI APIs.
- **Endpoints:** All calls to mfapi.in and mfdata.in go through a thin nginx reverse proxy route (e.g., `/api/mfapi/...`) that adds CORS headers and optional caching.
- **Data normalization:** Zod schemas at the API boundary normalize inconsistent field names (e.g., `scheme_code` vs `schemeCode`).
- **Error handling:** TanStack Query error boundaries with retry logic (3 retries, exponential backoff). User-facing errors are specific: "Couldn't fetch NAV data. The data source may be temporarily unavailable."

### Frontend Architecture
- **Framework:** Vite + React 19 + TypeScript 5 + Tailwind v4 + shadcn/ui
- **Routing:** TanStack Router — type-safe, file-based routes matching the 11 IA surfaces
- **State management:**
  - TanStack Query: all API-sourced data (fund lists, NAV history, scheme details)
  - Dexie.js: all user-created data (goals, transactions, portfolio, journal)
  - React context: transient UI state (active filters, form drafts)
  - No Redux, no Zustand, no global store
- **Component architecture:** Feature-based folders under `src/features/` — each feature owns its components, hooks, and queries. Shared UI components in `src/components/ui/` (shadcn) and `src/components/`
- **Pure-function engines:** Scorecard, SIP calculator, XIRR computation as standalone TypeScript modules in `src/lib/` — zero React imports, testable with Vitest
- **Charts:** Recharts for SIP projection charts, allocation donuts, scorecard radars, returns comparison bars
- **Performance:** React.lazy + TanStack Router code splitting per route. Skeletons for all data-fetching surfaces. Optimistic updates for journal/review saves.

### Infrastructure & Deployment
- **Container:** Single Docker container running nginx (serves SPA + reverse proxy). Multi-stage build: Node build stage → nginx runtime stage.
- **docker-compose.yml:** Single service. Port 80 (or 443 with Let's Encrypt via companion).
- **Domain:** Personal domain with nginx handling HTTP Basic Auth before serving the SPA.
- **CI/CD:** None for v1 (manual `docker build` + `docker push` + pull on server).
- **Monitoring:** None for v1 (single user, personal use).

### Decision Impact Analysis

**Implementation Sequence:**
1. Project scaffold: `npx shadcn@latest init -t vite` → add TanStack Router, Dexie.js, TanStack Query, Recharts
2. Category taxonomy: ship static AMFI category JSON + Zod schema
3. API proxy: configure nginx routes for mfapi.in / mfdata.in
4. Pure-function engines: scorecard, SIP calc, XIRR as tested modules
5. Auth: nginx htpasswd setup
6. Feature surfaces in order: Profiling → Universe Browser → Scorecard → Goals → Portfolio → Reviews → Journal

**Cross-Component Dependencies:**
- Scorecard engine depends on category taxonomy + normalized fund data
- Portfolio tracker depends on transaction data + XIRR engine + NAV lookup
- Review engine depends on portfolio drift computation + journal entries
- Goal detail depends on SIP calculator + allocation tracker + scorecard

## Implementation Patterns & Consistency Rules

### Naming Conventions
- **Files:** PascalCase for components (`GoalCard.tsx`), camelCase for utilities (`calculateSIP.ts`), kebab-case for config (`tailwind.config.ts`)
- **Code:** camelCase for functions/variables, PascalCase for types/interfaces/components, UPPER_SNAKE for constants
- **IndexedDB tables:** snake_case (`goal_allocations`, `transaction_records`, `portfolio_snapshots`)
- **TanStack Query keys:** array with string scope + ID (`['nav', schemeCode]`, `['funds', {category}]`)
- **Route paths:** kebab-case (`/goal-detail`, `/universe-browser`)
- **CSS:** Tailwind utility classes only — no custom CSS modules or styled-components

### Project Structure
- **Feature modules** in `src/features/<feature-name>/` owning: components, hooks, TanStack Query hooks, Dexie table access
- **Shared code** in `src/components/ui/` (shadcn), `src/components/layout/` (shell), `src/lib/` (pure engines), `src/stores/` (db setup), `src/types/` (Zod schemas), `src/hooks/` (shared hooks)
- **Tests** co-located as `*.test.ts` next to the file under test
- **Routes** in `src/routes/` — TanStack Router file-based tree, one file per route, lazy-loaded

### Format Rules
- **Dates:** ISO 8601 strings everywhere (`2026-06-03`) — no Date objects in storage
- **Currency:** Indian Rupee integers (paise not stored), display formatted via `Intl.NumberFormat('en-IN')`
- **Percentages:** stored as decimal (0.12 = 12%), display formatted with `toFixed(2)`
- **NAV values:** stored as floats (Zod coerce on ingestion)
- **No backend API wrapper** — TanStack Query calls the nginx proxy directly

### State Management Rules
- **TanStack Query** for all external API data (funds, NAV, scheme details)
- **Dexie.js** for all user data (goals, transactions, portfolio, reviews, journal)
- **React context** only for transient UI state (active filters, sidebar state, form drafts)
- **sessionStorage** for form draft persistence (goals, profiling, review forms)
- No Redux, Zustand, or global stores

### Error & Loading Patterns
- **TanStack Query:** 3 retries, exponential backoff, stale data shown while re-fetching
- **Skeletons** for all data-fetching surfaces (shadcn Skeleton component)
- **User-facing errors:** specific message + retry button — no raw error codes
- **API errors:** normalize at Zod boundary, show "Couldn't load [data type]. The data source may be temporarily unavailable."

### Enforcement
- Pure-function engines (`src/lib/`) must have zero React/DOM imports
- No raw `fetch` calls — all external data through TanStack Query
- Zod schemas at every API entry point (validate on ingestion)
- Feature modules should not import directly from other feature modules — share through `src/lib/` or `src/types/`

## Project Structure & Boundaries

### Complete Project Directory Structure

```
investor-adviser-app/
├── package.json
├── vite.config.ts
├── tsconfig.json / tsconfig.node.json / tsconfig.app.json
├── tailwind.config.ts
├── postcss.config.js
├── .env.example
├── .gitignore
├── README.md
├── Dockerfile
├── docker-compose.yml
├── nginx/
│   ├── nginx.conf
│   └── .htpasswd.example
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx
    ├── routeTree.gen.ts
    ├── index.css
    ├── routes/
    │   ├── __root.tsx
    │   ├── index.tsx                  # Dashboard
    │   ├── login.tsx
    │   ├── profiling/
    │   │   └── index.tsx              # FR-1, FR-2
    │   ├── universe-browser/
    │   │   └── index.tsx              # FR-6, FR-7
    │   ├── scorecard/
    │   │   ├── index.tsx              # FR-8 list
    │   │   └── $schemeCode.tsx        # FR-8 detail
    │   ├── goals/
    │   │   ├── index.tsx              # FR-3 list
    │   │   ├── new.tsx                # FR-3 create
    │   │   └── $goalId.tsx            # FR-4, FR-5
    │   ├── portfolio/
    │   │   ├── index.tsx              # FR-9 summary
    │   │   └── $schemeCode.tsx        # FR-10 detail
    │   ├── reviews/
    │   │   └── index.tsx              # FR-11, FR-12
    │   ├── journal/
    │   │   └── index.tsx              # FR-13
    │   └── settings/
    │       └── index.tsx              # export/import, profile
    ├── components/
    │   ├── ui/                        # shadcn (untouched)
    │   └── layout/
    │       ├── AppShell.tsx
    │       ├── Sidebar.tsx
    │       ├── Topbar.tsx
    │       └── ProtectedRoute.tsx
    ├── features/
    │   ├── profiling/
    │   │   ├── components/            # InvestorProfileForm, RiskProfileCard
    │   │   └── hooks/                 # useProfile
    │   ├── goals/
    │   │   ├── components/            # GoalCard, GoalForm, GoalProgress, AllocationChart
    │   │   └── hooks/                 # useGoals, useGoalForm
    │   ├── screener/
    │   │   ├── components/            # UniverseFilters, FundTable, FundRow
    │   │   └── hooks/                 # useFundList, useUniverseFilters
    │   ├── scorecard/
    │   │   ├── components/            # ScorecardRadar, FactorBreakdown, OverlapMatrix
    │   │   └── hooks/                 # useScorecard
    │   ├── portfolio/
    │   │   ├── components/            # PortfolioSummary, AllocationDonut, HoldingsTable, AddTransactionForm
    │   │   └── hooks/                 # usePortfolio, useTransactions
    │   ├── reviews/
    │   │   ├── components/            # ReviewTimeline, DriftAnalysis, ReviewForm
    │   │   └── hooks/                 # useReviews
    │   ├── journal/
    │   │   ├── components/            # JournalEntryList, JournalEditor
    │   │   └── hooks/                 # useJournal
    │   └── settings/
    │       └── components/            # DataExportImport, CategoryManager
    ├── lib/
    │   ├── scorecard.ts
    │   ├── sip-calculator.ts
    │   ├── xirr.ts
    │   ├── category-taxonomy.ts
    │   ├── utils.ts
    │   └── formatters.ts
    ├── stores/
    │   ├── db.ts                      # Dexie.js schema + instance
    │   └── queries/
    │       ├── useFunds.ts
    │       ├── useNav.ts
    │       └── useSchemes.ts
    ├── types/
    │   ├── fund.ts / goal.ts / transaction.ts / portfolio.ts
    │   ├── review.ts / journal.ts / profile.ts
    │   └── api.ts                     # Zod schemas for API normalization
    └── hooks/
        ├── useAuth.ts
        └── useSidebar.ts
```

### Architectural Boundaries

**API Boundaries:**
- nginx reverse proxy routes `/api/mfapi/*` and `/api/mfdata/*` to external AMFI APIs
- All external calls through TanStack Query hooks in `stores/queries/`
- Zod schemas in `types/api.ts` normalize API responses at ingestion
- No direct `fetch` calls outside of TanStack Query configuration

**Component Boundaries:**
- Features never import directly from other features
- Shared through `src/lib/` (pure functions), `src/types/` (Zod/TS types), `src/hooks/` (shared hooks)
- Layout components (`AppShell`, `Sidebar`, `Topbar`) are owned by the route tree
- shadcn `ui/` components are never modified directly — customization via Tailwind theme tokens

**Data Boundaries:**
- Dexie.js `stores/db.ts` is the single source of truth for all user data
- TanStack Query manages external API cache separately — no overlap with user data
- Goal/portfolio/review state is computed from Dexie — no derived server cache
- Form drafts in sessionStorage — ephemeral, cleared on submit

### Requirements to Structure Mapping

**Feature → Route → Feature Module:**
| IA Surface | Route | Feature Module | Dependencies |
|---|---|---|---|
| Dashboard | `/` | — | All features (aggregation) |
| Profiling | `/profiling` | `features/profiling` | `stores/db` |
| Goals List | `/goals` | `features/goals` | `stores/db`, `lib/sip-calculator` |
| Goal Detail | `/goals/$goalId` | `features/goals` | `stores/db`, `lib/xirr`, `stores/queries` |
| Universe Browser | `/universe-browser` | `features/screener` | `stores/queries`, `lib/category-taxonomy` |
| Scorecard | `/scorecard` | `features/scorecard` | `lib/scorecard`, `stores/queries` |
| Portfolio | `/portfolio` | `features/portfolio` | `stores/db`, `lib/xirr`, `stores/queries` |
| Reviews | `/reviews` | `features/reviews` | `stores/db`, `features/portfolio` (drift) |
| Journal | `/journal` | `features/journal` | `stores/db` |
| Settings | `/settings` | `features/settings` | `stores/db` (export/import) |

**Cross-Cutting Concerns:**
- Auth: `components/layout/ProtectedRoute.tsx` + `hooks/useAuth.ts` (checks nginx basic auth — SPA-level redirect to login page)
- Data export/import: `features/settings` owns the UI, `stores/db.ts` provides the serialization logic
- Category taxonomy: `lib/category-taxonomy.ts` is imported by screener, scorecard, portfolio features
- Formatters: `lib/formatters.ts` (currency, percentage, date) used across all features

### Integration Points

**Internal Communication:**
- Features communicate through shared types (`types/`) and pure functions (`lib/`)
- Portfolio/review cross-feature dependency: review reads portfolio allocations via a shared selector in `types/portfolio.ts` — no direct feature import
- Dashboard aggregates from all features via Dexie queries in the route component

**External Integrations:**
- mfapi.in: scheme master data, NAV history — through nginx proxy
- mfdata.in: mutual fund details, category data — through nginx proxy
- No other external services

**Data Flow:**
1. User data: Forms → Dexie.js → React Query (via `useLiveQuery`) → UI
2. External data: nginx proxy → TanStack Query → Zod normalize → ZCached + UI
3. Computed values: Dexie data + API data → pure function (scorecard/xirr) → UI
4. Export: Dexie tables → JSON blob → download/upload

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** All technology choices are compatible. Vite 6 + React 19 + TanStack Router + TanStack Query + Dexie.js + Recharts all coexist without conflict. No backend framework needed — nginx proxy handles API routing and auth.

**Pattern Consistency:** Naming conventions (camelCase code, PascalCase components, snake_case DB tables) are consistent across all layers. State management boundaries (TanStack Query → API, Dexie.js → user data, React context → UI state) are non-overlapping.

**Structure Alignment:** Project structure mirrors the architectural decisions — feature modules isolate business logic, `lib/` enforces pure-function separation, `stores/` centralizes data access.

### Requirements Coverage Validation ✅

**Feature Coverage (13/13 FRs mapped):** Every functional requirement maps to a route + feature module. Dashboard aggregates all features. The 11 IA surfaces from EXPERIENCE.md each have a dedicated route.

**Non-Functional Requirements Coverage:**
- Auth: HTTP Basic Auth via nginx ✅
- Docker deployment: Single nginx container ✅
- Desktop-first responsive: Tailwind + shadcn responsive utilities ✅
- API resilience: TanStack Query staleTime + retry + fallback ✅
- Data export/import: JSON dump/restore in Settings ✅
- WCAG AA: shadcn/ui base components + semantic HTML ✅

### Gap Analysis

**Minor (Non-Blocking):**
- `src/routes/login.tsx` is unnecessary — HTTP Basic Auth via nginx pops a browser-native dialog, the SPA never handles login UI. Route should be removed.
- `vitest.config.ts` missing from project tree (exists implicitly via package.json scripts, but explicit config improves consistency).
- `features/reviews` depends on portfolio drift data — documented as a cross-feature concern but the shared selector location (`types/portfolio.ts`) should be explicitly noted as the boundary.

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — all 16 checklist items validated, no critical gaps, 13/13 FRs mapped, technology choices are well-understood and compatible.

**Key Strengths:**
- Minimal architecture — no over-engineered backend, no redundant state management
- Clear separation of concerns (pure functions, feature modules, data access)
- API resilience strategy addresses the primary risk (unreliable external APIs)
- Structure maps 1:1 to IA surfaces — implementation follows a clear blueprint

**Areas for Future Enhancement:**
- Automated NAV refresh scheduling (deferred to post-MVP)
- Dark mode toggle (deferred to post-MVP)
- Service worker / PWA for offline support (deferred)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries — no cross-feature imports
- Refer to this document for all architectural questions

**First Implementation Priority:**
```
npx shadcn@latest init -t vite
# Then add: npm install @tanstack/react-router @tanstack/react-query dexie recharts zod
```

**Stack consensus:**
- Frontend: Vite + React + TypeScript + shadcn/ui + TanStack Query + TanStack Router
- Backend: Lightweight gateway/cache (FastAPI or nginx proxy) or fully local-first
- Persistence: IndexedDB (Dexie.js) for local data; SQLite for server-side cache if backend used
- Charts: Recharts (shadcn ecosystem)
- Validation: Zod at API boundary

**Key architectural decisions identified:**
1. Frontend-only vs lightweight backend — the #1 scope call
2. API caching strategy — two-tier (SQLite materialized cache + TanStack Query staleTime)
3. Pure-function core engines (scorecard, SIP calculator, XIRR) — test in isolation
4. Category taxonomy as structured data with migration path
5. Form state persistence in localStorage
6. Computed alerts from data selectors (no notification system)
7. Export/import for portfolio data (browser storage is ephemeral)
