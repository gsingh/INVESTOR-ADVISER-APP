import { describe, it, expect } from 'vitest'
import { calculateSIP } from './sip-calculator'

const futureDate = new Date()
futureDate.setFullYear(futureDate.getFullYear() + 5)
const futureDateStr = futureDate.toISOString().split('T')[0]

const pastDate = new Date()
pastDate.setFullYear(pastDate.getFullYear() - 1)
const pastDateStr = pastDate.toISOString().split('T')[0]

describe('calculateSIP', () => {
  it('returns three scenarios with correct labels', () => {
    const result = calculateSIP({
      targetAmount: 300000,
      targetDate: futureDateStr,
      startingAmount: 50000,
      expectedInflation: 0.04,
      monthlyContribution: 5000,
    })

    expect(result.scenarios).toHaveLength(3)
    expect(result.scenarios[0].label).toBe('Conservative 6%')
    expect(result.scenarios[1].label).toBe('Moderate 8%')
    expect(result.scenarios[2].label).toBe('Optimistic 10%')
  })

  it('shows on_track when monthly contribution is sufficient', () => {
    const result = calculateSIP({
      targetAmount: 300000,
      targetDate: futureDateStr,
      startingAmount: 50000,
      expectedInflation: 0.04,
      monthlyContribution: 10000,
    })

    expect(result.gap.status).toBe('on_track')
    expect(result.gap.amount).toBeGreaterThanOrEqual(0)
  })

  it('shows a gap when monthly contribution is low', () => {
    const result = calculateSIP({
      targetAmount: 10000000,
      targetDate: futureDateStr,
      startingAmount: 0,
      expectedInflation: 0.04,
      monthlyContribution: 1000,
    })

    expect(result.gap.status === 'minor_gap' || result.gap.status === 'significant_gap').toBe(true)
    expect(result.gap.amount).toBeLessThan(0)
  })

  it('returns past_due status for past target date', () => {
    const result = calculateSIP({
      targetAmount: 300000,
      targetDate: pastDateStr,
      startingAmount: 50000,
      expectedInflation: 0.04,
      monthlyContribution: 5000,
    })

    expect(result.gap.status).toBe('past_due')
    expect(result.scenarios).toHaveLength(0)
  })

  it('handles zero starting amount', () => {
    const result = calculateSIP({
      targetAmount: 300000,
      targetDate: futureDateStr,
      startingAmount: 0,
      expectedInflation: 0.04,
      monthlyContribution: 5000,
    })

    expect(result.scenarios).toHaveLength(3)
    result.scenarios.forEach(s => {
      expect(s.projectedValue).toBeGreaterThan(0)
    })
  })

  it('generates monthly data array', () => {
    const result = calculateSIP({
      targetAmount: 300000,
      targetDate: futureDateStr,
      startingAmount: 50000,
      expectedInflation: 0.04,
      monthlyContribution: 5000,
    })

    expect(result.monthlyData.length).toBeGreaterThan(1)
    expect(result.monthlyData[0].month).toBe(0)
    expect(result.monthlyData[0].target).toBeGreaterThan(300000)
  })

  it('suggested increase is zero when on track', () => {
    const result = calculateSIP({
      targetAmount: 1000,
      targetDate: futureDateStr,
      startingAmount: 0,
      expectedInflation: 0.04,
      monthlyContribution: 5000,
    })

    expect(result.gap.status).toBe('on_track')
    expect(result.gap.suggestedIncrease).toBe(0)
  })

  it('returns scenarios with zero projected gains when target date is today', () => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const result = calculateSIP({
      targetAmount: 300000,
      targetDate: todayStr,
      startingAmount: 50000,
      expectedInflation: 0.04,
      monthlyContribution: 5000,
    })

    expect(result.gap.status).not.toBe('past_due')
    expect(result.scenarios).toHaveLength(3)
    result.scenarios.forEach(s => {
      expect(s.monthlySIP).toBe(0)
    })
  })
})
