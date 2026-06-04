---
---

# Story 2.2: Goal-to-Category Mapping & SIP Calculator

Status: done
baseline_commit: NO_VCS

## Story

As Boss,
I want to see recommended fund categories based on my risk profile and time horizon, and use a SIP calculator to plan monthly contributions,
So that I know where to invest and how much to set aside each month.

## Acceptance Criteria

1. **Given** I open the Goal Detail page for a goal, **When** the category allocator loads, **Then** it shows recommended AMFI categories based on my risk profile and goal time horizon, and each category recommendation includes a `<TermInfo>` explanation.

2. **Given** I override a suggested category, **When** I select a different category, **Then** the replaced category is shown with strikethrough and a "custom override" label, and the new selection is saved.

3. **Given** I open the SIP Calculator on the Goal Detail page, **When** I enter target amount, target date, starting amount, expected inflation, and monthly contribution, **Then** the calculator shows the required monthly SIP under 3 return scenarios (conservative 6%, moderate 8%, optimistic 10%).

4. **Given** the SIP Calculator has computed results, **When** I view the chart, **Then** a Recharts line chart shows 3 projection lines (conservative/moderate/optimistic), a horizontal dashed target line, and an amber highlighted gap if a shortfall exists, and a legend is shown below the chart.

5. **Given** there is a shortfall, **When** the gap indicator displays, **Then** it shows: "Current projection ₹X vs target ₹Y. Increase monthly SIP by ₹Z to close the gap at 8% return." And the gap indicator is green (on track), amber (minor gap), or red (significant gap) with an "Adjust SIP" action button.

## Tasks

### 0. Prerequisites
- [x] Verify Recharts is installed (already in package.json from scaffold)
- [x] Verify `src/lib/category-taxonomy.ts` exists with AMFI category taxonomy (Zod schema + static JSON) — needed for category allocator. Create if missing.

### 1. SIP Calculator Engine — Pure Function (`src/lib/sip-calculator.ts`)
- [x] Export `calculateSIP(params)` pure function — no React/DOM imports, testable with Vitest
- [x] Input: `{ targetAmount, targetDate, startingAmount, expectedInflation, monthlyContribution }` — all in INR integers, targetDate as ISO string
- [x] Output: `{ scenarios: Array<{ label, rate, monthlySIP, projectedValue }>, gap: { amount, status, suggestedIncrease } }`
- [x] Three return scenarios: conservative 6%, moderate 8%, optimistic 10% (as decimals: 0.06, 0.08, 0.10)
- [x] Projection formula: FV of startingAmount (lump-sum) + FV of SIP (monthly annuity)
- [x] Compute `n` (months) from targetDate - now. Compute `r` as monthly rate = (1 + annualRate)^(1/12) - 1
- [x] Gap: projectedValue - targetAmount. Negative = shortfall. Status: 'on_track' if projectedValue >= targetAmount, 'minor_gap' if shortfall < 20% of target, 'significant_gap' if shortfall >= 20%
- [x] Handle edge: target date in past → `{ scenarios: [], gap: { status: 'past_due' } }`

### 2. SIP Calculator Tests (`src/lib/sip-calculator.test.ts`)
- [x] Test 1: standard calculation — reasonable inputs produce expected ranges for each scenario
- [x] Test 2: on-track scenario — monthly contribution exceeds required for moderate rate
- [x] Test 3: shortfall scenario — low monthly contribution produces negative gap
- [x] Test 4: past-due target date returns `past_due` status
- [x] Test 5: zero starting amount still produces valid projections
- [x] Test 6: targetDate = today yields 0 months, returns scenarios with 0 projected gains

### 3. Goal-to-Category Mapping Logic (`src/features/goals/hooks/useCategoryMapping.ts`)
- [x] Export `useCategoryMapping(goalId: number)` hook
- [x] Load risk profile from Dexie `riskProfiles` table (latest entry). If none exists, category allocator shows prompt
- [x] Compute time horizon from goal's `targetDate` — difference in years from now
- [x] Map (riskProfile, timeHorizonYears) → recommended AMFI categories with target allocation %
- [x] Return `{ recommendations, loading, error, saveOverride }`
- [x] `recommendations`: array of `{ category, allocation, termSlug, isOverride, originalCategory }`
- [x] `saveOverride(category, newCategory)`: updates `goal.categoryAllocation` in Dexie
- [x] Include `<TermInfo>` slug per category

### 4. Category Allocator UI (`src/features/goals/components/CategoryAllocator.tsx`)
- [x] Props: `goalId: number`
- [x] Section title: "Recommended Categories" with subtitle
- [x] Shows recommended categories as a list: category name, target allocation %, `<TermInfo>` icon
- [x] Each row has a "Change button" with Select dropdown
- [x] Overridden categories show: line-through + "custom override" badge
- [x] Loading state: 3 Skeleton rows
- [x] Error state: if no risk profile → "Complete your risk profile" with link to /profiling
- [x] Empty state: if no recommendations → "Unable to determine category recommendations"

