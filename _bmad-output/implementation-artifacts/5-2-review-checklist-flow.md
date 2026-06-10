# Story 5.2: Review Checklist Flow

Status: done
baseline_commit: b5e3c8bf13c1fee1cb07201a66253debf49bc1a9

## Story

As Boss,
I want to step through a structured review — drift check, category exposure, fund-role fit, benchmark comparison — and write a rationale,
So that I can make deliberate, documented decisions about my portfolio.

## Acceptance Criteria

1. **Given** I start a review from an alert card or the Reviews page,
   **When** the Review Checklist opens,
   **Then** it presents 5 steps: (1) Drift Check, (2) Category Exposure, (3) Fund-Role Fit, (4) Benchmark Comparison, (5) Rationale & Outcome
   **And** each step shows a status indicator (PASS / WARN / FAIL).

2. **Given** I complete all steps,
   **When** I reach Step 5,
   **Then** I can choose "No action needed — portfolio is aligned with plan" or "Take action"
   **And** I must write a written rationale explaining my decision.

3. **Given** a fund underperforms its benchmark by >2% for 2 consecutive quarters,
   **When** the Benchmark Comparison step loads,
   **Then** the fund is highlighted with a red border and a note: "Fund X has underperformed its benchmark for 2 consecutive quarters."

4. **Given** I submit the review,
   **When** the review is complete,
   **Then** the review date is logged in Dexie, drift indicators reset, alerts are dismissed, and next review date is calculated based on frequency.

## Tasks / Subtasks

### 1. Create `reviews` table in Dexie (version 4)

- [x] Add `Review` interface to `src/stores/db.ts`:
  ```ts
  export interface Review {
    id?: number
    reviewDate: string
    outcome: 'aligned' | 'action_taken'
    rationale: string
    steps: ReviewStep[]
    createdAt: string
  }

  export interface ReviewStep {
    name: 'drift_check' | 'category_exposure' | 'fund_role_fit' | 'benchmark_comparison' | 'rationale_outcome'
    status: 'pass' | 'warn' | 'fail'
    details: string
  }
  ```
- [x] Add `this.version(4).stores({...})` extending version 3 with `reviews: '++id, reviewDate'`
- [x] Add `reviews!: Table<Review>` to class body

### 2. Create `src/features/reviews/hooks/useReviewSteps.ts` — step computation hook

- [x] Create hook that returns computed review steps from Dexie data:
  - **Step 1 — Drift Check**: Compute drift % for each holding (reuse logic from `useAlerts.ts`). Status: PASS if all <5%, WARN if any 5–10%, FAIL if any >10%.
  - **Step 2 — Category Exposure**: Group holdings by `amfiCategory`. PASS if all groups <2 funds, WARN if any ≥2 funds.
  - **Step 3 — Fund-Role Fit**: Check each portfolio for missing `category`. PASS if all have category, WARN if any missing.
  - **Step 4 — Benchmark Comparison**: (Placeholder) always returns PASS with note "Benchmark data not available in MVP". Store structure for future real data.
  - **Step 5 — Rationale & Outcome**: User-facing form, no auto-computation.
- [x] Signature: `useReviewSteps(): { steps: ReviewStep[], loading: boolean, recompute: () => void }`
- [x] Use `useLiveQuery` to reactively read goals, holdings, portfolios from Dexie

### 3. Create `src/routes/reviews/checklist.tsx` — review checklist page

- [x] New route at `/reviews/checklist` using TanStack Router file-based routing
- [x] Use `useReviewSteps` hook to get computed steps
- [x] **Step navigation**: Show all 5 steps as a vertical stepper. Each step is collapsible/expandable. Only current + completed steps are active.
- [x] **Step 1-4 display**: For each step, show:
  - Status badge (PASS green / WARN amber / FAIL red) using shadcn `Badge`
  - Title
  - Details text listing individual item statuses (e.g., "Large Cap: PASS (2%)", "Debt: WARN (8%)")
- [x] **Step 5 — Rationale & Outcome**: Show two outcome buttons + a `<textarea>` for rationale. Button disabled until rationale is non-empty.
  - Outcome "No action needed — portfolio is aligned with plan" (green `variant="success"`)
  - Outcome "Take action" (amber `variant="default"`)
- [x] **Submit**: On submit, save `Review` record to Dexie, dismiss all current alerts, reset next review date from frequency, show success toast
- [x] After submit, navigate to `/reviews` with a success toast

### 4. Wire up "Start Review" navigation from alerts

- [x] Update `src/routes/reviews/index.tsx` — change `onStartReview` toast to navigate to `/reviews/checklist`
- [x] Update `src/routes/index.tsx` — Dashboard alert card "Start Review" navigates to `/reviews/checklist`

### 5. Create `src/features/reviews/hooks/useReviewSubmit.ts` — review submission hook

- [x] Hook that takes `outcome`, `rationale`, `steps` and:
  - [x] Creates `Review` record in Dexie
- [x] Dismisses all current alerts (clear sessionStorage `dismissedAlertIds`)
- [x] Resets next review date: reads frequency from `reviewSettings`, recomputes `nextReviewDate` from today
- [x] Returns `{ submit: () => Promise<void>, submitting: boolean }`

### 6. Tests

- [x] Test `useReviewSteps` step computation logic (pure function):
  - [x] Drift: all <5% → PASS, some 5-10% → WARN, any >10% → FAIL
  - [x] Category: 0-1 funds per category → PASS, ≥2 → WARN
  - [x] Fund-role: all have category → PASS, any missing → WARN
  - [x] Benchmark: always PASS (placeholder)
