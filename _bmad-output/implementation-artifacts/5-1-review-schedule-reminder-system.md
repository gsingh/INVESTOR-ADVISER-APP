---
baseline_commit: b5e3c8bf13c1fee1cb07201a66253debf49bc1a9
---

# Story 5.1: Review Schedule & Reminder System

Status: done

## Story

As Boss,
I want to set a review frequency and receive event-based alerts for drift, duplicate exposure, or fund role mismatches,
So that I know when to review my portfolio and what needs attention.

## Acceptance Criteria

1. **Given** I open Settings,
   **When** I select a review frequency (monthly or quarterly),
   **Then** the review schedule is saved to Dexie
   **And** the Dashboard shows the next review date.

2. **Given** my portfolio has a drift threshold exceeded (>5%),
   **When** the alert is computed from Dexie data selectors,
   **Then** an alert card is shown on the Dashboard with amber accent-left-border, a warning icon, title ("Drift alert: Debt is 8% over target"), description, timestamp, dismiss button, and "Start Review" action.

3. **Given** there are duplicate category exposures (≥2 funds in same sector) or a fund role mismatch,
   **When** alerts are evaluated,
   **Then** corresponding alert cards are generated: "Duplicate exposure: 3 funds in Banking sector" and "Fund X (Flexi Cap) has been reclassified to Large Cap."
   **And** alert cards are dismissible by clicking the close icon.

4. **Given** there are no reviews scheduled yet,
   **When** I view the Reviews page,
   **Then** an empty state shows: "No reviews scheduled. Set a review frequency to receive reminders."

5. **Given** an alert card is displayed,
   **When** I click "Start Review",
   **Then** I am directed to the Review Checklist flow for the affected goal or portfolio.

## Tasks / Subtasks

### 1. Add `reviewSettings` table and `Alert` type to Dexie schema

- [x] Add `ReviewSetting` interface to `src/stores/db.ts`:
- [x] Add to DB version 3:
- [x] Define `Alert` type (not stored in Dexie — computed on demand from selectors):
- [x] Store alerts in React state (not Dexie) — compute from selectors on Dashboard mount, persist dismissed state in sessionStorage.

### 2. Create `src/features/settings/hooks/useReviewSettings.ts`

- [x] Hook returning:
  - `frequency: 'monthly' | 'quarterly' | null` — current setting from Dexie
  - `nextReviewDate: string | null` — computed next review date
  - `setFrequency(freq: 'monthly' | 'quarterly'): Promise<void>` — saves to Dexie, computes nextReviewDate = today + freq, updates state
  - `loading: boolean`
- [x] Compute nextReviewDate: if frequency=monthly → +30 days, if quarterly → +90 days
- [x] Use `useLiveQuery` from dexie-react-hooks for reactive reads
- [x] On setFrequency, use `db.reviewSettings.put({ id: 1, frequency, nextReviewDate, updatedAt: new Date().toISOString() })`

### 3. Create `src/features/reviews/hooks/useAlerts.ts` — alert computation engine

