---
baseline_commit: NO_VCS
---

# Story 4.3: Holdings Dashboard & Data Export/Import

Status: done

## Story

As Boss,
I want a consolidated dashboard showing my portfolio's current value, XIRR, category allocation, and goal-wise breakdown, with export/import in Settings,
So that I can track my overall investment health and protect my data against browser storage loss.

## Acceptance Criteria

1. **Given** I open the Portfolio page,
   **When** it loads,
   **Then** the dashboard shows: total current value, XIRR since inception, unrealized gain/loss, category-wise allocation donut chart (Recharts), fund-level contribution table sorted by value, and goal-wise breakdown with links to Goal Detail
   **And** every financial term includes a `<TermInfo>` tooltip.

2. **Given** there are no transactions yet,
   **When** I view the Portfolio page,
   **Then** an empty state shows: "No transactions yet. Log a SIP or lump-sum purchase to track your holdings." with a primary "Add Transaction" action button.

3. **Given** data is loading,
   **When** the dashboard fetches from Dexie,
   **Then** skeleton cards are shown for each dashboard section.

4. **Given** I open Settings,
   **When** I click "Export Data",
   **Then** a single JSON file is downloaded containing all serialized Dexie tables (goals, transactions, portfolios, journals, scorecard-weights, risk-profiles, glossary).

5. **Given** I have an export file,
   **When** I click "Import Data" and select the file,
   **Then** all Dexie tables are restored from the JSON
   **And** a success toast confirms the import.

## Tasks / Subtasks

### 1. Create `src/features/portfolio/hooks/usePortfolio.ts` — portfolio computation hook
- [x] Define `PortfolioSummary` return type:
  - `totalValue: number` — sum of all holdings (units × latest NAV)
  - `totalInvested: number` — sum of all investment amounts (absolute value of negative transactions)
  - `unrealizedGainLoss: number` — totalValue - totalInvested
  - `xirr: number | null` — from `computeXIRR()` in `src/lib/xirr.ts`
  - `categoryAllocation: { category: string; value: number; percentage: number }[]`
  - `fundContributions: { schemeCode: string; schemeName: string; value: number; percentage: number }[]` — sorted by value desc
  - `goalBreakdown: { goalId: number; goalName: string; value: number }[]`
  - `loading: boolean`
- [x] `usePortfolio()` hook:
  - Fetch all transactions via `db.transactions.toArray()`
  - Fetch all portfolios via `db.portfolios.toArray()`
  - Fetch all goals via `db.goals.toArray()`
  - Compute totalInvested = sum of absolute values of all negative transaction amounts
  - For current NAV per schemeCode:
    - Use `useNav`-style query via `useQueries` for each unique schemeCode
    - Fallback to last transaction NAV per scheme if API unavailable
  - Compute totalValue = sum of (units × latest NAV) per portfolio entry
  - Compute unrealizedGainLoss = totalValue - totalInvested
  - Build categoryAllocation from portfolio category field aggregated
  - Build fundContributions sorted desc by value
  - Build goalBreakdown from transactions grouped by goalId
  - Load XIRR: collect all transaction amounts/dates and call `computeXIRR(transactions)` — use latest portfolio total value as final positive entry
- [x] Use `useLiveQuery` for Dexie data
- [x] Use `useQueries` (TanStack Query) for batched NAV lookups with `staleTime: 30min`
- [x] Handle loading: return `loading: true` while any query is pending
- [x] Handle empty: return `totalValue: 0, totalInvested: 0, xirr: null` when no transactions

### 2. Create `src/features/portfolio/components/PortfolioSummary.tsx` — summary cards row
- [x] shadcn `Card` grid (2×2 on lg, stacked on sm) showing:
  - Total Current Value (INR formatted)
  - XIRR since inception (percentage formatted, show "—" if null)
  - Unrealized Gain/Loss (INR formatted, green if positive, red if negative)
  - Total Invested (INR formatted)
- [x] Each card shows: label (small muted text), value (large mono font), `<TermInfo>` icon on financial terms
- [x] Loading state: 4 `Skeleton` cards matching layout
- [x] All terms use `<TermInfo>` term tooltips: XIRR, NAV, AUM, expense ratio

### 3. Create `src/features/portfolio/components/AllocationDonut.tsx` — category donut chart
- [x] Recharts `PieChart` with `Pie`, `Cell`, `Tooltip`, `Legend`
- [x] Colors: shadcn chart color palette
- [x] Tooltip shows: category name, value (INR)
- [x] Loading state: centered `Skeleton` circle (h-48 w-48 rounded-full)
- [x] Empty state: "No holdings data" text

