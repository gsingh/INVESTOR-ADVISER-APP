# UX Rubric Review: Investor Adviser App

**Reviewer:** UX Quality Validator
**Date:** 2026-06-03
**Files reviewed:**
- `DESIGN.md` (212 lines)
- `EXPERIENCE.md` (206 lines)
- `prd.md` (130 lines)

---

## 1. Coverage — PRD Feature-to-UX Traceability

All 13 functional requirements are mapped to at least one UX surface, component, or flow. No orphan PRD features.

| FR | Surface / Component / Flow | Status |
|---|---|---|
| FR-1 Risk Profile Assessment | Profiling surface, Profile Card, Flow 1 ¶6 | ✓ |
| FR-2 Profile Persistence | Profiling surface ("Retake anytime"), Profile Card | ✓ |
| FR-3 Goal CRUD | Goals list, Goal Detail, Goal Card, SIP Calculator, Flow 1 | Partial ✦ |
| FR-4 Goal-to-Category Mapping | Category Allocator (strikethrough + override label) | ✓ |
| FR-5 Allocation Tracking | Goal Detail drift display, Drift indicator, Portfolio surface | ✓ |
| FR-6 Category Browser | Universe Browser, Filter Panel, Fund Row | ✓ |
| FR-7 Custom Scoring | Scorecard, Scorecard Breakdown, Flow 3 | ✓ |
| FR-8 Fund Detail View | Fund Detail surface (NAV, expense ratio, AUM, holdings, returns) | ✓ |
| FR-9 Transaction Logging | Transactions surface (SIP + lump-sum, date, amount, NAV, units) | ✓ |
| FR-10 Holdings Dashboard | Portfolio surface (value, XIRR, allocation, drift) | ✓ |
| FR-11 Review Schedule | Reviews surface, Profile Card (frequency setting) | ✓ |
| FR-12 Review Flow | Review Alert Card, Review Checklist (5-step), Flow 2 | ✓ |
| FR-13 Investment Journal | Journal surface, Journal Entry component, search | ✓ |

✦ FR-3: Create is fully detailed in Flow 1. Edit/Delete/Close are listed in the IA table but have **no behavioral specification**, no confirmation dialogs, and no validation states. The PRD requires full CRUD.

---

## 2. Consistency — Cross-Spine Token & Term Alignment

### 2.1 Cross-references
- EXPERIENCE.md correctly references `DESIGN.md` in its Foundation section (¶1) and Component Patterns section (§ preamble).
- Component Patterns table header: *"Visual specs live in DESIGN.md.Components (or shadcn defaults when inherited)."*

### 2.2 Glossary term usage
Terms from PRD Glossary (Goal, Risk Profile, AMFI Category, Screener, Drift, Review) are used consistently and correctly throughout both spines.

### 2.3 Mismatches found

**DESIGN.md "SIP chart" vs EXPERIENCE.md "SIP Calculator"**
- DESIGN.md §Components defines a `SIP chart` — line chart with 3 projection lines, target line, gap highlight.
- EXPERIENCE.md §Component Patterns defines a `SIP Calculator` — input form + output under 3 return assumptions + chart.
- These are the **same conceptual component** named differently. No cross-reference between the two specifications. An implementer reading DESIGN.md would build a chart component, while EXPERIENCE.md specifies a calculator widget that happens to contain a chart. A merge/integration spec is missing.

**DESIGN.md "Alert card" vs EXPERIENCE.md "Review Alert Card"**
- DESIGN.md defines an `Alert card` (accent-left-border, icon, title, description, timestamp, action button, dismissible).
- EXPERIENCE.md defines a `Review Alert Card` with event-based triggers and "Start Review" action.
- These align semantically but the naming difference could cause confusion. No cross-reference.

**Overlap indicator — alignment OK**
- DESIGN.md: progress bar with two segments, percentage label, context line.
- EXPERIENCE.md: shows sector overlap, percentage or bar, with explanatory text.
- Consistent.

### 2.4 Do/Don't table alignment
EXPERIENCE.md Voice & Tone do/don't tables (lines 58-74) are internally consistent with DESIGN.md design do/don'ts (lines 203-212). Shared principle: no emoji, no gamification, professional tone.

---

## 3. Completeness — States, Edge Cases, Errors

### 3.1 State patterns documented (EXPERIENCE.md §State Patterns)
| State | Covered | Surface |
|---|---|---|
| Cold app / first run | ✓ | Dashboard |
| Loading | ✓ | Universe Browser, Dashboard |
| Empty — no goals | ✓ | Goals, Dashboard |
| Empty — no transactions | ✓ | Portfolio |
| Empty — no reviews | ✓ | Reviews |
| Data fetch error | ✓ | Universe Browser, Scorecard |
| Offline | ✓ | Global |
| Allocation drift | ✓ | Dashboard, Goal Detail |
| SIP overdue | ✓ | Portfolio |
| Duplicate category alert | ✓ | Dashboard, Reviews |
| Fund role mismatch | ✓ | Dashboard, Reviews |
| Category changed | ✓ | Dashboard, Reviews |
| SIP projection gap | ✓ | Goal Detail |
| No overlap data | ✓ | Scorecard |

