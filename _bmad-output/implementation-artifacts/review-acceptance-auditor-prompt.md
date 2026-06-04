# Acceptance Auditor Review — Story 4.3

Review this diff against the spec/story file below. Check for: violations of acceptance criteria, deviations from spec intent, missing implementation of specified behavior, contradictions between spec constraints and actual code.

Output findings as a Markdown list. Each finding: one-line title, which AC/constraint it violates, and evidence from the diff.

## Story Spec

```
Status: review

## Story

As Boss,
I want a consolidated dashboard showing my portfolio's current value, XIRR, category allocation, and goal-wise breakdown, with export/import in Settings,
So that I can track my overall investment health and protect my data against browser storage loss.

## Acceptance Criteria

1. **Given** I open the Portfolio page,
   **When** it loads,
   **Then** the dashboard shows: total current value, XIRR since inception, unrealized gain/loss, category-wise allocation donut chart (Recharts), fund-level contribution table sorted by value, and goal-wise breakdown with links to Goal Detail
   **And** every financial term includes a `<TermInfo>` tooltip.

2. **Given** there are no transactions yet,
   **When** I view the Portfolio page,
   **Then** an empty state shows: "No transactions yet. Log a SIP or lump-sum purchase to track your holdings." with a primary "Add Transaction" action button.

3. **Given** data is loading,
   **When** the dashboard fetches from Dexie,
   **Then** skeleton cards are shown for each dashboard section.

4. **Given** I open Settings,
   **When** I click "Export Data",
   **Then** a single JSON file is downloaded containing all serialized Dexie tables (goals, transactions, portfolios, journals, scorecard-weights, risk-profiles, glossary).

5. **Given** I have an export file,
   **When** I click "Import Data" and select the file,
   **Then** all Dexie tables are restored from the JSON
   **And** a success toast confirms the import.
```

## Diff

[Same diff]
