---
stepsCompleted: [1, 2]
requirements_extracted: true
requirements_confirmed_at: '2026-06-03'
epics_approved: true
epics_approved_at: '2026-06-03'
inputDocuments:
  - planning-artifacts/prds/prd-Investor-adviser-app-2026-06-03/prd.md
  - planning-artifacts/architecture.md
  - planning-artifacts/ux-designs/ux-Investor-adviser-app-2026-06-03/DESIGN.md
  - planning-artifacts/ux-designs/ux-Investor-adviser-app-2026-06-03/EXPERIENCE.md
---

# Investor-adviser-app - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Investor-adviser-app, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Risk Profile Assessment — User completes questionnaire. System computes risk profile (Conservative / Moderate / Aggressive) and maps to recommended AMFI categories.
FR2: Profile Persistence — Profile saved and reusable. User can retake assessment anytime.
FR3: Goal CRUD — User creates goals with name, type (Emergency / Medium-Term / Long-Term / Custom), target amount, and target date.
FR4: Goal-to-Category Mapping — System suggests AMFI categories per goal based on Risk Profile and time horizon. User can override suggestions.
FR5: Allocation Tracking — Each goal tracks current allocation across funds vs target allocation. Drift % displayed.
FR6: Category Browser — User browses funds grouped by AMFI super-category and sub-category.
FR7: Custom Scoring — User defines scoring criteria (expense ratio, returns, fund age, AUM, consistency) with % weights. System ranks funds by composite score.
FR8: Fund Detail View — Shows NAV history, expense ratio, AUM, portfolio holdings, sector allocation, rolling returns, and category benchmark comparison.
FR9: Transaction Logging — User logs purchases (lump-sum or SIP instalments) with date, amount, NAV, and units.
FR10: Holdings Dashboard — Consolidated view of all holdings: current value, XIRR, category-wise allocation, goal-wise breakdown.
FR11: Review Schedule — User sets review frequency (monthly / quarterly). System sends reminders.
FR12: Review Flow — Each review shows: current vs target allocation, drift amount, fund performance vs benchmark, SIP status. User writes rationale entry.
FR13: Investment Journal — Free-form journal entries tagged to goals, funds, or reviews. Full history searchable.

### Non-Functional Requirements

NFR1: Single-user with password authentication via HTTP Basic Auth (nginx)
NFR2: Deployed via Docker on personal domain
NFR3: Web-only application, responsive desktop-first with mobile usability
NFR4: Data sourced from free public APIs (mfapi.in, mfdata.in) with no SLA — must handle API unavailability gracefully
NFR5: Manual data refresh for MVP, automated post-MVP
NFR6: WCAG AA accessibility compliance
NFR7: Browser storage must support export/import to prevent data loss
NFR8: API resilience with stale-while-revalidate caching; app must work when APIs are down
NFR9: Desktop-first responsive design with three breakpoints (lg 1024px+, md 768-1023px, sm <768px)

### Additional Requirements (Architecture)

- AR1: Project scaffold via `npx shadcn@latest init -t vite` with TanStack Router, Dexie.js, TanStack Query, Recharts added
- AR2: nginx reverse proxy routes for `/api/mfapi/*` and `/api/mfdata/*` with CORS headers and optional caching
- AR3: Category taxonomy as structured data (Zod schema + static JSON asset) with migration awareness
- AR4: Pure-function engines: scorecard engine, SIP calculator, XIRR computation as standalone TypeScript modules tested with Vitest
- AR5: nginx .htpasswd setup for HTTP Basic Auth
- AR6: Single Docker container — multi-stage build (Node build → nginx runtime), docker-compose.yml for deployment
- AR7: Data export/import as single JSON dump/restore in Settings (serializes all IndexedDB tables)
- AR8: Dark mode tokens predefined (frontmatter -dark variants) but light-only for v1
- AR9: TanStack Query key conventions (`['nav', schemeCode]`, `['funds', {category}]`) for all API data
- AR10: Zod schemas at every API entry point for data normalization (inconsistent field names from external APIs)
- AR11: Feature modules in `src/features/<name>/` — no cross-feature imports; share through `src/lib/` or `src/types/`
- AR12: IndexedDB Dexie.js tables: goals, transactions, portfolios, journals, scorecard-weights, risk-profiles
- AR13: Form draft persistence in sessionStorage for goals, profiling, and review forms
- AR14: Naming conventions — PascalCase for components, camelCase for utilities, kebab-case for config, snake_case for DB tables

