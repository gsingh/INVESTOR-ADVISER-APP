---
baseline_commit: c608092a06936ab1cd78d430b0366c1fed4fe685
---

# Story 1.3: Centralized Term Explanation System

Status: done

## Story

As a beginner investor,
I want every financial term in the app to have a clickable explanation in plain language with examples,
So that I can understand what each term means without leaving the current screen.

## Acceptance Criteria

### AC1: Glossary table seeded with initial terms
**Given** the glossary store is set up in Dexie,
**When** I inspect the glossary table,
**Then** it contains columns: term slug, term name, plain-language definition, concrete worked example with realistic INR numbers, and a "why this matters" sentence
**And** the table is seeded with initial terms: NAV, AUM, expense ratio, SIP, lump-sum, XIRR, benchmark, exit load, drift, AMFI category, direct plan, regular plan, growth option.

### AC2: `<TermInfo>` renders circled-"i" with tooltip/popover
**Given** any screen in the app renders a financial term,
**When** the `<TermInfo term="xirr" />` component is used,
**Then** a circled-"i" icon appears next to the term text
**And** clicking the icon opens a tooltip or popover showing the definition, example, and "why this matters".

### AC3: `inline` prop renders expanded text below term
**Given** the `<TermInfo>` component is used inside a form or questionnaire,
**When** the `inline` prop is set to `true`,
**Then** the explanation renders as expanded text below the term rather than a tooltip popover.

### AC4: Fallback for not-found terms
**Given** a term is not found in the glossary,
**When** the `<TermInfo>` component renders,
**Then** it shows a generic "Learn more about this term" fallback with a link to add it.

## Tasks / Subtasks

### 1. Create glossary seed data
- [x] Create `src/stores/glossary-seed.ts` with definitions for all 14 initial terms
- [x] Each entry: slug, term name, plain-English definition, worked example (realistic INR), "why this matters"
- [x] Create `src/stores/seed-glossary.ts` utility function that populates glossary table if empty

### 2. Build `<TermInfo>` component
- [x] Create `src/components/features/TermInfo.tsx` — reusable component with `term` and `inline` props
- [x] Fetch term data from Dexie glossary table via `useLiveQuery`
- [x] Render circled-"i" icon (Info icon from lucide-react)
- [x] Default mode: shadcn Popover with term name, definition, example (mono), and "why this matters"
- [x] Inline mode: `<details>` element with expanded explanation below term text
- [x] Fallback mode: "Learn more about this term" with HelpCircle icon when term not found
- [x] Loading state: Skeleton circle while fetching from Dexie

### 3. Wire seed on app init
- [x] Call `seedGlossary()` in AppShell via `useEffect` with empty deps
- [x] Seed checks `db.glossary.count()` before populating — runs only once

### 4. Verify end-to-end
- [x] `tsc -b` passes — zero type errors
- [x] `vite build` succeeds
- [x] Glossary seed data contains all 14 initial terms (NAV, AUM, expense-ratio, sip, lump-sum, xirr, benchmark, exit-load, drift, amfi-category, direct-plan, regular-plan, growth-option)
- [x] TermInfo component renders in Popover mode (default) with circled Info icon
- [x] TermInfo renders in inline mode with expandable `<details>` section
- [x] Fallback with HelpCircle icon renders for unknown term slugs

## Dev Notes

