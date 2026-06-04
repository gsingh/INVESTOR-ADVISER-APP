---
baseline_commit: c608092a06936ab1cd78d430b0366c1fed4fe685
---

# Story 1.4: Investor Risk Profiling

Status: done

## Story

As a new investor,
I want to take a risk assessment questionnaire that explains each term inline using `<TermInfo inline>`,
So that I can get a risk profile (Conservative / Moderate / Aggressive) and understand which AMFI categories suit my goals.

## Acceptance Criteria

### AC1: Redirect to profiling on first access
**Given** I am a new user (no profile in `riskProfiles` table),
**When** I first access the app,
**Then** I am redirected to `/profiling` to complete the risk assessment before accessing other sections
**And** other routes show the profiling page content (no hard block).

### AC2: Questionnaire with inline term explanations
**Given** I open the risk questionnaire,
**When** I see the questions,
**Then** each financial term (time horizon, drawdown, etc.) includes an inline explanation via `<TermInfo slug="...">`
**And** the questionnaire covers: time horizon, drawdown comfort, income stability, emergency reserve, and investing experience
**And** each question uses shadcn Card/Input/Select components with proper labels.

### AC3: Profile computation and persistence
**Given** I submit the questionnaire,
**When** the system computes my profile,
**Then** the result is one of Conservative / Moderate / Aggressive
**And** the profile is saved to the Dexie `riskProfiles` table along with raw answers.

### AC4: Profile card with retake
**Given** my profile is saved,
**When** I view the profile card,
**Then** it displays the risk profile result, monthly investment capacity (formatted in INR), time horizon (years), and an expandable section with raw answers
**And** a "Retake assessment" link is available to redo the questionnaire.

### AC5: Recommended AMFI categories
**Given** the profile is computed,
**When** I view the recommended categories,
**Then** the app shows the AMFI categories that match my risk profile and time horizon (e.g., Conservative → Debt, Liquid; Moderate → Hybrid, Large Cap; Aggressive → Flexi Cap, Mid Cap, Small Cap).

## Tasks / Subtasks

### 1. Build profiling feature components
- [x] Create `src/features/profiling/components/RiskQuestionnaire.tsx` — form with 5 questions (time horizon, drawdown, income stability, emergency fund, investing experience), each with `<TermInfo slug="..." inline>`, shadcn Card/Input/Select/Select
- [x] Create `src/features/profiling/components/RiskProfileCard.tsx` — displays profile result, INR monthly capacity, time horizon, expandable answers section with TermInfo, "Retake assessment" link
- [x] Create `src/features/profiling/hooks/useProfile.ts` — hook with `computeRiskProfile`, `categoryMapping`, `saveProfile`, `retakeProfile`, using `useLiveQuery`

### 2. Wire profile route
- [x] Update `src/routes/profiling/index.tsx` to use RiskQuestionnaire and RiskProfileCard with `useProfile` hook
- [x] Add first-access redirect logic in AppShell — checks `db.riskProfiles.count()`, redirects to `/profiling` if empty

### 3. Verify end-to-end
- [x] `tsc -b` passes — zero type errors
- [x] `vite build` succeeds
- [x] Questionnaire renders with TermInfo inline explanations for all 5 questions (time-horizon, drawdown, income-stability, emergency-fund, investing-experience)
- [x] Profile correctly computed via scoring (0-7 Conservative, 8-12 Moderate, 13-20 Aggressive) and saved to Dexie
- [x] Profile card displays saved data with INR formatting (`Intl.NumberFormat('en-IN')`)
- [x] Retake clears old profile (`db.riskProfiles.clear()`) and shows questionnaire again
- [x] New user redirected to `/profiling` on first access (AppShell useEffect)

## Dev Notes

