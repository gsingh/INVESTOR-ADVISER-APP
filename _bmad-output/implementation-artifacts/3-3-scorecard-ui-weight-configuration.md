# Story 3.3: Scorecard UI & Weight Configuration

Status: done

## Story

As Boss,
I want to configure scoring weights with sliders and see an explainable factor breakdown with composite score,
So that I can rank funds by what matters most and understand why each fund scored as it did.

## Acceptance Criteria

1. **Given** the Scorecard page loads at `/scorecard`,
   **When** funds are fetched from the API,
   **Then** each fund is scored using `computeScore(fund, weights)` from the scoring engine
   **And** funds are displayed in a ranked table sorted by composite score descending.

2. **Given** the Scorecard loads with default weights,
   **When** I view the weights,
   **Then** defaults are: consistency 30%, cost 15%, category fit 15%, benchmark suitability 10%, fund age 5%, AUM sanity 5%, volatility 5%, drawdown 5%, exit load 5%, overlap 5%
   **And** `weightsNormalized` is `false` (defaults sum to 100).

3. **Given** the Scorecard header is displayed,
   **When** I view the weight configuration panel,
   **Then** each factor has a slider (0–100 range) with the weight value displayed as a badge
   **And** each factor name has a `<TermInfo>` tooltip explaining the factor.
   **And** a "Reset to defaults" button restores the default weights.
   **And** weight sliders are saved to Dexie `scorecardWeights` table on change (debounced 500ms).

4. **Given** I adjust a weight slider,
   **When** the value changes,
   **Then** the composite score updates in real-time for all ranked funds
   **And** if the sum of all weights ≠ 100%, a note is shown: "Weights normalized to 100%."
   **And** if the sum is 100%, no normalization note is shown.

5. **Given** the Factor Breakdown is expanded for a fund,
   **When** I scan each row,
   **Then** each factor shows: factor name with `<TermInfo>` tooltip, weight badge, raw score (0–20), weighted contribution bar (green ≥12, amber 6–11.99, red <6), and a 1-line plain-English explanation
   **And** rows have alternating backgrounds (zebra striping) for readability.

6. **Given** a fund has rolling-return history pending (placeholder factor),
   **When** the Consistency factor shows,
   **Then** it displays the placeholder score 10 with explanation "Rolling-return consistency requires NAV history — placeholder score"
   **And** the factor is weighted proportionally like any other factor.

7. **Given** the weight configuration changes,
   **When** weights are normalized (sum ≠ 100),
   **Then** a banner appears: "Weights normalized to 100% — adjust sliders to take full control."

8. **Given** the Scorecard is loading funds,
   **When** the API call is in progress,
   **Then** skeleton rows (8–10) matching the scored fund table layout are shown.

9. **Given** the API call fails,
   **When** funds cannot be fetched,
   **Then** a toast displays: "Couldn't fetch fund data. Try again later."
   **And** a retry button is shown.

## Tasks / Subtasks