### 3.2 Edge cases from flow failure paths
- Flow 1: Data source unreachable — calculator works offline with cached return assumptions; browser shows retry + toast. ✓
- Flow 2: Fund underperforms benchmark by >2% for 2 consecutive quarters — highlighted with red border + note. ✓
- Flow 3: Rolling-return history incomplete — amber warning, score still computed. ✓

### 3.3 Gaps

**Goal CRUD — missing edit/delete states**
- No confirmation dialog spec for deleting a goal with allocated funds.
- No "are you sure?" / "what happens to allocated funds?" flow.
- No field-level validation for goal dates (target date before start date), amounts (negative, zero), or name (duplicate, empty).

**Transaction logging — missing failure states**
- No error state for invalid NAV/unit combinations (e.g., NAV × units ≠ reported amount beyond rounding tolerance).
- No state for logging a transaction against a closed goal.

**Search — missing empty/missing results state**
- Journal search mentions keyword filtering but no component spec for: zero results, search-in-progress, debounce behavior, or clear search action.

**Review schedule — missing edge case**
- No state for "review frequency not yet set."
- No specification for what happens if the user misses a scheduled review date.

**Risk profile retake — missing state consequence**
- If user retakes the assessment and gets a different profile, what happens to existing goal-to-category mappings? Recalculate? Flag for review? Not specified.

**SIP calculator edge cases**
- No specification for: target amount already reached (zero gap), target date in the past, zero monthly contribution capacity.

---

## 4. Feasibility — Implementability Assessment

### 4.1 Implementable as specified
- **Sidebar navigation (260px → icon → Sheet):** Standard responsive pattern. shadcn Sheet + Tailwind breakpoints.
- **Goal CRUD forms:** Standard React hook form + zod validation. Well-specified fields.
- **Category Browser + Filter Panel:** Composable filter UI. Sliders for ranges, multi-select for categories. Feasible.
- **Transaction logging:** Simple form with 4-5 fields. OK.
- **Portfolio Holdings dashboard:** Aggregate calculations (XIRR, allocation, drift). Math is straightforward.
- **Journal:** CRUD + search with keyword filter. OK.
- **Review flow (5-step checklist):** Step wizard pattern. Conditional pass/warn/fail display. Well-specified.

### 4.2 Ambiguous or risky

**Scorecard with 10 configurable factors (Flow 3)**
- Ten scoring factors with percentage weights summing to 100. The real-time slider interaction (line 64: "Sliders update results in real-time") when adjusting weights requires recomputing the composite score for all displayed funds. With 34 funds and 10 factors, this is ~340 calculations per slider move. Feasible in JS but the UI must debounce or throttle gracefully.
- The spec does not define what happens when weights don't sum to 100% (do you normalize? warn? block?).

**SIP projection chart (DESIGN.md line 199)**
- Requires a charting library (Recharts, visx, or chart.js). The spec calls for 3 projection lines + target line + gap highlight + legend. This is a moderately complex custom chart that may need a custom Recharts composition. Feasible but should be flagged for the implementer.

**Overlap analysis indicator (DESIGN.md line 197-198)**
- Requires computing sector-level overlap between a candidate fund and existing holdings. This requires sector allocation data from the API (mfapi.in provides this for most funds). If data is missing, the fallback UX is specified ("No overlap data unavailable"). Feasible but data-dependent.

**XIRR calculation (Portfolio surface)**
- XIRR is an iterative root-finding algorithm. Requires a numeric library or self-implemented Newton-Raphson. Not trivial but standard for portfolio tools. Not mentioned as an implementation dependency.

### 4.3 Scope issues

**Offline with local caching (EXPERIENCE.md line 105)**
- The PRD does not mention offline support. EXPERIENCE.md specifies: *"Changes will be saved locally and synced when you reconnect."* This implies IndexedDB/localStorage + conflict resolution + sync reconciliation logic — a significant engineering investment for a v1 solo project. For a Docker-deployed personal web app, this is architectural scope creep. The simpler approach (show offline toast, block writes until reconnection) would suffice and match the MVP scope. **Recommend: remove or down-scope to offline detection + toast only.**

**Manual data refresh (EXPERIENCE.md line 44-46, line 63)**
- Consistent with PRD assumption: "Data refresh is manual trigger for MVP." Implementable. The Settings page has "Refresh data" button with spinner. Fine.

---

## 5. Shape Fit — Solo/Hobby Scale Assessment

### 5.1 Good fits
- **shadcn/ui as base, brand-layer-only overrides:** Excellent for solo scale. 80% of components come for free.
- **No multi-user, no auth beyond password:** Appropriate.
- **No broker integration, no real-time data:** Avoids major integration risk.
- **No AI, no predictions:** Keeps the app deterministic and testable.
- **Single navigation paradigm (sidebar):** Low cognitive load, easy to implement.
- **11 surfaces total:** Manageable for one developer over a few sprints.
- **Rejected features list (EXPERIENCE.md §Inspiration):** Clear articulation of what not to build. Disciplines the solo developer.

### 5.2 Over-engineered for v1

