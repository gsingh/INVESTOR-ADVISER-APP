---
---

# Story 2.3: Goal Detail — Allocation & Drift Tracking

Status: done
baseline_commit: NO_VCS

## Story

As Boss,
I want to see each goal's current allocation versus target, with drift indicators,
So that I know whether my portfolio is on track or needs rebalancing.

## Acceptance Criteria

1. **Given** I open a Goal Detail page,
   **When** the allocation section loads,
   **Then** it shows the target amount vs current amount, a progress bar, and a per-fund drift indicator pill.

2. **Given** a fund's allocation is tracked,
   **When** drift is computed,
   **Then** drift percentage = (current allocation % - target allocation %) / target allocation %
   **And** the drift pill displays: green "On track" (<5%), amber "Watch" (5-10%), or red "Review" (>10%).

3. **Given** the allocation breakdown is displayed,
   **When** I view assigned funds,
   **Then** each fund shows: fund name, AMFI category badge, current value, target %, actual %, and drift pill
   **And** financial terms include `<TermInfo>` tooltips.

4. **Given** the goal has no allocated funds yet,
   **When** I view the allocation section,
   **Then** an empty state shows: "No funds allocated to this goal yet. Browse the fund universe to find suitable funds."

## Tasks

### 0. Prerequisites
- [x] [Task 0] Verify Dexie `db.goals` schema supports a `holdings` or `allocatedFunds` field. If not, add a new `goalHoldings` table with fields: `id`, `goalId`, `fundName`, `amfiCategory`, `currentValue`, `targetAllocation`, `createdAt`, `updatedAt`.
- [x] [Task 0] Verify existing `$goalId.tsx` layout — understand where AllocationDrift section fits relative to SIPCalculator and CategoryAllocator.

### 1. Database Layer — Goal Holdings Schema (`src/stores/db.ts`)
- [x] [Task 1] If not present, define and export `GoalHolding` interface — a Dexie mapped type with `id` (auto-increment), `goalId` (number, indexed), `fundName` (string), `amfiCategory` (string), `currentValue` (number), `targetAllocation` (number, 0-1), `createdAt` (string), `updatedAt` (string).
- [x] [Task 1] Add `goalHoldings` table to `InvestorAdviserDB` class with schema `++id, goalId`.
- [x] [Task 1] Ensure TypeScript compiles clean after table addition (Dexie schema version bump version 1 → version 2).
- [ ] [Task 1] Optionally seed 2 sample holdings per goal for dev/demo purposes.

### 2. Drift Calculation — Pure Function (`src/lib/drift-calculator.ts`)
- [x] [Task 2] Create `src/lib/drift-calculator.ts` with a pure function `computeDrift(currentAllocationPct: number, targetAllocationPct: number): DriftResult`.
- [x] [Task 2] `DriftResult` interface: `{ pctChange: number, status: 'on_track' | 'watch' | 'review', label: string }`.
- [x] [Task 2] Formula: `pctChange = (currentAllocationPct - targetAllocationPct) / targetAllocationPct`. Guard against `targetAllocationPct === 0` (return `{ pctChange: 0, status: 'review', label: 'Review' }`).
- [x] [Task 2] Thresholds: `|pctChange| < 0.05` → `on_track` / "On track", `0.05 <= |pctChange| <= 0.10` → `watch` / "Watch", `|pctChange| > 0.10` → `review` / "Review".

### 3. Drift Calculator Tests (`src/lib/drift-calculator.test.ts`)
- [x] [Task 3] Create Vitest test file with at least 7 tests: exact match (0% drift), 5% drift, boundary at 10%, over 10%, negative over 10%, zero target, slight negative under 5%.
- [x] [Task 3] Run `npx vitest run` — all 7 tests pass.

### 4. useDriftTracking Hook (`src/features/goals/hooks/useDriftTracking.ts`)
- [x] [Task 4] Create hook `useDriftTracking(goalId: number)`.
- [x] [Task 4] Uses `useLiveQuery` to fetch `goalHoldings` for the given goalId.
- [x] [Task 4] Computes per-fund drift using `computeDrift`. `actualPct = fund.currentValue / totalGoalValue`, `targetPct = fund.targetAllocation`.
- [x] [Task 4] Returns `{ holdings: GoalHoldingWithDrift[], totalValue: number, loading, error }`.
- [x] [Task 4] `GoalHoldingWithDrift` extends the Dexie type with computed `actualPct`, `targetPct`, and `drift: DriftResult`.
- [x] [Task 4] Handle loading state: `goal === undefined || holdings === undefined` (use `.then(r => r ?? null)` pattern from Story 2.2 CR fix).
- [x] [Task 4] Handle empty: `holdings.length === 0`.
- [x] [Task 4] Handle error: if goal not found.

### 5. DriftPill Component (`src/features/goals/components/DriftPill.tsx`)
- [x] [Task 5] Small UI component accepting `drift: DriftResult` and an optional `size?: 'sm' | 'md'` prop.
- [x] [Task 5] Renders a `<Badge>` with:
  - `on_track` → green background (`bg-green-500`), text "On track"
  - `watch` → amber background (`bg-amber-500`), text "Watch"
  - `review` → red background (`bg-red-500`), text "Review"