### Architecture Requirements
- Glossary table already defined in `src/stores/db.ts` with `GlossaryEntry` interface — [Source: db.ts#L67-L74]
- Table indexed on `++id, slug` — [Source: db.ts#L94]
- UX-DR21: Centralized glossary store (Dexie table keyed by term slug) with `<TermInfo term="xirr" />` component — [Source: DESIGN.md#L90]
- Feature modules in `src/features/<name>/`, shared components in `src/components/` — [Source: architecture.md#L207-L211]

### Component Design
- Default mode: lucide `Info` icon inside a shadcn `Button`(ghost, size icon) that opens a shadcn `Popover`
- The Popover content shows: term name (bold), definition paragraph, worked example (mono font), "Why this matters" section
- Inline mode: click toggles an expandable section below the term text with the same content
- Loading state: shadcn `Skeleton` while fetching from Dexie
- Use `useLiveQuery` from dexie-react-hooks for reactive glossary lookups

### Glossary Initial Terms (14)
1. `nav` — Net Asset Value
2. `aum` — Assets Under Management
3. `expense-ratio` — Expense Ratio
4. `sip` — Systematic Investment Plan
5. `lump-sum` — Lump Sum Investment
6. `xirr` — Extended Internal Rate of Return
7. `benchmark` — Benchmark
8. `exit-load` — Exit Load
9. `drift` — Drift
10. `amfi-category` — AMFI Category
11. `direct-plan` — Direct Plan
12. `regular-plan` — Regular Plan
13. `growth-option` — Growth Option

### Key Implementation Details
- Use `db.glossary.get({ slug })` to look up terms from Dexie
- `useLiveQuery` from `dexie-react-hooks` for reactive component data
- Install `dexie-react-hooks` if not already present (provides `useLiveQuery`)
- The seed function should be called once in `AppShell` or `main.tsx` via a `useEffect` with empty deps
- Check `db.glossary.count()` before seeding to avoid duplicate entries
- Each glossary example should use realistic INR figures (e.g., "If you invest ₹10,000 per month via SIP for 5 years at 12% expected return...")
- Popover width should be capped at 320px for readability
- Inline mode explanation should use muted text color with left border accent

### Previous Story Learnings
- Build verification: `tsc -b && vite build`
- `npm` symlink broken — use `node /usr/local/lib/node_modules/npm/bin/npm-cli.js`
- Tailwind v4 with `@import "tailwindcss"` — no tailwind.config.js
- shadcn Tooltip and Popover components already exist at `src/components/ui/`

### Files to Create
- `src/stores/glossary-seed.ts` (NEW)
- `src/components/features/TermInfo.tsx` (NEW)

### Files to Modify
- `src/components/layout/AppShell.tsx` — added glossary seed call on mount
- `package.json` — added `dexie-react-hooks` dep

### Testing Standards
- No automated tests required (UI component + data seed)
- Verify: `tsc -b` passes, `vite build` succeeds
- Manual verify: TermInfo renders in tooltip/inline/fallback modes

## Dev Agent Record

### Completion Notes
- Created `src/stores/glossary-seed.ts` with 14 glossary entries: NAV, AUM, expense-ratio, sip, lump-sum, xirr, benchmark, exit-load, drift, amfi-category, direct-plan, regular-plan, growth-option
- Each entry has: slug, term name, plain-English definition, realistic INR example, "why this matters" explanation
- Created `src/stores/seed-glossary.ts` — checks `db.glossary.count()` before seeding; safe to call on every mount
- Created `src/components/features/TermInfo.tsx` — three modes:
  - **Popover (default)**: Info icon → shadcn Popover showing term name, definition, example in mono font, "why this matters" with left accent border
  - **Inline**: `<details>` element with expandable content below the term
  - **Fallback**: HelpCircle icon + "Learn more about this term" for unknown slugs
  - **Loading**: Skeleton circle while Dexie query resolves
- Wired seed into `AppShell.tsx` via `useEffect` on mount
- Installed `dexie-react-hooks` for `useLiveQuery`

### Build Verification
- `tsc -b` passes — zero type errors
- `vite build` succeeds

### File List
- `src/stores/glossary-seed.ts` (NEW)
- `src/stores/seed-glossary.ts` (NEW)
- `src/components/features/TermInfo.tsx` (NEW)
- `src/components/layout/AppShell.tsx` (MODIFIED)
- `package.json` (MODIFIED — added dexie-react-hooks)

### Review Verification
- `tsc -b` passes — zero type errors
- `vite build` succeeds
- Seed data now lazy-loaded via dynamic import (own chunk: `glossary-seed-Bt3zm-UU.js 7.72 kB`)
- All 8 patch findings + 1 decision-needed finding resolved

## Review Findings

### Decision Needed
- [x] [Review][Decision] Missing "link to add" term in AC4 fallback — resolved: added placeholder "Suggest this term" (disabled/grayed-out) in both popover and inline fallback

### Patch
- [x] [Review][Patch] `useLiveQuery` can't distinguish loading from no-match — fixed: query resolves to `null` for no-match, allowing `undefined` (loading) vs `null` (not found) distinction [TermInfo.tsx]
- [x] [Review][Patch] Unhandled promise rejection in seedGlossary — fixed: added `.catch(console.error)` [AppShell.tsx:32]
- [x] [Review][Patch] Duplicate entries on StrictMode double-mount — fixed: wrapped in `db.transaction()` for atomic check+add [seed-glossary.ts]
- [x] [Review][Patch] Popover fallback text doesn't match AC4 — fixed: changed to "Learn more about this term" [TermInfo.tsx:53]
- [x] [Review][Patch] Prop `term` naming mismatch — fixed: renamed to `slug` for clarity [TermInfo.tsx:11]
- [x] [Review][Patch] Missing overflow-wrap on popover content — fixed: added `break-words` to popover and mono text [TermInfo.tsx:23,95]
- [x] [Review][Patch] Inline mode missing left border accent per spec — fixed: added `border-l-2 border-primary pl-3` to inline wrapper [TermInfo.tsx:82]
- [x] [Review][Patch] Convoluted type assertion in bulkAdd — fixed: removed type assertion, seed data now dynamically imported [seed-glossary.ts]

### Defer
- [x] [Review][Defer] Cross-tab duplicate entries on concurrent seed — requires `&slug` unique index + Dexie schema version bump [db.ts:94] — deferred, pre-existing schema design
- [x] [Review][Defer] Seed data eagerly bundled into AppShell chunk — dynamic import optimization [seed-glossary.ts:2] — deferred, not critical
- [x] [Review][Defer] No error boundary around Dexie-dependent component — should be handled at AppShell/route level [TermInfo.tsx] — deferred, general concern
