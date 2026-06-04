import { describe, it, expect } from 'vitest'
import { computeXIRR } from './xirr'

describe('computeXIRR', () => {
  it('computes XIRR for lump-sum investment over 1 year', () => {
    const result = computeXIRR([
      { date: '2025-01-01', amount: -100000 },
      { date: '2026-01-01', amount: 115000 },
    ])
    expect(result).not.toBeNull()
    expect(result!).toBeCloseTo(0.15, 4)
  })

  it('computes XIRR for monthly SIP over 12 months', () => {
    const amounts = Array(12).fill(-5000)
    const dates = Array.from({ length: 12 }, (_, i) => {
      const m = (i + 1).toString().padStart(2, '0')
      return `2025-${m}-01`
    })
    const transactions = dates.map((d, i) => ({ date: d, amount: amounts[i] }))
    transactions.push({ date: '2026-01-01', amount: 65000 })

    const result = computeXIRR(transactions)
    expect(result).not.toBeNull()
    expect(result!).toBeCloseTo(0.115, 1)
  })

  it('returns null for a single transaction', () => {
    const result = computeXIRR([{ date: '2025-01-01', amount: -50000 }])
    expect(result).toBeNull()
  })

  it('returns null when only one positive transaction', () => {
    const result = computeXIRR([{ date: '2025-01-01', amount: 50000 }])
    expect(result).toBeNull()
  })

  it('returns null when all amounts are zero', () => {
    const result = computeXIRR([
      { date: '2025-01-01', amount: 0 },
      { date: '2026-01-01', amount: 0 },
    ])
    expect(result).toBeNull()
  })

  it('returns null for extreme values causing non-convergence', () => {
    const result = computeXIRR([
      { date: '2025-01-01', amount: -1e-10 },
      { date: '2026-01-01', amount: 1e10 },
    ])
    expect(result).toBeNull()
  })

  it('computes negative XIRR for losses', () => {
    const result = computeXIRR([
      { date: '2025-01-01', amount: -100000 },
      { date: '2026-01-01', amount: 85000 },
    ])
    expect(result).not.toBeNull()
    expect(result!).toBeCloseTo(-0.15, 4)
  })

  it('handles transactions with fractional years', () => {
    const result = computeXIRR([
      { date: '2025-01-01', amount: -50000 },
      { date: '2025-07-02', amount: 52000 },
    ])
    expect(result).not.toBeNull()
    expect(result!).toBeGreaterThan(0)
  })

  it('handles multiple redemptions with intermediate investments', () => {
    const result = computeXIRR([
      { date: '2025-01-01', amount: -100000 },
      { date: '2025-06-01', amount: 20000 },
      { date: '2025-09-01', amount: -30000 },
      { date: '2026-01-01', amount: 95000 },
    ])
    expect(result).not.toBeNull()
    expect(result!).toBeGreaterThan(-0.5)
    expect(result!).toBeLessThan(0.5)
  })

  it('accepts a custom guess parameter', () => {
    const result = computeXIRR(
      [
        { date: '2025-01-01', amount: -100000 },
        { date: '2026-01-01', amount: 115000 },
      ],
      0.2,
    )
    expect(result).not.toBeNull()
    expect(result!).toBeCloseTo(0.15, 4)
  })

  it('returns null for NaN amount', () => {
    const result = computeXIRR([
      { date: '2025-01-01', amount: NaN },
      { date: '2026-01-01', amount: 100 },
    ])
    expect(result).toBeNull()
  })

  it('returns null for invalid date', () => {
    const result = computeXIRR([
      { date: 'not-a-date', amount: -100 },
      { date: '2026-01-01', amount: 110 },
    ])
    expect(result).toBeNull()
  })

  it('returns null when all transactions are on the same date', () => {
    const result = computeXIRR([
      { date: '2025-01-01', amount: -100 },
      { date: '2025-01-01', amount: 50 },
      { date: '2025-01-01', amount: 50 },
    ])
    expect(result).toBeNull()
  })

  it('handles unsorted transactions correctly', () => {
    const result = computeXIRR([
      { date: '2026-01-01', amount: 115000 },
      { date: '2025-01-01', amount: -100000 },
    ])
    expect(result).not.toBeNull()
    expect(result!).toBeCloseTo(0.15, 4)
  })
})