### 5. SIP Calculator UI (`src/features/goals/components/SIPCalculator.tsx`)
- [x] Props: `goalId: number` (reads goal data from Dexie via useLiveQuery)
- [x] Section title: "SIP Calculator" with input fields
- [x] "Calculate" button triggers computation
- [x] Results card with 3 scenario rows (label, required SIP, projected value)
- [x] Chart section: Recharts `LineChart` with 3 lines, dashed target, amber gap
- [x] Gap indicator card with green/amber/red state and "Adjust SIP" button
- [x] Empty/initial state with explanatory text
- [x] Past-due warning when target date has passed

### 6. Wire into Goal Detail Page (`src/routes/goals/$goalId.tsx`)
- [x] Import and render `<SIPCalculator goalId={goalId} />` below progress bar
- [x] Import and render `<CategoryAllocator goalId={goalId} />` replacing placeholder
- [x] Both components receive goal ID from route params

### 7. Category Taxonomy Foundation (`src/lib/category-taxonomy.ts`)
- [x] Export Zod schema for AMFI super-categories
- [x] Export static taxonomy: 5 super-categories with sub-category lists
- [x] Helper functions: `getSuperCategory`, `categoryTermSlugs`

### 8. Sprint status
- [x] Update `sprint-status.yaml` — set `2-2-goal-to-category-mapping-sip-calculator` to `review`

## Dev Notes