- [x] [Task 5] Size `sm` for inline use, `md` for standalone display.

### 6. AllocationDrift Section (`src/features/goals/components/AllocationDrift.tsx`)
- [x] [Task 6] Main section component accepting `goalId: number`.
- [x] [Task 6] **States:**
  - **Loading:** Skeleton rows (2) inside a container.
  - **Empty:** Text "No holdings recorded yet. Add investments to track allocation drift."
  - **Error:** Error message in text.
  - **Data:** List of holdings with fund name, actual %, target %, drift pill.
- [x] [Task 6] Shows actual/target percentages formatted via `formatPercentage`.

### 7. Wire into Goal Detail Page (`src/routes/goals/$goalId.tsx`)
- [x] [Task 7] Import and render `<AllocationDrift goalId={Number(goalId)} />` in the Goal Detail page.
- [x] [Task 7] Place it after `<SIPCalculator>` and `<CategoryAllocator>` in the CardContent.

### 8. Barrel Export and Sprint Status
- [x] [Task 8] Add `AllocationDrift` and `useDriftTracking` to `src/features/goals/index.ts`.
- [x] [Task 8] Update `sprint-status.yaml`: set `2-3-goal-detail-allocation-drift-tracking` to `done`.

## Dev Notes

### Relevant Architecture Patterns & Constraints
- Follow shadcn/ui component patterns: Card, CardHeader, CardTitle, CardContent, Badge, Button, Skeleton
- Use lucide-react icons: `Target`, `AlertTriangle`, `TrendingUp`
- All monetary values formatted via `formatINR` from `@/lib/formatters`
- All date formatting via `formatDate`
- Path alias `@/` maps to `src/`
- Components use named exports, not default exports (except route pages)

### Existing Patterns to Follow
- useLiveQuery with `.then(r => r ?? null)` pattern to distinguish loading from not-found
- Tailwind v4 for styling
- Consistent loading/error/empty state handling pattern
- Use `as const` for hook return types

### Source Tree Components to Touch
- **NEW** `src/stores/db.ts` — add `goalHoldings` table
- **NEW** `src/lib/drift-calculator.ts` — pure function for drift computation
- **NEW** `src/lib/drift-calculator.test.ts` — Vitest tests
- **NEW** `src/features/goals/hooks/useDriftTracking.ts` — hook to fetch holdings and compute drift
- **NEW** `src/features/goals/components/DriftPill.tsx` — badge component
- **NEW** `src/features/goals/components/AllocationDrift.tsx` — main section
- **MODIFIED** `src/routes/goals/$goalId.tsx` — wire AllocationDrift
- **MODIFIED** `src/features/goals/index.ts` — barrel exports
- **MODIFIED** `_bmad-output/implementation-artifacts/sprint-status.yaml` — status update

### Testing Notes
- Drift calculator is a pure function → straightforward Vitest tests
- Goal holdings table may require schema version bump in Dexie
- Use `formatINR` for monetary display in all holdings rows
- TermInfo needs `categoryTermSlugs` entries for all AMFI categories (already complete from Story 2.2 CR)

### Previous Story Learnings
- SIP calculator from Story 2.2 underwent 18 code review fixes
- Key patterns established: `resolveCategory()` for super→sub mapping, DB reads inside useCallback to avoid stale closures
- All 17 tests pass, TypeScript compiles clean
- `categoryTermSlugs` now has all ~30 sub-categories mapped

### Review Findings

- [x] [Review][Patch] Missing AMFI category badge per fund [AllocationDrift.tsx] — AC3 requires per-fund AMFI category display
- [x] [Review][Patch] Missing current value per fund [AllocationDrift.tsx] — AC3 requires per-fund current value (formatINR)
- [x] [Review][Patch] Missing TermInfo tooltips on financial terms [AllocationDrift.tsx] — AC3 requires TermInfo on financial terms
- [x] [Review][Patch] Empty state message contradicts spec [AllocationDrift.tsx] — AC4 exact text not used
- [x] [Review][Patch] Unsafe colorClasses lookup [DriftPill.tsx:14] — Record<string,string> should be Record<DriftStatus,string> with fallback
- [x] [Review][Patch] Route param goalId not validated [$goalId.tsx:37] — Number(goalId) can yield NaN for invalid URLs
- [x] [Review][Patch] computeDrift(0,0) returns "review" [drift-calculator.ts:10] — both zero should be on_track
- [x] [Review][Patch] NaN/Infinity inputs to computeDrift [drift-calculator.ts:13] — missing isFinite guard
- [x] [Review][Patch] Missing symmetric drift boundary tests [drift-calculator.test.ts] — no -5% or -10% boundary tests
- [x] [Review][Defer] Progress bar clamps at 100% [$goalId.tsx:76] — deferred, pre-existing from story 2.1
- [x] [Review][Defer] handleClose no catch [$goalId.tsx:72-82] — deferred, pre-existing from story 2.1
- [x] [Review][Defer] useLiveQuery indefinite loading on failure [useDriftTracking.ts:19-26] — deferred, pre-existing app-wide pattern

## Dev Agent Record

### Agent Model Used

### Completion Notes

### File List