### UX Design Requirements

UX-DR1: Implement navy (#1B3A5C) / green (#2E8B57) brand palette as shadcn/ui CSS variable overrides (including -dark variants for future dark mode)
UX-DR2: Configure typography ramp — Inter for UI (28px display, 20px display-sm, 14px body, 13px label, 12px small), JetBrains Mono for financial figures (13px)
UX-DR3: Build sidebar navigation — fixed 260px (lg+), icon-only (md), Sheet (sm) — with navy background, green active indicator pill, lighter navy hover state
UX-DR4: Implement brand-layer component overrides: Button (primary/success/danger), Card (1px border, no shadow), Input/Select, Table (muted header with alternating rows), Badge (pill shape), Progress bar (green fill), Drift indicator (3-state pill)
UX-DR5: Build scorecard factor row component — factor name, weight badge, raw score, weighted contribution bar (green/amber), 1-line explanation, alternating row backgrounds
UX-DR6: Build scorecard total component — large composite score number (mono, 32px) with weight distribution mini donut below
UX-DR7: Build overlap indicator component — single progress bar with two segments (new exposure green, overlap gray) + percentage label
UX-DR8: Build alert card component — accent-left-border (amber/red), icon, title, description, timestamp, "Start Review" action, dismissible
UX-DR9: Build SIP projection chart — Recharts line chart with 3 projection lines (conservative/moderate/optimistic), horizontal dashed target line, gap highlight in amber, legend
UX-DR10: Build drift indicator — 3-state pill (green/amber/red) with text labels ("On track" / "Watch" / "Review") next to allocation percentages
UX-DR11: Build review checklist component — 5-step structured flow (drift check → category exposure → fund-role fit → benchmark comparison → rationale) with pass/warn/fail status per step
UX-DR12: Build structured journal entry component — fields: "Why bought", "What role it plays", "What would trigger exit", "Next review date" + free-form notes + timeline of previous entries + keyword search
UX-DR13: Implement empty states for all list surfaces (goals, transactions, reviews, journal, watchlist) with app-specific guidance text and primary action button
UX-DR14: Implement loading skeletons (shadcn Skeleton rows matching expected layout) for all data-fetching surfaces
UX-DR15: Implement form validation on blur for financial inputs with auto-formatting (commas, decimal precision) using Intl.NumberFormat('en-IN')
UX-DR16: Implement scorecard weight sliders with real-time composite score updates and auto-normalization to 100% when sum ≠ 100%
UX-DR17: Implement responsive sidebar (fixed on lg 1024px+, icon-only on md 768-1023px, Sheet on sm <768px)
UX-DR18: Ensure WCAG 2.2 AA — screen reader announces page surface on navigation, visible focus rings, color + text for drift indicators, proper `<th>` scope and `<caption>` on data tables
UX-DR19: Implement Review Alert Card system — event-based alerts for drift threshold exceeded, duplicate category exposure, fund role mismatch — with dismiss and "Start Review" action
UX-DR20: Implement Investment Journal with structured fields, search-by-keyword across all fields/notes, chronological timeline of entries per fund/goal
UX-DR21: Implement in-app term explanation system — centralized glossary store (Dexie table keyed by term slug) with reusable `<TermInfo term="xirr" />` component rendering tooltip or side-panel. Every financial term (XIRR, AUM, NAV, expense ratio, exit load, SIP, drift, benchmark, large-cap, etc.) gets: plain-English definition, concrete worked example with realistic Indian Rupee numbers, and "why this matters" sentence. Inline explanations embedded directly in risk questionnaire questions — not just tooltips on results.

### FR Coverage Map

FR1: Epic 1 — Risk Profile Assessment
FR2: Epic 1 — Profile Persistence
FR3: Epic 2 — Goal CRUD
FR4: Epic 2 — Goal-to-Category Mapping
FR5: Epic 2 — Allocation Tracking
FR6: Epic 3 — Category Browser
FR7: Epic 3 — Custom Scoring
FR8: Epic 3 — Fund Detail View
FR9: Epic 4 — Transaction Logging
FR10: Epic 4 — Holdings Dashboard
FR11: Epic 5 — Review Schedule
FR12: Epic 5 — Review Flow
FR13: Epic 5 — Investment Journal

## Epic List

### Epic 1: App Foundation & Investor Profiling
User can access the app securely, set up their risk profile, and the platform foundation is ready for all features. Centralized term explanation system (`<TermInfo>` component + Dexie glossary store) established as reusable pattern for all downstream epics. Risk questionnaire includes inline explanations embedded within questions.
**FRs covered:** FR1, FR2
**UX-DRs covered:** UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR13, UX-DR14, UX-DR15, UX-DR17, UX-DR18, UX-DR21
**Includes:** Project scaffold (Vite + shadcn + TanStack Router + Dexie + TanStack Query + Recharts), Docker + nginx setup, HTTP Basic Auth, Dexie DB schema setup, category taxonomy JSON + Zod schema, risk profiling screens with inline term explanations, centralized glossary store (Dexie table), reusable `<TermInfo>` component

#### Story 1.1: Project Scaffold, Docker Setup & Authentication

As Boss,
I want the app scaffolded with Docker, password authentication, and brand theme applied,
So that I can access the app securely with the right look and feel from the start.

**Acceptance Criteria:**

**Given** the project repository is cloned,
**When** I run `docker compose up`,
**Then** the application is served on port 80
**And** the browser prompts for a username and password (nginx HTTP Basic Auth with bcrypt `.htpasswd`).

**Given** Docker is running the app,
**When** I enter valid credentials,
**Then** I see the app with the navy (#1B3A5C) primary and green (#2E8B57) accent brand palette applied via shadcn/ui CSS variables
**And** typography is configured with Inter for UI text and JetBrains Mono for financial figures.

**Given** the project is scaffolded with `npx shadcn@latest init -t vite`,
**When** I inspect the project structure,
**Then** TypeScript strict mode is enabled, `@/` path alias is configured, and shadcn/ui components (Button, Card, Input, Badge) render correctly
**And** Dexie.js is initialized with base schema, TanStack Query and TanStack Router are installed
**And** `.htpasswd.example` and `.env.example` files are present with documented instructions.

#### Story 1.2: Navigation Shell & Layout

As Boss,
I want a sidebar navigation that lets me move between sections of the app,
So that I can access goals, fund research, portfolio, reviews, and settings easily.

**Acceptance Criteria:**

**Given** Story 1.1 is complete,
**When** I log in and see the app,
**Then** an AppShell renders with a Sidebar (left), Topbar (top), and content area
**And** the sidebar is fixed 260px wide on lg+ viewports (1024px+).

**Given** I am on a medium viewport (768-1023px),
**When** the sidebar renders,
**Then** it collapses to icon-only with tooltips on hover.

**Given** I am on a small viewport (<768px),
**When** I tap the hamburger icon,
**Then** the sidebar opens as a Sheet overlay.

**Given** I click a sidebar item,
**When** the section becomes active,
**Then** it highlights with a green (#2E8B57) accent pill on navy (#1B3A5C) background
**And** hover state uses lighter navy (#2A4F7A) background.

**Given** the route tree is configured,
**When** I navigate between sections,
**Then** each route (Dashboard, Goals, Goal Detail, Profiling, Universe Browser, Scorecard, Fund Detail, Portfolio, Reviews, Journal, Settings) renders a placeholder page
**And** routes are type-safe and lazy-loaded via TanStack Router.

#### Story 1.3: Centralized Term Explanation System

As a beginner investor,
I want every financial term in the app to have a clickable explanation in plain language with examples,
So that I can understand what each term means without leaving the current screen.

**Acceptance Criteria:**

**Given** the glossary store is set up in Dexie,
**When** I inspect the glossary table,
**Then** it contains columns: term slug, term name, plain-language definition, concrete worked example with realistic INR numbers, and a "why this matters" sentence
**And** the table is seeded with initial terms: NAV, AUM, expense ratio, SIP, lump-sum, XIRR, benchmark, exit load, drift, AMFI category, direct plan, regular plan, growth option.

**Given** any screen in the app renders a financial term,
**When** the `<TermInfo term="xirr" />` component is used,
**Then** a circled-"i" icon appears next to the term text
**And** clicking the icon opens a tooltip or popover showing the definition, example, and "why this matters".

**Given** the `<TermInfo>` component is used inside a form or questionnaire,
**When** the `inline` prop is set to `true`,
**Then** the explanation renders as expanded text below the term rather than a tooltip popover.

**Given** a term is not found in the glossary,
**When** the `<TermInfo>` component renders,
**Then** it shows a generic "Learn more about this term" fallback with a link to add it.

#### Story 1.4: Investor Risk Profiling

As a new investor,
I want to take a risk assessment questionnaire that explains each term inline,
So that I can get a risk profile and understand which fund categories suit my goals.

**Acceptance Criteria:**

**Given** I am a new user,
**When** I first access the app,
**Then** I am redirected to the Profiling page to complete the risk assessment before accessing other sections.

**Given** I open the risk questionnaire,
**When** I see the questions,
**Then** each financial term (time horizon, drawdown, etc.) includes an inline explanation via `<TermInfo inline>`
**And** the questionnaire covers: time horizon, drawdown comfort, income stability, emergency reserve, and investing experience.

**Given** I submit the questionnaire,
**When** the system computes my profile,
**Then** the result is one of Conservative / Moderate / Aggressive
**And** the profile is saved to the Dexie `risk-profiles` table along with raw answers.

**Given** my profile is saved,
**When** I view the profile card,
**Then** it displays the risk profile result, monthly investment capacity, time horizon, and an expandable section with raw answers
**And** a "Retake assessment" link is available to redo the questionnaire.

**Given** the profile is computed,
**When** I view the recommended categories,
**Then** the app shows the AMFI categories that match my risk profile and time horizon.

### Epic 2: Goal Planning & SIP Calculator
User creates financial goals with target amounts, gets category recommendations, tracks allocation with drift, and uses SIP calculator to plan contributions.
**FRs covered:** FR3, FR4, FR5
**UX-DRs covered:** UX-DR9, UX-DR10, UX-DR16
**Includes:** Goal CRUD (create/edit/close), goal-to-category mapping with user overrides, allocation tracking with drift %, SIP calculator engine + projection chart, goal detail view
**Term wiring:** SIP, target amount, drift, time horizon, allocation, conservative/moderate/optimistic scenarios

#### Story 2.1: Goal CRUD

As Boss,
I want to create, view, edit, and close financial goals with clear validation,
So that I can define my investment targets and track them.

**Acceptance Criteria:**

**Given** I am on the Goals page,
**When** I click "Create Goal",
**Then** a form opens with fields: name, type (Emergency / Medium-Term / Long-Term / Custom), starting amount, target amount, and target date
**And** financial terms on the form have `<TermInfo>` tooltips explaining each field.

**Given** I fill in the form,
**When** I blur a financial input field,
**Then** the value auto-formats with INR commas (Intl.NumberFormat('en-IN'))
**And** validation errors appear on blur.

**Given** I submit the form,
**When** the goal is created,
**Then** I am redirected to the Goal Detail page
**And** the goal appears in the goal list with a progress bar at 0%.

**Given** the goal list is empty,
**When** I view the page,
**Then** an empty state is shown: "No goals yet. Create your first goal to start tracking your investments." with a primary "Create Goal" action button.

**Given** I open an existing goal's context menu (⋮),
**When** I select "Edit",
**Then** the create form opens pre-filled with current values and saves updates on submit.

**Given** I select "Close Goal" from the context menu,
**When** I confirm the action,
**Then** the goal is archived with a completion date
**And** its holdings remain visible in the Portfolio.

#### Story 2.2: Goal-to-Category Mapping & SIP Calculator

As Boss,
I want to see recommended fund categories based on my risk profile and time horizon, and use the SIP calculator to plan my monthly contributions,
So that I know where to invest and how much to set aside.

**Acceptance Criteria:**

**Given** I open the Goal Detail page for a goal,
**When** the category allocator loads,
**Then** it shows recommended AMFI categories based on my risk profile and goal time horizon
**And** each category recommendation includes a `<TermInfo>` explanation.

**Given** I override a suggested category,
**When** I select a different category,
**Then** the replaced category is shown with strikethrough and a "custom override" label
**And** the new selection is saved.

**Given** I open the SIP Calculator on the Goal Detail page,
**When** I enter target amount, target date, starting amount, expected inflation, and monthly contribution,
**Then** the calculator shows the required monthly SIP under 3 retur1n scenarios (conservative 6%, moderate 8%, optimistic 10%).

**Given** the SIP Calculator has computed results,
**When** I view the chart,
**Then** a Recharts line chart shows 3 projection lines (conservative/moderate/optimistic), a horizontal dashed target line, and an amber highlighted gap if a shortfall exists
**And** a legend is shown below the chart.

**Given** there is a shortfall,
**When** the gap indicator displays,
**Then** it shows: "Current projection ₹X vs target ₹Y. Increase monthly SIP by ₹Z to close the gap at 8% return."
**And** the gap indicator is green (on track), amber (minor gap), or red (significant gap) with an "Adjust SIP" action button.

#### Story 2.3: Goal Detail — Allocation & Drift Tracking

As Boss,
I want to see each goal's current allocation versus target, with drift indicators,
So that I know whether my portfolio is on track or needs rebalancing.

**Acceptance Criteria:**

**Given** I open a Goal Detail page,
**When** the allocation section loads,
**Then** it shows the target amount vs current amount, a progress bar, and a per-fund drift indicator pill.

**Given** a fund's allocation is tracked,
**When** drift is computed,
**Then** drift percentage = (current allocation % - target allocation %) / target allocation %
**And** the drift pill displays: green "On track" (<5%), amber "Watch" (5-10%), or red "Review" (>10%).

**Given** the allocation breakdown is displayed,
**When** I view assigned funds,
**Then** each fund shows: fund name, AMFI category badge, current value, target %, actual %, and drift pill
**And** financial terms include `<TermInfo>` tooltips.

**Given** the goal has no allocated funds yet,
**When** I view the allocation section,
**Then** an empty state shows: "No funds allocated to this goal yet. Browse the fund universe to find suitable funds."

### Epic 3: Fund Research Universe — Browser, Scorecard & Detail
User browses mutual funds by AMFI category, scores/ranks them by custom criteria, and views detailed fund information with overlap analysis.
**FRs covered:** FR6, FR7, FR8
**UX-DRs covered:** UX-DR5, UX-DR6, UX-DR7, UX-DR16
**Includes:** Category browser with 6 filter dimensions, custom scoring engine, scorecard UI with factor breakdown + composite score, overlap indicator, fund detail view (NAV history, sector allocation, benchmark comparison)
**Term wiring:** NAV, AUM, expense ratio, exit load, benchmark, AMFI category, direct/regular plan, growth option, rolling returns, sector allocation, overlap

#### Story 3.1: Category Browser & Fund Filtering

As Boss,
I want to browse mutual funds grouped by AMFI category and filter by my criteria,
So that I can discover funds that match my investment preferences.

**Acceptance Criteria:**

**Given** the Universe Browser loads,
**When** the page opens,
**Then** funds are fetched from mfapi.in / mfdata.in via the nginx proxy
**And** displayed grouped by AMFI super-category and sub-category.

**Given** the filter panel is visible,
**When** I expand it,
**Then** I can filter by: category (multi-select), plan type (direct/regular), growth option toggle, AMC dropdown, expense ratio range (slider), AUM range (slider), and benchmark type (multi-select)
**And** each financial term in the filter panel has a `<TermInfo>` tooltip.

**Given** I have set my filter criteria,
**When** I click "Apply filters",
**Then** the results update to show only matching funds.

**Given** data is loading,
**When** the API call is in progress,
**Then** skeleton rows (4-6) are shown with "Fetching fund data..." text.

**Given** the API call fails,
**When** data cannot be fetched,
**Then** a toast displays: "Couldn't fetch fund data. The data source may be temporarily unavailable. Try again later."
**And** a retry button is shown.

**Given** no funds match my filters,
**When** results are empty,
**Then** an empty state shows: "No funds match your filters. Try adjusting your criteria."

**Given** a list of funds is shown,
**When** I scan the Fund Row,
**Then** each row shows: fund name, AMFI category badge, plan type, expense ratio, AUM, risk label, and composite score (placeholder until scoring is built).

#### Story 3.2: Custom Scoring Engine (Pure Function)

As a developer,
I want a pure-function scoring engine in `src/lib/scorecard.ts` with Vitest tests,
So that funds can be scored by configurable criteria without UI dependencies.

**Acceptance Criteria:**

**Given** the scorecard engine is implemented,
**When** I inspect `src/lib/scorecard.ts`,
**Then** it exports a `computeScore(fund, weights)` pure function with no React or DOM imports
**And** it supports the 10 scoring factors: category fit, cost, fund age, AUM sanity, benchmark suitability, rolling-return consistency, volatility, drawdown, exit load, overlap with holdings.

**Given** weights are provided,
**When** they do not sum to 100%,
**Then** the engine normalizes them proportionally with a flag `weightsNormalized: true`.

**Given** the engine is tested,
**When** Vitest runs `src/lib/scorecard.test.ts`,
**Then** tests cover: correct composite score computation, weight normalization, edge case with zero weights, edge case with missing factor data, and single-factor scoring.

#### Story 3.3: Scorecard UI & Weight Configuration

As Boss,
I want to configure scoring weights with sliders and see an explainable factor breakdown with composite score,
So that I can rank funds by what matters most and understand why each fund scored as it did.

**Acceptance Criteria:**

**Given** I select a fund from the Universe Browser,
**When** the Scorecard opens,
**Then** it shows the composite score at the top in mono 32px font with a mini donut chart showing weight distribution across factors.

**Given** the Scorecard loads with default weights,
**When** I view the weights,
**Then** defaults are: consistency 25%, cost 15%, category fit 15%, benchmark suitability 10%, fund age 5%, AUM sanity 5%, volatility 5%, drawdown 5%, exit load 5%, overlap 5%.

**Given** I adjust a weight slider,
**When** the value changes,
**Then** the composite score updates in real-time
**And** if the sum of all weights ≠ 100%, remaining weight is distributed proportionally across all factors with a note: "Weights normalized to 100%."

**Given** the Factor Breakdown table is displayed,
**When** I scan each row,
**Then** each factor shows: factor name with `<TermInfo>` tooltip, weight badge, raw score (0-20), weighted contribution bar (green for good, amber for below average), and a 1-line plain-English explanation
**And** rows have alternating backgrounds for readability.

**Given** rolling-return history is incomplete (<5 years),
**When** the Consistency factor loads,
**Then** it shows an amber warning: "Only X years of data available — consistency score may not be fully representative."

#### Story 3.4: Fund Detail View & Overlap Indicator

As Boss,
I want to see a fund's full details — NAV history, holdings, sector allocation, benchmark comparison — and how it overlaps with my existing portfolio,
So that I can make an informed decision before allocating.

**Acceptance Criteria:**

**Given** I click a fund from the Scorecard,
**When** the Fund Detail page loads at `/scorecard/$schemeCode`,
**Then** it shows: NAV history (Recharts line chart), expense ratio, AUM, exit load summary cards, portfolio holdings table, sector allocation bar chart, and rolling returns vs benchmark comparison chart
**And** every financial figure has a `<TermInfo>` tooltip.

**Given** the Overlap Indicator loads,
**When** I view it,
**Then** it shows a single progress bar with two segments: green for % new sector exposure and gray for % overlap with existing holdings
**And** a percentage label in the center with an explanation below: "This fund adds X% new sector exposure not in your portfolio" or "Your portfolio already has Y% in Financial Services. This fund adds Z% more."

**Given** I have no holdings yet,
**When** the Overlap Indicator tries to compute,
**Then** it shows: "No existing holdings to compare against. Add holdings to see overlap analysis."

**Given** fund overlap data is incomplete,
**When** the indicator cannot compute,
**Then** it shows: "Overlap data unavailable for this fund."

### Epic 4: Portfolio Tracking & Transaction Management
User logs transactions (SIP + lump-sum), views consolidated holdings with XIRR, allocation breakdown, and can export/import data.
**FRs covered:** FR9, FR10
**UX-DRs covered:** UX-DR15
**Includes:** Transaction logging form, holdings dashboard (current value, XIRR, unrealized gain/loss), category-wise allocation, goal-wise breakdown, data export/import in Settings
**Term wiring:** XIRR, absolute returns, unrealized gain/loss, NAV, SIP, lump-sum, allocation, drift

#### Story 4.1: XIRR Engine (Pure Function)

As a developer,
I want a pure-function XIRR computation module in `src/lib/xirr.ts` with Vitest tests,
So that portfolio returns can be accurately calculated without UI dependencies.

**Acceptance Criteria:**

**Given** the XIRR engine is implemented in `src/lib/xirr.ts`,
**When** I inspect the module,
**Then** it exports a `computeXIRR(transactions)` pure function with no React or DOM imports
**And** it accepts an array of `{date: string, amount: number}` entries where negative = investment, positive = redemption, and the final entry represents current portfolio value.

**Given** the function computes XIRR,
**When** provided with valid transaction data,
**Then** it uses Newton's method to solve for the internal rate of return
**And** returns the annualized return as a decimal (e.g., 0.124 = 12.4%).

**Given** edge cases are encountered,
**When** there is only a single transaction (no redemptions),
**Then** the function returns a placeholder indicating insufficient data.
**When** the Newton method does not converge,
**Then** the function returns `null` with a fallback approximation.

**Given** Vitest tests exist in `src/lib/xirr.test.ts`,
**When** the test suite runs,
**Then** tests cover: standard XIRR calculation, single-transaction edge case, non-convergence handling, and boundary conditions with zero amounts.

#### Story 4.2: Transaction Logging

As Boss,
I want to log my SIP instalments and lump-sum purchases with date, amount, NAV, and linked goal,
So that my portfolio accurately reflects my holdings.

**Acceptance Criteria:**

**Given** I open the Portfolio page,
**When** I click "Add Transaction",
**Then** a form opens with fields: type (SIP / Lump-sum), date, amount, NAV, units (auto-computed from amount/NAV), linked goal (dropdown of active goals)
**And** validation occurs on blur with INR auto-formatting.

**Given** I submit a transaction,
**When** the form is valid,
**Then** the transaction is saved to the Dexie `transaction_records` table
**And** the portfolio dashboard updates to reflect the new holding.

**Given** I log a SIP instalment,
**When** the entry is saved,
**Then** it is tagged with the SIP schedule name and linked to the correct goal.

**Given** I open the Transactions view,
**When** transactions are listed,
**Then** they are paginated (not infinite scroll) with date, fund name, type, amount, NAV, units, and linked goal columns.

#### Story 4.3: Holdings Dashboard & Data Export/Import

As Boss,
I want a consolidated dashboard showing my portfolio's current value, XIRR, category allocation, and goal-wise breakdown, with the ability to export and import my data,
So that I can track my overall investment health and protect my data against browser storage loss.

**Acceptance Criteria:**

**Given** I open the Portfolio page,
**When** it loads,
**Then** the dashboard shows: total current value, XIRR since inception, unrealized gain/loss, category-wise allocation donut chart (Recharts), fund-level contribution table sorted by value, and goal-wise breakdown with links to Goal Detail
**And** every financial term includes a `<TermInfo>` tooltip.

**Given** there are no transactions yet,
**When** I view the Portfolio page,
**Then** an empty state shows: "No transactions yet. Log a SIP or lump-sum purchase to track your holdings." with a primary "Add Transaction" action button.

**Given** data is loading,
**When** the dashboard fetches from Dexie,
**Then** skeleton cards are shown for each dashboard section.

**Given** I open Settings,
**When** I click "Export Data",
**Then** a single JSON file is downloaded containing all serialized Dexie tables (goals, transactions, portfolios, journals, scorecard-weights, risk-profiles, glossary).

**Given** I have an export file,
**When** I click "Import Data" and select the file,
**Then** all Dexie tables are restored from the JSON
**And** a success toast confirms the import.

### Epic 5: Reviews, Alerts & Investment Journal
User runs scheduled reviews, responds to drift/duplicate/role-mismatch alerts, and maintains a searchable decision journal.
**FRs covered:** FR11, FR12, FR13
**UX-DRs covered:** UX-DR8, UX-DR11, UX-DR12, UX-DR19, UX-DR20
**Includes:** Review schedule + reminder system, review checklist flow (drift → category → role → benchmark → rationale), alert card system, structured journal with search + timeline
**Term wiring:** drift, benchmark, category exposure, role mismatch, XIRR, absolute returns

#### Story 5.1: Review Schedule & Reminder System

As Boss,
I want to set a review frequency and receive event-based alerts for drift, duplicate exposure, or fund role mismatches,
So that I know when to review my portfolio and what needs attention.

**Acceptance Criteria:**

**Given** I open Settings,
**When** I select a review frequency (monthly or quarterly),
**Then** the review schedule is saved to Dexie
**And** the Dashboard shows the next review date.

**Given** my portfolio has a drift threshold exceeded (>5%),
**When** the alert is computed from Dexie data selectors,
**Then** an alert card is shown on the Dashboard with amber accent-left-border, a warning icon, title ("Drift alert: Debt is 8% over target"), description, timestamp, dismiss button, and "Start Review" action.

**Given** there are duplicate category exposures (≥2 funds in same sector) or a fund role mismatch,
**When** alerts are evaluated,
**Then** corresponding alert cards are generated: "Duplicate exposure: 3 funds in Banking sector" and "Fund X (Flexi Cap) has been reclassified to Large Cap."
**And** alert cards are dismissible by clicking the close icon.

**Given** there are no reviews scheduled yet,
**When** I view the Reviews page,
**Then** an empty state shows: "No reviews scheduled. Set a review frequency to receive reminders."

**Given** an alert card is displayed,
**When** I click "Start Review",
**Then** I am directed to the Review Checklist flow for the affected goal or portfolio.

#### Story 5.2: Review Checklist Flow

As Boss,
I want to step through a structured review — drift check, category exposure, fund-role fit, benchmark comparison — and write a rationale,
So that I can make deliberate, documented decisions about my portfolio.

**Acceptance Criteria:**

**Given** I start a review from an alert card or the Reviews page,
**When** the Review Checklist opens,
**Then** it presents 5 steps: (1) Drift Check, (2) Category Exposure, (3) Fund-Role Fit, (4) Benchmark Comparison, (5) Rationale & Outcome
**And** each step shows a status indicator (PASS / WARN / FAIL).

**Given** I complete all steps,
**When** I reach Step 5,
**Then** I can choose "No action needed — portfolio is aligned with plan" or "Take action"
**And** I must write a written rationale explaining my decision.

**Given** a fund underperforms its benchmark by >2% for 2 consecutive quarters,
**When** the Benchmark Comparison step loads,
**Then** the fund is highlighted with a red border and a note: "Fund X has underperformed its benchmark for 2 consecutive quarters."

**Given** I submit the review,
**When** the review is complete,
**Then** the review date is logged in Dexie, drift indicators reset, alerts are dismissed, and next review date is calculated based on frequency.

#### Story 5.3: Investment Journal

As Boss,
I want to write structured journal entries for each fund or goal — why I bought, what role it plays, what would trigger exit, and when to review next — with a searchable timeline,
So that I preserve my decision trail and learn from past choices.

**Acceptance Criteria:**

**Given** I open the Journal from the sidebar, a Goal Detail page, or a Fund Detail page,
**When** I create a new entry,
**Then** the form shows structured fields: "Why bought", "What role it plays", "What would trigger exit", "Next review date", plus a free-form notes field
**And** the entry is tagged to the relevant fund, goal, or review.

**Given** I save an entry,
**When** it is stored in the Dexie `journals` table,
**Then** previous entries for the same fund or goal are shown in a reverse-chronological timeline below the form.

**Given** I am on the Journal surface,
**When** I use the search bar,
**Then** results filter all entries by keyword across all fields and notes.

**Given** an entry was written during a review,
**When** it is displayed,
**Then** it is linked to the review date and outcome.
