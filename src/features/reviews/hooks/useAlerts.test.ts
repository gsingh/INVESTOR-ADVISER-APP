import { describe, it, expect } from 'vitest'
import { computeAlerts } from './useAlerts'
import type { Goal, GoalHolding } from '@/stores/db'

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
  goalId: 1,
  fundName: 'Test Fund',
  amfiCategory: 'Large Cap',
  currentValue: 10000,
  targetAllocation: 8000,
  createdAt: '2026-01-01',
  updatedAt: '2026-06-01',
}

describe('computeAlerts', () => {
  it('returns drift alert when drift exceeds 5%', () => {
    const holding: GoalHolding = {
      ...baseHolding,
      currentValue: 8600,
      targetAllocation: 8000,
    }
    const alerts = computeAlerts([baseGoal], [holding], [], [])
    expect(alerts).toHaveLength(1)
    expect(alerts[0].type).toBe('drift')
    expect(alerts[0].severity).toBe('warning')
    expect(alerts[0].title).toContain('Drift alert')
  })

  it('returns critical severity for drift over 10%', () => {
    const holding: GoalHolding = {
      ...baseHolding,
      currentValue: 20000,
      targetAllocation: 8000,
    }
    const alerts = computeAlerts([baseGoal], [holding], [], [])
    expect(alerts).toHaveLength(1)
    expect(alerts[0].severity).toBe('critical')
  })

  it('does not create drift alert when drift is under 5%', () => {
    const holding: GoalHolding = {
      ...baseHolding,
      currentValue: 8200,
      targetAllocation: 8000,
    }
    const alerts = computeAlerts([baseGoal], [holding], [], [])
    const driftAlerts = alerts.filter(a => a.type === 'drift')
    expect(driftAlerts).toHaveLength(0)
  })

  it('creates duplicate exposure alert when ≥2 funds in same category', () => {
    const holdings: GoalHolding[] = [
      { ...baseHolding, amfiCategory: 'Banking' },
      { ...baseHolding, fundName: 'Test Fund 2', amfiCategory: 'Banking' },
    ]
    const alerts = computeAlerts([baseGoal], holdings, [], [])
    const dupAlerts = alerts.filter(a => a.type === 'duplicate_exposure')
    expect(dupAlerts).toHaveLength(1)
    expect(dupAlerts[0].title).toContain('2 funds in Banking sector')
  })

  it('does not create duplicate exposure for single fund in category', () => {
    const holdings: GoalHolding[] = [
      { ...baseHolding, amfiCategory: 'Large Cap' },
    ]
    const alerts = computeAlerts([baseGoal], holdings, [], [])
    const dupAlerts = alerts.filter(a => a.type === 'duplicate_exposure')
    expect(dupAlerts).toHaveLength(0)
  })

  it('filters out dismissed alerts', () => {
    const holding: GoalHolding = {
      ...baseHolding,
      currentValue: 8600,
      targetAllocation: 8000,
    }
    const alerts = computeAlerts([baseGoal], [holding], [], ['drift-1-Test Fund'])
    expect(alerts).toHaveLength(0)
  })

  it('returns no alerts for empty holdings', () => {
    const alerts = computeAlerts([baseGoal], [], [], [])
    expect(alerts).toHaveLength(0)
  })

  it('sorts critical alerts before warnings', () => {
    const holdings: GoalHolding[] = [
      {
        ...baseHolding,
        id: 1,
        fundName: 'Warning Fund',
        currentValue: 8600,
        targetAllocation: 8000,
        amfiCategory: 'Large Cap',
      },
      {
        ...baseHolding,
        id: 2,
        fundName: 'Critical Fund',
        currentValue: 20000,
        targetAllocation: 8000,
        amfiCategory: 'Small Cap',
      },
    ]
    const alerts = computeAlerts([baseGoal], holdings, [], [])
    const driftAlerts = alerts.filter(a => a.type === 'drift')
    expect(driftAlerts.length).toBeGreaterThanOrEqual(2)
    expect(driftAlerts[0].severity).toBe('critical')
  })

  it('handles zero targetAllocation without crashing', () => {
    const holding: GoalHolding = {
      ...baseHolding,
      targetAllocation: 0,
    }
    const alerts = computeAlerts([baseGoal], [holding], [], [])
    const driftAlerts = alerts.filter(a => a.type === 'drift')
    expect(driftAlerts).toHaveLength(0)
  })
})