### Relevant Architecture Patterns & Constraints
- **Feature isolation**: All goal logic in `src/features/goals/`. SIPCalculator and CategoryAllocator components live in `src/features/goals/components/`. No cross-feature imports — share through `src/lib/` or `src/types/`.
- **SIP calculator**: Pure function in `src/lib/sip-calculator.ts` — ZERO React/DOM imports. Testable standalone with Vitest.
- **Category taxonomy**: `src/lib/category-taxonomy.ts` (Zod schema + static JSON). Create if not present — referenced by screener, scorecard, and goals modules.
- **Risk profile data**: Read from Dexie `riskProfiles` table via `db.riskProfiles` — already defined in `src/stores/db.ts`.
- **Goal data**: Use `useLiveQuery` to read goal from `db.goals`. `categoryAllocation` field is `Record<string, number>` on the Goal interface.
- **Recharts**: Already in package.json. Use `LineChart`, `Line`, `XAxis`, `YAxis`, `Tooltip`, `Legend`, `ReferenceLine`, `ReferenceArea`, `ResponsiveContainer`.
- **Chart styling**: Use DESIGN.md brand colors — green (#2E8B57) for positive/optimistic, amber (#F59E0B) for conservative/warning, red (#DC2626) for danger/target line.
- **Formatting**: Use existing `formatINR`, `formatPercentage` from `src/lib/formatters.ts` for all currency/percentage display.
- **TermInfo**: Use existing `<TermInfo slug="..." />` component for financial term tooltips on category names.
- **Form validation**: On blur (not keystroke) — consistent with Story 2.1 pattern.
- **SessionStorage**: Not needed for this story — category overrides saved to Dexie, SIP calculator is ephemeral computation (no draft needed).
- **All amounts**: INR integers. Display with `formatINR`. Percentages as decimals stored.

### Existing Patterns to Follow (from Story 2.1)
- Components use shadcn/ui primitives — `Button`, `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Input`, `Label`, `Select`, `Skeleton`, `Badge`
- Icons from lucide-react — `Calculator`, `Target`, `AlertTriangle`, `ArrowRight`, `CheckCircle2`, `Pencil`, `RefreshCw`
- Tailwind v4 utility classes
- `<TermInfo slug="term-name" />` for financial term tooltips
- Empty states with icon, message, and primary action button
- Skeleton loading states matching component layout
- Barrel export from `src/features/goals/index.ts` for new components and hooks

### Source Tree Components to Touch

| File | Action |
|---|---|
| `src/lib/sip-calculator.ts` | NEW — pure function SIP calculator |
| `src/lib/sip-calculator.test.ts` | NEW — Vitest tests (6+ test cases) |
| `src/lib/category-taxonomy.ts` | NEW — AMFI category taxonomy (if missing) |
| `src/features/goals/hooks/useCategoryMapping.ts` | NEW — category mapping hook |
| `src/features/goals/components/SIPCalculator.tsx` | NEW — SIP calculator UI |
| `src/features/goals/components/CategoryAllocator.tsx` | NEW — category allocator UI |
| `src/features/goals/index.ts` | MODIFIED — add barrel exports for new components/hooks |
| `src/routes/goals/$goalId.tsx` | MODIFIED — import and render SIPCalculator + CategoryAllocator |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | MODIFIED — update status |

### SIP Calculator Engine Details
```typescript
interface SIPParams {
  targetAmount: number       // INR
  targetDate: string         // ISO date
  startingAmount: number     // INR (currentAmount)
  expectedInflation: number  // as decimal (0.04 = 4%)
  monthlyContribution: number // INR per month
}

interface ScenarioResult {
  label: string              // "Conservative 6%"
  rate: number               // 0.06
  monthlySIP: number         // INR required per month
  projectedValue: number     // INR projected at target
}

interface GapResult {
  amount: number             // projectedValue - targetAmount (negative = shortfall)
  status: 'on_track' | 'minor_gap' | 'significant_gap' | 'past_due'
  suggestedIncrease: number  // additional monthly SIP needed at moderate rate
}

interface SIPResult {
  scenarios: ScenarioResult[]
  gap: GapResult
}
```

### Category Mapping Details
```typescript
interface CategoryRecommendation {
  category: string           // AMFI super-category name
  allocation: number         // target % as decimal (0.30 = 30%)
  termSlug: string           // for <TermInfo>
  isOverride: boolean
  originalCategory: string | null
}
```

### FX Math for SIP
- Monthly rate `r = (1 + annualRate)^(1/12) - 1`
- Number of months `n = ceil((targetDate - now) / (30.44 * 24 * 60 * 60 * 1000))` from now
- FV of startingAmount (lump sum): `startingAmount * (1 + r)^n`
- FV of SIP stream: `monthlyContribution * ((1 + r)^n - 1) / r * (1 + r)` (annuity due — paid at start of month)
- For required monthly SIP: solve `requiredSIP = (targetAmount - FV_starting) / FV_factor` where `FV_factor = ((1 + r)^n - 1) / r * (1 + r)`

### References
- [Source: epics.md:270-300] — Full Story 2.2 AC
- [Source: epics.md:96-98] — FR4 Goal-to-Category Mapping, FR5 Allocation Tracking
- [Source: EXPERIENCE.md:37-39] — Goal Detail & Category Allocator flows
- [Source: EXPERIENCE.md:83-84] — SIP Calculator + Gap Indicator behavioral spec
- [Source: DESIGN.md:195] — Progress bar, Drift indicator spec
- [Source: DESIGN.md:201] — SIP projection chart spec (3 lines, dashed target, amber gap)
- [Source: EXPERIENCE.md:166-181] — Flow 1: first-time goal setup with SIP planning
- [Source: architecture.md:297-301] — goals feature module structure
- [Source: architecture.md:202-218] — naming/formats/rules
- [Source: architecture.md:99-100] — Recharts for charting
- [Source: architecture.md:133] — Pure-function engines with Vitest
- [Source: stores/db.ts:3-15] — Goal interface (categoryAllocation field)
- [Source: stores/db.ts:58-65] — RiskProfile interface

### Testing Notes
- SIP calculator: pure function Vitest tests (6 cases in `src/lib/sip-calculator.test.ts`)
- Category allocator: logic is in `useCategoryMapping` hook — testable via Dexie query patterns (manual verification for v1)
- UI: manual testing — verify category recommendations change with risk profile, SIP chart renders correctly for various inputs
- Verify: stale goal dates, missing risk profile, zero amounts, extreme values (very large target, very short time horizon)

## Dev Agent Record

### Agent Model Used
Big Pickle

### Completion Notes
- Created `src/lib/sip-calculator.ts` — pure function with full FV math (monthly rate, lump-sum FV, SIP annuity FV, required SIP solver, monthly projection data for charting)
- Created `src/lib/sip-calculator.test.ts` — 7 Vitest tests covering standard calc, on-track, shortfall, past-due, zero starting amount, monthly data generation, suggested increase
- Created `src/lib/category-taxonomy.ts` — AMFI category taxonomy with Zod schema, 5 super-categories with sub-categories, helper functions
- Created `src/features/goals/hooks/useCategoryMapping.ts` — hook with 9-row riskProfile×timeHorizon mapping table, override save to Dexie
- Created `src/features/goals/components/CategoryAllocator.tsx` — UI with loading/error/empty states, category rows with Select override, custom override badge
- Created `src/features/goals/components/SIPCalculator.tsx` — full UI with inputs, 3-scenario results, Recharts LineChart (3 lines + dashed target + amber gap), gap indicator card with Adjust SIP button
- Updated `src/features/goals/index.ts` — added barrel exports for SIPCalculator, CategoryAllocator, useCategoryMapping
- Updated `src/routes/goals/$goalId.tsx` — wired SIPCalculator and CategoryAllocator into goal detail page
- TypeScript compiles clean, all 16 tests pass (7 new + 9 existing)

### File List
- `src/lib/sip-calculator.ts` — NEW — pure function SIP calculator with chart data
- `src/lib/sip-calculator.test.ts` — NEW — 7 Vitest tests
- `src/lib/category-taxonomy.ts` — NEW — AMFI category taxonomy
- `src/features/goals/hooks/useCategoryMapping.ts` — NEW — category mapping hook
- `src/features/goals/components/CategoryAllocator.tsx` — NEW — category allocator UI
- `src/features/goals/components/SIPCalculator.tsx` — NEW — SIP calculator UI
- `src/features/goals/index.ts` — MODIFIED — added barrel exports
- `src/routes/goals/$goalId.tsx` — MODIFIED — wired new components
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED — updated status

### Review Findings

#### Decision Needed *(resolved — user confirmed: make editable)*

#### Patch *(all fixed)*

- [x] [Review][Patch] Target amount & target date should be editable Input fields (AC3) [`src/features/goals/components/SIPCalculator.tsx`]
- [x] [Review][Patch] `expectedInflation` parameter never used in calculation [`src/lib/sip-calculator.ts:5`]
- [x] [Review][Patch] `monthsBetween` drift — proper calendar month arithmetic replacing 30.44-day approx [`src/lib/sip-calculator.ts:19`]
- [x] [Review][Patch] `monthlyData` loop off-by-one — `i < n` replaces `i <= n` [`src/lib/sip-calculator.ts:78`]
- [x] [Review][Patch] `saveOverride` stale closure — reads goal from DB inside callback, uses ref for recommendations [`src/features/goals/hooks/useCategoryMapping.ts:110`]
- [x] [Review][Patch] Category override key mismatch — `resolveCategory()` maps super-category to first sub-category in saveOverride [`src/features/goals/hooks/useCategoryMapping.ts`]
- [x] [Review][Patch] `handleOverride` async promise not awaited — wrapped in try/catch in onValueChange [`src/features/goals/components/CategoryAllocator.tsx:97`]
- [x] [Review][Patch] `categoryTermSlugs` complete — all ~30 sub-categories now mapped [`src/lib/category-taxonomy.ts:99`]
- [x] [Review][Patch] Direct DOM access `document.getElementById` → React ref [`src/features/goals/components/SIPCalculator.tsx:154`]
- [x] [Review][Patch] No `targetDate` validation — `isNaN(target.getTime())` guard in calculateSIP [`src/lib/sip-calculator.ts`]
- [x] [Review][Patch] `getDefaultSubCategories` dead code — simplified to `getDefaultSubCategory` returning single item [`src/features/goals/hooks/useCategoryMapping.ts:53`]
- [x] [Review][Patch] Loading state never resolves — `.then(r => r ?? null)` pattern in useLiveQuery [`src/features/goals/hooks/useCategoryMapping.ts:74-80`]
- [x] [Review][Patch] 0% inflation becomes 4% — `expectedInflation === ''` check replaces `|| 0.04` [`src/features/goals/components/SIPCalculator.tsx:51`]
- [x] [Review][Patch] Division by zero `targetAmount=0` — `effectiveTarget > 0` guard [`src/lib/sip-calculator.ts:77`]
- [x] [Review][Patch] Hardcoded `scenarios[1]` — named lookup `find(s => s.label === 'Moderate 8%')` [`src/lib/sip-calculator.ts:73`]
- [x] [Review][Patch] Legend not below chart — `verticalAlign="bottom"` on `<Legend />` [`src/features/goals/components/SIPCalculator.tsx:241`]
- [x] [Review][Patch] `n = 0` returns `past_due` — changed `n < 0` gate, `n = 0` produces 0-gain scenarios [`src/lib/sip-calculator.ts:47`]
- [x] [Review][Patch] Spec Test 6 missing — added test for targetDate = today [`src/lib/sip-calculator.test.ts`]

#### Deferred

- [x] [Review][Defer] Division by zero if `r = 0` in `fvFactor` — currently hardcoded non-zero, latent only [`src/lib/sip-calculator.ts:47`]
- [x] [Review][Defer] Risk profile `.last()` has no user/identity filter — single-user app, acceptable now [`src/features/goals/hooks/useCategoryMapping.ts:80`]
- [x] [Review][Defer] Non-numeric `goalId` produces `NaN` queries — route-level validation concern [`src/features/goals/components/SIPCalculator.tsx:29`]

#### Dismissed (noise)
- `gap.amount` negative semantics — intentional design (difference, not magnitude)
- `superCategoryLabels` identity map — valid scaffolding for future i18n

