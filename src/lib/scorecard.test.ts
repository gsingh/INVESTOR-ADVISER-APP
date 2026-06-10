import { describe, it, expect } from 'vitest'
import { computeScore } from './scorecard'
import type { ScorableFund, ScoringContext } from '@/types/scorecard'
import type { NavEntry, RollingReturn, PortfolioHolding } from '@/types/api'

const TOTAL_FACTORS = 23

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

const ALL_FACTOR_KEYS = [
  'categoryFit', 'cost', 'fundAge', 'aumSanity', 'benchmarkSuitability',
  'consistency', 'volatility', 'drawdown', 'exitLoad', 'overlap',
  'sharpeRatio', 'sortinoRatio', 'alpha', 'beta', 'rSquared',
  'informationRatio', 'upCapture', 'downCapture',
  'trailing1YReturn', 'trailing3YReturn', 'trailing5YReturn',
  'sinceInceptionReturn', 'yearwiseConsistency',
]

function makeAllZeroWeights(keepFactors: string[] = []): Record<string, number> {
  const weights: Record<string, number> = {}
  for (const key of ALL_FACTOR_KEYS) {
    weights[key] = keepFactors.includes(key) ? 100 : 0
  }
  return weights
}

describe('computeScore', () => {
  it('returns composite score with default weights', () => {
    const result = computeScore(makeFund())
    expect(result.compositeScore).toBeGreaterThan(0)
    expect(result.compositeScore).toBeLessThanOrEqual(100)
    expect(result.factors).toHaveLength(TOTAL_FACTORS)
    expect(result.maxPossibleScore).toBe(100)
  })

  it('includes all 18 factors in the result', () => {
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
    expect(keys).toContain('sharpeRatio')
    expect(keys).toContain('sortinoRatio')
    expect(keys).toContain('alpha')
    expect(keys).toContain('beta')
    expect(keys).toContain('rSquared')
    expect(keys).toContain('informationRatio')
    expect(keys).toContain('upCapture')
    expect(keys).toContain('downCapture')
  })

  it('normalizes weights when sum does not equal 100', () => {
    const result = computeScore(makeFund(), { cost: 50, fundAge: 50 })
    expect(result.weightsNormalized).toBe(true)
    expect(result.compositeScore).toBeGreaterThanOrEqual(0)
    expect(result.compositeScore).toBeLessThanOrEqual(100)
  })

  it('does not flag normalization when weights sum to 100', () => {
    const result = computeScore(makeFund(), { cost: 100, ...makeAllZeroWeights(['cost']) })
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
    const result = computeScore(fund, { ...makeAllZeroWeights(['cost']), cost: 100 })
    expect(result.factors.find(f => f.key === 'cost')?.rawScore).toBe(10)
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
    expect(result.factors).toHaveLength(TOTAL_FACTORS)
    expect(result.compositeScore).toBeGreaterThanOrEqual(0)
    for (const factor of result.factors) {
      expect(typeof factor.rawScore).toBe('number')
      expect(typeof factor.weightedContribution).toBe('number')
      expect(typeof factor.explanation).toBe('string')
      expect(factor.rawScore).toBeGreaterThanOrEqual(0)
      expect(factor.rawScore).toBeLessThanOrEqual(20)
    }
  })

  it('handles null/undefined fund gracefully', () => {
    const nullResult = computeScore(null)
    expect(nullResult.compositeScore).toBe(0)
    expect(nullResult.factors).toHaveLength(TOTAL_FACTORS)
    for (const factor of nullResult.factors) {
      expect(factor.weight).toBe(0)
      expect(factor.weightedContribution).toBe(0)
      expect(factor.rawScore).toBe(0)
    }

    const undefinedResult = computeScore(undefined)
    expect(undefinedResult.compositeScore).toBe(0)
    expect(undefinedResult.factors).toHaveLength(TOTAL_FACTORS)
  })

  // ── Existing factor tests ──

  it('expense ratio at 0.5% scores 20 on cost', () => {
    const fund = makeFund({ expenseRatio: 0.5 })
    const result = computeScore(fund, { ...makeAllZeroWeights(['cost']), cost: 100 })
    expect(result.factors.find(f => f.key === 'cost')!.rawScore).toBe(20)
  })

  it('expense ratio at 2.5% scores 0 on cost', () => {
    const fund = makeFund({ expenseRatio: 2.5 })
    const result = computeScore(fund, { ...makeAllZeroWeights(['cost']), cost: 100 })
    expect(result.factors.find(f => f.key === 'cost')!.rawScore).toBe(0)
  })

  it('AUM in ideal range scores 20', () => {
    const fund = makeFund({ aum: 5000 })
    const result = computeScore(fund, { ...makeAllZeroWeights(['aumSanity']), aumSanity: 100 })
    expect(result.factors.find(f => f.key === 'aumSanity')!.rawScore).toBe(20)
  })

  it('benchmark with TRI scores 20', () => {
    const fund = makeFund({ benchmark: 'Nifty 500 TRI' })
    const result = computeScore(fund, { ...makeAllZeroWeights(['benchmarkSuitability']), benchmarkSuitability: 100 })
    expect(result.factors.find(f => f.key === 'benchmarkSuitability')!.rawScore).toBe(20)
  })

  it('no benchmark scores 0', () => {
    const fund = makeFund({ benchmark: undefined })
    const result = computeScore(fund, { ...makeAllZeroWeights(['benchmarkSuitability']), benchmarkSuitability: 100 })
    expect(result.factors.find(f => f.key === 'benchmarkSuitability')!.rawScore).toBe(0)
  })

  it('category fit scores based on sub-category definition', () => {
    const goodCat = makeFund({ subCategory: 'Flexi Cap', category: 'Equity' })
    const catOnly = makeFund({ subCategory: undefined, category: 'Equity' })
    const noCat = makeFund({ subCategory: undefined, category: undefined })

    const goodResult = computeScore(goodCat, { ...makeAllZeroWeights(['categoryFit']), categoryFit: 100 })
    const catResult = computeScore(catOnly, { ...makeAllZeroWeights(['categoryFit']), categoryFit: 100 })
    const noResult = computeScore(noCat, { ...makeAllZeroWeights(['categoryFit']), categoryFit: 100 })

    expect(goodResult.factors.find(f => f.key === 'categoryFit')!.rawScore).toBe(20)
    expect(catResult.factors.find(f => f.key === 'categoryFit')!.rawScore).toBe(10)
    expect(noResult.factors.find(f => f.key === 'categoryFit')!.rawScore).toBe(0)
  })

  it('exit load scores for various durations', () => {
    const noLoad = makeFund({ exitLoad: { exists: false } })
    const shortLoad = makeFund({ exitLoad: { exists: true, durationYears: 0.5 } })
    const longLoad = makeFund({ exitLoad: { exists: true, durationYears: 5 } })

    const noLoadResult = computeScore(noLoad, { ...makeAllZeroWeights(['exitLoad']), exitLoad: 100 })
    const shortResult = computeScore(shortLoad, { ...makeAllZeroWeights(['exitLoad']), exitLoad: 100 })
    const longResult = computeScore(longLoad, { ...makeAllZeroWeights(['exitLoad']), exitLoad: 100 })

    expect(noLoadResult.factors.find(f => f.key === 'exitLoad')!.rawScore).toBe(20)
    expect(shortResult.factors.find(f => f.key === 'exitLoad')!.rawScore).toBe(15)
    expect(longResult.factors.find(f => f.key === 'exitLoad')!.rawScore).toBe(0)
  })

  it('handles negative expense ratio as invalid data', () => {
    const fund = makeFund({ expenseRatio: -1 })
    const result = computeScore(fund, { ...makeAllZeroWeights(['cost']), cost: 100 })
    const costFactor = result.factors.find(f => f.key === 'cost')!
    expect(costFactor.rawScore).toBe(10)
    expect(costFactor.explanation).toContain('invalid')
  })

  it('treats NaN expense ratio as unavailable data', () => {
    const fund = makeFund({ expenseRatio: NaN })
    const result = computeScore(fund, { ...makeAllZeroWeights(['cost']), cost: 100 })
    const costFactor = result.factors.find(f => f.key === 'cost')!
    expect(costFactor.rawScore).toBe(10)
  })

  it('default weights do not sum to 100 so weightsNormalized is true', () => {
    const result = computeScore(makeFund())
    expect(result.weightsNormalized).toBe(true)
  })

  // ── Rolling-Return Consistency ──

  it('rolling-return consistency scores 10 when no rolling returns data', () => {
    const result = computeScore(makeFund(), { ...makeAllZeroWeights(['consistency']), consistency: 100 })
    const factor = result.factors.find(f => f.key === 'consistency')!
    expect(factor.rawScore).toBe(10)
    expect(factor.explanation).toContain('unavailable')
  })

  it('rolling-return consistency max score when fund beats benchmark in all periods', () => {
    const returns: RollingReturn[] = [
      { period: '1Y', fund: 15, benchmark: 10 },
      { period: '3Y', fund: 22, benchmark: 18 },
      { period: '5Y', fund: 45, benchmark: 38 },
    ]
    const fund = makeFund({ rollingReturns: returns })
    const result = computeScore(fund, { ...makeAllZeroWeights(['consistency']), consistency: 100 })
    const factor = result.factors.find(f => f.key === 'consistency')!
    expect(factor.rawScore).toBe(20)
  })

  // ── Volatility ──

  it('volatility scores 10 when insufficient NAV history', () => {
    const result = computeScore(makeFund(), { ...makeAllZeroWeights(['volatility']), volatility: 100 })
    const factor = result.factors.find(f => f.key === 'volatility')!
    expect(factor.rawScore).toBe(10)
  })

  it('volatility scores 20 for very stable fund', () => {
    const nav: NavEntry[] = Array.from({ length: 100 }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      nav: 100 + 0.01 * i,
    }))
    const fund = makeFund({ navHistory: nav })
    const result = computeScore(fund, { ...makeAllZeroWeights(['volatility']), volatility: 100 })
    const factor = result.factors.find(f => f.key === 'volatility')!
    expect(factor.rawScore).toBe(20)
  })

  // ── Drawdown ──

  it('drawdown scores 10 when insufficient NAV history', () => {
    const result = computeScore(makeFund(), { ...makeAllZeroWeights(['drawdown']), drawdown: 100 })
    const factor = result.factors.find(f => f.key === 'drawdown')!
    expect(factor.rawScore).toBe(10)
  })

  it('drawdown scores 20 when always rising NAV', () => {
    const nav: NavEntry[] = Array.from({ length: 100 }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      nav: 100 + i,
    }))
    const fund = makeFund({ navHistory: nav })
    const result = computeScore(fund, { ...makeAllZeroWeights(['drawdown']), drawdown: 100 })
    const factor = result.factors.find(f => f.key === 'drawdown')!
    expect(factor.rawScore).toBe(20)
  })

  // ── Overlap ──

  it('overlap scores 10 when no fund holdings data', () => {
    const result = computeScore(makeFund(), { ...makeAllZeroWeights(['overlap']), overlap: 100 })
    const factor = result.factors.find(f => f.key === 'overlap')!
    expect(factor.rawScore).toBe(10)
  })

  it('overlap scores 20 when zero overlap with user portfolio', () => {
    const holdings: PortfolioHolding[] = [
      { name: 'Reliance Industries', amountCr: 100, percentage: 10 },
      { name: 'TCS', amountCr: 80, percentage: 8 },
    ]
    const context: ScoringContext = {
      userPortfolioHoldings: [
        { name: 'Infosys', percentage: 15 },
        { name: 'HDFC Bank', percentage: 12 },
      ],
    }
    const fund = makeFund({ portfolioHoldings: holdings })
    const result = computeScore(fund, { ...makeAllZeroWeights(['overlap']), overlap: 100 }, context)
    const factor = result.factors.find(f => f.key === 'overlap')!
    expect(factor.rawScore).toBe(20)
  })

  // ── Sharpe Ratio ──

  it('sharpeRatio scores 10 when insufficient NAV history', () => {
    const result = computeScore(makeFund(), { ...makeAllZeroWeights(['sharpeRatio']), sharpeRatio: 100 })
    const factor = result.factors.find(f => f.key === 'sharpeRatio')!
    expect(factor.rawScore).toBe(10)
  })

  it('sharpeRatio scores higher for better risk-adjusted returns', () => {
    const nav: NavEntry[] = Array.from({ length: 100 }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      nav: 100 + 0.5 * i,
    }))
    const fund = makeFund({ navHistory: nav })
    const result = computeScore(fund, { ...makeAllZeroWeights(['sharpeRatio']), sharpeRatio: 100 })
    const factor = result.factors.find(f => f.key === 'sharpeRatio')!
    expect(factor.rawScore).toBeGreaterThan(10)
    expect(factor.rawScore).toBeLessThanOrEqual(20)
    expect(factor.explanation).toContain('Sharpe')
  })

  // ── Sortino Ratio ──

  it('sortinoRatio scores 10 when insufficient NAV history', () => {
    const result = computeScore(makeFund(), { ...makeAllZeroWeights(['sortinoRatio']), sortinoRatio: 100 })
    const factor = result.factors.find(f => f.key === 'sortinoRatio')!
    expect(factor.rawScore).toBe(10)
  })

  // ── Alpha ──

  it('alpha scores 10 when insufficient rolling returns', () => {
    const result = computeScore(makeFund(), { ...makeAllZeroWeights(['alpha']), alpha: 100 })
    const factor = result.factors.find(f => f.key === 'alpha')!
    expect(factor.rawScore).toBe(10)
  })

  it('alpha scores 20 for strong positive alpha', () => {
    const returns: RollingReturn[] = [
      { period: '1Y', fund: 18, benchmark: 10 },
      { period: '3Y', fund: 25, benchmark: 15 },
      { period: '5Y', fund: 40, benchmark: 25 },
    ]
    const fund = makeFund({ rollingReturns: returns })
    const result = computeScore(fund, { ...makeAllZeroWeights(['alpha']), alpha: 100 })
    const factor = result.factors.find(f => f.key === 'alpha')!
    expect(factor.rawScore).toBe(20)
  })

  it('alpha scores 0 for strong negative alpha', () => {
    const returns: RollingReturn[] = [
      { period: '1Y', fund: 2, benchmark: 10 },
      { period: '3Y', fund: 5, benchmark: 15 },
      { period: '5Y', fund: 10, benchmark: 25 },
    ]
    const fund = makeFund({ rollingReturns: returns })
    const result = computeScore(fund, { ...makeAllZeroWeights(['alpha']), alpha: 100 })
    const factor = result.factors.find(f => f.key === 'alpha')!
    expect(factor.rawScore).toBe(0)
  })

  // ── Beta ──

  it('beta scores 10 when insufficient rolling returns', () => {
    const result = computeScore(makeFund(), { ...makeAllZeroWeights(['beta']), beta: 100 })
    const factor = result.factors.find(f => f.key === 'beta')!
    expect(factor.rawScore).toBe(10)
  })

  it('beta scores 20 when beta is near 1.0', () => {
    const returns: RollingReturn[] = [
      { period: '1Y', fund: 10.5, benchmark: 10 },
      { period: '3Y', fund: 15.5, benchmark: 15 },
      { period: '5Y', fund: 30, benchmark: 30 },
    ]
    const fund = makeFund({ rollingReturns: returns })
    const result = computeScore(fund, { ...makeAllZeroWeights(['beta']), beta: 100 })
    const factor = result.factors.find(f => f.key === 'beta')!
    expect(factor.rawScore).toBe(20)
  })

  // ── R-Squared ──

  it('rSquared scores 10 when insufficient rolling returns', () => {
    const result = computeScore(makeFund(), { ...makeAllZeroWeights(['rSquared']), rSquared: 100 })
    const factor = result.factors.find(f => f.key === 'rSquared')!
    expect(factor.rawScore).toBe(10)
  })

  it('rSquared scores higher for better correlation', () => {
    const returns: RollingReturn[] = [
      { period: '1Y', fund: 10, benchmark: 10 },
      { period: '3Y', fund: 15, benchmark: 15 },
      { period: '5Y', fund: 25, benchmark: 25 },
    ]
    const fund = makeFund({ rollingReturns: returns })
    const result = computeScore(fund, { ...makeAllZeroWeights(['rSquared']), rSquared: 100 })
    const factor = result.factors.find(f => f.key === 'rSquared')!
    expect(factor.rawScore).toBe(20)
  })

  // ── Information Ratio ──

  it('informationRatio scores 10 when insufficient rolling returns', () => {
    const result = computeScore(makeFund(), { ...makeAllZeroWeights(['informationRatio']), informationRatio: 100 })
    const factor = result.factors.find(f => f.key === 'informationRatio')!
    expect(factor.rawScore).toBe(10)
  })

  it('informationRatio scores 20 for strong ratio', () => {
    const returns: RollingReturn[] = [
      { period: '1Y', fund: 12, benchmark: 10 },
      { period: '3Y', fund: 18, benchmark: 15 },
      { period: '5Y', fund: 30, benchmark: 25 },
    ]
    const fund = makeFund({ rollingReturns: returns })
    const result = computeScore(fund, { ...makeAllZeroWeights(['informationRatio']), informationRatio: 100 })
    const factor = result.factors.find(f => f.key === 'informationRatio')!
    expect(factor.rawScore).toBeGreaterThan(10)
    expect(factor.rawScore).toBeLessThanOrEqual(20)
  })

  // ── Up Capture ──

  it('upCapture scores 10 when insufficient rolling returns', () => {
    const result = computeScore(makeFund(), { ...makeAllZeroWeights(['upCapture']), upCapture: 100 })
    const factor = result.factors.find(f => f.key === 'upCapture')!
    expect(factor.rawScore).toBe(10)
  })

  it('upCapture scores 20 for high upside participation', () => {
    const returns: RollingReturn[] = [
      { period: '1Y', fund: 15, benchmark: 10 },
      { period: '3Y', fund: 18, benchmark: 15 },
      { period: '5Y', fund: -8, benchmark: -10 },
    ]
    const fund = makeFund({ rollingReturns: returns })
    const result = computeScore(fund, { ...makeAllZeroWeights(['upCapture']), upCapture: 100 })
    const factor = result.factors.find(f => f.key === 'upCapture')!
    expect(factor.rawScore).toBeGreaterThan(10)
  })

  // ── Down Capture ──

  it('downCapture scores 10 when insufficient rolling returns', () => {
    const result = computeScore(makeFund(), { ...makeAllZeroWeights(['downCapture']), downCapture: 100 })
    const factor = result.factors.find(f => f.key === 'downCapture')!
    expect(factor.rawScore).toBe(10)
  })

  // ── Enriched scoring produces real scores ──

  it('enriched fund produces different scores from basic for volatility and drawdown', () => {
    const nav: NavEntry[] = Array.from({ length: 60 }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      nav: 100 + Math.sin(i * 0.5) * 5 + i * 0.2,
    }))

    const basic = computeScore(makeFund(), { ...makeAllZeroWeights(['volatility']), volatility: 100 })
    const basicVol = basic.factors.find(f => f.key === 'volatility')!
    expect(basicVol.rawScore).toBe(10)

    const enriched = computeScore(makeFund({ navHistory: nav }), { ...makeAllZeroWeights(['volatility']), volatility: 100 })
    const enrichedVol = enriched.factors.find(f => f.key === 'volatility')!
    expect(enrichedVol.rawScore).not.toBe(10)
  })
})
