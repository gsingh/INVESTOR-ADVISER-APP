# Story 5.3: Investment Journal

Status: done
baseline_commit: b5e3c8bf13c1fee1cb07201a66253debf49bc1a9

## Story

As Boss,
I want to write structured journal entries for each fund or goal — why I bought, what role it plays, what would trigger exit, and when to review next — with a searchable timeline,
So that I preserve my decision trail and learn from past choices.

## Acceptance Criteria

1. **Given** I open the Journal from the sidebar, a Goal Detail page, or a Fund Detail page,
   **When** I create a new entry,
   **Then** the form shows structured fields: "Why bought", "What role it plays", "What would trigger exit", "Next review date", plus a free-form notes field
   **And** the entry is tagged to the relevant fund, goal, or review.

2. **Given** I save an entry,
   **When** it is stored in the Dexie `journals` table,
   **Then** previous entries for the same fund or goal are shown in a reverse-chronological timeline below the form.

3. **Given** I am on the Journal surface,
   **When** I use the search bar,
   **Then** results filter all entries by keyword across all fields and notes.

4. **Given** an entry was written during a review,
   **When** it is displayed,
   **Then** it is linked to the review date and outcome.

## Tasks / Subtasks

### 1. Create `src/features/journal/hooks/useJournal.ts` — CRUD hook

- [x] Create hook using `useLiveQuery` from `dexie-react-hooks`:
  - `entries: Journal[] | undefined` — all entries, sorted `createdAt` descending
  - `loading: boolean` — `entries === undefined`
  - `createEntry(data) → Promise<number>` — adds to `db.journals`, returns id
  - `updateEntry(id, patch) → Promise<void>` — updates by id
  - `deleteEntry(id) → Promise<void>` — deletes by id
- [x] Tagging: entry stores `fundName` (string), `goalId` (number), `reviewId` (number) — all optional, at least one should be present
- [x] `createEntry` writes `createdAt: new Date().toISOString()`

### 2. Create `src/features/journal/components/JournalEditor.tsx` — entry form

- [x] Structured fields (all optional except at least one tag):
  - "Fund name" — text input (links to `fundName`)
  - "Goal" — select dropdown of active goals (links to `goalId`)
  - "Review" — select dropdown of past reviews (links to `reviewId`)
  - "Why bought" — textarea
  - "What role it plays" — textarea
  - "What would trigger exit" — textarea
  - "Next review date" — date input (ISO string)
  - "Notes" — free-form textarea
- [x] Props: `onSave(entry)`, `initialData?: Journal`, `isSubmitting: boolean`
- [x] Validation: at least one of `fundName`, `goalId`, `reviewId` must be set — show inline error if all empty
- [x] Clean form on successful save (controlled state reset)

### 3. Create `src/features/journal/components/JournalTimeline.tsx` — entry list

- [x] Props: `entries: Journal[]`, `goals: Goal[]`, `reviews: Review[]`
- [x] Reverse-chronological timeline (newest first) using shadcn `Card` components
- [x] Each card shows:
  - Date badge (formatted via `Intl.DateTimeFormat`)
  - Tag chips: fund name, goal name, review date+outcome (use `Badge` variants)
  - Structured fields displayed as labeled sections (only show non-empty fields)
  - "Why bought", "Role", "Exit trigger" as labeled paragraphs
  - Notes block below
- [x] Review-linked entries: show "Linked to review on [date] — outcome: [aligned/action_taken]" badge
- [x] Edit/delete action buttons per entry (pencil + trash icons from lucide-react)

### 4. Implement `src/routes/journal/index.tsx` — journal page (modify existing placeholder)

- [x] Replace placeholder with full implementation:
  - **Search bar** at top: `<Input>` with search icon, filters entries client-side by keyword across all fields
  - **New entry button**: "Write Entry" button opens `JournalEditor` as inline form (or expandable section) above the timeline
  - **Timeline**: `JournalTimeline` component showing filtered entries
  - **Tag filters**: optional chips to filter by goal or fund (derived from existing entries)
- [x] Search: `useMemo` filtering entries by keyword matching `whyBought`, `role`, `exitTrigger`, `notes`, `fundName`
- [x] Loading state: skeleton cards while `loading === true`
- [x] Empty state: "No journal entries yet. Start by writing your first investment decision note."
- [x] Toast on save: `addToast({ title: 'Entry saved' })`
- [x] Toast on delete: `addToast({ title: 'Entry deleted' })`

### 5. Wire from Goal Detail and Fund Detail pages

