---
status: final
created: 2026-06-03
updated: 2026-06-03
sources:
  - {planning_artifacts}/prds/prd-Investor-adviser-app-2026-06-03/prd.md
---

# Investor Adviser App — Experience Spine

## Foundation

A responsive web app deployed via Docker on a personal domain. Built with shadcn/ui on React with Tailwind CSS. Single-user with password authentication. `DESIGN.md` is the visual identity reference (navy primary, green accent, shadcn defaults as the base). This document is the behavioral and flow specification.

**Target user:** A technically capable self-directed investor in India new to the stock market. They want to build investing knowledge while using a structured tool for mutual fund planning. They prefer tools that explain trade-offs clearly.

**Core principles that shape every interaction:**
1. **Transparency over prediction** — every recommendation shows input factors and scoring logic used.
2. **Category-first thinking** — decide the role of money (debt, equity, hybrid) before picking a scheme.
3. **Goal orientation** — every investment maps to a target, horizon, or reserve bucket.
4. **Review discipline** — scheduled reviews preferred over frequent switching.
5. **Personal-use simplicity** — optimized for one user and one portfolio, not adviser-client workflows.

**Internal success metrics (not return guarantees):**
- % of holdings tagged to a goal and category role.
- % of portfolio positions with a written investment rationale.
- Number of completed quarterly reviews.
- Time required to evaluate and shortlist funds for a new SIP.
- Reduction in unnecessary portfolio churn between review cycles.

## Information Architecture

| Surface | Reached from | Purpose |
|---|---|---|---|
| Dashboard | App open / sidebar | Summary: goal progress, portfolio value, drift warnings, next review date, active alerts |
| Goals | Sidebar | List of all goals with progress bars and SIP projection. Create/edit/close goals. |
| Goal Detail | Goals → click goal | Single goal view: target vs current, SIP calculator with multiple return assumptions, gap display, allocation breakdown, drift, assigned funds |
| Profiling | Sidebar / onboarding | Risk questionnaire (time horizon, drawdown comfort, income stability, emergency reserve, investing experience). Stores both profile result and raw answers. Retake anytime. |
| Category Allocator | Goal Detail | Translates goal + risk profile into target asset allocation and recommended AMFI categories. User can override any category suggestion — replaced categories are shown with strikethrough and a "custom override" label. |
| Universe Browser | Sidebar | Master fund list with filters: AMFI category, plan type, growth option, AMC, expense ratio range, AUM range, benchmark type. Attributes: AMC, scheme name, category, plan, option, benchmark, expense ratio, AUM, exit load, risk label. |
| Scorecard | Universe → select fund | Configurable weighted scoring: category fit, cost, AUM sanity, benchmark suitability, rolling-return consistency, volatility, drawdown, exit load, overlap with current holdings. Shows factor-level breakdown. |
| Fund Detail | Scorecard → click | NAV history, expense ratio, AUM, exit load, portfolio holdings, sector allocation, rolling returns vs benchmark, risk label |
| Portfolio | Sidebar | Holdings dashboard: current value, XIRR, unrealized gain/loss, asset allocation, category allocation, fund-level contribution, drift vs target |
| Transactions | Portfolio → add | Log SIP or lump-sum: date, amount, NAV, units, linked goal |
| Reviews | Sidebar | Quarterly review prompts. Event-based alerts (drift threshold, duplicate category, fund role mismatch). Review flow with drift check, benchmark comparison, goal check. Supports "no action needed" outcome. |
| Journal | Sidebar / Reviews / Goal Detail | Structured entries per fund or goal: "why bought," "what role it plays," "what would trigger exit," "next review date." Preserves prior entries as decision trail. |
| Watchlist | Sidebar | Shortlisted funds not yet allocated to any goal. Add/remove funds. Move fund to goal allocation from here. |
| Settings | Avatar / bottom of sidebar | Password change, data refresh trigger, review frequency, theme toggle |

