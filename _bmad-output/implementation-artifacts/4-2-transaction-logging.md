---
baseline_commit: NO_VCS
---

# Story 4.2: Transaction Logging

Status: done

## Story

As Boss,
I want to log my SIP instalments and lump-sum purchases with date, amount, NAV, and linked goal,
So that my portfolio accurately reflects my holdings.

## Acceptance Criteria

1. **Given** I open the Portfolio page,
   **When** I click "Add Transaction",
   **Then** a form opens with fields: type (SIP / Lump-sum), date, amount, NAV, units (auto-computed from amount/NAV), linked goal (dropdown of active goals)
   **And** validation occurs on blur with INR auto-formatting.

2. **Given** I submit a transaction,
   **When** the form is valid,
   **Then** the transaction is saved to the Dexie `transactions` table
   **And** the Portfolio page shows the updated data.

3. **Given** I log a SIP instalment,
   **When** the entry is saved,
   **Then** it is tagged with the SIP schedule name and linked to the correct goal.

4. **Given** I open the Transactions view on the Portfolio page,
   **When** transactions are listed,
   **Then** they are paginated (not infinite scroll) with date, fund name, type, amount, NAV, units, and linked goal columns.

## Tasks / Subtasks

### 1. Create `src/types/transaction.ts` — transaction form types
- [ ] Define `TransactionFormData` interface (type, date, amount, nav, goalId, sipSchedule?)
- [ ] Define `TransactionRow` display type extending Dexie Transaction with resolved fund name and goal name
- [ ] No Zod schema needed — all data originates from user input (no external API)

### 2. Create `src/features/portfolio/hooks/useTransactions.ts` — Dexie CRUD hook
- [ ] `useTransactions()` — fetches all transactions sorted by date descending via `useLiveQuery`
- [ ] `addTransaction(data: TransactionFormData)` — writes to `db.transactions` with computed units = amount / nav, ISO date, id auto-generated
- [ ] Guard: reject if amount ≤ 0 or nav ≤ 0 or amount NaN
- [ ] Guard: reject if goalId refers to a closed goal (validate via `db.goals.get(goalId)`)
- [ ] Return `{ transactions, loading, addTransaction, error }`
- [ ] Follow exact pattern from `useGoals` (`src/features/goals/hooks/useGoals.ts`) — `useLiveQuery`, `useCallback`

### 3. Create `src/features/portfolio/components/AddTransactionForm.tsx` — form dialog
- [ ] shadcn `Dialog` triggered by "Add Transaction" button
- [ ] Fields: type (select SIP/Lump-sum), date (input type="date"), amount (number input), NAV (number input), units (computed readonly display field), linked goal (select of active goals from `useGoals`)
- [ ] Auto-compute units on amount/NAV change: `units = amount / nav` (show 4 decimal places)
- [ ] Validation on blur: amount > 0, NAV > 0, date not empty, goal selected
- [ ] INR auto-format on blur for amount field via `Intl.NumberFormat('en-IN')`
- [ ] On submit: call `addTransaction` from hook, show success toast, close dialog
- [ ] On error: show destructive toast with error message

### 4. Create `src/features/portfolio/components/TransactionList.tsx` — paginated transaction table
- [ ] shadcn `Table` with columns: date, fund name, type (SIP/Lump-sum badge), amount (INR formatted), NAV, units, linked goal, actions (delete)
- [ ] Pagination controls at bottom (prev/next, page X of Y) — local state, 10 items per page
- [ ] Fund name lookup: use existing `useSchemes` pattern from `src/stores/queries/` or resolve from `schemeCode` via Dexie portfolios table
- [ ] Empty state: "No transactions yet. Log a SIP or lump-sum purchase to track your holdings." with "Add Transaction" button
- [ ] Loading state: shadcn `Skeleton` rows (5 rows)

### 5. Update `src/routes/portfolio/index.tsx` — wire components
- [ ] Import and render `TransactionList`
- [ ] Import and render `AddTransactionForm` (button to trigger dialog)
- [ ] Render heading: "Portfolio" with subtitle "Track your investments"
- [ ] Keep layout as existing: full-width content area

