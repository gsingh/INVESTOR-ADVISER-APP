---
title: Investor Adviser App
status: final
created: 2026-06-03
updated: 2026-06-03
---

# PRD: Investor Adviser App

## 1. Vision
A private decision-support web app that helps an individual investor research, organize, and review mutual fund investments using transparent rules and live market data. The app does not predict returns — it structures goal planning, fund screening, portfolio tracking, and periodic reviews so the user builds conviction and reduces impulsive switching.

## 2. Target User

### 2.1 Jobs To Be Done
- Define financial goals (emergency fund, medium-term savings, long-term wealth) with target amounts and time horizons.
- Assess my risk tolerance, investment capacity, and time horizon once, then use that profile to filter suitable fund categories.
- Browse mutual funds by AMFI category, screen and rank them by criteria I define (expense ratio, historical returns, fund size, rolling returns consistency, etc.).
- Track my holdings, contributions, SIPs, and review schedule in one place.
- Be reminded when it's time to review and rebalance.

### 2.2 Non-Users (v1)
- Financial advisors or third-party agents.
- Multi-user family or group portfolios.
- Users seeking automated investment advice or predictive recommendations.

### 2.3 Key User Journeys

- **UJ-1. Setting up a goal for the first time.**
  I log in (personal domain, password auth), name a goal ("Emergency Corpus"), pick a time horizon (3 years), set a target amount, and answer a quick risk-tolerance quiz. The app maps the result to recommended AMFI categories — debt funds for short-term, equity for long-term.

- **UJ-2. Screening and selecting a fund.**
  I open the fund screener, pick a category (e.g., Flexi Cap), set my scoring weights (Expense Ratio 30%, 5Y CAGR 40%, Fund Size 15%, Consistency 15%), and the app ranks available funds. I drill into a top-ranked fund, read its fact sheet data, and add it to my watchlist or allocate it to a goal.

- **UJ-3. Monthly review.**
  A notification reminds me it's review time. I see current allocation vs target, drift %, each fund's performance vs category benchmark, and my SIP status. I add a journal entry explaining why I'm holding or switching a fund. The app logs the review date.

## 3. Scope Boundaries

### 3.1 In Scope (MVP)
- Investor profiling (risk questionnaire + profile)
- Goal CRUD with category mapping
- Fund browser by AMFI category with data from mfapi.in / mfdata.in
- Custom scoring / ranking
- Fund detail view
- Manual transaction logging (SIP + lump-sum)
- Holdings dashboard with XIRR
- Review scheduling + flow
- Investment journal

### 3.2 Out of Scope
- No predictive recommendations ("buy this fund" AI outputs).
- No automated transaction execution (no BSE Star / broker integration).
- No multi-user or shared portfolio support (single-user, personal domain with password auth).
- No tax calculation or filing.
- No integration with external broker accounts — entries are manual.
- Mobile app (web-only v1).
- Automated data refresh scheduling (manual trigger for MVP).
- Advanced analytics (rolling volatility, Sharpe ratio, alpha/beta).

### 3.3 Assumptions
- Goal-to-category mapping is a suggestion — user overrides always win.
- Web-only, single-user with password auth, deployed via Docker on a personal domain.
- Live fund data is freely available from mfapi.in and mfdata.in with no API key.
- Tech stack to be decided at architecture phase; Docker deployment confirmed.
- Data refresh is manual trigger for MVP; auto-scheduled post-MVP.

## 4. Glossary
- **Goal** — A named financial target with target amount, time horizon, and assigned fund allocation.
- **Risk Profile** — The user's assessed risk tolerance (conservative / moderate / aggressive) derived from a questionnaire.
- **AMFI Category** — SEBI-defined mutual fund classification (Equity, Debt, Hybrid, Solution-Oriented, Other).
- **Screener** — A ranked list of funds within a category filtered and scored by user-defined criteria.
- **Drift** — Percentage difference between target allocation and current allocation for a goal.
- **Review** — A periodic check of portfolio health, logged with a journal entry.

## 5. Features

### 5.1 Investor Profiling
Onboarding flow with a risk-tolerance questionnaire, monthly investment capacity input, and time-horizon preferences. Produces a Risk Profile that persists and informs category recommendations.

**FR-1: Risk Profile Assessment**
User completes a brief questionnaire. System computes a risk profile (Conservative / Moderate / Aggressive) and maps it to recommended AMFI categories.

**FR-2: Profile Persistence**
Profile is saved and reusable. User can retake the assessment anytime.

### 5.2 Goal Planning
Create, edit, and close financial goals. Each goal has a name, target amount, time horizon, and one or more allocated funds.

**FR-3: Goal CRUD**
User creates goals with name, type (Emergency / Medium-Term / Long-Term / Custom), target amount, and target date.

**FR-4: Goal-to-Category Mapping**
System suggests AMFI categories per goal based on the user's Risk Profile and time horizon. User can override suggestions.

**FR-5: Allocation Tracking**
Each goal tracks its current allocation across funds vs target allocation. Drift percentage is displayed.

### 5.3 Fund Screener
Fetches live fund data from public sources (mfapi.in / mfdata.in). Allows filtering by AMFI category and ranking by user-defined scoring rules.

**FR-6: Category Browser**
User browses funds grouped by AMFI super-category and sub-category.

**FR-7: Custom Scoring**
User defines scoring criteria (expense ratio, returns, fund age, AUM, consistency) with percentage weights. System ranks funds by composite score.

**FR-8: Fund Detail View**
Shows NAV history, expense ratio, AUM, portfolio holdings, sector allocation, rolling returns, and category benchmark comparison.

### 5.4 Portfolio Tracking
Manual SIP and lump-sum contribution logging. Consolidates holdings across goals.

**FR-9: Transaction Logging**
User logs purchases (lump-sum or SIP instalments) with date, amount, NAV, and units.

**FR-10: Holdings Dashboard**
Consolidated view of all holdings: current value, XIRR, category-wise allocation, and goal-wise breakdown.

### 5.5 Reviews & Journal
Scheduled reviews with drift check, performance review, and journal entry.

**FR-11: Review Schedule**
User sets review frequency (monthly / quarterly). System sends reminders.

**FR-12: Review Flow**
Each review shows: current vs target allocation, drift amount, fund performance vs benchmark, SIP status. User writes a rationale entry.

**FR-13: Investment Journal**
Free-form journal entries tagged to goals, funds, or reviews. Full history searchable.
