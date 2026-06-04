import { describe, it, expect } from 'vitest'
import { computeScore } from './scorecard'
import type { ScorableFund } from '@/types/scorecard'

function makeFund(overrides: Partial<ScorableFund> = {}): ScorableFund {
  return {
    schemeCode: '123456',
    schemeName: 'Test Fund',
    category: 'Equity',
    subCategory: 'Flexi Cap',
    expenseRatio: 1.0,
    aum: 5000,
    launchDate: '2010-01-01',
    benchmark: 'Nifty 500 TRI',
    plan: 'Direct',
    option: 'Growth',
    ...overrides,
  }
}

describe('computeScore', () => {
  it('returns composite score with equal default weights', () => {
    const result = computeScore(makeFund())
    expect(result.compositeScore).toBeGreaterThan(0)
    expect(result.compositeScore).toBeLessThanOrEqual(100)
    expect(result.factors).toHaveLength(10)
    expect(result.maxPossibleScore).toBe(100)
  })

  it('includes all 10 factors in the result', () => {
    const result = computeScore(makeFund())
    const keys = result.factors.map(f => f.key)
    expect(keys).toContain('categoryFit')
    expect(keys).toContain('cost')
    expect(keys).toContain('fundAge')
    expect(keys).toContain('aumSanity')
    expect(keys).toContain('benchmarkSuitability')
    expect(keys).toContain('consistency')
    expect(keys).toContain('volatility')
    expect(keys).toContain('drawdown')
    expect(keys).toContain('exitLoad')
    expect(keys).toContain('overlap')
  })

  it('normalizes weights when sum does not equal 100', () => {
    const result = computeScore(makeFund(), { cost: 50, fundAge: 50 })
    expect(result.weightsNormalized).toBe(true)
    expect(result.compositeScore).toBeGreaterThanOrEqual(0)
    expect(result.compositeScore).toBeLessThanOrEqual(100)
  })

  it('does not flag normalization when weights sum to 100', () => {
    const result = computeScore(makeFund(), {
      consistency: 0, cost: 100, categoryFit: 0, benchmarkSuitability: 0,
      fundAge: 0, aumSanity: 0, volatility: 0, drawdown: 0, exitLoad: 0, overlap: 0,
    })
    expect(result.weightsNormalized).toBe(false)
  })

  it('handles zero weights correctly', () => {
    const result = computeScore(makeFund(), { cost: 0, fundAge: 100 })
    const costFactor = result.factors.find(f => f.key === 'cost')
    expect(costFactor?.weight).toBe(0)
    expect(costFactor?.weightedContribution).toBe(0)
    expect(costFactor?.explanation).toBe('Factor weight is zero — not scored')
    expect(result.compositeScore).toBeGreaterThan(0)
  })

  it('returns default 10 rawScore for factors with missing data', () => {
    const fund = makeFund({ expenseRatio: undefined, aum: undefined, launchDate: undefined })
    const result = computeScore(fund, {
      cost: 100,
      fundAge: 0,
      aumSanity: 0,
      categoryFit: 0,
      benchmarkSuitability: 0,
      consistency: 0,
      volatility: 0,
      drawdown: 0,
      exitLoad: 0,
      overlap: 0,
    })
    expect(result.factors.find(f => f.key === 'cost')?.rawScore).toBe(10)
  })

  it('computes single-factor scoring correctly', () => {
    const result = computeScore(makeFund(), {
      consistency: 0, cost: 100, categoryFit: 0, benchmarkSuitability: 0,
      fundAge: 0, aumSanity: 0, volatility: 0, drawdown: 0, exitLoad: 0, overlap: 0,
    })
    expect(result.weightsNormalized).toBe(false)
    expect(result.factors.filter(f => f.weight > 0)).toHaveLength(1)
    const costFactor = result.factors.find(f => f.key === 'cost')!
    expect(costFactor.weight).toBe(100)
    expect(result.compositeScore).toBe(costFactor.weightedContribution)
  })

  it('each factor has bounded rawScore [0-20]', () => {
    const result = computeScore(makeFund())
    for (const factor of result.factors) {
      expect(factor.rawScore).toBeGreaterThanOrEqual(0)
      expect(factor.rawScore).toBeLessThanOrEqual(20)
    }
  })

  it('compositeScore is sum of weighted contributions', () => {
    const result = computeScore(makeFund())
    const sumContributions = result.factors.reduce((acc, f) => acc + f.weightedContribution, 0)
    expect(result.compositeScore).toBe(Math.round(Math.min(100, Math.max(0, sumContributions)) * 100) / 100)
  })

  it('caps fund age at 20 for very old funds', () => {
    const fund = makeFund({ launchDate: '1980-01-01' })
    const result = computeScore(fund, { fundAge: 100 })
    const ageFactor = result.factors.find(f => f.key === 'fundAge')
    expect(ageFactor?.rawScore).toBe(20)
  })

  it('scores exit load for various durations', () => {
    const noLoad = makeFund({ exitLoad: { exists: false } })
    const shortLoad = makeFund({ exitLoad: { exists: true, durationYears: 0.5 } })
    const longLoad = makeFund({ exitLoad: { exists: true, durationYears: 5 } })

    const noLoadResult = computeScore(noLoad, { exitLoad: 100 })
    const shortResult = computeScore(shortLoad, { exitLoad: 100 })
    const longResult = computeScore(longLoad, { exitLoad: 100 })

    const noLoadScore = noLoadResult.factors.find(f => f.key === 'exitLoad')!.rawScore
    const shortScore = shortResult.factors.find(f => f.key === 'exitLoad')!.rawScore
    const longScore = longResult.factors.find(f => f.key === 'exitLoad')!.rawScore

    expect(noLoadScore).toBe(20)
    expect(shortScore).toBe(15)
    expect(longScore).toBe(0)
  })

  it('scores category fit based on sub-category definition', () => {
    const goodCat = makeFund({ subCategory: 'Flexi Cap', category: 'Equity' })
    const catOnly = makeFund({ subCategory: undefined, category: 'Equity' })
    const noCat = makeFund({ subCategory: undefined, category: undefined })

    const goodResult = computeScore(goodCat, { categoryFit: 100 })
    const catResult = computeScore(catOnly, { categoryFit: 100 })
    const noResult = computeScore(noCat, { categoryFit: 100 })

    expect(goodResult.factors.find(f => f.key === 'categoryFit')!.rawScore).toBe(20)
    expect(catResult.factors.find(f => f.key === 'categoryFit')!.rawScore).toBe(10)
    expect(noResult.factors.find(f => f.key === 'categoryFit')!.rawScore).toBe(0)
  })

  it('handles undefined/null fields gracefully', () => {
    const fund = makeFund({
      subCategory: undefined,
      expenseRatio: undefined,
      aum: undefined,
      launchDate: undefined,
      benchmark: undefined,
      exitLoad: undefined,
    })
    const result = computeScore(fund)
    expect(result.factors).toHaveLength(10)
    expect(result.compositeScore).toBeGreaterThanOrEqual(0)
    for (const factor of result.factors) {
      expect(typeof factor.rawScore).toBe('number')
      expect(typeof factor.weightedContribution).toBe('number')
      expect(typeof factor.explanation).toBe('string')
      expect(factor.rawScore).toBeGreaterThanOrEqual(0)
      expect(factor.rawScore).toBeLessThanOrEqual(20)
    }
  })

  it('expense ratio at 0.5% scores 20 on cost', () => {
    const fund = makeFund({ expenseRatio: 0.5 })
    const result = computeScore(fund, { cost: 100 })
    expect(result.factors.find(f => f.key === 'cost')!.rawScore).toBe(20)
  })

  it('expense ratio at 2.5% scores 0 on cost', () => {
    const fund = makeFund({ expenseRatio: 2.5 })
    const result = computeScore(fund, { cost: 100 })
    expect(result.factors.find(f => f.key === 'cost')!.rawScore).toBe(0)
  })

  it('AUM in ideal range scores 20', () => {
    const fund = makeFund({ aum: 5000 })
    const result = computeScore(fund, { aumSanity: 100 })
    expect(result.factors.find(f => f.key === 'aumSanity')!.rawScore).toBe(20)
  })

  it('benchmark with TRI scores 20', () => {
    const fund = makeFund({ benchmark: 'Nifty 500 TRI' })
    const result = computeScore(fund, { benchmarkSuitability: 100 })
    expect(result.factors.find(f => f.key === 'benchmarkSuitability')!.rawScore).toBe(20)
  })

  it('no benchmark scores 0', () => {
    const fund = makeFund({ benchmark: undefined })
    const result = computeScore(fund, { benchmarkSuitability: 100 })
    expect(result.factors.find(f => f.key === 'benchmarkSuitability')!.rawScore).toBe(0)
  })

  it('all factors contribute proportionally with equal weights', () => {
    const result = computeScore(makeFund())
    const weightedFactors = result.factors.filter(f => f.weight > 0)
    expect(weightedFactors.length).toBeGreaterThan(1)
    for (const factor of weightedFactors) {
      expect(factor.weightedContribution).toBeGreaterThanOrEqual(0)
      expect(factor.weightedContribution).toBeLessThanOrEqual(factor.weight)
    }
  })

  it('returns explanation for every factor', () => {
    const result = computeScore(makeFund())
    for (const factor of result.factors) {
      expect(factor.explanation).toBeTruthy()
      expect(typeof factor.explanation).toBe('string')
    }
  })

  it('handles null/undefined fund gracefully', () => {
    const nullResult = computeScore(null)
    expect(nullResult.compositeScore).toBe(0)
    expect(nullResult.factors).toHaveLength(10)
    for (const factor of nullResult.factors) {
      expect(factor.weight).toBe(0)
      expect(factor.weightedContribution).toBe(0)
      expect(factor.rawScore).toBe(0)
    }

    const undefinedResult = computeScore(undefined)
    expect(undefinedResult.compositeScore).toBe(0)
    expect(undefinedResult.factors).toHaveLength(10)
  })

  it('treats negative expense ratio as invalid data', () => {
    const fund = makeFund({ expenseRatio: -1 })
    const result = computeScore(fund, { cost: 100 })
    const costFactor = result.factors.find(f => f.key === 'cost')!
    expect(costFactor.rawScore).toBe(10)
    expect(costFactor.explanation).toContain('invalid')
  })

  it('treats NaN expense ratio as unavailable data', () => {
    const fund = makeFund({ expenseRatio: NaN })
    const result = computeScore(fund, { cost: 100 })
    const costFactor = result.factors.find(f => f.key === 'cost')!
    expect(costFactor.rawScore).toBe(10)
  })

  it('treats NaN AUM as unavailable data', () => {
    const fund = makeFund({ aum: NaN })
    const result = computeScore(fund, { aumSanity: 100 })
    const aumFactor = result.factors.find(f => f.key === 'aumSanity')!
    expect(aumFactor.rawScore).toBe(10)
  })

  it('clamps rawScore to [0, 20] in factor results', () => {
    const fund = makeFund({ expenseRatio: 0.5 })
    const result = computeScore(fund, { cost: 100 })
    const costFactor = result.factors.find(f => f.key === 'cost')!
    expect(costFactor.rawScore).toBeGreaterThanOrEqual(0)
    expect(costFactor.rawScore).toBeLessThanOrEqual(20)
    expect(costFactor.rawScore).toBe(20)
  })

  it('default weights sum to 100 so weightsNormalized is false', () => {
    const result = computeScore(makeFund())
    expect(result.weightsNormalized).toBe(false)
  })
})