**Three-breakpoint responsive + Sheet + card-list tables**
- Desktop-first with basic mobile would be sufficient for v1. The spec calls for icon-only sidebar at md, Sheet at sm, table→card-list conversion at sm. This is 3 layout variants for every data surface. For a personal-use tool the developer themselves will use, a single desktop layout with readable scaling on mobile is adequate. Consider deferring the responsive polish to post-MVP.

**10-factor scorecard with real-time slider interaction**
- While central to the app's value, 10 factors is a lot. The default weights show Consistency at 25%, Cost at 15% — these are fine. But implementing sliders that recompute scores for all filtered funds in real-time adds UI complexity. A simpler v1: static input fields (not sliders) with a "Recalculate" button.

**SIP calculator with 3 projection scenarios + chart + gap highlight**
- This is well-specified but represents the most visually complex component in the app. For a solo project, a tabular output (3 lines showing conservative/moderate/optimistic with target gap) would deliver the same information with less implementation cost than a multi-line chart.

### 5.3 Appropriate complexity
- Goal creation flow — straightforward form, within normal scope.
- Filter panel — standard multi-filter pattern.
- Review checklist — step pattern, well-bounded.
- Journal — CRUD + search, standard pattern.
- Drift indicators — pills + badges, low implementation cost.
- Empty states — shadcn empty pattern, copy-paste friendly.

---

## 6. Summary of Findings

### Critical (blocks implementation clarity)

(No critical findings — all PRD features are mapped.)

### High

**H1. Offline sync is scope creep (EXPERIENCE.md:105)**
- The PRD does not mention offline capability. EXPERIENCE.md specifies local caching with sync-on-reconnect, which implies IndexedDB, conflict resolution, and sync logic. This is substantial engineering for a Docker-deployed personal v1 app. **Recommendation:** Replace with offline detection + toast notification; block writes until reconnection.

**H2. SIP chart vs SIP Calculator — split component spec (DESIGN.md:199 vs EXPERIENCE.md:83)**
- The same component is named differently in each spine with no cross-reference. DESIGN.md defines the chart visualization; EXPERIENCE.md defines the calculator behavior. An implementer may build them independently or miss the integration. **Recommendation:** Unify the name (e.g., "SIP Projection Widget") and add a cross-reference in both files.

### Medium

**M1. Goal CRUD — missing edit/delete specification (EXPERIENCE.md:36-37)**
- PRD requires full CRUD. EXPERIENCE.md shows only the Create flow. Edit and Close/Delete are listed in the IA table but have no behavioral spec, confirmation dialog, validation states, or "what happens to allocated funds" flow. **Recommendation:** Add edit flow (modal or inline) and delete confirmation with fund-reallocation options.

**M2. Dark mode token mapping unspecified (DESIGN.md:11-16 vs EXPERIENCE.md:48)**
- DESIGN.md includes `-dark` variant tokens but EXPERIENCE.md only says "theme toggle" with no mapping to Tailwind's `dark:` variant or shadcn's dark mode conventions. The token naming suggests a manual approach, but no implementation guidance exists. **Recommendation:** Clarify dark mode strategy — either inherit shadcn dark defaults with token overrides, or specify the mechanism.

**M3. Scorecard weight normalization undefined (EXPERIENCE.md:87, Flow 3)**
- The scorecard has 10 configurable factors with percentage weights. There is no specification for behavior when weights don't sum to 100%. Normalization? Warning? Block? This will be the first UX bug an implementer encounters. **Recommendation:** Specify weight-normalization behavior (e.g., auto-normalize on input, or show warning if sum ≠ 100).

### Low

**L1. Journal search lacks component spec (EXPERIENCE.md:91)**
- Search bar mentioned but no behavioral spec: debounce, empty results, in-progress state, clear action. Minor — inherits shadcn Input — but would benefit from explicit state patterns.

**L2. Transaction form — missing validation error display (EXPERIENCE.md:123-124)**
- "Form validation on blur" stated but no inline error pattern specified. Should reference shadcn form/input error pattern or define a custom one.

**L3. Profile retake — downstream impact not specified (EXPERIENCE.md:39)**
- If retaking the risk profile changes the result, existing goal-to-category mappings might need to be flagged for review. No UX flow for this transition.

**L4. Sidebar icon-only mode — missing accessible labels (EXPERIENCE.md:163)**
- When sidebar collapses to icon-only on md, no specification for tooltips or aria-labels on icon buttons.

---

## 7. Final Verdict

**Verdict: APPROVED WITH CONDITIONS.** Both spines demonstrate thorough PRD coverage, strong internal consistency, and appropriate restraint for a hobby/solo project. The brand layer (navy primary, green accent, shadcn defaults) is well-constrained. The experience flows are grounded in real user scenarios with failure paths documented. Three conditions must be resolved before implementation begins: (1) remove or down-scope the offline sync requirement (scope creep against PRD), (2) unify the SIP Calculator/SIP Chart component specification across both spines, and (3) add the missing Goal edit/delete behavioral specification. The scorecard, review checklist, and universe browser are the most complex surfaces but are within feasible range for a solo developer using shadcn/ui.
