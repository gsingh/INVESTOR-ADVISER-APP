---
baseline_commit: NO_VCS
---

# Story 4.1: XIRR Engine (Pure Function)

Status: done

## Story

As a developer,
I want a pure-function XIRR computation module in `src/lib/xirr.ts` with Vitest tests,
So that portfolio returns can be accurately calculated without UI dependencies.

## Acceptance Criteria

1. **Given** the XIRR engine is implemented in `src/lib/xirr.ts`,
   **When** I inspect the module,
   **Then** it exports a `computeXIRR(transactions)` pure function with no React or DOM imports
   **And** it accepts an array of `{date: string, amount: number}` entries where negative = investment, positive = redemption, and the final entry represents current portfolio value.

2. **Given** the function computes XIRR,
   **When** provided with valid transaction data,
   **Then** it uses Newton's method to solve for the internal rate of return
   **And** returns the annualized return as a decimal (e.g., 0.124 = 12.4%).

3. **Given** edge cases are encountered,
   **When** there is only a single transaction (no redemptions),
   **Then** the function returns `null` indicating insufficient data.
   **When** the Newton method does not converge,
   **Then** the function returns `null` with a fallback approximation.

4. **Given** Vitest tests exist in `src/lib/xirr.test.ts`,
   **When** the test suite runs,
   **Then** tests cover: standard XIRR calculation, single-transaction edge case, non-convergence handling, and boundary conditions with zero amounts.

## Tasks / Subtasks

### 1. Create `src/lib/xirr.ts` — pure XIRR engine
- [x] Define `XirrTransaction` type: `{ date: string; amount: number }` (negative = investment, positive = redemption, final = current value)
- [x] Define `computeXIRR(transactions: XirrTransaction[], guess?: number): number | null`
- [x] Implement Newton's method to solve `Σ(amount_i / (1 + r)^(days_i / 365)) = 0`
  - [x] Compute days difference from first transaction date for each entry
  - [x] Iterate Newton-Raphson: `r_next = r - f(r) / f'(r)`
  - [x] Max 1000 iterations, convergence threshold 1e-7
  - [x] If f'(r) ≈ 0 (near-zero derivative), break to avoid division overflow
- [x] Guard: if only 1 transaction → return `null` immediately
- [x] Guard: if no negative amounts (no investment) → return `null`
- [x] Guard: if all amounts are zero → return `null`
- [x] If Newton method does not converge → return `null`
- [x] No React/DOM imports — pure TypeScript only

### 2. Create `src/lib/xirr.test.ts` — comprehensive Vitest tests
- [x] Test: standard XIRR calculation with known cash flows (verify against known result: monthly SIP of ₹5000 over 12 months with final value ₹65,000 → ~11.5% annualized)
- [x] Test: single transaction returns `null`
- [x] Test: only one positive transaction (redemption with no investments) returns `null`
- [x] Test: all zero amounts returns `null`
- [x] Test: non-convergence with extreme values returns `null`
- [x] Test: XIRR for lump-sum investment: invest ₹100,000, after 365 days value = ₹115,000 → 15% annualized
- [x] Test: multiple redemptions with intermediate investments
- [x] Test: transactions with fractional years (partial years between dates)
- [x] Test: negative XIRR (portfolio lost value over time)
- [x] Test: custom guess parameter converges correctly

### 3. Verify compilation and tests
- [x] `npx tsc --noEmit` — zero errors
- [x] `npx vitest run src/lib/xirr.test.ts` — all 12 tests pass
- [x] `npx vitest run` — 76 tests pass, no regressions

## Dev Notes

### XIRR Engine Architecture
- Pure function — no React, no DOM, no side effects, no async — follows `src/lib/scorecard.ts` pattern
- Location: `src/lib/xirr.ts` per architecture [`architecture.md:322`]
- Co-located test file at `src/lib/xirr.test.ts`
- Follows AR4: "Pure-function engines: scorecard engine, SIP calculator, XIRR computation as standalone TypeScript modules tested with Vitest" [`architecture.md:497`]
- No existing Vitest config — tests run via Vite config in project mode (`npx vitest run`)

### Algorithm: Newton's Method for XIRR

```
Given: cash flows C_i on dates D_i, where t_i = (D_i - D_0) / 365 in years

NPV function:  f(r) = Σ C_i / (1 + r)^t_i
Derivative:    f'(r) = Σ -t_i * C_i / (1 + r)^(t_i + 1)

Iterate: r_{n+1} = r_n - f(r_n) / f'(r_n)
Until: |f(r_n)| < 1e-7 OR |r_{n+1} - r_n| < 1e-7
Max iterations: 1000
```

### Edge Case Handling
| Condition | Behavior |
|-----------|----------|
| Only 1 transaction | Return `null` |
| All amounts zero | Return `null` |
| Net cash flow ≥ 0 (no net investment) | Return `null` |
| Newton does not converge after 1000 iterations | Return `null` |
| f'(r) near zero during iteration | Break iteration, return `null` |
| Negative XIRR (loss) | Return negative decimal (e.g., -0.05 = -5%) |

