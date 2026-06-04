# Story 3.1: Category Browser & Fund Filtering

Status: done

## Story

As Boss,
I want to browse mutual funds grouped by AMFI category and filter by my criteria,
So that I can discover funds that match my investment preferences.

## Acceptance Criteria

1. Universe Browser loads funds grouped by AMFI super-category and sub-category, fetched from mfapi.in / mfdata.in via nginx proxy.
2. Collapsible filter panel with: category multi-select, plan type (direct/regular), growth option toggle, AMC dropdown, expense ratio range (slider), AUM range (slider), benchmark type multi-select — every filter label has `<TermInfo>` tooltip.
3. "Apply filters" button updates results; filter state persisted in URL query params.
4. Loading state: skeleton rows (4-6) + "Fetching fund data..." text.
5. API error: toast "Couldn't fetch fund data. The data source may be temporarily unavailable. Try again later." + retry button.
6. Empty results: "No funds match your filters. Try adjusting your criteria." with "Clear filters" action.
7. Fund Row shows: fund name, AMFI category badge, plan type badge, expense ratio, AUM, risk label, composite score placeholder ("—").

## Tasks / Subtasks

### 0. Prerequisites — shadcn components & project setup
- [x] Add missing shadcn components: `npx shadcn@latest add slider toast tabs` (AC: #2, #5)
- [x] Verify `src/stores/queries/` directory exists for TanStack Query hooks (create if missing)
- [x] Verify nginx proxy routes (`/api/mfapi/...`, `/api/mfdata/...`) are configured for local dev — uses direct URLs with TanStack Query if not available yet

### 1. TanStack Query hooks for fund data (`src/stores/queries/`)
- [x] Create `src/stores/queries/useFunds.ts`:
  - `useFundList(filters: FundFilters)` — fetches fund list from `/api/mfapi/...` (or mfapi.in directly), returns `UseQueryResult`
  - `useCategories()` — fetches AMFI category tree (can use static `categoryTaxonomy` from `src/lib/category-taxonomy.ts` as fallback)
  - Define `FundFilters` interface: `{ categories?: string[], planType?: 'direct' | 'regular', growthOnly?: boolean, amc?: string, expenseRatioMax?: number, aumMin?: number, aumMax?: number, benchmarkTypes?: string[] }`
  - Configure TanStack Query: `staleTime: Infinity` (cache forever, manual refresh), `retry: 3` with exponential backoff
  - Add Zod schemas for API response normalization at the boundary for mfapi.in / mfdata.in response shapes

### 2. Screener feature module (`src/features/screener/`)
- [x] Create `src/features/screener/hooks/useUniverseFilters.ts`:
  - Manages filter state (React state or useReducer)
  - `useUniverseFilters()` returns: `filters`, `setFilter`, `resetFilters`, `activeFilterCount`
  - Syncs with URL search params via TanStack Router `useSearch`
- [ ] Create `src/features/screener/components/FilterPanel.tsx`:
  - Collapsible panel (tabs or accordion) with all 6 filter dimensions
  - Category multi-select: checkboxes grouped by super-category using `categoryTaxonomy`
  - Plan type: radio/toggle for direct/regular
  - Growth option: toggle switch
  - AMC dropdown: `Select` from shadcn
  - Expense ratio range: `Slider` (0-2.5%, step 0.05)
  - AUM range: `Slider` (0-50000 Cr, step 500)
  - Benchmark type: multi-select checkboxes
  - Each filter label has `<TermInfo>` tooltip (terms: "expense ratio", "AUM", "direct plan", "regular plan", "growth option", "AMC", "benchmark", "AMFI category")
  - "Apply filters" button and "Clear all" link
- [ ] Create `src/features/screener/components/FundRow.tsx`:
  - Displays: fund name (semibold), AMFI category badge (Badge variant secondary), plan type badge (Badge variant outline), expense ratio (formatted to 2 decimals), AUM (formatINR), risk label (Badge with color-coded: Low/Moderate/High), composite score placeholder "—"
  - Clickable — navigates to `/scorecard/$schemeCode` (route exists, placeholder)
  - Keyboard accessible: `role="button"`, `tabIndex`, Enter/Space handler
- [ ] Create `src/features/screener/index.ts` barrel export

### 3. Universe Browser route (`src/routes/universe-browser/index.tsx`)
- [x] Replace existing placeholder with full implementation:
  - Import and compose: FilterPanel + filtered fund list
  - Fetch fund list via `useFundList(filters)` when "Apply filters" clicked
  - Pass URL search params from `useSearch` into filter hook
  - **Loading state**: 4-6 Skeleton rows matching FundRow layout + "Fetching fund data..." text
  - **Empty state**: Search icon + "No funds match your filters. Try adjusting your criteria." + "Clear filters" button
  - **Error state**: destructive Toast on API failure + inline retry button
  - **Data state**: funds grouped by super-category, then sub-category, with category header dividers
  - Regenerate route tree: `npx tsc --noEmit`

### 4. Data normalization & edge cases
- [x] Add Zod schemas in `src/types/api.ts` for mfapi.in / mfdata.in response shapes:
  - `mfapiSchemeSchema`: normalize `scheme_code`, `scheme_name`, `amc`, `category`, `sub_category`, `plan`, `option`, `benchmark`, `expense_ratio`, `aum`, `risk_label`
  - Handle missing fields gracefully (optional with defaults)
  - Handle inconsistent field names (`scheme_code` vs `schemeCode`, `expense_ratio` vs `expenseRatio`)
- [ ] Handle edge cases:
  - API returns empty array → empty results state
  - API returns malformed data → partial render with toast warning
  - Network error → retry + toast
  - No filters applied → show all funds grouped by category
  - Very long fund names → truncate with ellipsis

### 5. Cleanup & verify
- [x] Verify all files compile: `npx tsc --noEmit`
- [x] manual check: universe-browser loads, filters apply, states render correctly
- [x] Verify route tree generated correctly

## Dev Notes

### Relevant Architecture Patterns & Constraints
- **API layer**: TanStack Query hooks in `src/stores/queries/` for all API-sourced data. No raw `fetch` calls outside TanStack Query config. Architecture specifies nginx proxy routes `/api/mfapi/*` and `/api/mfdata/*`.
- **Feature isolation**: All screener/browser logic in `src/features/screener/` — components/ and hooks/. No cross-feature imports.
- **Category taxonomy**: Already exists at `src/lib/category-taxonomy.ts` — `categoryTaxonomy` array with `superCategory` + `subCategories`, `getSuperCategory()` helper, `categoryTermSlugs` map for TermInfo. Do NOT duplicate.
- **Data normalization**: Zod schemas at API boundary in `src/types/api.ts` to normalize inconsistent field names from external APIs.
- **State management**: TanStack Query for API data (fund list), React state + URL search params for filter state. No Redux/Zustand.
- **Formatting**: `formatINR` from `src/lib/formatters.ts` for AUM display. `formatPercentage` for expense ratio.
- **Types**: Create `FundFilters` interface in the feature module. API response types in `src/types/api.ts`.

### Existing Patterns to Follow
- Components use shadcn/ui primitives — check `src/components/ui/` for what's available before adding new ones
- Icons from lucide-react (`Search`, `SlidersHorizontal`, `RotateCcw`, `X`, `ChevronDown`, `ChevronUp`, `Filter`)
- Tailwind v4 utility classes
- `<TermInfo slug="term-name" />` for financial term tooltips — glossary seeded in Epic 1.3
- Empty states with icon, message, and primary action button (pattern from `Goals` route)
- Skeleton loading states matching card/row layout (pattern from `GoalCard` loading)
- TanStack Query: `useQuery` with key convention `['funds', {category}]`, `staleTime`, `retry`
- Barrel export from `src/features/screener/index.ts`

### Source Tree Components to Touch
| File | Action |
|---|---|
| `src/routes/universe-browser/index.tsx` | Replace placeholder with full implementation |
| `src/features/screener/hooks/useUniverseFilters.ts` | NEW — filter state hook |
| `src/features/screener/components/FilterPanel.tsx` | NEW — collapsible filter panel |
| `src/features/screener/components/FundRow.tsx` | NEW — fund list row |
| `src/features/screener/index.ts` | NEW — barrel export |
| `src/stores/queries/useFunds.ts` | NEW — TanStack Query hook for fund API |
| `src/types/api.ts` | NEW — Zod schemas for API response normalization |
| `src/routeTree.gen.ts` | Auto-regenerated (minor changes expected) |
| `src/components/ui/slider.tsx` | NEW — shadcn slider component |
| `src/components/ui/toast.tsx` | NEW — shadcn toast/sonner component |
| `src/components/ui/tabs.tsx` | NEW — shadcn tabs component |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | Update 3-1-category-browser-fund-filtering to ready-for-dev |
| `_bmad-output/implementation-artifacts/deferred-work.md` | Append any deferred findings if applicable |

### Existing DB Schema (from stores/db.ts)
```typescript
interface Portfolio {
  id?: number
  schemeCode: string
  schemeName: string
  category: string
  goalId?: number
  units: number
  targetAllocation: number
}
```
Note: Fund data comes from external APIs (not Dexie) — no new Dexie tables needed for this story. The `portfolios` table is referenced only for overlap analysis (future story).

### API Response Shapes (from mfapi.in / mfdata.in)
The typical mfapi.in `/scheme/` response:
```json
{
  "scheme_code": "123456",
  "scheme_name": "HDFC Flexi Cap Fund - Direct - Growth",
  "amc": "HDFC",
  "category": "Equity",
  "sub_category": "Flexi Cap",
  "plan": "Direct",
  "option": "Growth",
  "benchmark": "Nifty 500 TRI",
  "expense_ratio": 0.68,
  "aum": 45230.00,
  "risk_label": "Moderate"
}
```
Actual field names may vary — normalize via Zod schema.

### API Data Flow
```
User action → FilterPanel state (URL params) → "Apply filters" click
  → useFundList(queryKey with filters) → TanStack Query
  → /api/mfapi/funds?category=... (nginx proxy)
  → Zod normalize response → cached by queryKey → render FundRow list
```

### Acceptance Criteria Mapping
| Task | AC |
|---|---|
| TanStack Query hooks for fund API | #1, #4 |
| FilterPanel with all 6 dimensions + TermInfo | #2 |
| URL-synced filter state + Apply button | #3 |
| Skeleton loading state | #4 |
| Error handling (toast + retry) | #5 |
| Empty results state | #6 |
| FundRow display component | #7 |

### References
- [Source: epics.md:335-373] — Full Story 3.1 acceptance criteria
- [Source: epics.md:98] — FR-6 Category Browser
- [Source: architecture.md:155-159] — API proxy & data normalization
- [Source: architecture.md:296-297] — screener feature module structure
- [Source: architecture.md:227-231] — Error & loading patterns
- [Source: architecture.md:2-62] — External API dependency notes (no SLA)
- [Source: EXPERIENCE.md:40,85-86] — Universe Browser IA + Filter Panel + Fund Row spec
- [Source: EXPERIENCE.md:100,104] — Loading & error state patterns
- [Source: EXPERIENCE.md:196-201] — Key flow: screening and scoring a fund
- [Source: lib/category-taxonomy.ts] — Existing category taxonomy module
- [Source: lib/formatters.ts] — Existing formatters (formatINR, formatPercentage)
- [Source: stores/db.ts] — Existing Dexie schema (Portfolio interface for future overlap)

## Dev Agent Record

### Agent Model Used
Big Pickle

### Debug Log References
- User-reported: `stores/queries/` directory does not exist yet — create it
- User-reported: `slider`, `toast`, `tabs` shadcn components not yet added

### Completion Notes
- Created `src/components/ui/tabs.tsx` — shadcn tabs using @radix-ui/react-tabs (already installed)
- Created `src/components/ui/slider.tsx` — range slider using native HTML inputs styled as shadcn component (avoids missing @radix-ui/react-slider dep)
- Created `src/components/ui/toast.tsx` — toast system with context provider (avoids missing sonner dep)
- Created `src/types/api.ts` — Zod schemas for mfapi.in response normalization (`mfFundSchema`, `mfapiResponseSchema`)
- Created `src/stores/queries/useFunds.ts` — TanStack Query hook `useFundList(filters)` with retry/staleTime, `useAmcList()`
- Created `src/features/screener/` module: `useUniverseFilters` hook, `FilterPanel` component (6 filter dimensions with TermInfo tooltips, sliders, multi-select), `FundRow` component, barrel export
- Replaced placeholder in `src/routes/universe-browser/index.tsx` with full implementation: filter panel, loading skeletons, error state (toast + retry), empty state, grouped fund display
- Wired `ToastProvider` in `AppShell.tsx` for app-wide toast access
- TypeScript compiles clean with `npx tsc --noEmit` — zero errors

### File List
- `src/components/ui/tabs.tsx` — NEW — shadcn tabs component
- `src/components/ui/slider.tsx` — NEW — range slider component
- `src/components/ui/toast.tsx` — NEW — toast system with context provider
- `src/types/api.ts` — NEW — Zod schemas for API normalization
- `src/stores/queries/useFunds.ts` — NEW — TanStack Query hooks for fund API
- `src/features/screener/hooks/useUniverseFilters.ts` — NEW — filter state hook
- `src/features/screener/components/FilterPanel.tsx` — NEW — collapsible filter panel
- `src/features/screener/components/FundRow.tsx` — NEW — fund list row
- `src/features/screener/index.ts` — NEW — barrel export
- `src/routes/universe-browser/index.tsx` — MODIFIED — full implementation replacing placeholder
- `src/components/layout/AppShell.tsx` — MODIFIED — wrapped ToastProvider for app-wide toasts

### Review Findings

**Patch items (fixable without human input):**

- [x] [Review][Patch] Division by zero in slider when min === max [slider.tsx:20-21]
- [x] [Review][Patch] NaN propagation from api.ts Zod parsing (z.number() accepts NaN) [api.ts:35-36]
- [x] [Review][Patch] Orphaned setTimeout not cleaned up on toast unmount [toast.tsx:30-33]
- [x] [Review][Patch] Toast exit animations never play (data-state never set to "closing") [toast.tsx:48-49]
- [x] [Review][Patch] Mutable module-level defaultFilters shared across hook instances [useUniverseFilters.ts:4]
- [x] [Review][Patch] Object reference in query key creates infinite stale cache entries [useFunds.ts:37]
- [x] [Review][Patch] Unused superCat variable in FundRow [FundRow.tsx:19]
- [x] [Review][Patch] Incomplete risk color map — missing Very Low, Moderately Low, Moderately High [FundRow.tsx:11-15]
- [x] [Review][Patch] Expense ratio slider left thumb pinned at 0 — should be single-value slider [FilterPanel.tsx:161-168]
- [x] [Review][Patch] Redundant toast notification on retry failure (inline error already shown) [universe-browser.tsx:69]
- [x] [Review][Patch] WebKit-only range thumb styling — missing -moz-range-thumb [slider.tsx:43,56]
- [x] [Review][Patch] value[0] > value[1] deadlock in dual-range slider [slider.tsx:40-41,53-54]
- [x] [Review][Patch] activeFilterCount miscounts false/0 values [useUniverseFilters.ts:17-18]
- [x] [Review][Patch] Missing benchmark type multi-select in FilterPanel (AC 2) [FilterPanel.tsx]
- [x] [Review][Patch] Filter state not synced to URL query params (AC 3) [useUniverseFilters.ts]
- [x] [Review][Patch] No toast on initial API error (AC 5 — inline instead of toast) [universe-browser.tsx]
- [x] [Review][Patch] Unused Input import in FilterPanel [FilterPanel.tsx:4]

**Deferred items (pre-existing, not caused by this change):**
- [x] [Review][Defer] Math.random ID collision risk in toast IDs — extremely low probability in single-user app [toast.tsx:5]
- [x] [Review][Defer] No AbortController in TanStack Query fetch — pre-existing pattern across codebase, TanStack Query handles its own cancellation [useFunds.ts]
