# Deferred Work

## Deferred from: code review of Story 1.3 (2026-06-03)

- Cross-tab duplicate entries on concurrent seed — requires `&slug` unique index + Dexie schema version bump (`db.ts:94`). Pre-existing schema design, not introduced by this change.
- Seed data eagerly bundled into AppShell chunk — dynamic import optimization (`seed-glossary.ts:2`). Not critical for correctness.
- No error boundary around Dexie-dependent component — should be handled at AppShell/route level (`TermInfo.tsx`). General concern, not component-specific.

## Deferred from: code review of Story 1.4 (2026-06-03)

- No error state when `useLiveQuery` fails — `undefined` conflates loading/empty/error (`useProfile.ts:37,56`). Requires ErrorBoundary pattern or different query API.
- Missing ErrorBoundary in profiling route — `useLiveQuery` exceptions would unmount the React tree. Pre-existing app-wide gap.
- Redirect on every pathname change — `AppShell.tsx:42` calls `db.riskProfiles.count()` on every route change. Minor perf issue.

## Deferred from: code review of Story 2.2 (2026-06-03)

- Division by zero if `r = 0` in `fvFactor` — `src/lib/sip-calculator.ts:47`. Currently hardcoded non-zero only, latent bug if rates become parameterized.
- Risk profile `.last()` has no user/identity filter — `src/features/goals/hooks/useCategoryMapping.ts:80`. Single-user local DB, acceptable now.
- Non-numeric `goalId` produces NaN queries — `src/features/goals/components/SIPCalculator.tsx:29`. Route-level validation concern, not specific to these components.

## Deferred from: code review of Story 2.3 (2026-06-03)

- Progress bar clamps at 100% — `src/routes/goals/$goalId.tsx:76`. Pre-existing from story 2.1, Math.min(progress, 1) hides over-funding.
- handleClose no catch — `src/routes/goals/$goalId.tsx:72-82`. Pre-existing from story 2.1, unhandled rejection propagates silently.
- useLiveQuery indefinite loading on failure — `src/features/goals/hooks/useDriftTracking.ts:19-26`. Pre-existing app-wide pattern where Dexie query failures cause permanent loading state.

## Deferred from: code review of Story 2.1 (2026-06-04)

- closeGoal not idempotent on already-closed goals — `src/features/goals/hooks/useGoals.ts:50-55`. Pre-existing: UI only shows close action for active goals.

## Deferred from: code review of 3-1-category-browser-fund-filtering (2026-06-04)

- Math.random ID collision risk in toast IDs — extremely low probability in single-user app (`toast.tsx:5`).
- No AbortController in TanStack Query fetch — pre-existing pattern across codebase, TanStack Query handles its own cancellation (`useFunds.ts`).

## Deferred from: code review of 3-2-custom-scoring-engine-pure-function (2026-06-04)

- Four placeholder scoring factors inflate composite score ~21pts — by design, addressed when NAV/portfolio data available (`scorecard.ts`).
- clamp() dead code — unused utility, harmless (`scorecard.ts:11`).
- Loose "tri" substring match in benchmark suitability — minor heuristic, works for >95% real benchmarks (`scorecard.ts:85`).
- Contradictory exitLoad (exists:false + durationYears) — external data edge case (`scorecard.ts:103-117`).
- Future launch date produces misleading explanation — external data edge case (`scorecard.ts:40-57`).
- Rounding errors in normalizeWeights can sum to 99.99/100.01 — negligible at <0.01% (`scorecard.ts:150-167`).
- No type-level sync between ScorecardWeights interface and ALL_FACTORS array — pre-existing pattern (`scorecard.ts:20-31,124-135`).
- Double-rounding in weightedContribution accumulation — negligible precision at 0.01 scale (`scorecard.ts:194`).
- String type for numeric fields causing TypeError — mitigated by Zod normalization at API boundary (`scorecard.ts:26,61`).
- NaN exitLoad duration treated as max penalty — rare edge case (`scorecard.ts:110-117`).
- Default weights merge before normalization (user partial weights) — intentional design choice (`scorecard.ts:173`).
- weights parameter declared optional vs spec's required — deliberate, tests cover both paths (`scorecard.ts:169`).
- Whitespace-only benchmark produces non-zero score — extremely unlikely, trimmed at API boundary (`scorecard.ts:81`).

## Deferred from: code review of 4-1-xirr-engine-pure-function (2026-06-04)

- Date parsing locale-dependent for non-ISO strings — documented contract requires ISO 8601 (`src/lib/xirr.ts:11-13,44`)
- Absolute Newton tolerance for tiny rates — theoretical concern, not relevant for 5-20% mutual fund returns (`src/lib/xirr.ts:53`)
- Date objects created twice per transaction — performance micro-optimization, not worth complexity (`src/lib/xirr.ts:14,41`)

## Deferred from: code review of 4-2-transaction-logging (2026-06-04)

- No future-date validation on transaction date — `validateDate()` only checks `!date`. Future dates pass. `max` HTML attribute provides browser guard. Not in ACs. (`AddTransactionForm.tsx:178`)

## Deferred from: code review of 5-2-review-checklist-flow (2026-06-04)

- Hardcoded BENCHMARK_RATES going stale — Static rates in code; requires API or config source for dynamic updates. MVP limitation. (`useReviewSteps.ts`)
- 6 useLiveQuery calls across useReviewSteps + useAlertsState — Performance optimization; each fires on every write to observed tables. (`useReviewSteps.ts`, `useAlertsState.ts`)
- sessionStorage dismissed alerts cleared on tab close — Intentional design: alerts reappear per session for a single-user SPA. (`useAlertsState.ts`)
- AC #4: "drift indicators reset" — no explicit drift state to reset in current architecture

## Deferred from: code review of 5-3-investment-journal (2026-06-04)

- Stale select options after external data change — If a goal or review is deleted while JournalEditor is open, the selected value no longer exists in the dropdown. Unlikely in single-user MVP. (`JournalEditor.tsx:111-128`)