### Transaction Input Format
- Uses same format as Dexie `Transaction` type from `src/stores/db.ts` (date as ISO string, amount as number)
- Negative amounts = investments/purchases (cash outflow from investor's perspective)
- Positive amounts = redemptions/withdrawals (cash inflow to investor)
- Final positive entry = current portfolio value (mark-to-market)
- Date format: ISO 8601 strings (`2026-06-03`)

### Default Guess
- Start with `guess = 0.1` (10% annualized) unless caller provides custom guess
- This is a reasonable starting point for Indian equity mutual funds which historically return 10-15%

### Testing Pattern
Follow existing Vitest pattern from `src/lib/scorecard.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { computeXIRR } from './xirr'

describe('computeXIRR', () => {
  it('computes XIRR for standard cash flows', () => {
    const result = computeXIRR([
      { date: '2025-01-01', amount: -100000 },
      { date: '2026-01-01', amount: 115000 },
    ])
    expect(result).toBeCloseTo(0.15, 2) // 15%
  })
})
```

### Known Good Test Data
| Test | Input | Expected |
|------|-------|----------|
| Lump-sum 1yr | -100000 on 2025-01-01, +115000 on 2026-01-01 | ~0.15 (15%) |
| Monthly SIP 1yr | 12× -5000 monthly, +65000 final | ~0.115 (11.5%) |
| Lump-sum loss | -100000, +85000 after 365d | ~-0.15 (-15%) |
| Single tx only | Just -50000 | null |

### Source Tree Components to Touch
| File | Action |
|------|--------|
| `src/lib/xirr.ts` | NEW — pure XIRR engine |
| `src/lib/xirr.test.ts` | NEW — Vitest tests |

### References
- [Source: epics.md:458-484] — Full Story 4.1 acceptance criteria
- [Source: architecture.md:106] — `lib/` directory for pure functions
- [Source: architecture.md:170] — Pure-function engines pattern
- [Source: architecture.md:187] — Implementation sequence: pure-function engines before UI
- [Source: architecture.md:322] — `src/lib/xirr.ts` in project structure
- [Source: architecture.md:398] — Computed values data flow: pure function → UI
- [Source: architecture.md:497] — Pure-function core engines test in isolation
- [Source: src/stores/db.ts:17-27] — Transaction Dexie interface (date, amount schema)
- [Source: src/lib/scorecard.test.ts] — Existing Vitest test pattern
- [Source: src/lib/sip-calculator.test.ts] — Existing Vitest test pattern

## Dev Agent Record

### Agent Model Used
Big Pickle

### Completion Notes
- `src/lib/xirr.ts` — pure function implementing Newton's method for XIRR calculation
  - Uses `Σ(C_i / (1+r)^(t_i)) = 0` where t_i = days_from_first / 365
  - Newton-Raphson iteration with max 1000 iterations, convergence at 1e-7
  - Guards: <2 transactions, all-zero amounts, no negative cash flows (no investment), NaN amounts, invalid dates, non-convergence, (1+r) <= 0, derivative near zero
  - Returns `number | null` — null for edge cases, decimal (e.g. 0.15 = 15%) for valid results
  - No React/DOM imports, no side effects, pure TypeScript
- `src/lib/xirr.test.ts` — 12 tests covering:
  - Lump-sum 1yr (15%), monthly SIP (~11.5%), loss case (-15%)
  - Single transaction, single positive, all-zero amounts → null
  - Non-convergence with extreme values → null
  - Fractional years, multiple redemptions/intermediate investments
  - Custom guess parameter, NaN/invalid date guards
- All validations pass: `tsc --noEmit` zero errors, full `vitest run` 76/76 pass (12 new + 64 existing)

### File List
- `src/lib/xirr.ts` — NEW: XIRR pure function engine
- `src/lib/xirr.test.ts` — NEW: comprehensive Vitest tests

## Review Findings (2026-06-04)

### Patch Findings
- [x] [Review][Patch] Same-date net-zero cash flow returns initial guess instead of null [src/lib/xirr.ts:38-64] — FIXED: added zero-time-span guard before Newton loop.
- [x] [Review][Patch] Transactions not sorted by date can produce negative time deltas [src/lib/xirr.ts:41-44] — FIXED: transactions sorted by date before computation.
- [x] [Review][Patch] `denom <= 0` check run in inner loop despite being loop-invariant [src/lib/xirr.ts:46] — FIXED: moved to outer loop before inner iteration.

### Deferred Findings
- [x] [Review][Defer] Date parsing locale-dependent for non-ISO strings [src/lib/xirr.ts:11-13,44] — deferred, documented contract requires ISO 8601
- [x] [Review][Defer] Absolute Newton tolerance for tiny rates [src/lib/xirr.ts:53] — deferred, theoretical concern, not relevant for 5-20% mutual fund returns
- [x] [Review][Defer] Date objects created twice per transaction [src/lib/xirr.ts:14,41] — deferred, performance micro-optimization
