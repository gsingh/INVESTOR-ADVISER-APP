# Epic 5 Retrospective: Reviews, Alerts & Investment Journal

Date: 2026-06-04

## Delivery

- **Stories:** 3/3 complete (5-1, 5-2, 5-3)
- **Tests:** 119 passing (87 pre-epic + 32 new)
- **TypeScript:** Clean, no errors

## Story-by-Story

### 5-1 Review Schedule & Reminder System
- Added `useAlerts` (computeAlerts), `useAlertsState` (dismiss), `useReviewSettings` (frequency/nextDate)
- 14 review patches applied across 2 rounds
- Established pattern: sessionStorage `dismissedAlertIds`, deterministic alert IDs

### 5-2 Review Checklist Flow
- 5-step stepper: drift, category exposure, fund-role fit, benchmark comparison, rationale
- 23 patches across 2 rounds (13 + 10)
- AC #3 retrofitted: QuarterlySnapshot table (version 5) for consecutive-quarter underperformance tracking
- Established pattern: `addMonths` extraction to shared utils, Badge variant mapping

### 5-3 Investment Journal
- Structured entry form, keyword search, reverse-chronological timeline
- 4 patches in single review round
- Journal interface existed since version 1 — zero schema migration

## Key Learnings

1. **Forward-plan Dexie tables** — Journal table existed from v1, made 5.3 implementation trivial
2. **Pure-function engines pay off** — All core logic testable without React/Dexie
3. **Review cycle catches non-obvious bugs** — setMonth date drift, sessionStorage semantics, consecutive-quarter tracking
4. **Delete safety pattern** — Dialog confirmation + submitting guard should be default for all destructive actions

## Action Items

- [x] Epic 5 marked complete in sprint-status.yaml
- [ ] Consider running retro for Epics 1-4 (all optional, none done)
- [ ] All project stories complete — project ready for deployment/dogfooding

## Technical Debt Summary

See `deferred-work.md` for full registry. Notable items:
- Hardcoded BENCHMARK_RATES (requires external API)
- sessionStorage cleared on tab close (intentional for single-user SPA)
- Stale select options after external data change (edge case, single-user MVP)