Sidebar is a fixed 260px column on `lg+`, collapses to icons on `md`, becomes a Sheet on `sm`. The active section highlights with a green accent pill. Modal stacks limited to one level deep.

## Voice and Tone

Educational but not condescending. Professional, direct, and calm. The tone assumes the user is technically capable but new to mutual fund mechanics — explain the *what* and *why* of each recommendation, not how to click a button.

Financial language is precise — no gamification, no hype. The app talks like a knowledgeable peer who names trade-offs openly.

| Do | Don't |
|---|---|
| "Your goal is 65% funded. On track." | "Awesome progress! 🎉 You're crushing it!" |
| "Drift alert: Large Cap is 8% over target." | "Oops! Your portfolio got a bit chubby!" |
| "XIRR: +12.4% since inception." | "You're making bank! 💰" |
| "Review your allocation by June 15." | "Time for a portfolio check-up! 🩺" |
| "Nothing scheduled for this fund yet." | "No SIP? Let's fix that right now!" |

Microcopy is educational. Error messages state what happened, what it means, and what the user can do next. Empty states explain what the section is for and how to get started. Numbers are precise but not overwhelming — show 2 decimal places for NAV, 1 for percentages, whole numbers for amounts > 1000.

| Do | Don't |
|---|---|
| "Expense ratio 0.68% — lower than category average of 0.95%" | "Expense ratio 0.68% — Good" |
| "This fund invests 60% in Financial Services. Your other funds also have heavy Finance exposure. Consider diversifying." | "This fund has high sector concentration." |
| "Your goal needs ₹5,000/mo for 3 years at 8% expected return to reach ₹2,00,000." | "Recommended SIP: ₹5,000" |
| "Flexi Cap funds can invest across market caps. Suitable for 7+ year horizons." | "Flexi Cap — Good for long term" |
| "Review completed. Drift reduced from 12% to 3%. Next review in 3 months." | "Review done ✅" |

## Component Patterns

Behavioral. Visual specs live in `DESIGN.md.Components` (or shadcn defaults when inherited).

| Component | Use | Behavioral rules |
|---|---|---|---|
| Goal Card | Dashboard, Goals list | Shows name, target amount, progress bar with percentage, drift indicator pill, SIP projection summary line. Click opens Goal Detail. Context menu (⋮) has "Edit" and "Close Goal" actions. Editing a goal opens the same form as Create, pre-filled. Closing a goal archives it — holdings remain in Portfolio but goal is marked "closed" with a completion date. |
| SIP Calculator | Goal Detail | Input: target amount, target date, starting amount, expected inflation, monthly contribution. Output: required SIP under 3 return assumptions (conservative, moderate, optimistic). Chart shows projected growth vs target with gap highlighted. |
| Gap Indicator | Goal Detail | Shows shortfall between current projection and target amount. Green (on track), amber (minor gap), red (significant gap). Action button: "Adjust SIP" or "Increase monthly contribution." |
| Fund Row | Universe Browser, Portfolio | Fund name, AMFI category badge, plan type, expense ratio, AUM, risk label, composite score. Click opens Scorecard. |
| Filter Panel | Universe Browser | Collapsible panel with: category multi-select, plan type (direct/regular), growth option toggle, AMC dropdown, expense ratio range slider, AUM range slider, benchmark type multi-select. "Apply filters" button. Results update on apply. |
| Scorecard Breakdown | Scorecard | Table of scoring factors: category fit, cost, fund age, AUM sanity, benchmark suitability, rolling-return consistency, volatility, drawdown, exit load, overlap with holdings. Each factor shows weight %, raw score, weighted contribution, and a 1-sentence explanation. Total composite score at top. Default weights favor consistency and cost over trailing returns. **Weight normalization:** weights must sum to 100%. If user adjusts and sum ≠ 100%, remaining weight is distributed proportionally across all factors with a note: "Weights normalized to 100%." |
| Overlap Indicator | Scorecard | Shows sector overlap between this fund and user's current holdings using a simple bar or percentage. "This fund adds 15% new sector exposure not in your portfolio" or "Your portfolio already has 40% in Financial Services. This fund adds 12% more." |
| Review Alert Card | Dashboard, Reviews | Event-based: "Drift alert: Large Cap is 8% over target." "Duplicate exposure: 3 funds in Banking sector." "Role mismatch: Fund X no longer fits its selected role (category changed)." Dismissible. "Start Review" action. |
| Review Checklist | Review | Structured flow: (1) drift check → (2) category exposure check → (3) fund-role fit check → (4) benchmark comparison → (5) "No action needed" option. Each step shows status (pass/warn/fail). Final step: written rationale. |
| Journal Entry | Journal, Goal Detail, Fund Detail | Structured fields: "Why bought," "What role it plays," "What would trigger exit," "Next review date." Free-form notes field. Previous entries shown in timeline below the form. Editable. Search bar at top of Journal surface filters by keyword across all fields and notes. |
| Empty State | Any list surface | shadcn's empty pattern + app-specific text. Example: "No goals yet. Create your first goal to start tracking." Single primary action button. |
| Profile Card | Profiling | Shows current risk profile (Conservative / Moderate / Aggressive), monthly capacity, time horizon, and raw answers expandable section. "Retake assessment" link. |