- [x] Test empty state (no holdings → "No holdings" details)
- [x] Test empty portfolios → "No portfolio" details

## Dev Notes

### Previous Story Intelligence (5.1)

- `computeAlerts` in `useAlerts.ts` already computes drift %, duplicate exposure, and role mismatch — reuse drift calculation logic
- `useAlertsState` manages alert state with sessionStorage dismiss; use `dismissAlert` or clear all pattern
- `AlertCard` already exists with dismiss + "Start Review" action
- `reviewSettings` table stores frequency + nextReviewDate — read for reset after review submit
- sessionStorage key `dismissedAlertIds` holds dismissed alert IDs — clear on review submit
- All 87 tests pass, TypeScript clean

### Architecture

- **Route:** `/reviews/checklist` — file-based routing via TanStack Router
- **DB:** Dexie version 4, new `reviews` table
- **Flow:** EXPERIENCE.md Flow 2 describes the 5-step review flow end-to-end
- **Design:** DESIGN.md says review screens have distinct visual treatment (card state with checklist layout)
- **Pattern:** Vertical stepper with collapsible steps, status badges per step
- **Cross-feature:** `features/reviews` depends on portfolio/drift data via shared selectors in `types/`

### Files to Create

| File | Purpose |
|------|---------|
| `src/features/reviews/hooks/useReviewSteps.ts` | Step computation hook |
| `src/features/reviews/hooks/useReviewSubmit.ts` | Review submission hook |
| `src/routes/reviews/checklist.tsx` | Review checklist route page |

### Files to Modify

| File | Change |
|------|--------|
| `src/stores/db.ts` | Add `Review` + `ReviewStep` interfaces, version 4, `reviews` table |
| `src/routes/reviews/index.tsx` | Wire "Start Review" to `/reviews/checklist` |
| `src/routes/index.tsx` | Update navigation to `/reviews/checklist` |

### Existing Patterns to Follow

- **Stepper navigation**: Use shadcn `Card` per step, vertical layout with collapsible sections (use `Collapsible` from shadcn or controlled state)
- **Badges**: `Badge` from shadcn with variant mapping: PASS → `success` (green), WARN → `warning` (amber), FAIL → `destructive` (red)
- **Textarea**: shadcn `textarea` component
- **Navigation**: `useNavigate` from `@tanstack/react-router`
- **Toast**: `useToast` with `addToast`
- **Hook pattern**: `useLiveQuery` for reactive reads, `useCallback` for actions

### Testing Notes

- `useReviewSteps` computes step statuses from Dexie data — extract pure computation function for unit testing
- Test drift thresholds: <5% PASS, 5–10% WARN, >10% FAIL
- Test category counts: 0–1 PASS, 2+ WARN
- Test role mismatch: all present PASS, any missing WARN
- Benchmark always PASS (placeholder)

### References

- [Source: epics.md#Story-5.2] — Full ACs
- [Source: EXPERIENCE.md#Flow-2] — Review flow with 5-step checklist
- [Source: DESIGN.md#Components] — Review screens visual treatment
- [Source: architecture.md#Data-Architecture] — Dexie schema, feature boundaries
- [Source: architecture.md#Frontend-Architecture] — Route structure
- [Source: 5-1-review-schedule-reminder-system.md] — Previous story patterns, computeAlerts reuse
- [Source: stores/db.ts] — Existing Dexie schema

## Dev Agent Record

### Debug Log
- All 99 tests pass (87 old + 12 new)
- TypeScript compilation clean
- No lint warnings

### Completion Notes
- Added Review + ReviewStep interfaces and version 4 to Dexie schema (reviews table)
- Created computeSteps pure-function engine: drift check, category exposure, fund-role fit, benchmark comparison, rationale outcome
- Created useReviewSteps hook wrapping computeSteps with reactive Dexie queries
- Created ReviewChecklist page at /reviews/checklist with collapsible step cards, status badges, and outcome+rationale form
- Created useReviewSubmit hook: saves Review to Dexie, clears sessionStorage dismissed alerts, resets next review date
- Wired up "Start Review" navigation from Dashboard and Reviews page to /reviews/checklist
- 12 unit tests for computeSteps covering drift thresholds, category counts, role mismatch, benchmark placeholder, empty states

### File List
- `src/stores/db.ts` — added ReviewStep, Review interfaces, version 4, reviews table
- `src/features/reviews/hooks/useReviewSteps.ts` — new: computeSteps pure function + useReviewSteps hook
- `src/features/reviews/hooks/useReviewSteps.test.ts` — new: 12 unit tests
- `src/features/reviews/hooks/useReviewSubmit.ts` — new: review submission hook
- `src/routes/reviews/checklist.tsx` — new: review checklist route page
- `src/routes/reviews/index.tsx` — updated: Start Review navigates to /reviews/checklist
- `src/routes/index.tsx` — updated: Start Review navigates to /reviews/checklist

## Review Findings (Round 1 — Applied)

All 13 Round 1 patches applied and verified: 104 tests pass, TypeScript clean.

## Review Findings (Round 2 — Applied)

- Consecutive-quarter tracking implemented via `QuarterlySnapshot` table (version 5) + `useQuarterlyTracking` hook
- Benchmark step uses snapshot value changes to detect >2% underperformance over 2 quarters
- All 10 patch findings applied and verified (105 tests pass, TypeScript clean)