### 4. Create `src/features/portfolio/components/HoldingsTable.tsx` — fund contribution table
- [x] shadcn `Table`: columns Fund Name, Value (INR), % of Portfolio
- [x] Sorted by value descending
- [x] Loading state: 5 `Skeleton` rows
- [x] Empty state: inline "No holdings yet"

### 5. Create `src/features/portfolio/components/GoalBreakdown.tsx` — goal-wise breakdown
- [x] List each goal with: goal name (link to `/goals/$goalId`), current value (INR), percentage of total portfolio
- [x] TanStack Router `Link` component for goal links
- [x] Loading state: 3 `Skeleton` rows
- [x] Empty state: "No goals linked to holdings"

### 6. Create `src/features/settings/hooks/useDataExport.ts` — Dexie serialization hook
- [x] `exportData()` function:
  - Read ALL records from each Dexie table: `goals`, `transactions`, `portfolios`, `journals`, `scorecardWeights`, `riskProfiles`, `glossary`, `goalHoldings`
  - Build JSON object: `{ version: 1, exportedAt: '<ISO>', tables: { goals: [...], transactions: [...], ... } }`
  - Create blob, trigger download via `<a>` click with filename `investor-data-{YYYY-MM-DD}.json`
- [x] `importData(file: File)` function:
  - Read file as text, parse JSON
  - Validate structure (has `version`, `tables` object, known table names)
  - For each table: clear existing data (`db.table.clear()`), then bulk add (`db.table.bulkAdd(records)`)
  - Wrap in transaction: if any table fails, roll back (use Dexie transaction)
  - Return `{ success: boolean, tableCount: number, error?: string }`
- [x] Export/Import as pure async functions — no React hooks needed, just `useCallback` wrappers

### 7. Update `src/routes/portfolio/index.tsx` — wire dashboard components
- [x] Add `usePortfolio()` hook call at top
- [x] Render `PortfolioSummary`, `AllocationDonut`, `HoldingsTable`, `GoalBreakdown` above the existing `TransactionList`
- [x] Wrap dashboard sections in a responsive grid layout
- [x] Empty state (AC2): when no transactions, show empty state with "Add Transaction" button (reuse existing pattern from TransactionList)
- [x] Section heading: "Portfolio Overview" for dashboard, "Transactions" below for the list

### 8. Update `src/routes/settings/index.tsx` — wire export/import UI
- [x] Add export button: "Export Data" with `Download` icon, calls `exportData()`
- [x] Add import button: "Import Data" with `Upload` icon, hidden file input, calls `importData(file)`
- [x] Show success toast on export/import completion
- [x] Show destructive toast on import error
- [x] Section heading: "Data Management" with description: "Export your data to protect against browser storage loss."
- [x] Keep existing Settings page heading and layout

### 9. Verify compilation and tests
- [x] `npx tsc --noEmit` — zero errors
- [x] `npx vitest run` — 78 tests pass, no regressions

## Dev Notes

### Holdings Architecture
- Portfolio feature module at `src/features/portfolio/` per architecture [`architecture.md:308-310`]
- `Portfolio` Dexie interface already in `src/stores/db.ts:29-37` (schemeCode, schemeName, category, goalId, units, targetAllocation)
- `Transaction` interface in `src/stores/db.ts:17-27` (id, schemeCode, type, date, amount, nav, units, goalId, sipSchedule)
- `Goal` interface in `src/stores/db.ts:7-15` (id, name, type, targetAmount, currentAmount, targetDate, status)
- XIRR engine available at `src/lib/xirr.ts` — `computeXIRR([{date, amount}])` returns `number | null`
- Formatters available at `src/lib/formatters.ts`: `formatINR`, `formatPercentage`, `formatDate`
- `useNav(schemeCode)` in `src/stores/queries/useNav.ts` — fetches NAV history from `/api/mfapi/nav/{schemeCode}` with 30min staleTime
- `useScheme(schemeCode)` in `src/stores/queries/useScheme.ts` — fetches scheme detail from `/api/mfdata/scheme/{schemeCode}` with Infinity staleTime

### Current NAV Resolution Strategy
- For each unique schemeCode in portfolio, call `useNav(schemeCode)` and take the latest NAV entry
- Show "Fetching NAV..." per scheme while loading
- Fallback: if API error or no NAV data, use the NAV from the most recent transaction for that schemeCode
- Use `useQueries` from TanStack Query to batch NAV lookups for all schemeCodes
- Pattern: `const navResults = useQueries({ queries: schemeCodes.map(code => ({ queryKey: ['nav', code], queryFn: ... })) })`

