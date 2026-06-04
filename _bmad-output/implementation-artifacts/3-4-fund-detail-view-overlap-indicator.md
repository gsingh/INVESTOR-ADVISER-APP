# Story 3.4: Fund Detail View & Overlap Indicator

Status: done

## Story

As Boss,
I want to see a fund's full details — NAV history, holdings, sector allocation, benchmark comparison — and how it overlaps with my existing portfolio,
So that I can make an informed decision before allocating.

## Acceptance Criteria

1. **Given** I click a fund from the Scorecard,
   **When** the Fund Detail page loads at `/scorecard/$schemeCode`,
   **Then** it shows: NAV history (Recharts line chart), expense ratio, AUM, exit load summary cards, portfolio holdings table, sector allocation bar chart, and rolling returns vs benchmark comparison chart
   **And** every financial figure has a `<TermInfo>` tooltip.

2. **Given** the Overlap Indicator loads,
   **When** I view it,
   **Then** it shows a single progress bar with two segments: green for % new sector exposure and gray for % overlap with existing holdings
   **And** a percentage label in the center with an explanation below.

3. **Given** I have no holdings yet,
   **When** the Overlap Indicator tries to compute,
   **Then** it shows: "No existing holdings to compare against. Add holdings to see overlap analysis."

4. **Given** fund overlap data is incomplete,
   **When** the indicator cannot compute,
   **Then** it shows: "Overlap data unavailable for this fund."

5. **Given** data is loading,
   **When** the API call is in progress,
   **Then** skeleton cards are shown for each section (NAV chart, info cards, holdings, sector allocation).

6. **Given** the API call fails,
   **When** data cannot be fetched,
   **Then** a toast displays: "Couldn't fetch fund details. The data source may be temporarily unavailable."
   **And** a retry button is shown.

## Tasks / Subtasks

