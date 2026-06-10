import { describe, it, expect } from 'vitest'
import { computeSteps } from './useReviewSteps'
import type { Goal, GoalHolding, Portfolio, QuarterlySnapshot } from '@/stores/db'

const baseGoal: Goal = {
  name: 'Test Goal',
  type: 'Long-Term',
  targetAmount: 100000,
  currentAmount: 50000,
  targetDate: '2030-01-01',
  riskProfile: 'Moderate',
  categoryAllocation: {},
  status: 'active',
  createdAt: '2026-01-01',
}

const baseHolding: GoalHolding = {
  id: 1,
  goalId: 1,
  fundName: 'Test Fund',
  amfiCategory: 'Large Cap',
  currentValue: 8000,
  targetAllocation: 8000,
  createdAt: '2026-01-01',
  updatedAt: '2026-06-01',
}

const basePortfolio: Portfolio = {
  schemeCode: 'SC001',
  schemeName: 'Test Portfolio Fund',
  category: 'Large Cap',
  units: 100,
  targetAllocation: 10,
}

const makeSnapshot = (holdingId: number, quarter: string, currentValue: number): QuarterlySnapshot => ({
  id: holdingId,
  holdingId,
  goalId: 1,
  fundName: 'Test Fund',
  amfiCategory: 'Large Cap',
  currentValue,
  targetAllocation: 8000,
  quarter,
  snapshotDate: '2026-01-01',
})

describe('computeSteps', () => {
  it('returns all 5 steps', () => {
    const steps = computeSteps([baseGoal], [baseHolding], [basePortfolio])
    expect(steps).toHaveLength(5)
    expect(steps.map(s => s.name)).toEqual([
      'drift_check',
      'category_exposure',
      'fund_role_fit',
      'benchmark_comparison',
      'rationale_outcome',
    ])
  })

  it('marks drift as pass when all under 5%', () => {
    const steps = computeSteps([baseGoal], [baseHolding], [])
    expect(steps[0].status).toBe('pass')
  })

  it('marks drift as warn when any is 5-10%', () => {
    const holding: GoalHolding = { ...baseHolding, currentValue: 8600, targetAllocation: 8000 }
    const steps = computeSteps([baseGoal], [holding], [])
    expect(steps[0].status).toBe('warn')
  })

  it('marks drift as fail when any exceeds 10%', () => {
    const holding: GoalHolding = { ...baseHolding, currentValue: 20000, targetAllocation: 8000 }
    const steps = computeSteps([baseGoal], [holding], [])
    expect(steps[0].status).toBe('fail')
  })

  it('handles zero targetAllocation without crashing', () => {
    const holding: GoalHolding = { ...baseHolding, targetAllocation: 0 }
    const steps = computeSteps([baseGoal], [holding], [])
    expect(steps[0].status).toBe('pass')
  })

  it('includes excluded note for zero target allocation', () => {
    const holding: GoalHolding = { ...baseHolding, targetAllocation: 0 }
    const steps = computeSteps([baseGoal], [holding], [])
    expect(steps[0].details).toContain('excluded')
    expect(steps[0].details).toContain('zero target allocation')
  })

  it('returns pass for category exposure when all categories have <2 funds', () => {
    const steps = computeSteps([baseGoal], [baseHolding], [])
    expect(steps[1].status).toBe('pass')
  })

  it('returns warn for category exposure when category has ≥2 funds', () => {
    const holdings: GoalHolding[] = [
      { ...baseHolding, amfiCategory: 'Banking' },
      { ...baseHolding, fundName: 'Fund 2', amfiCategory: 'Banking' },
    ]
    const steps = computeSteps([baseGoal], holdings, [])
    expect(steps[1].status).toBe('warn')
  })

  it('uses Unknown for empty amfiCategory in category exposure', () => {
    const holdings: GoalHolding[] = [
      { ...baseHolding, amfiCategory: '' },
      { ...baseHolding, fundName: 'Fund 2', amfiCategory: '' },
    ]
    const steps = computeSteps([baseGoal], holdings, [])
    expect(steps[1].details).toContain('Unknown')
  })

  it('returns pass for fund role fit when all have category', () => {
    const steps = computeSteps([baseGoal], [], [basePortfolio])
    expect(steps[2].status).toBe('pass')
  })

  it('returns warn for fund role fit when portfolio has no category', () => {
    const portfolio: Portfolio = { ...basePortfolio, category: '' }
    const steps = computeSteps([baseGoal], [], [portfolio])
    expect(steps[2].status).toBe('warn')
  })

  it('returns pass for benchmark comparison when no holdings', () => {
    const steps = computeSteps([baseGoal], [], [])
    expect(steps[3].status).toBe('pass')
    expect(steps[3].details).toContain('No holdings')
  })

  it('shows insufficient data when no snapshots exist', () => {
    const steps = computeSteps([baseGoal], [baseHolding], [])
    expect(steps[3].details).toContain('insufficient quarterly data')
  })

  it('flags consecutive-quarter underperformance from snapshots', () => {
    const holding: GoalHolding = { ...baseHolding, id: 1 }
    const snapshots: QuarterlySnapshot[] = [
      makeSnapshot(1, '2025-Q4', 10000),
      makeSnapshot(1, '2026-Q1', 10050),
    ]
    const steps = computeSteps([baseGoal], [holding], [], snapshots)
    expect(steps[3].status).toBe('fail')
    expect(steps[3].details).toContain('underperformed its benchmark')
    expect(steps[3].details).toContain('FAIL')
  })

  it('passes benchmark when snapshot growth matches expected', () => {
    const holding: GoalHolding = { ...baseHolding, id: 1 }
    const snapshots: QuarterlySnapshot[] = [
      makeSnapshot(1, '2025-Q4', 8000),
      makeSnapshot(1, '2026-Q1', 8240),
    ]
    const steps = computeSteps([baseGoal], [holding], [], snapshots)
    expect(steps[3].status).toBe('pass')
  })

  it('warns for unknown category benchmark', () => {
    const holding: GoalHolding = { ...baseHolding, id: 1, amfiCategory: 'Weird Category' }
    const steps = computeSteps([baseGoal], [holding], [])
    expect(steps[3].status).toBe('warn')
    expect(steps[3].details).toContain('no benchmark data')
  })

  it('handles empty holdings gracefully', () => {
    const steps = computeSteps([baseGoal], [], [])
    expect(steps[0].details).toContain('No holdings')
    expect(steps[1].details).toContain('No holdings')
    expect(steps[3].details).toContain('No holdings')
  })

  it('handles empty portfolios gracefully', () => {
    const steps = computeSteps([baseGoal], [baseHolding], [])
    expect(steps[2].details).toContain('No portfolio')
  })
})