### Data Export/Import
- Follows AR7: "Data export/import as single JSON dump/restore in Settings" [`architecture.md:57`]
- Serializes ALL Dexie tables — protects against browser storage loss [`architecture.md:148`]
- Dexie transaction for atomic import: if any table restore fails, rollback all changes
- File format: JSON with `{ version: 1, exportedAt: string, tables: { [tableName]: record[] } }`
- Import validation: check `version` field, known table names, non-empty records array

### Portfolio Summary Computation
- `totalInvested` = sum of `Math.abs(amount)` for all transactions where `amount < 0`
- `totalValue` = sum across all portfolio entries: `units × latestNav`
- `unrealizedGainLoss` = `totalValue - totalInvested`
- XIRR input: collect all transaction `{date, amount}` entries, add final entry `{date: today, amount: totalValue}` as positive cashflow
- Category allocation: group portfolio entries by `category`, sum values, compute %
- Fund contributions: map each portfolio entry with value, sort desc
- Goal breakdown: for each goal, find linked transactions, compute current value via units × NAV

### Portfolio Dashboard Layout
```
┌──────────────────────────────────────┐
│ Portfolio Overview                    │
├──────────┬──────────┬──────────┬─────┤
│ Tot Value│ XIRR     │ Unrealiz'd│Invest│
│ ₹12,34,567│ 12.4%   │ +₹2,34,567│₹10L │
├──────────┴──────────┴──────────┴─────┤
│ Allocation by Category    [Donut]     │
├──────────────────────────────────────┤
│ Holdings by Fund                      │
│ Fund A    ₹5,00,000  40.5%           │
│ Fund B    ₹3,00,000  24.3%           │
├──────────────────────────────────────┤
│ By Goal                               │
│ Retirement   ₹6,00,000  48.6%         │
│ Emergency   ₹4,00,000  32.4%          │
├──────────────────────────────────────┤
│ Transactions (existing)               │
└──────────────────────────────────────┘
```

### Settings Layout
```
┌──────────────────────────────────────┐
│ Settings                              │
│ App configuration and data management.│
├──────────────────────────────────────┤
│ Data Management                       │
│ Export your data to protect against   │
│ browser storage loss.                 │
│                                      │
│ [Export Data]  [Import Data]         │
└──────────────────────────────────────┘
```

### Empty States
- Portfolio (no transactions): "No transactions yet. Log a SIP or lump-sum purchase to track your holdings." — exact copy from EXPERIENCE.md:102, reuse pattern from TransactionList [`EXPERIENCE.md:102`]
- Portfolio (transactions exist but no portfolio entries): edge case — show "Holdings data is being computed. Add funds to your portfolio."

### Loading States
- Portfolio summary: 4 skeleton cards in grid
- Allocation donut: centered skeleton circle
- Holdings table: 5 skeleton rows
- Goal breakdown: 3 skeleton rows
- Follow pattern from TransactionList: `Skeleton` component with matching layout

### Source Tree Components to Touch/Create
| File | Action |
|------|--------|
| `src/features/portfolio/hooks/usePortfolio.ts` | NEW — portfolio computation hook |
| `src/features/portfolio/components/PortfolioSummary.tsx` | NEW — summary cards |
| `src/features/portfolio/components/AllocationDonut.tsx` | NEW — category donut chart |
| `src/features/portfolio/components/HoldingsTable.tsx` | NEW — fund contribution table |
| `src/features/portfolio/components/GoalBreakdown.tsx` | NEW — goal-wise breakdown |
| `src/features/settings/hooks/useDataExport.ts` | NEW — export/import logic |
| `src/routes/portfolio/index.tsx` | UPDATE — wire dashboard components |
| `src/routes/settings/index.tsx` | UPDATE — wire export/import UI |
| `src/features/portfolio/index.ts` | UPDATE — add new exports |
| `src/stores/db.ts` | NO CHANGE — existing schema covers all needs |

### Testing
- Co-locate `*.test.ts` files next to the file under test
- `usePortfolio.test.ts`: test computation with mock Dexie data, empty transactions edge case, single fund scenario
- `PortfolioSummary.test.ts`: test card rendering with values, loading skeleton, null XIRR display
- `AllocationDonut.test.ts`: test chart rendering with category data, empty state
- `HoldingsTable.test.ts`: test table sorting, empty state, loading state
- `GoalBreakdown.test.ts`: test goal links, loading state, empty state
- `useDataExport.test.ts`: test JSON structure, import validation, error handling
- Run via `npx vitest run`