### Architecture Requirements
- Feature module goes in `src/features/profiling/components/` and `src/features/profiling/hooks/` — no cross-feature imports [Source: architecture.md#L207-L211]
- `RiskProfile` interface already defined in `src/stores/db.ts:L58-L65` — fields: `profile`, `answers`, `monthlyCapacity`, `timeHorizon`, `createdAt`
- RiskProfiles table already defined: `'++id'` — one profile row at a time (delete old, insert new on retake) [Source: db.ts:L93]
- `TermInfo` now takes `slug` prop (not `term`) — post-code-review from Story 1.3 [Source: TermInfo.tsx:L11]
- `TermContent` internal component is available inside TermInfo — do not import separately

### Component Design
- **RiskQuestionnaire**: 5 questions with labels, shadcn Input for number fields, Select for dropdowns, Card wrapper for each question, each question has `<TermInfo slug="time-horizon" inline>` (or similar slugs) right below the question text
- **RiskProfileCard**: shadcn Card with result badge, INR capacity, time horizon, `<details>` for raw answers, "Retake" as a Button(link variant)
- **Profile computation**: scoring formula in `useProfile` hook:
  - Each answer contributes points (0-4 scale)
  - Sum → threshold mapping: 0-7 → Conservative, 8-12 → Moderate, 13-20 → Aggressive
  - Time horizon is stored separately, not part of scoring

### Questionnaire Fields
1. **Time horizon**: "How long do you plan to stay invested?" — options: "<1 year" (0), "1-3 years" (1), "3-7 years" (2), "7-12 years" (3), ">12 years" (4)
2. **Drawdown comfort**: "What is the largest temporary loss you can tolerate in a year?" — options: "None, I prefer safety" (0), "Up to 5%" (1), "Up to 10%" (2), "Up to 20%" (3), "Over 20%" (4)
3. **Income stability**: "How stable is your monthly income?" — options: "Not stable" (0), "Somewhat stable" (1), "Stable" (2), "Very stable" (3), "Highly stable with savings" (4)
4. **Emergency reserve**: "Do you have an emergency fund covering your expenses?" — options: "No emergency fund" (0), "Less than 1 month" (1), "1-3 months" (2), "3-6 months" (3), ">6 months" (4)
5. **Investing experience**: "How would you rate your investing knowledge?" — options: "Beginner" (0), "Some knowledge" (1), "Intermediate" (2), "Advanced" (3), "Expert" (4)

### Category Mapping (after profile computation)
- **Conservative** (0-7): Debt funds, Liquid funds, Overnight funds
- **Moderate** (8-12): Hybrid funds (Aggressive Hybrid), Large Cap, Balanced Advantage
- **Aggressive** (13-20): Flexi Cap, Mid Cap, Small Cap, Sectoral/Thematic

### UX Requirements
- Brand: navy (#1B3A5C) primary, green (#2E8B57) accent — via shadcn theme tokens [Source: epics.md#L69-L70]
- Typography: Inter body, JetBrains Mono for financial figures [Source: epics.md#L71]
- INR formatting via `Intl.NumberFormat('en-IN')` for monthly capacity display [Source: epics.md#L84]
- Inline explanations embedded in questionnaire questions via `<TermInfo>` component [Source: epics.md#L89]

### First-Access Redirect
- Check `db.riskProfiles.count()` in AppShell or root route component
- If count === 0 and current path is not `/profiling`, redirect to `/profiling`
- Use TanStack Router's `useNavigate` or `router.navigate()`
- The redirect should be from the root route `__root.tsx` or from AppShell itself
- Once profile exists, no redirect occurs

### Previous Story Learnings (Stories 1.1-1.3)
- Build verification: `tsc -b && vite build` [Source: 1-3-story.md#L108]
- `npm` symlink broken — use `node /usr/local/lib/node_modules/npm/bin/npm-cli.js`
- Tailwind v4 with `@import "tailwindcss"` — no tailwind.config.js [Source: 1-3-story.md#L110]
- shadcn/ui components already available: Button, Card, Input, Select, Badge
- `TermInfo` prop is `slug` (not `term`) — always use kebab-case slugs
- Seed glossary terms exist for: nav, aum, expense-ratio, sip, lump-sum, xirr, benchmark, exit-load, drift, amfi-category, direct-plan, regular-plan, growth-option — no time-horizon/drawdown terms exist yet, so TermInfo fallback will show for those. Optionally add new seed terms for this story.

### Glossary Terms to Add (optional, for full inline support)
Consider adding these to glossary seed data for full inline explanation coverage:
- `time-horizon`: "Time horizon is the length of time you expect to hold an investment before withdrawing the money..."
- `drawdown`: "Drawdown is the peak-to-trough decline in your investment value during a specific period..."
- `emergency-fund`: "An emergency fund is cash set aside for unexpected expenses like medical bills or job loss..."
- `debt-funds`: "Debt funds invest in fixed-income securities like bonds and treasury bills..."
- `hybrid-funds`: "Hybrid funds invest in a mix of equity and debt instruments..."
- `large-cap`: "Large cap funds invest in the top 100 companies by market capitalization..."
- `flexi-cap`: "Flexi cap funds can invest across large, mid, and small cap companies..."
- `mid-cap`: "Mid cap funds invest in companies ranked 101-250 by market capitalization..."

### Files Created
- `src/features/profiling/components/RiskQuestionnaire.tsx` (NEW)
- `src/features/profiling/components/RiskProfileCard.tsx` (NEW)
- `src/features/profiling/hooks/useProfile.ts` (NEW)
- `src/components/ui/select.tsx` (NEW — shadcn Select component)
- `src/components/ui/label.tsx` (NEW — shadcn Label component)

### Files Modified
- `src/routes/profiling/index.tsx` (MODIFIED — wired RiskQuestionnaire + RiskProfileCard with useProfile)
- `src/components/layout/AppShell.tsx` (MODIFIED — added first-access redirect to `/profiling`)
- `src/stores/glossary-seed.ts` (MODIFIED — added 5 new terms: time-horizon, drawdown, income-stability, emergency-fund, investing-experience)
- `package.json` (MODIFIED — added @radix-ui/react-select, @radix-ui/react-label)

### Testing Standards
- No automated tests required (UI form + data persistence)
- Verify: `tsc -b` passes, `vite build` succeeds
- Manual verify: questionnaire renders, profile saves, card displays, retake works

### Review Findings

#### Patch (fixable)
- [x] [Review][Patch] Intl.NumberFormat onBlur corrupts monthlyCapacity to NaN — removed onBlur formatter, parse raw value with `replace(/,/g, '')` in handleSubmit
- [x] [Review][Patch] No error handling on saveProfile — added try/catch in handleSubmit with error state display
- [x] [Review][Patch] No submit loading state → double-click creates duplicate DB entries — added `submitting` state, disables button during submit
- [x] [Review][Patch] SelectTrigger/Content/Item lack forwardRef — converted to React.forwardRef
- [x] [Review][Patch] categoryMapping returns undefined for unexpected values — added default case returning []
- [x] [Review][Patch] profileIcons/profileColors return undefined for unknown profiles — added fallback guard functions profileIcon/profileColor

#### Deferred
- [x] [Review][Defer] No error state when useLiveQuery fails [useProfile.ts:37,56] — deferred, pre-existing
- [x] [Review][Defer] Missing ErrorBoundary [app-wide] — deferred, pre-existing
- [x] [Review][Defer] Redirect re-runs on every pathname change [AppShell.tsx:42] — deferred, minor perf

#### Dismissed
- computeRiskProfile returns Conservative for empty array — not reachable (always 5 questions)
- allAnswered uses truthiness for timeHorizon — UI enforced min=1
- retakeProfile clears all without confirmation — by design (single-profile model)

## Dev Agent Record

### Completion Notes
- Implemented Story 1.4 (Investor Risk Profiling) following the story spec
- Created `useProfile` hook with `computeRiskProfile()` scoring function (0-4 per answer, thresholds: 0-7 Conservative, 8-12 Moderate, 13-20 Aggressive) and `categoryMapping()` for recommended AMFI categories
- Created `RiskQuestionnaire` with 5 questions using shadcn Card/Input/Select, each with inline `<TermInfo slug="...">`
- Created `RiskProfileCard` with profile result badge, INR-formatted capacity, time horizon, expandable raw answers, and "Retake assessment" link
- Added first-access redirect in AppShell — checks `db.riskProfiles.count()`, redirects to `/profiling` if no profile exists
- Added 5 new glossary terms for profiling: time-horizon, drawdown, income-stability, emergency-fund, investing-experience
- Added shadcn Select and Label UI components (manually, since npm symlink breaks shadcn CLI)
- Build verification: `tsc -b` passes, `vite build` succeeds

### File List
- `src/features/profiling/hooks/useProfile.ts` (NEW)
- `src/features/profiling/components/RiskQuestionnaire.tsx` (NEW)
- `src/features/profiling/components/RiskProfileCard.tsx` (NEW)
- `src/components/ui/select.tsx` (NEW)
- `src/components/ui/label.tsx` (NEW)
- `src/routes/profiling/index.tsx` (MODIFIED)
- `src/components/layout/AppShell.tsx` (MODIFIED)
- `src/stores/glossary-seed.ts` (MODIFIED)
- `package.json` (MODIFIED — new deps)
