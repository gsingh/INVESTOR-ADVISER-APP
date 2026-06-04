---
baseline_commit: c608092a06936ab1cd78d430b0366c1fed4fe685
---

# Story 2.1: Goal CRUD

Status: done

## Story

As Boss,
I want to create, view, edit, and close financial goals with clear validation,
So that I can define my investment targets and track them.

## Acceptance Criteria

1. Goals list page shows all active goals with progress bars, or empty state when none exist.
2. "Create Goal" button opens a form with fields: name, type (Emergency / Medium-Term / Long-Term / Custom), starting amount, target amount, target date — financial terms get `<TermInfo>` tooltips.
3. Financial inputs auto-format with INR commas on blur; validation errors appear on blur.
4. Submitting the form saves to Dexie `goals` table and redirects to Goal Detail page.
5. Goal Detail page shows name, progress bar (current/target), type, target date, and empty allocation state.
6. Existing goal's context menu (⋮) offers "Edit" (pre-filled form) and "Close Goal" (archive with completion date).
7. Closing a goal archives it (status → `closed`, `closedAt` set) — holdings remain in Portfolio.
8. Form draft persists in sessionStorage on navigation away and clears on submit.

## Tasks

### 0. Prerequisites — shadcn components
- [x] Add missing shadcn components: `npx shadcn@latest add progress dialog dropdown-menu`
- [x] These are needed for: progress bars (goal cards), confirmation dialog (close goal), context menu (edit/close)

### 1. Goals list page (`/goals`)
- [x] Replace placeholder in `src/routes/goals/index.tsx` with full implementation
- [x] Fetch goals from Dexie via `useLiveQuery` sorted by `createdAt` desc
- [x] Render GoalCard for each active goal: name, type badge, progress bar, target amount, target date
- [x] Show empty state with lucide `Target` icon & "No goals yet. Create your first goal to start tracking your investments." + primary CTA
- [x] Loading state with 3 skeleton cards matching GoalCard layout
- [x] Click goal card navigates to `/goals/$goalId`

### 2. Goal creation form & route (`/goals/new`)
- [x] Create `src/routes/goals/new.tsx` — lazy-loaded route for goal creation (matches architecture plan)
- [x] Create `src/features/goals/components/GoalForm.tsx` — shared between create and edit flows
- [x] Fields: name (text), type (select: Emergency/Medium-Term/Long-Term/Custom), startingAmount (number, INR → maps to `currentAmount` in DB), targetAmount (number, INR), targetDate (date input)
- [x] Add `<TermInfo>` tooltips for: "target amount", "time horizon"
- [x] Validation on blur: required fields, targetAmount > 0, targetAmount > startingAmount, targetDate > today
- [x] Auto-format currency on blur via `Intl.NumberFormat('en-IN')`
- [x] Persist form state in sessionStorage keyed `goal-form-draft` on each change; clear on submit
- [x] Restore draft from sessionStorage if user navigates back
- [x] Regenerate route tree: manually added to `routeTree.gen.ts` (tsc --noEmit passes clean)

### 3. Goal CRUD hook
- [x] Create `src/features/goals/hooks/useGoals.ts` hook
- [x] `useGoals()` returns: `goals`, `loading`, `createGoal`, `updateGoal`, `closeGoal`
- [x] `createGoal(data)` validates, adds to Dexie `goals` table with `status: 'active'`, `currentAmount: startingAmount`, `createdAt: now`
- [x] `updateGoal(id, data)` patches existing goal
- [x] `closeGoal(id)` sets `status: 'closed'` and `closedAt: now`
- [x] Create `src/features/goals/index.ts` barrel export re-exporting hook and components

### 4. Goal detail page (`/goals/$goalId`)
- [x] Replace placeholder in `src/routes/goals/$goalId.tsx`
- [x] Load goal by ID from Dexie via `useLiveQuery`
- [x] Display: name (display-sm), type badge, progress bar (currentAmount / targetAmount), target date
- [x] Context menu (DropdownMenu with ⋮ trigger) — "Edit" and "Close Goal"
- [x] "Edit" opens GoalForm inline with pre-filled values
- [x] "Close Goal" shows confirmation Dialog, then calls `closeGoal`
- [x] Allocation section placeholder: "No funds allocated to this goal yet. Browse the fund universe to find suitable funds."
- [x] Loading skeleton while goal loads
- [x] 404/not-found state if goal doesn't exist

