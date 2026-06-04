# UX Reconciliation Report

**Sources checked:**
- PRD (`prd.md`) — FR-1 through FR-13, UJ-1 through UJ-3, scope boundaries
- Additional functional requirements (#1–#8, detailed field‑level reqs)

**UX artifacts checked:**
- `DESIGN.md` — visual identity, brand tokens, component specs
- `EXPERIENCE.md` — information architecture, component patterns, state patterns, key flows

## Methodology

Each functional requirement (PRD + additional list) was traced through both UX files to verify coverage. Gaps are categorized as **missing** (no mention), **partial** (mentioned but lacking specified detail), or **additive** (UX adds beyond requirements — not a gap).

## Coverage by Requirement

| # | Requirement | UX Coverage | Status |
|---|---|---|---|
| PRD FR-1 | Risk Profile Assessment | Profiling surface, questionnaire fields, profile mapping | ✅ Covered |
| PRD FR-2 | Profile Persistence | Persist + retake, raw answers stored | ✅ Covered |
| PRD FR-3 | Goal CRUD | Create/edit/close goal, Goal Card, Goal Detail | ✅ Covered |
| PRD FR-4 | Goal-to-Category Mapping | Category Allocator maps goal+risk→target allocation + AMFI categories | ⚠️ Partial |
| PRD FR-5 | Allocation Tracking / Drift | Drift indicator, Goal Detail shows drift vs target | ✅ Covered |
| PRD FR-6 | Category Browser | Universe Browser with filters by category, plan, etc. | ✅ Covered |
| PRD FR-7 | Custom Scoring | Scorecard with configurable weights, factor breakdown | ⚠️ Partial |
| PRD FR-8 | Fund Detail View | NAV history, expense ratio, AUM, holdings, sector allocation, rolling returns, benchmark | ✅ Covered |
| PRD FR-9 | Transaction Logging | Transactions surface: date, amount, NAV, units, linked goal | ✅ Covered |
| PRD FR-10 | Holdings Dashboard | XIRR, unrealized gain/loss, asset allocation, category allocation, fund contribution, drift | ✅ Covered |
| PRD FR-11 | Review Schedule | Review frequency in Settings, quarterly prompts | ✅ Covered |
| PRD FR-12 | Review Flow | Review Checklist: drift check, category exposure, fund-role fit, benchmark, no-action option | ✅ Covered |
| PRD FR-13 | Investment Journal | Journal Entry: structured fields + previous entries timeline | ⚠️ Partial |
| PRD UJ-2 | Watchlist | Watchlist concept absent from UX; only direct allocation to goals | ❌ Missing |
| Addl #1 | Goal planner fields + SIP projection | SIP Calculator, Gap Indicator, 3-return-assumption chart | ✅ Covered |
| Addl #2 | Risk profiler fields | Questionnaire: time horizon, drawdown comfort, income stability, emergency reserve, experience | ✅ Covered |
| Addl #3 | Category allocator | Goal + risk → target allocation + AMFI categories | ✅ Covered |
| Addl #4 | Fund universe browser | All 10 attributes + all 7 filter dimensions present in Filter Panel | ✅ Covered |
| Addl #5 | Fund scorecard factors | All 9 factors listed, configurable weights, factor-level explanation | ✅ Covered |
| Addl #6 | Portfolio tracker metrics | XIRR, unrealized gain/loss, allocation, contribution, drift | ✅ Covered |
| Addl #7 | Review engine | Event-based alerts (drift, duplicate, role mismatch), quarterly prompts, no-action option | ✅ Covered |
| Addl #8 | Journal rationale fields | Why bought, role, exit trigger, next review date, prior entry preservation | ✅ Covered |

## Gaps Found

### 1. Watchlist surface missing
**Source:** PRD UJ-2 ("add it to my watchlist or allocate it to a goal")
**Detail:** The PRD describes a watchlist as a distinct holding state — funds can be shortlisted without immediately allocating to a goal. The UX spine only supports direct allocation from the Scorecard ("Allocate to Goal"). No watchlist surface, component, or IA entry exists. Users cannot save a fund for later consideration without assigning it to a goal.

### 2. Journal history not searchable
**Source:** PRD FR-13 ("Full history searchable")
**Detail:** EXPERIENCE.md describes Journal Entry with structured fields and a timeline of prior entries but no search/filter mechanism. A free-text search across all journal entries is specified in the PRD but absent from the UX.

### 3. Category allocation override mechanism not specified
**Source:** PRD §3.3 ("Goal-to-category mapping is a suggestion — user overrides always win"), PRD FR-4
**Detail:** PRD is explicit that the user can override the system's suggested categories. EXPERIENCE.md describes the Category Allocator as "translates...into target asset allocation and recommended AMFI categories" — the word "recommended" implies suggestiveness, but no UI flow for editing/overriding the allocation is described (no edit-in-place, no manual category reassignment). The user can only accept the allocator's output and browse pre-filtered funds.

### 4. Fund age absent from scorecard factors
**Source:** PRD FR-7 (lists "fund age" as a scoring criterion)
**Detail:** The PRD's custom scoring feature lists "fund age" as one of the criteria. The UX spine's Scorecard factors (matching the additional functional requirements) do not include fund age. While the more detailed additional reqs also omit it, the PRD remains a source input. The UX should either include fund age as a factor or explicitly document the rationale for its exclusion.

## Summary

| Metric | Count |
|---|---|
| Requirements fully covered | 16 / 20 |
| Partial coverage | 3 |
| Missing | 1 |
| Additive (UX beyond reqs, not gaps) | — |

**Verdict: Minor gaps**

The UX spine covers the vast majority of requirements. The four gaps are real but manageable: the watchlist and journal search are feature additions, the override mechanism is a flow elaboration, and fund age is a factor-list discrepancy. None require restructuring the existing IA or component patterns.