- [x] Pure computation, not a React hook initially — export `computeAlerts()` function
- [x] Signature: `computeAlerts(goals: Goal[], holdings: GoalHolding[], portfolios: Portfolio[], dismissedIds: string[]): Alert[]`
- [x] **Drift alert** (AC #2):
- [x] **Duplicate exposure alert** (AC #3):
- [x] **Role mismatch alert** (AC #3 placeholder):
- [x] Filter out any alerts whose id is in `dismissedIds`
- [x] Sort alerts by severity (critical first) then timestamp desc

### 4. Create `src/features/reviews/hooks/useAlertsState.ts` — React hook wrapping computeAlerts

- [x] Uses `useLiveQuery` to watch goals, goalHoldings, portfolios from Dexie
- [x] Calls `computeAlerts()` reactively
- [x] Manages dismissed set in sessionStorage key `dismissedAlertIds`
- [x] Returns:
  - `alerts: Alert[]`
  - `dismissAlert(id: string): void` — adds id to dismissed set, triggers recompute
  - `loading: boolean`

### 5. Create `src/components/AlertCard.tsx` — reusable alert card component

- [x] Props: `alert: Alert`, `onDismiss: () => void`, `onStartReview: () => void`
- [x] Visual spec from DESIGN.md:
  - Accent-left-border: amber (`#F59E0B`) for warning, red (`#DC2626`) for critical
  - Icon at top-left: AlertTriangle (lucide-react) for warning, AlertCircle for critical
  - Title in `text-body font-semibold`
  - Description in `text-body text-muted-foreground`
  - Timestamp in `text-small text-muted-foreground`
  - "Start Review" button — `Button variant="success"` (green, #2E8B57)
  - Dismiss via close icon (X) top-right — `Button variant="ghost" size="sm"`
- [x] Use shadcn `Card` as structural base:
- [x] Animation: fade out on dismiss using CSS transition (opacity 0 → 300ms)

### 6. Update `src/routes/settings/index.tsx` — add Review Frequency section

- [x] Import and use `useReviewSettings` hook
- [x] Add new `<Card>` section **above** the Data Management card:
- [x] If no frequency set, show helper text: "Choose a frequency to get started."

### 7. Update `src/routes/index.tsx` (Dashboard) — show next review date and alert cards

- [x] Import `useReviewSettings` to display nextReviewDate
- [x] Import `useAlertsState` and `AlertCard` to show active alerts
- [x] Layout:
- [x] If no alerts and review is set: show "No alerts. Your portfolio is on track."
- [x] If no review frequency set: show "Set a review frequency in Settings to get started."
- [x] "Start Review" on alert card navigates to `/reviews`

### 8. Update `src/routes/reviews/index.tsx` — show alerts with empty state

- [x] Import `useAlertsState` and `AlertCard`
- [x] If no review frequency set: show empty state "No reviews scheduled. Set a review frequency to receive reminders." with a "Go to Settings" link/button
- [x] If frequency set but no active alerts: show "No active alerts. Your portfolio is on track."
- [x] If alerts exist: render alert cards with "Start Review" action
- [x] Use `<Link>` from `@tanstack/react-router` for navigation

### 9. Verify all paths in route tree

- [x] Confirm `/reviews` route resolves correctly in `src/routes/reviews/index.tsx`
- [x] Confirm `/settings` route resolves correctly in `src/routes/settings/index.tsx`
- [x] Confirm Dashboard route at `/` in `src/routes/index.tsx`

## Dev Agent Record

### Debug Log
- All 87 tests pass (no regressions)
- TypeScript compilation clean
- No lint warnings introduced

### Completion Notes
- Added ReviewSetting interface and version 3 to Dexie schema (reviewSettings table)
- Created Alert type in src/types/review.ts
- Created useReviewSettings hook for review frequency management (monthly/quarterly)
- Created computeAlerts pure-function engine: drift, duplicate exposure, role mismatch alerts
- Created useAlertsState React hook wrapping computeAlerts with sessionStorage dismiss
- Created AlertCard component with accent-left-border, icon, dismiss, "Start Review"
- Updated Settings page with Review Schedule card section
- Updated Dashboard with next review date + alert cards
- Updated Reviews page with empty state + alerts display
- All routes verified in routeTree.gen.ts

### File List
- `src/stores/db.ts` — added ReviewSetting interface, version 3 with reviewSettings table
- `src/types/review.ts` — new file: Alert interface
- `src/features/settings/hooks/useReviewSettings.ts` — new file: review frequency hook
- `src/features/reviews/hooks/useAlerts.ts` — new file: computeAlerts pure function
- `src/features/reviews/hooks/useAlertsState.ts` — new file: alert state hook with dismiss
- `src/features/reviews/hooks/useAlerts.test.ts` — new file: unit tests for computeAlerts
- `src/components/AlertCard.tsx` — new file: reusable alert card component
- `src/routes/settings/index.tsx` — added Review Schedule card
- `src/routes/index.tsx` — added alerts + next review date to Dashboard
- `src/routes/reviews/index.tsx` — added alerts + empty state

## Review Findings

### decision-needed
- [x] [Review][Defer] Hardcoded `'en-IN'` locale for date formatting [routes/index.tsx:18, settings/index.tsx:77] — intentional for Indian-user audience, kept as-is

### patch
- [x] [Review][Patch] Reviews page "Start Review" is a no-op [reviews/index.tsx:61] — HIGH. Added toast "Review checklist coming soon".
- [x] [Review][Patch] Dismissed alerts never filtered (stale dismissedIds) [useAlertsState.ts:37] — HIGH. Changed to React state with functional updates.
- [x] [Review][Patch] reviewSettings table omitted from data export/import [useDataExport.ts] — HIGH. Added 'reviewSettings' to TABLE_NAMES.
- [x] [Review][Patch] Missing "Go to Settings" link in Dashboard empty state [routes/index.tsx:26-31] — MED. Added Link component.
- [x] [Review][Patch] new Date(alert.timestamp) throws on malformed/undefined timestamp [AlertCard.tsx:42] — MED. Added ternary guard, fallback "Date unavailable".
- [x] [Review][Patch] sort.localeCompare on potentially invalid timestamp [useAlerts.ts:81] — MED. Added nullish coalescing fallback.
- [x] [Review][Patch] dismissAlert read-write race [useAlertsState.ts:45-48] — MED. Changed to functional setState pattern.
- [x] [Review][Patch] Role mismatch title shows empty string for '' category [useAlerts.ts:67] — MED. Changed `??` to `||`.
- [x] [Review][Patch] Unhandled promise rejection from setFrequency [settings/index.tsx:58,64] — MED. Added .catch() with toast.
- [x] [Review][Patch] Dashboard ignores loading from useAlertsState [routes/index.tsx:10] — MED. Added loading state with skeleton text.
- [x] [Review][Patch] Monthly frequency adds 30 days instead of 1 month [useReviewSettings.ts:17] — MED. Changed to setMonth+1 / +3.
- [x] [Review][Patch] Drift alert says "over target" even when under-allocated [useAlerts.ts:27] — MED. Added sign-aware direction: "over"/"under".
- [x] [Review][Patch] No loading state for frequency/nextReviewDate in settings [settings/index.tsx] — LOW. Added disabled state while loading.
- [x] [Review][Patch] Nil-safety on amfiCategory in drift title [useAlerts.ts:27] — LOW. Added `?? 'Unknown'` fallback.

### defer
- [x] [Review][Defer] Duplicated AlertCard rendering logic across Dashboard and Reviews [routes/] — pre-existing pattern, DRY improvement only
- [x] [Review][Defer] Duplicate exposure groups holdings across all goals not per goal [useAlerts.ts:37-41] — may be intentional cross-goal concentration monitoring
- [x] [Review][Defer] Role mismatch alert is a placeholder stub [useAlerts.ts:59-74] — known gap noted in subtask 3

## Dev Notes

### Relevant Architecture

- **Persistence:** Dexie.js (IndexedDB). Alerts are NOT stored in DB — computed on-demand from selectors. Only review frequency + nextReviewDate persist. [Source: architecture.md#Data-Architecture]
- **Dashboard aggregation:** Dashboard reads from Dexie for user data and TanStack Query for external data. [Source: architecture.md#Frontend-Architecture]
- **Computed alerts from data selectors:** No notification system — alerts are derived state from existing Dexie data. [Source: architecture.md#Decision-Impact-Analysis]
- **Brand colors:** Navy primary (#1B3A5C), green accent (#2E8B57), amber warning (#F59E0B), red critical (#DC2626). [Source: DESIGN.md#Colors]
- **Alert card spec:** Accent-left-border, icon, title, description, timestamp, dismiss + "Start Review". [Source: DESIGN.md#Components]
- **Dashboard IA:** Shows goal progress, portfolio value, drift warnings, next review date, active alerts. [Source: EXPERIENCE.md#Information-Architecture]

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/AlertCard.tsx` | Reusable alert card component |
| `src/features/reviews/hooks/useAlerts.ts` | Pure-function alert computation engine (`computeAlerts`) |
| `src/features/reviews/hooks/useAlertsState.ts` | React hook wrapping computeAlerts with dismissed state |
| `src/features/settings/hooks/useReviewSettings.ts` | Review frequency CRUD hook |

### Files to Modify

| File | Change |
|------|--------|
| `src/stores/db.ts` | Add `ReviewSetting` interface, add version 3 with `reviewSettings` table |
| `src/routes/settings/index.tsx` | Add Review Schedule card section |
| `src/routes/index.tsx` (Dashboard) | Show next review date + alert cards |
| `src/routes/reviews/index.tsx` | Show alerts with empty state |

### DB Schema Changes (version 3)

```ts
this.version(3).stores({
  goals: '++id, status',
  transactions: '++id, schemeCode, date, goalId',
  portfolios: '++id, schemeCode, goalId',
  journals: '++id, goalId, reviewId, createdAt',
  scorecardWeights: '++id, factor',
  riskProfiles: '++id',
  glossary: '++id, slug',
  goalHoldings: '++id, goalId',
  reviewSettings: '++id',
})
```

### Alert Computation Flow

```
Dexie tables (goalHoldings, goals, portfolios)
        │
        ▼
computeAlerts(goals, holdings, portfolios, dismissedIds)
        │
        ├── For each holding: drift% = (actual% - target%) / target% → if >5% → drift alert
        ├── Group by amfiCategory: count ≥2 → duplicate_exposure alert
        └── For each portfolio: check category mismatch → role_mismatch alert
        │
        ▼
        Filter out dismissedIds
        ▼
        Sort: critical first, then newest first
        ▼
        Return Alert[]
```

### Alert Type Definition (put in `src/types/review.ts`)

```ts
export interface Alert {
  id: string
  type: 'drift' | 'duplicate_exposure' | 'role_mismatch'
  severity: 'warning' | 'critical'
  title: string
  description: string
  timestamp: string
  dismissed: boolean
  relatedGoalId?: number
  relatedSchemeCode?: string
}
```

### Existing Patterns to Follow

- **Hook pattern:** `src/features/settings/hooks/useDataExport.ts` — uses `useLiveQuery`, returns async actions
- **Component pattern:** shadcn `Card`, `Button`, `Badge` — see `src/routes/settings/index.tsx` for Card usage
- **Toast pattern:** `useToast` from `@/components/ui/toast` with `addToast({ title, variant })`
- **Route pattern:** TanStack Router file-based routes — see `src/routes/settings/index.tsx` for export pattern
- **Navigation:** Use `useNavigate` from `@tanstack/react-router` for "Start Review" → `/reviews` navigation
- **Dismissed state:** Use `sessionStorage` keyed by alert id — similar to form draft persistence pattern [Source: architecture.md#Format-Rules]

### Testing Notes

- `computeAlerts()` is a pure function — unit test with Vitest in `src/features/reviews/hooks/useAlerts.test.ts`
  - Test drift alert triggered at >5%
  - Test no alert at <5%
  - Test duplicate exposure with ≥2 funds in same category
  - Test dismissed alerts filtered out
  - Test empty holdings returns no alerts
  - Test role mismatch alert when category data missing

### References

- [Source: epics.md#Story-5.1] — Full ACs
- [Source: architecture.md#Data-Architecture] — Dexie schema, alert = computed from selectors
- [Source: architecture.md#Frontend-Architecture] — Dashboard aggregates from all features
- [Source: DESIGN.md#Components] — Alert card visual spec
- [Source: EXPERIENCE.md#Information-Architecture] — Dashboard IA, review surface IA
- [Source: EXPERIENCE.md#State-Patterns] — Empty states for no review, alert card patterns
- [Source: EXPERIENCE.md#Flow-2] — Review flow with event-based alerts
- [Source: stores/db.ts] — Existing Dexie schema
- [Source: routes/index.tsx] — Current Dashboard placeholder
- [Source: routes/settings/index.tsx] — Current Settings page
- [Source: routes/reviews/index.tsx] — Current Reviews placeholder