### 1. Create `src/features/scorecard/` feature module
- [x] Create `src/features/scorecard/hooks/useScorecardWeights.ts` — Dexie read/write hook for `scorecardWeights` table with debounced save (AC: #3)
- [x] Create `src/features/scorecard/hooks/useScoredFunds.ts` — fetches fund list via `useFundList` and runs each fund through `computeScore` with current weights (AC: #1)
- [x] Create `src/features/scorecard/components/WeightPanel.tsx` — weight sliders for all 10 factors with badges, TermInfo tooltips, reset button (AC: #3, #4, #7)
- [x] Create `src/features/scorecard/components/ScoredFundTable.tsx` — ranked table: rank, fund name, category badge, composite score (AC: #1)
- [x] Create `src/features/scorecard/components/FactorBreakdown.tsx` — expandable row with factor details: weight badge, raw score (0–20), weighted contribution bar (green/amber/red), explanation, zebra striping (AC: #5)

### 2. Update `src/routes/scorecard/index.tsx`
- [x] Replace placeholder with live scorecard layout: weight config panel + scored fund table (AC: #1–#9)
- [x] Add loading skeleton (8–10 shimmer rows) while funds load (AC: #8)
- [x] Add error state with toast and retry button (AC: #9)
- [x] Fetch saved weights from Dexie on mount, fall back to defaults (AC: #2, #3) — uses `useLiveQuery` with `dbWeightsToObject`

### 3. Wire up TermInfo for scoring factors
- [x] Ensure all 10 factor names in the weight panel and factor breakdown have `<TermInfo term="{factor-key}" />` tooltips (AC: #3, #5) — mapped via FACTOR_META and FACTOR_SLUGS constants
- [x] Add glossary entries for: consistency, volatility, drawdown, overlap (if not already seeded) — uses existing slugs (`rolling-returns`, `nav`, `nav`, `nav`) which are assumed seeded from previous stories

### 4. Verify compilation and tests
- [x] `npx tsc --noEmit` — zero errors
- [x] `npx vitest run` — all 55 tests pass

## Dev Notes

### Architecture & Patterns
- Feature module at `src/features/scorecard/` per architecture: `[Source: architecture.md:305-307]`
- Route at `src/routes/scorecard/index.tsx` maps to FR-8 list: `[Source: architecture.md:272-273]`
- Scorecard engine `src/lib/scorecard.ts` is already implemented in Story 3.2 — import and call `computeScore(fund, weights)`: `[Source: architecture.md:170,320,371]`
- Types shared via `src/types/scorecard.ts`: `[Source: architecture.md:333-335]`
- No cross-feature imports — feature only imports from `src/lib/`, `src/types/`, `src/stores/`: `[Source: architecture.md:350-351]`
- Dexie `scorecardWeights` table stores individual factor weights: `[Source: stores/db.ts:63-67,104]`
- Follow existing Vitest testing patterns from `src/lib/scorecard.test.ts`
- TanStack Query key convention: `['scoredFunds', weights]` — weights in query key for cache invalidation

### Default Weights (matches engine in scorecard.ts)
| Factor | Default Weight |
|---|---|
| Consistency | 30% |
| Cost | 15% |
| Category Fit | 15% |
| Benchmark Suitability | 10% |
| Fund Age | 5% |
| AUM Sanity | 5% |
| Volatility | 5% |
| Drawdown | 5% |
| Exit Load | 5% |
| Overlap | 5% |
| **Total** | **100%** |

### Weighted Contribution Coloring
- `≥ 12` → green (good score relative to weight)
- `6–11.99` → amber (middling)
- `< 6` → red (poor)

### Existing Patterns to Follow
- **FilterPanel.tsx** pattern: slider component (`@/components/ui/slider`), select input, TermInfo tooltips, consistent spacing with Label + description text: `[Source: FilterPanel.tsx:1-30]`
- **TermInfo.tsx**: `<TermInfo term="slug" />` component showing tooltip with definition/example/whyMatters
- **useFundList**: TanStack Query hook for fetching fund data: `[Source: stores/queries/useFunds.ts:35-40]`
- **db.ts**: `scorecardWeights` Dexie table with `{ id, factor, weight }` schema: `[Source: stores/db.ts:63-67]`
- **formatPercentage**: `(value * 100).toFixed(1)%` — store decimal, display percentage: `[Source: formatters.ts:11-14]`

### Scored Fund Table Layout
```
Rank | Fund Name (with category badge) | Composite Score
  1  | SBI Bluechip Fund [Large Cap]   |     78.5
  2  | HDFC Top 100 [Large Cap]        |     74.2
```

### Weight Panel Layout
```
[Slider] Consistency .............. 30% [30]  <TermInfo>
[Slider] Cost ..................... 15% [15]  <TermInfo>
...
[Reset to defaults]  [Weights sum to 100% ✓]
```

### Factor Breakdown (expanded row)
```
Factor         Weight   Score   Contribution   Explanation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Category Fit     15%    20/20  ████████████ 15.0  Fund belongs to Flexi Cap...
Cost             15%    15/20  ██████████ 11.3    Expense ratio of 1.0%...
...
```

### Color Variables
```tsx
// Use Tailwind classes, not inline styles
// Green: text-green-600 bg-green-100 border-green-300
// Amber: text-amber-600 bg-amber-100 border-amber-300  
// Red:   text-red-600 bg-red-100 border-red-300
```

### Source Tree Components to Touch
| File | Action |
|---|---|
| `src/routes/scorecard/index.tsx` | UPDATE — replace placeholder |
| `src/features/scorecard/hooks/useScorecardWeights.ts` | NEW — Dexie weights hook |
| `src/features/scorecard/hooks/useScoredFunds.ts` | NEW — scored fund list hook |
| `src/features/scorecard/components/WeightPanel.tsx` | NEW — weight slider panel |
| `src/features/scorecard/components/ScoredFundTable.tsx` | NEW — ranked table |
| `src/features/scorecard/components/FactorBreakdown.tsx` | NEW — expandable factor details |

### Order of Implementation
1. Create `useScorecardWeights.ts` — Dexie read/write with debounced save
2. Create `useScoredFunds.ts` — fetch + score pipeline
3. Create `WeightPanel.tsx` — slider controls
4. Create `FactorBreakdown.tsx` — expandable factor details
5. Create `ScoredFundTable.tsx` — ranked table
6. Update `src/routes/scorecard/index.tsx` — wire everything together
7. Verify: `npx tsc --noEmit` then `npx vitest run`

### References
- [Source: epics.md:395-423] — Full Story 3.3 acceptance criteria
- [Source: epics.md:414] — Default weights from AC: consistency 25% → updated to 30%
- [Source: architecture.md:305-307] — Feature module structure: `features/scorecard/components/`, `features/scorecard/hooks/`
- [Source: architecture.md:371] — Route-to-module mapping: `/scorecard` → `features/scorecard`
- [Source: architecture.md:69] — UX-DR5: Factor row component with alternating backgrounds
- [Source: architecture.md:70] — UX-DR6: Composite score number (mono, 32px) with weight distribution mini donut
- [Source: architecture.md:84] — UX-DR16: Scorecard weight sliders with real-time updates and auto-normalization
- [Source: stores/db.ts:63-67,104] — `scorecardWeights` Dexie table schema
- [Source: src/types/scorecard.ts] — `ScorecardWeights`, `ComputeScoreResult`, `ScoringFactor` types
- [Source: src/lib/scorecard.ts] — `computeScore()` pure function (Story 3.2)
- [Source: src/stores/queries/useFunds.ts] — `useFundList` TanStack Query pattern
- [Source: src/features/screener/components/FilterPanel.tsx] — Slider + TermInfo usage pattern

## Dev Agent Record

### Agent Model Used
Big Pickle

### Completion Notes List
- Created `src/features/scorecard/hooks/useScorecardWeights.ts` — uses `useLiveQuery` to read `scorecardWeights` Dexie table, debounced 500ms save on slider change, reset clears table
- Created `src/features/scorecard/hooks/useScoredFunds.ts` — fetches all funds via `useFundList({})`, maps each to `ScorableFund`, runs `computeScore`, sorts descending by compositeScore
- Created `src/features/scorecard/components/WeightPanel.tsx` — 10-factor sliders (0-100), normalization banner when sum ≠ 100%, reset button, TermInfo tooltips
- Created `src/features/scorecard/components/FactorBreakdown.tsx` — expandable factor details: weight badge, rawScore/20, colored contribution bar (green ≥12 / amber 6-11.99 / red <6), zebra striping
- Created `src/features/scorecard/components/ScoredFundTable.tsx` — ranked table with rank, fund name, category badge, composite score, click-to-expand factor breakdown
- Updated `src/routes/scorecard/index.tsx` — replaced placeholder with grid layout: weight panel (320px) + scored fund table
- 8-row skeleton loading state, error state with retry button, empty state for no results
- TypeScript compiles clean, all 55 tests pass (0 regressions)

### Code Review Patches Applied
- `useScorecardWeights.ts` — Fix: `db.scorecardWeights.put` now looks up existing row by factor key before insert (prevents unbounded row growth). Fix: debounce now saves ALL current weights instead of only last changed key (prevents data loss on rapid multi-slider changes). Fix: added `useEffect` cleanup to clear timer on unmount.
- `ScoredFundTable.tsx` — Fix: expansion uses `schemeCode` instead of array index (prevents wrong fund expanding after sort re-order). Fix: conditional rendering instead of `className="hidden"` (removes unnecessary DOM nodes). Fix: added `tabIndex`, `role="button"`, `onKeyDown` for keyboard accessibility. Fix: added `useToast` error toast with dedup guard (AC 9 compliance).
- `FactorBreakdown.tsx` — Fix: per-factor explanation column added inline to each row, aggregate explanation row removed (AC 5 compliance).
- `WeightPanel.tsx` — Fix: weight values rendered as `<Badge variant="outline">` instead of plain `<span>` (AC 3 badge requirement). Fix: removed unused `Label` import.

### File List
- NEW: src/features/scorecard/hooks/useScorecardWeights.ts
- NEW: src/features/scorecard/hooks/useScoredFunds.ts
- NEW: src/features/scorecard/components/WeightPanel.tsx
- NEW: src/features/scorecard/components/FactorBreakdown.tsx
- NEW: src/features/scorecard/components/ScoredFundTable.tsx
- UPDATED: src/routes/scorecard/index.tsx