### 1. Create TanStack Query hooks for fund detail data
- [ ] Create `src/stores/queries/useNav.ts` — fetch NAV history via `/api/mfapi/nav/{schemeCode}`, return `{ date: string; nav: number }[]` sorted by date ascending (AC: #1)
- [ ] Create `src/stores/queries/useScheme.ts` — fetch scheme details via `/api/mfdata/scheme/{schemeCode}`, return normalized scheme data including: expenseRatio, aum, exitLoad, benchmark, portfolioHoldings (name, amount, percentage), sectorAllocation (sector, percentage), rollingReturns (period, fund, benchmark) (AC: #1)
- [ ] Add Zod schemas to `src/types/api.ts` for: NAV entry, scheme detail response, portfolio holding, sector allocation, rolling return (AC: #1)

### 2. Create Overlap Indicator component
- [ ] Create `src/features/scorecard/components/OverlapIndicator.tsx` — single progress bar with two segments: green (new exposure) and gray (overlap with existing holdings), percentage label in center, context explanation line below (AC: #2, UX-DR7)
- [ ] Handle empty portfolio state: "No existing holdings to compare against. Add holdings to see overlap analysis." (AC: #3)
- [ ] Handle incomplete data state: "Overlap data unavailable for this fund." (AC: #4)
- [ ] Compute overlap in a pure function in `src/lib/overlap.ts`: `computeOverlap(fundSectors, portfolioSectors)` returning `{ newExposurePct, overlapPct, explanations: string[] }` — no React/DOM imports (AC: #2, #3, #4)

### 3. Create Fund Detail page
- [ ] Create `src/features/scorecard/components/FundDetail.tsx` — main layout component (AC: #1–#6)
  - [ ] NAV history chart (Recharts `LineChart`) — date on X axis, NAV on Y axis, proper tooltip with formatted dates and ₹ values
  - [ ] Summary cards row: expense ratio, AUM, exit load, risk label — each in a `<Card>` with `<TermInfo>` tooltips
  - [ ] Portfolio holdings table — name, amount, % of portfolio, alternating row backgrounds
  - [ ] Sector allocation horizontal bar chart (Recharts `BarChart` with horizontal layout, or custom div bars) — sector name, percentage bar
  - [ ] Rolling returns vs benchmark comparison chart (Recharts `LineChart`) — overlay fund line and benchmark line, period on X, return % on Y
- [ ] Add skeleton loading states (6-8 skeleton cards/charts matching layout) while data fetches (AC: #5)
- [ ] Add error state with toast and retry button (AC: #6)
- [ ] Wire up `<TermInfo>` tooltips for: NAV, AUM, expense ratio, exit load, benchmark, sector allocation, rolling returns, overlap

### 4. Update route placeholder
- [ ] Update `src/routes/scorecard/$schemeCode.tsx` — replace placeholder with `FundDetail` component, read `schemeCode` param via `useParams` and pass to data hooks (AC: #1)

### 5. Verify compilation and tests
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npx vitest run` — all tests pass (55 existing + new tests for overlap.ts)
- [ ] Verify Recharts renders without SSR issues (use client-side only rendering pattern)

## Dev Notes

### Architecture & Patterns
- Route at `src/routes/scorecard/$schemeCode.tsx` maps to FR-8 detail: `[Source: architecture.md:274]`
- Feature module at `src/features/scorecard/` exists — add new components here: `[Source: architecture.md:305-307]`
- TanStack Query keys convention: `['nav', schemeCode]`, `['scheme', schemeCode]`: `[Source: architecture.md:203]`
- External data flows: nginx proxy → TanStack Query → Zod normalize → UI: `[Source: architecture.md:157-158]`
- No cross-feature imports — overlap computation shared via `src/lib/`: `[Source: architecture.md:350-351]`
- Charts use Recharts (already installed): `[Source: architecture.md:171]`
- Use existing patterns from `src/features/screener` and `src/features/scorecard` (ScoredFundTable, FactorBreakdown) for consistent styling

### Overlap Computation
- `src/lib/overlap.ts` is a pure function: `computeOverlap(fundSectors, portfolioSectors)` — takes fund sector allocations and portfolio sector allocations (aggregated from Dexie `portfolios` table and scheme sector data), returns overlap metrics
- Fund sector data: from `/api/mfdata/scheme/{schemeCode}` response (sectorAllocation array of `{ sector: string; percentage: number }`)
- Portfolio sector data: aggregate sector allocations across all funds in the `portfolios` Dexie table. Each fund's sector allocation is fetched from the API (cached via TanStack Query)
- Edge case: no portfolio holdings → empty state message
- Edge case: fund has no sector data → "data unavailable" message

### API Data Patterns
- NAV history: mfapi.in returns `{ data: [{ date: string; nav: string }] }` — Zod schema normalizes dates and coerces NAV to number
- Scheme details: mfdata.in returns scheme info + holdings + sector allocation + rolling returns — Zod schema at API boundary
- All financial terms have `<TermInfo tooltip>` — use existing slugs (`nav`, `aum`, `expense-ratio`, `exit-load`, `benchmark`, `rolling-returns`)
- Add new glossary slug: `sector-allocation`, `overlap` if not already seeded

### Testing
- `src/lib/overlap.test.ts`: test `computeOverlap` with known sector data, empty portfolio, missing fund data, single-sector overlap, multi-sector overlap
- Follow existing Vitest patterns from `src/lib/scorecard.test.ts`

### Source Tree Components to Touch
| File | Action |
|---|---|
| `src/routes/scorecard/$schemeCode.tsx` | UPDATE — replace placeholder with FundDetail |
| `src/features/scorecard/components/FundDetail.tsx` | NEW — main fund detail layout |
| `src/features/scorecard/components/OverlapIndicator.tsx` | NEW — overlap progress bar |
| `src/stores/queries/useNav.ts` | NEW — NAV history TanStack Query hook |
| `src/stores/queries/useScheme.ts` | NEW — scheme detail TanStack Query hook |
| `src/lib/overlap.ts` | NEW — pure function for overlap computation |
| `src/lib/overlap.test.ts` | NEW — Vitest tests for overlap function |
| `src/types/api.ts` | UPDATE — add Zod schemas for NAV, scheme detail, holdings, sector allocation, rolling returns |
| Globbing: search for existing `usePortfolio` in `src/features/portfolio/hooks/` — may need to create or use Dexie query directly for reading portfolio holdings |

### Order of Implementation
1. Add Zod schemas to `src/types/api.ts` (NAV entry, scheme detail, holdings, sector allocation, rolling returns)
2. Create `src/stores/queries/useNav.ts` — fetch NAV history
3. Create `src/stores/queries/useScheme.ts` — fetch scheme details
4. Create `src/lib/overlap.ts` — pure function for overlap computation
5. Create `src/lib/overlap.test.ts` — Vitest tests
6. Create `src/features/scorecard/components/OverlapIndicator.tsx` — overlap progress bar
7. Create `src/features/scorecard/components/FundDetail.tsx` — main layout with charts
8. Update `src/routes/scorecard/$schemeCode.tsx` — wire component with route params
9. Verify: `npx tsc --noEmit` then `npx vitest run`

### References
- [Source: epics.md:425-449] — Full Story 3.4 acceptance criteria
- [Source: architecture.md:274] — Route at `/scorecard/$schemeCode` maps to FR-8 detail
- [Source: architecture.md:305-307] — Feature module structure adds components to `features/scorecard/`
- [Source: architecture.md:350-351] — No cross-feature imports; overlap shared via `src/lib/`
- [Source: architecture.md:203] — TanStack Query key conventions
- [Source: architecture.md:157-158] — API data normalization with Zod
- [Source: DESIGN.md:199] — Overlap indicator UX: single progress bar, two segments, context line
- [Source: EXPERIENCE.md:88] — Overlap indicator component spec
- [Source: EXPERIENCE.md:42] — Fund Detail surface description
- [Source: review-ux-rubric.md:139] — Overlap requires sector allocation data from API
- [Source: EXPERIENCE.md:112] — Empty state for no overlap data
- [Source: stores/db.ts:29-37] — Portfolio Dexie table schema (schemeCode, schemeName, category, units, targetAllocation)
- [Source: src/types/api.ts] — Existing Zod schemas for MFFund, mfapiResponseSchema

## Dev Agent Record

### Agent Model Used
Big Pickle

### Completion Notes List

### File List

### Review Findings

#### Patch (21 — all applied)

- [x] [Review][Patch] Overlap computation always passes empty portfolio sectors [FundDetail.tsx:195]
- [x] [Review][Patch] No AbortSignal on TanStack Query fetch calls [useNav.ts:11, useScheme.ts:11]
- [x] [Review][Patch] Invalid dates in NAV sort produce NaN comparator [api.ts:68]
- [x] [Review][Patch] `dataUnavailable` heuristic false-positives on zero-percentage sectors [OverlapIndicator.tsx:28]
- [x] [Review][Patch] NAV decimation filter may skip last data point [FundDetail.tsx:63]
- [x] [Review][Patch] `computeOverlap` silently produces NaN when sector percentages are NaN [overlap.ts:39-62]
- [x] [Review][Patch] `computeOverlap` handles negative percentages incorrectly [overlap.ts:43]
- [x] [Review][Patch] String-magic `noHoldings` detection breaks if message text changes [OverlapIndicator.tsx:27]
- [x] [Review][Patch] Either query error hides the other query's successful data [FundDetail.tsx:179]
- [x] [Review][Patch] Duplicate holding names cause React key collisions [FundDetail.tsx:106]
- [x] [Review][Patch] `formatCurrency` renders `₹NaN Cr` for non-finite AUM [FundDetail.tsx:35]
- [x] [Review][Patch] Empty `schemeCode` param makes wasteful API calls [route.tsx:5]
- [x] [Review][Patch] Exit load non-object from API fails schema parse [api.ts:156]
- [x] [Review][Patch] Rolling returns uses BarChart instead of LineChart (spec AC#1) [FundDetail.tsx:156]
- [x] [Review][Patch] No toast displayed on API error (spec AC#6) [FundDetail.tsx:176]
- [x] [Review][Patch] Incomplete skeleton loading states (spec AC#5) [FundDetail.tsx:213]
- [x] [Review][Patch] Wrong TermInfo slug `nav` for Sector Allocation heading (should be `sector-allocation`) [FundDetail.tsx:266]
- [x] [Review][Patch] Wrong TermInfo slug `nav` for Portfolio Holdings heading (should be `portfolio-holdings`) [FundDetail.tsx:285]
- [x] [Review][Patch] Wrong TermInfo slug `nav` for Risk info card (should be `risk`) [FundDetail.tsx:253]
- [x] [Review][Patch] Missing TermInfo tooltip on OverlapIndicator [OverlapIndicator.tsx]
- [x] [Review][Patch] Missing TermInfo tooltip for benchmark comparison [FundDetail.tsx]

#### Dismiss (1)

- [x] [Review][Dismiss] `useLiveQuery` empty deps array — correct usage; third arg is default value `[]`, not deps. Dexie handles reactivity internally.