## State Patterns

| State | Surface | Treatment |
|---|---|---|---|
| Cold app load / first run | Dashboard | Onboarding flow redirects to Profiling or Goal setup. "Welcome. Set up your first goal to get started." |
| Loading data | Universe Browser, Dashboard | shadcn `Skeleton` rows (4-6) matching the expected layout. "Fetching fund data..." text for API calls. |
| No goals | Goals, Dashboard | "No goals yet. Create your first goal to start tracking your investments." |
| No transactions | Portfolio | "No transactions yet. Log a SIP or lump-sum purchase to track your holdings." |
| No review scheduled | Reviews | "No reviews scheduled. Set a review frequency to receive reminders." |
| Data fetch error | Universe Browser, Scorecard | shadcn `Toast` (destructive variant): "Couldn't fetch fund data. The data source may be temporarily unavailable. Try again later." |
| Offline | Global | shadcn `Toast`: "No internet connection. Data refresh and fund lookup unavailable until reconnected." |
| Allocation drift | Dashboard, Goal Detail | Amber/Red drift indicator pill appears next to affected allocation. Dashboard shows count: "2 drift alerts." |
| SIP overdue | Portfolio | Amber badge: "SIP due. Log your latest instalment." |
| Event-based alert: duplicate category | Dashboard, Reviews | Alert card: "Duplicate exposure: 3 funds in Banking sector. Review your allocation." |
| Event-based alert: fund role mismatch | Dashboard, Reviews | Alert card: "Fund X (Flexi Cap) has been reclassified to Large Cap. It may no longer fit its selected role." |
| Event-based alert: category changed | Dashboard, Reviews | Alert card: "The AMFI category for Fund Y has changed. Review its role in your portfolio." |
| SIP projection gap | Goal Detail | Red gap indicator between projected growth line and target line. "Current projection ₹2,40,000 vs target ₹3,00,000. Increase monthly SIP by ₹800 to close the gap at 8% return." |
| No overlap data | Scorecard | If the user has no holdings yet, overlap indicator shows: "No existing holdings to compare against. Add holdings to see overlap analysis." If the fund data is incomplete, "Overlap data unavailable for this fund." |

## Interaction Primitives

**Mouse-first with keyboard support.** Primary audience is a single individual investor on desktop/laptop.

- Click sidebar items to navigate between sections.
- Click a card/row to drill into detail.
- Buttons handle primary actions (Create Goal, Run Screener, Log Transaction, Start Review).
- `Esc` closes dialogs and sheets.
- `Tab` moves through forms in reading order.
- Form validation on blur (not on keystroke) for financial inputs.
- All amounts auto-format with commas and decimal precision on blur.
- Sliders (scoring weights) update results in real-time.
- Data refresh is manual — a "Refresh data" button in Settings or top bar. Spinner during fetch.