- [x] Goal Detail (`/goals/$goalId`): add "Journal" tab or link that navigates to `/journal` with `?goalId=X` pre-selected
- [x] Fund Detail (`/scorecard/$schemeCode`): add "Write Journal Note" button that navigates to `/journal` with `?fundName=X` pre-selected
- [x] Journal page reads query params: `URLSearchParams` to pre-fill goalId/fundName in editor

### 6. Tests

- [x] Unit test `src/features/journal/hooks/useJournal.ts`:
  - filterEntries: search by fundName, whyBought, role, exitTrigger, notes (case-insensitive, empty query, no match, undefined fields)
  - validateEntry: valid with fundName/goalId/reviewId, error with no tags, error with invalid goalId

## Dev Notes

### Previous Story Intelligence (5.2 — Review Checklist Flow)

- **Toast pattern:** `import { useToast } from '@/components/ui/toast'`, then `const { addToast } = useToast()`, call `addToast({ title: '...' })` on success, `addToast({ title: '...', variant: 'destructive' })` on error
- **Dexie write pattern:** `useCallback` wrapping `db.transaction('rw', db.table, async () => { ... })` for atomic writes — follow `useReviewSubmit.ts` pattern
- **Form state:** controlled inputs with `useState`, validation on submit — follow `GoalForm.tsx` pattern
- **Loading sentinel:** `loading = entries === undefined` from `useLiveQuery` — exactly as `useGoals.ts`
- **Error handling:** wrap db writes in `try/finally` for `setSubmitting` cleanup
- **Date format:** ISO 8601 date-only strings (`new Date().toISOString().split('T')[0]`) for `nextReviewDate`, full ISO for `createdAt`
- All 105 tests pass, TypeScript clean

### Architecture

- **Route:** `/journal` already registered in `routeTree.gen.ts` — placeholder exists at `src/routes/journal/index.tsx`
- **DB:** `Journal` interface (line 50-61 in `db.ts`) and `journals` table exist in ALL Dexie versions (1-5) — **no schema migration needed**
- **Feature boundary:** `features/journal/` — owns all journal hooks and components
- **Cross-feature:** Journal references goals and reviews by ID — import `db.goals` and `db.reviews` directly via Dexie (shared data store, not cross-feature import)
- **Sidebar:** Journal link already in `Sidebar.tsx` at `/journal`
- **AppShell:** Title mapping `'/journal': 'Journal'` already configured

### Files to Create

| File | Purpose |
|------|---------|
| `src/features/journal/hooks/useJournal.ts` | CRUD hook with useLiveQuery |
| `src/features/journal/components/JournalEditor.tsx` | Structured entry form |
| `src/features/journal/components/JournalTimeline.tsx` | Reverse-chronological entry list |

### Files to Modify

| File | Change |
|------|--------|
| `src/routes/journal/index.tsx` | Replace placeholder with full journal page |
| `src/routes/goals/$goalId.tsx` | Add journal link/navigation (optional — query param flow) |
| `src/routes/scorecard/$schemeCode.tsx` | Add journal link/navigation (optional — query param flow) |

### Existing Patterns to Follow

- **Hook pattern:** `useLiveQuery` from `dexie-react-hooks` for reactive reads, `useCallback` for mutation ops, return `{ data, loading, createFn, updateFn, deleteFn }` — see `src/features/goals/hooks/useGoals.ts:21-66`
- **Form pattern:** Controlled state with `useState` per field, validation on submit, `setSubmitting` + try/finally, sessionStorage draft if desired — see `src/features/goals/components/GoalForm.tsx:22-80`
- **Card layout:** shadcn `Card`, `CardHeader`, `CardContent` — see `src/routes/reviews/checklist.tsx`
- **Badge variants:** `default` (gray), `outline` (tags), `destructive` (warnings) — from `src/components/ui/badge.tsx`
- **Date display:** `Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(isoString))`
- **Input:** shadcn `Input` with `type="search"`, `type="date"` — from `src/components/ui/input.tsx`
- **Textarea:** shadcn `Textarea` (import from `@/components/ui/textarea` if installed, or use native `<textarea>` with Tailwind classes)
- **Icons:** `lucide-react` — `Search`, `Plus`, `Pencil`, `Trash2`, `BookOpen`, `Calendar`, `Target`, `Flag`
- **Select:** shadcn `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` — see GoalForm.tsx
- **Query params:** `useSearch` from `@tanstack/react-router` to read `?goalId=X` or `?fundName=X`