### 5. Formatters utility
- [x] Create `src/lib/formatters.ts` with:
  - `formatINR(amount: number): string` — `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`
  - `formatPercentage(value: number): string` — `(value * 100).toFixed(1) + '%'`
  - `formatDate(date: string): string` — locale date string
- [x] Add Vitest tests in `src/lib/formatters.test.ts` — 9 tests, all passing

### 6. Wire navigation & verify
- [x] Goals link in Sidebar routes to `/goals` (already correct)
- [x] "Create Goal" button on `/goals` navigates to `/goals/new`
- [x] On submit success → navigate to `/goals/$newGoalId`
- [x] Route tree regenerated — added `/goals/new` route

### 7. Sprint status
- [x] `sprint-status.yaml` — already updated (epic-2 → in-progress, 2-1-goal-crud → ready-for-dev)

## Dev Notes

### Relevant Architecture Patterns & Constraints
- **Feature isolation**: All goal logic in `src/features/goals/` — components/ and hooks/. No cross-feature imports.
- **Data layer**: Dexie `goals` table already defined in `src/stores/db.ts` with `Goal` interface. Use `useLiveQuery` from `dexie-react-hooks` for reactive reads.
- **Route setup**: TanStack Router routes at `src/routes/goals/index.tsx` (list), `src/routes/goals/$goalId.tsx` (detail). Both currently have placeholder content.
- **State management**: Dexie for persistence, React state for form inputs, sessionStorage for form drafts. No Redux/Zustand.
- **Formatting**: `Intl.NumberFormat('en-IN')` for INR display — use `formatINR` in the new `formatters.ts`.
- **Types**: `Goal` interface already in `stores/db.ts` — do not duplicate.

### Existing Patterns to Follow
- Components use shadcn/ui primitives (Card, Button, Input, Select, Badge, Progress, Skeleton, Dialog, DropdownMenu)
- Icons from lucide-react (`Target`, `Plus`, `MoreHorizontal`, `Pencil`, `XCircle`, `Trash2`)
- Tailwind v4 utility classes
- `<TermInfo slug="term-name" />` for financial term tooltips — glossary already seeded in Epic 1.3
- Form validation on blur (not on keystroke)
- Empty states with icon, message, and primary action button
- Skeleton loading states matching card layout