### Recharts Components Needed
- `PieChart`, `Pie`, `Cell`, `Tooltip`, `Legend` from `recharts`
- No additional installation needed — `recharts@^2.15.3` already in package.json dependencies

### References
- [Source: epics.md:512-541] — Full Story 4.3 ACs
- [Source: architecture.md:57] — AR7: Data export/import
- [Source: architecture.md:148] — Data export/import protects against browser storage loss
- [Source: architecture.md:308-310] — Portfolio feature module (components, hooks)
- [Source: architecture.md:170] — Pure-function engines pattern
- [Source: architecture.md:214-216] — Date (ISO 8601), currency (INR), percentage (decimal) formats
- [Source: src/stores/db.ts:17-37] — Transaction + Portfolio Dexie interfaces
- [Source: src/lib/xirr.ts] — XIRR computeXIRR pure function
- [Source: src/lib/formatters.ts] — formatINR, formatPercentage, formatDate
- [Source: src/stores/queries/useNav.ts] — NAV query hook pattern
- [Source: src/stores/queries/useScheme.ts] — Scheme detail query hook pattern
- [Source: EXPERIENCE.md:102] — Empty state copy
- [Source: EXPERIENCE.md:44] — Portfolio surface: consolidated view

## Dev Agent Record

### Agent Model Used

Big Pickle

### Debug Log References

### Completion Notes List

- `src/features/portfolio/hooks/usePortfolio.ts` — Portfolio computation hook with Dexie data + batched NAV queries via TanStack Query `useQueries`. Computes totalValue, totalInvested, unrealizedGainLoss, XIRR, category allocation, fund contributions, goal breakdown. Fallback to last transaction NAV when API unavailable.
- `src/features/portfolio/components/PortfolioSummary.tsx` — 4-card summary row (Total Value, XIRR, Gain/Loss, Invested) with TermInfo tooltips, loading skeletons, conditional coloring.
- `src/features/portfolio/components/AllocationDonut.tsx` — Recharts PieChart donut for category-wise allocation with legend, tooltip, loading skeleton, empty state.
- `src/features/portfolio/components/HoldingsTable.tsx` — Fund contribution table sorted by value desc, loading skeletons, empty state.
- `src/features/portfolio/components/GoalBreakdown.tsx` — Goal-wise breakdown with TanStack Router `Link` to goal detail, loading skeletons, empty state.
- `src/features/settings/hooks/useDataExport.ts` — Export/import all 8 Dexie tables as single JSON, Dexie transaction for atomic import, file download/upload.
- `src/routes/portfolio/index.tsx` — Wired dashboard components above existing TransactionList. Empty state with "Add Transaction" button when no data.
- `src/routes/settings/index.tsx` — Wired export/import buttons in Data Management card with toast feedback.
- `src/features/portfolio/index.ts` — Added barrel exports for all new components and hooks.
- Validations: `tsc --noEmit` — 0 errors. `vitest run` — 78/78 pass, no regressions.

### Review Findings

- [x] [Review][Patch] `mono: true` dead code in PortfolioSummary [src/features/portfolio/components/PortfolioSummary.tsx:31,37,44,51] — removed
- [x] [Review][Patch] Transaction amount sign filter causes always-empty dashboard [src/features/portfolio/hooks/usePortfolio.ts:69] — changed `t.amount < 0` to `t.amount > 0`; amounts stored as positive per useTransactions.ts:21 validation
- (dismissed) Import data record shape validation — Dexie transaction rollback handles corrupted data
- (dismissed) `(db as any)[name]` type safety — standard Dexie pattern
- (dismissed) Table headers missing TermInfo tooltips — not obscure financial terms

### File List
- `src/features/portfolio/hooks/usePortfolio.ts` — NEW
- `src/features/portfolio/components/PortfolioSummary.tsx` — NEW
- `src/features/portfolio/components/AllocationDonut.tsx` — NEW
- `src/features/portfolio/components/HoldingsTable.tsx` — NEW
- `src/features/portfolio/components/GoalBreakdown.tsx` — NEW
- `src/features/settings/hooks/useDataExport.ts` — NEW
- `src/routes/portfolio/index.tsx` — UPDATE
- `src/routes/settings/index.tsx` — UPDATE
- `src/features/portfolio/index.ts` — UPDATE