### Search Implementation Notes

- Pure client-side filtering — no Dexie query change, no API call
- `useMemo` recomputes when `entries` or `searchQuery` changes
- Match logic: `.toLowerCase().includes(searchQuery.toLowerCase())` across all text fields
- If `goalId` or `fundName` query param present, pre-filter to those entries AND allow search within that subset
- Tag filter chips: extract unique `goalId` and `fundName` values from entries, show as toggleable `Badge` chips

### Testing Notes

- Test `useJournal` hook behavior: create, read, update, delete operations
- Test search filtering logic (extract pure function: `filterEntries(entries, query) → Journal[]`)
- Test validation: no tags → error, valid tags → success
- Pattern: extract pure functions for unit testing, mock Dexie for integration — see `useReviewSteps.test.ts`

### References

- [Source: epics.md#Story-5.3] — Full ACs and user story
- [Source: architecture.md#Data-Architecture] — Dexie schema, feature boundaries
- [Source: architecture.md#Frontend-Architecture] — Route structure, feature module conventions
- [Source: architecture.md#Requirements-to-Structure-Mapping] — Journal route → features/journal mapping
- [Source: stores/db.ts] — Existing Journal interface (line 50), journals table in all 5 Dexie versions
- [Source: 5-2-review-checklist-flow.md] — Previous story patterns: toast, Dexie writes, form state, loading sentinels
- [Source: src/features/goals/hooks/useGoals.ts] — useLiveQuery + CRUD hook pattern to follow
- [Source: src/features/goals/components/GoalForm.tsx] — Controlled form with validation pattern
- [Source: src/features/reviews/hooks/useReviewSubmit.ts] — Dexie transaction write pattern

## Dev Agent Record

### Agent Model Used

### Debug Log References
- All 119 tests pass (14 new + 105 existing)
- TypeScript compilation clean
- No lint errors

### Completion Notes List
- Created useJournal hook with useLiveQuery for reactive journal CRUD (create, update, delete, list — sorted by createdAt desc)
- Extracted pure functions: filterEntries (keyword search across all text fields) + validateEntry (tag validation, invalid goalId check)
- Created JournalEditor component with 8 structured fields: Fund name, Goal (select), Review (select), Why bought, Role, Exit trigger, Next review date, Notes
- Created JournalTimeline component with reverse-chronological display, tag badges, review linking, edit/delete actions, empty states
- Implemented Journal route page with search bar, toggleable editor, client-side filtering via useMemo, skeleton loading, toast notifications
- Wired Goal Detail → Journal via dropdown menu action (pre-fills goalId via query param)
- Wired Fund Detail → Journal via "Write Journal Note" button (pre-fills fundName via query param)
- 14 unit tests for filterEntries (8 tests) and validateEntry (6 tests)

### File List
- `src/features/journal/hooks/useJournal.ts` — new: CRUD hook + filterEntries/validateEntry pure functions
- `src/features/journal/hooks/useJournal.test.ts` — new: 14 unit tests
- `src/features/journal/components/JournalEditor.tsx` — new: structured entry form
- `src/features/journal/components/JournalTimeline.tsx` — new: reverse-chronological timeline
- `src/routes/journal/index.tsx` — modified: full journal page (replaced placeholder)
- `src/routes/goals/$goalId.tsx` — modified: added Journal dropdown action
- `src/features/scorecard/components/FundDetail.tsx` — modified: added Write Journal Note button

### Review Findings

- [x] [Review][Patch] Replace `window.open` with `useNavigate` in FundDetail [FundDetail.tsx:263] — Uses full page reload instead of SPA navigation. Goal Detail already uses proper `navigate()`.
- [x] [Review][Patch] Add `deleting` state guard to prevent double-click on delete [journal/index.tsx:115-121] — No loading/noop guard, rapid clicks fire multiple `deleteEntry` calls.
- [x] [Review][Patch] Add confirmation dialog before deleting journal entries [JournalTimeline.tsx:73] — Trash icon deletes immediately with no confirmation. Destructive action should follow GoalDetail Dialog pattern.
- [x] [Review][Patch] Fix JournalEditor `initialData` type to `Partial<Journal>` [JournalEditor.tsx:14] — Route passes fabricated object with `createdAt: ''` but initialData is typed as full `Journal`.
- [x] [Review][Defer] Stale select options after external data change [JournalEditor.tsx:111-128] — If a goal/review is deleted while editor is open, selected value no longer exists in dropdown. Pre-existing pattern, unlikely in single-user MVP.