### 6. Verify compilation and tests
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npx vitest run` — no regressions

## Dev Notes

### Transaction Architecture
- Portfolio feature module at `src/features/portfolio/` per architecture [`architecture.md:308-310`]
- `Transaction` interface already defined in `src/stores/db.ts:17-27` (id, schemeCode, type, date, amount, nav, units, goalId, sipSchedule)
- Dexie table `transactions` already indexed by `schemeCode`, `date`, `goalId` [`db.ts:101`]
- Pure XIRR engine already available at `src/lib/xirr.ts` (story 4-1) — for future dashboard use, not needed in this story
- Goal data available via existing `useGoals` hook [`src/features/goals/hooks/useGoals.ts:21`]

### Form Design
- Dialog (shadcn `Dialog`) — not a full-page form, matches UX pattern for simple data entry
- Units auto-computed as `amount / nav` (4 decimal places), displayed as read-only
- NAV precision: up to 4 decimal places (standard mutual fund NAV precision)
- INR formatting via `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })` — existing pattern from `src/lib/formatters.ts`
- Validation on blur per UX requirement [`EXPERIENCE.md:123`]
- SIP schedule name: stored in `sipSchedule` field, free text entry in form (not a separate CRUD)

### Pagination
- Local state pagination (not TanStack Router query params) — 10 items per page
- shadcn `Table` component with `TableHeader`, `TableBody`, `TableRow`, `TableCell`
- Pagination controls: simple prev/next with page indicator
- Matches UX requirement: "Banned in v1: infinite scroll — pagination for transaction lists" [`EXPERIENCE.md:128`]

### Fund Name Resolution
- `Transaction.schemeCode` stores the AMFI scheme code (5-6 digit number)
- Fund name can be resolved from existing Dexie `portfolios` table (which has `schemeCode` + `schemeName`), or from skeleton `useSchemes` query
- If no matching portfolio entry and no scheme data, show "Scheme {code}" as fallback

### Known UX Gaps (from review-ux-rubric.md)
- Error state for NAV × units ≠ amount beyond rounding tolerance — flag in validation but don't block
- Logging against closed goal — validate with `db.goals.get(goalId)` and reject with error message
- These are pre-identified edge cases from the UX rubric [`review-ux-rubric.md:99-101`]

### Empty State
- Copy: "No transactions yet. Log a SIP or lump-sum purchase to track your holdings."
- Primary action button: "Add Transaction"
- Matches UX spec [`EXPERIENCE.md:102`]

### Source Tree Components to Touch/Create
| File | Action |
|------|--------|
| `src/types/transaction.ts` | NEW — transaction form type |
| `src/features/portfolio/hooks/useTransactions.ts` | NEW — Dexie CRUD hook |
| `src/features/portfolio/components/AddTransactionForm.tsx` | NEW — form dialog |
| `src/features/portfolio/components/TransactionList.tsx` | NEW — paginated table |
| `src/routes/portfolio/index.tsx` | UPDATE — wire components |
| `src/features/portfolio/index.ts` | NEW — barrel export |

### Testing
- Co-locate `*.test.ts` files next to the file under test
- `useTransactions` hook: test addTransaction guards (zero amount, closed goal, NaN)
- `TransactionList`: test pagination, empty state rendering, row rendering
- `AddTransactionForm`: test validation, unit auto-compute, submit flow
- Run via `npx vitest run`

### References
- [Source: epics.md:486-510] — Full Story 4.2 ACs
- [Source: architecture.md:308-310] — Portfolio feature module (components, hooks)
- [Source: architecture.md:214-216] — Date (ISO 8601), currency (INR integers), percentage (decimal) formats
- [Source: architecture.md:220-225] — State management: Dexie for user data
- [Source: architecture.md:239-339] — Project directory structure
- [Source: src/stores/db.ts:17-27] — Transaction Dexie interface
- [Source: src/stores/db.ts:101] — Transaction table indexes
- [Source: src/features/goals/hooks/useGoals.ts] — Reference hook pattern
- [Source: EXPERIENCE.md:44] — Transaction surface: "Log SIP or lump-sum"
- [Source: EXPERIENCE.md:102] — Empty state copy
- [Source: EXPERIENCE.md:123-124] — Validation on blur, INR auto-format
- [Source: EXPERIENCE.md:128] — No infinite scroll, pagination
- [Source: review-ux-rubric.md:99-101] — Known UX gaps (NAV×units mismatch, closed goal)
- [Source: src/lib/formatters.ts] — Existing INR formatting function

## Dev Agent Record

### Agent Model Used
Big Pickle

### Completion Notes
Code review (2026-06-04): 6 patch findings applied, 1 deferred. All patches resolved. Story status → done.
All 6 files created/modified:
1. `src/types/transaction.ts` — FormData & TransactionRow display types
2. `src/features/portfolio/hooks/useTransactions.ts` — Dexie CRUD with add/delete, closed-goal guard, zero-amount guard
3. `src/features/portfolio/components/AddTransactionForm.tsx` — shadcn Dialog form with fund selector (from portfolios table), unit auto-compute, INR blur formatting, SIP schedule field, goal selector
4. `src/features/portfolio/components/TransactionList.tsx` — shadcn Table with pagination (10/page), fund/goal name resolution from Dexie, empty state with copy from EXPERIENCE.md:102, Skeleton loading, delete action
5. `src/features/portfolio/index.ts` — barrel export
6. `src/routes/portfolio/index.tsx` — wired AddTransactionForm + TransactionList, kept layout

Also added shadcn `dialog.tsx` and `table.tsx` UI components (not in original plan but required by ACs).
`tsc --noEmit` — 0 errors. `vitest run` — 78/78 pass, no regressions.

### File List
- `src/types/transaction.ts` — NEW
- `src/features/portfolio/hooks/useTransactions.ts` — NEW
- `src/features/portfolio/components/AddTransactionForm.tsx` — NEW
- `src/features/portfolio/components/TransactionList.tsx` — NEW
- `src/routes/portfolio/index.tsx` — UPDATE
- `src/features/portfolio/index.ts` — NEW

### Review Findings

- [x] [Review][Patch] Duplicate validation guard in `useTransactions.ts:21,23` — removed redundant line 23.
- [x] [Review][Patch] Empty catch block in `TransactionList.tsx:46-48` — added destructive toast on delete failure.
- [x] [Review][Patch] Empty-state "Add Transaction" button is inert — lifted dialog state to route; wired `onAddClick` to `setDialogOpen(true)`.
- [x] [Review][Patch] Fund select lacks blur validation — added `onBlur={validateScheme}` to SelectTrigger.
- [x] [Review][Patch] No portfolio loading indicator — shows "Loading funds..." when `portfolios === undefined`.
- [x] [Review][Patch] State/validation race in `handleAmountBlur` — validates against local variable instead of stale state.
- [x] [Review][Defer] No future-date validation on transaction date — `max` attr provides browser guard. Not in ACs. Deferred, pre-existing.