**Banned in v1:** infinite scroll (pagination for transaction lists), drag-to-reorder, hover-only affordances on small viewports, modal stacks > 1 level deep, keyboard shortcut overload (no vim-style `g t` etc. — this is not a developer tool).

## Accessibility Floor

Behavioral. Visual contrast lives in `DESIGN.md` (inherits shadcn's WCAG AA-compliant defaults; brand overrides verified to maintain ratios).

- WCAG 2.2 AA across the responsive web surface.
- Screen reader announces page surface on navigation: "Dashboard, {N} alerts" / "Screener, Flexi Cap category, 24 funds."
- `Tab` order matches reading order on every surface. `Esc` always closes the topmost modal/dialog.
- Form inputs have associated labels, not placeholders as labels.
- Color is not the only indicator for drift states — drift indicators include text labels ("On track", "Watch", "Review") and icons where appropriate.
- Focus rings inherit shadcn's `ring` token — visible at AA contrast against `background`.
- Data tables use proper `<th>` scope and `<caption>` elements.

## Responsive & Platform

| Breakpoint | Behavior |
|---|---|
| `>= lg` (1024px+) | Sidebar visible (260px). Dashboard can show 2-column grid for widgets. Screener results in table view. |
| `md` (768–1023px) | Sidebar collapses to icon-only. Dashboard stacks to single column. Tables remain in table layout. |
| `< md` (sx-sm) | Sidebar becomes a Sheet triggered from top bar. Tables become card lists (each row is a card). Financial data remains readable. |

Primary surface is desktop/laptop. Mobile is usable for reading and simple actions (logging a transaction, viewing dashboard) but data-heavy screens (screener, portfolio analytics) are optimal on larger viewports.

## Inspiration & Anti-patterns

- **Lifted from Kuvera/Coin:** The goal-planning metaphor — named goals with target amounts, category mapping, progress tracking. The app reuses this mental model because it works.
- **Lifted from Value Research:** The category browser with sortable columns and scoring. The app adds user-defined weight sliders on top of this layout.
- **Lifted from shadcn:** The entire surface vocabulary. The app's visual identity is what it adds to shadcn, not a from-scratch design system.
- **Rejected — Gamification elements:** No streaks, badges, or achievement notifications. Investing discipline is its own reward.
- **Rejected — AI predictive suggestions:** No "this fund is recommended for you" AI outputs. The app screens transparently by user-defined rules.
- **Rejected — Broker integration:** No auto-import from trading accounts. Entries are manual to encourage deliberate logging.
- **Rejected — Push notifications:** Email or in-app dashboard reminders only. No push alerts for NAV movements or short-term price action.
- **Rejected — Recent-returns focus:** Screener defaults weight consistency and cost over trailing returns. User must explicitly choose to emphasize returns.
- **Rejected — Undisciplined switching:** Review cycle is a hard gate — reallocation outside a review requires a written rationale entry.
- **Rejected — Multi-user or adviser features:** No shared portfolios, no adviser dashboards, no client reporting.

## Key Flows

### Flow 1 — First-time goal setup with SIP planning (Boss, Saturday afternoon)

1. Boss opens the app, logs in with password.
2. No data yet — Dashboard shows empty state: "Start by creating your first financial goal."
3. Boss navigates to Goals, clicks "Create Goal."
4. Form: names it "Emergency Corpus," picks type "Emergency," sets starting amount ₹50,000, target amount ₹3,00,000, target date 3 years out, expected inflation 4%.
5. **Climax:** Goal Detail opens. The SIP Calculator shows 3 scenarios:
   - Conservative (6%): ₹6,800/mo needed — gap ₹24,000
   - Moderate (8%): ₹6,200/mo needed — gap ₹12,000
   - Optimistic (10%): ₹5,700/mo needed — on track
   The gap indicator shows "At 6% return, you'll reach ₹2,76,000 — ₹24,000 short of target. Consider increasing monthly SIP to ₹6,800." Boss sets monthly SIP at ₹6,500.
6. The category allocator, using Boss's risk profile (moderate, completed during onboarding), maps this 3-year goal to Debt 70%, Liquid 30%. Boss sees the recommended allocation inline.
7. Boss clicks "Allocate funds" and is redirected to the Universe Browser, pre-filtered to Debt and Liquid categories.
8. Failure: if the data source is unreachable, the calculator still works offline with cached return assumptions, but the Universe Browser shows a retry button and a toast explaining the data source is down.

### Flow 2 — Quarterly review triggered by event-based alert

1. Boss logs in and sees an amber badge on the Dashboard: "2 alerts." One Review Alert Card reads: "Drift alert: Debt allocation is 12% over target." Another: "Duplicate category exposure: 2 funds in Banking sector."
2. Boss clicks "Start Review" from the alert card. The Review Checklist opens:
   - Step 1 (Drift check): Debt 82% vs target 70% — WARN. Liquid 10% vs target 30% — FAIL.
   - Step 2 (Category exposure): 2 Banking funds detected — WARN. "Your Portfolio has 35% in Financial Services. Consider whether you want concentrated sector exposure."
   - Step 3 (Fund-role fit): All funds still match their assigned role — PASS.
   - Step 4 (Benchmark comparison): Debt fund +0.2% vs benchmark +0.3% — just under, no alert.
3. **Climax:** Boss reaches Step 5 and can choose "No action needed — portfolio is aligned with plan" or "Take action." Boss chooses "No action needed," writing a rationale: "Debt drift is from planned lump-sum additions in the last quarter. Will redirect next 2 SIPs to Liquid to rebalance. Banking exposure is intentional goal allocation." Completes review.
4. Review date logged. Drift pill resets. Alerts dismissed. Next review in 3 months.
5. Failure: if a fund underperforms benchmark by >2% for 2 consecutive quarters, the review highlights it with a red border and note: "Fund X has underperformed its benchmark for 2 consecutive quarters. Consider reviewing whether it still fits this role." No auto-suggest — just a transparency prompt.

### Flow 3 — Screening and scoring a fund with explainable factors

1. Boss creates "Retirement Corpus," target ₹50,00,000, 15-year horizon. Risk profile suggests Flexi Cap, Large Cap, Mid Cap.
2. Boss opens Universe Browser, selects Flexi Cap category. Filter panel: direct plan, growth option, expense ratio <1%, AUM > ₹500 Cr. Applies the filters.
3. Results show 34 funds. Boss sorts by expense ratio, then clicks into a fund to open the Scorecard.
4. Scorecard loads with default weights: Category fit 15%, Cost 15%, Fund age 5%, AUM sanity 5%, Benchmark suitability 10%, Rolling-return consistency 25%, Volatility 5%, Drawdown 5%, Exit load 5%, Overlap with holdings 10%. Boss adjusts weights — notices consistency and cost have the highest defaults, reflecting the app's discipline.
5. **Climax:** Scorecard Breakdown shows each factor with explanation:
   - Cost (20% weight): Expense ratio 0.52% — score 18/20. "Below category average of 0.89%. Good."
   - Consistency (20% weight): Beat benchmark in 8/10 rolling 3Y periods — score 16/20. "Above average consistency."
   - Overlap (5% weight): 15% new sector exposure — score 4/5. "This fund adds Healthcare exposure not in your current portfolio."
   - Total composite score: 82/100.
   Boss reads each factor explanation, agrees with the assessment, and clicks "Allocate to Goal."
6. Failure: if rolling-return history is incomplete, the Consistency factor shows an amber warning: "Only 4 years of data available — consistency score may not be fully representative." The scorecard still computes a score but flags the data gap.