### Route Tree
- `src/routes/goals/new.tsx` needs to be created as a new route (not currently in routeTree.gen.ts)
- After any route file changes, regenerate: `npx tsc --noEmit` (TanStack Router's plugin regenerates routeTree.gen.ts on type-check)
- The `routeTree.gen.ts` already imports `$goalId` and `goals/index` — only `goals/new` needs adding

### Source Tree Components to Touch
| File | Action |
|---|---|
| `src/routes/goals/index.tsx` | Replace placeholder with full list page |
| `src/routes/goals/new.tsx` | NEW — goal creation route, lazy-loaded |
| `src/routes/goals/$goalId.tsx` | Replace placeholder with detail page |
| `src/features/goals/hooks/useGoals.ts` | NEW — CRUD hook |
| `src/features/goals/components/GoalForm.tsx` | NEW — create/edit form |
| `src/features/goals/components/GoalCard.tsx` | NEW — list card |
| `src/features/goals/index.ts` | NEW — barrel export |
| `src/lib/formatters.ts` | NEW — INR/date formatters |
| `src/stores/db.ts` | Already has Goal interface — read-only |
| `src/routeTree.gen.ts` | Auto-regenerated — add goals/new route |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | Already updated |

### Existing DB Schema (from stores/db.ts)
```typescript
interface Goal {
  id?: number
  name: string
  type: 'Emergency' | 'Medium-Term' | 'Long-Term' | 'Custom'
  targetAmount: number
  currentAmount: number
  targetDate: string
  riskProfile: string
  categoryAllocation: Record<string, number>
  status: 'active' | 'closed'
  createdAt: string
  closedAt?: string
}
```

### Acceptance Criteria Mapping
| Task | AC |
|---|---|
| Goals list with empty state | #1, #4 |
| Goal form with TermInfo tooltips | #2 |
| INR formatting & blur validation | #3 |
| Create & redirect to detail | #1, #3 |
| Goal detail page | #5 |
| Edit goal (pre-filled) | #6 |
| Close goal (archive) | #7 |
| SessionStorage draft | #8 |

### References
- [Source: epics.md:234-268] — Full Story 2.1 AC
- [Source: epics.md:96-101] — FR3 Goal CRUD
- [Source: PRD.md:90-91] — FR-3 Goal CRUD
- [Source: architecture.md:298-301] — goals feature module structure
- [Source: architecture.md:202-218] — naming/formats/rules
- [Source: DESIGN.md:132-133] — shadcn component inheritance
- [Source: EXPERIENCE.md:82] — Goal Card behavioral spec
- [Source: EXPERIENCE.md:115-126] — Interaction primitives

### Testing Notes
- Vitest is installed — pure function unit tests for `formatters.ts`
- Manual testing: create goal, verify redirect, verify persistence on reload, edit, close
- Verify sessionStorage draft survives navigation away and back
- Verify empty state, loading skeleton, and edge cases (zero target amount, past target date)

### Review Findings

**Patch items (fixable without human input):**

- `[x] [Review][Patch] updateGoal silently drops startingAmount/currentAmount [useGoals.ts:41-48]`
- `[x] [Review][Patch] reverse() is a no-op before sortBy() in goals query [useGoals.ts:13-14]`
- `[x] [Review][Patch] No error feedback when closeGoal fails [$goalId.tsx:121-128]`
- `[x] [Review][Patch] Duplicate typeLabels map in GoalCard.tsx and $goalId.tsx`
- `[x] [Review][Patch] formatINR missing NaN/Infinity guard [formatters.ts:1-8]`
- `[x] [Review][Patch] goal.id undefined passed to navigate [GoalCard.tsx:62, goals/index.tsx:62]`
- `[x] [Review][Patch] Date validation accepts invalid months (e.g. month=13) [GoalForm.tsx:101-102]`
- `[x] [Review][Patch] == null guard fails for NaN id values [GoalForm.tsx:158, $goalId.tsx:91]`
- `[x] [Review][Patch] typeLabels[goal.type] missing fallback in detail view [$goalId.tsx:140]`
- `[x] [Review][Patch] Starting amount field has no blur validation (violates AC3) [GoalForm.tsx]`

**Deferred items (pre-existing, not caused by this change):**

- `[x] [Review][Defer] closeGoal not idempotent on already-closed goals [useGoals.ts:50-55] — deferred, pre-existing: UI only shows close action for active goals`

## Dev Agent Record

### Agent Model Used
Big Pickle

### Completion Notes
- Implemented full Goal CRUD flow: list, create, detail/edit, close
- Created `src/lib/formatters.ts` with INR, percentage, and date formatters + 9 Vitest tests
- Added shadcn components: progress, dialog, dropdown-menu
- Created `src/features/goals/` module with hook, components, barrel export
- Implemented GoalForm with blur validation, INR auto-format, TermInfo tooltips, sessionStorage draft persistence
- Goals list page with empty state, loading skeletons, and GoalCard components
- Goal detail page with progress bar, context menu (edit/close), close confirmation dialog, not-found state
- Added `/goals/new` route to TanStack Router route tree
- TypeScript compiles clean, all tests pass

### File List
- `src/lib/formatters.ts` — NEW — INR/percentage/date formatters
- `src/lib/formatters.test.ts` — NEW — 9 Vitest tests for formatters
- `src/features/goals/hooks/useGoals.ts` — NEW — CRUD hook
- `src/features/goals/index.ts` — NEW — barrel export
- `src/features/goals/components/GoalCard.tsx` — NEW — list card component
- `src/features/goals/components/GoalForm.tsx` — NEW — create/edit form component
- `src/routes/goals/index.tsx` — MODIFIED — full goals list page
- `src/routes/goals/new.tsx` — NEW — goal creation route
- `src/routes/goals/$goalId.tsx` — MODIFIED — full goal detail page
- `src/routeTree.gen.ts` — MODIFIED — added `/goals/new` route
- `src/components/ui/progress.tsx` — NEW — shadcn progress component
- `src/components/ui/dialog.tsx` — NEW — shadcn dialog component
- `src/components/ui/dropdown-menu.tsx` — NEW — shadcn dropdown-menu component
- `_bmad-output/implementation-artifacts/2-1-goal-crud.md` — MODIFIED — status update
