import type { ScorableFund, ScorecardWeights, ComputeScoreResult, ScoringFactor } from '@/types/scorecard'

function getYearsSince(dateStr: string | undefined): number | undefined {
  if (!dateStr) return undefined
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return undefined
  const years = (Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  return Math.max(0, years)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function scoreCategoryFit(fund: ScorableFund): { rawScore: number; explanation: string } {
  const subCat = fund.subCategory?.trim()
  if (subCat && subCat !== 'Others' && subCat !== 'Unknown' && subCat !== '---') {
    return { rawScore: 20, explanation: `Fund belongs to ${fund.subCategory}, a well-defined AMFI sub-category` }
  }
  if (fund.category) {
    return { rawScore: 10, explanation: `Fund is classified under ${fund.category} but has no specific sub-category` }
  }
  return { rawScore: 0, explanation: 'No category classification available for this fund' }
}

function scoreCost(fund: ScorableFund): { rawScore: number; explanation: string } {
  if (fund.expenseRatio === undefined || fund.expenseRatio === null || isNaN(fund.expenseRatio)) {
    return { rawScore: 10, explanation: 'Expense ratio data unavailable — defaulting to middle score' }
  }
  if (fund.expenseRatio >= 2.5) {
    return { rawScore: 0, explanation: `Expense ratio of ${fund.expenseRatio.toFixed(2)}% is very high (max threshold 2.5%)` }
  }
  if (fund.expenseRatio < 0) {
    return { rawScore: 10, explanation: `Expense ratio of ${fund.expenseRatio}% is invalid (negative) — defaulting to middle score` }
  }
  if (fund.expenseRatio <= 0.5) {
    return { rawScore: 20, explanation: `Expense ratio of ${fund.expenseRatio.toFixed(2)}% is excellent (≤ 0.5%)` }
  }
  const rawScore = 20 - (fund.expenseRatio - 0.5) * 10
  const rounded = Math.round(rawScore * 100) / 100
  return { rawScore: rounded, explanation: `Expense ratio of ${fund.expenseRatio.toFixed(2)}% scores ${rounded.toFixed(1)}/20` }
}

function scoreFundAge(fund: ScorableFund): { rawScore: number; explanation: string } {
  const years = getYearsSince(fund.launchDate)
  if (years === undefined) {
    return { rawScore: 10, explanation: 'Fund launch date unavailable — defaulting to middle score' }
  }
  if (years < 1) {
    return { rawScore: 0, explanation: `Fund is only ${years.toFixed(1)} years old — very short track record` }
  }
  if (years >= 20) {
    return { rawScore: 20, explanation: `Fund has a ${years.toFixed(0)}-year track record — excellent` }
  }
  let rawScore: number
  if (years < 3) rawScore = 5 * ((years - 1) / 2)
  else if (years < 5) rawScore = 5 + 5 * ((years - 3) / 2)
  else if (years < 10) rawScore = 10 + 5 * ((years - 5) / 5)
  else rawScore = 15 + 5 * ((years - 10) / 10)
  const rounded = Math.round(rawScore * 100) / 100
  return { rawScore: rounded, explanation: `Fund is ${years.toFixed(1)} years old (score: ${rounded.toFixed(1)}/20)` }
}

function scoreAumSanity(fund: ScorableFund): { rawScore: number; explanation: string } {
  if (fund.aum === undefined || fund.aum === null || isNaN(fund.aum)) {
    return { rawScore: 10, explanation: 'AUM data unavailable — defaulting to middle score' }
  }
  if (fund.aum <= 0) {
    return { rawScore: 0, explanation: 'AUM is zero or negative — possible data issue' }
  }
  if (fund.aum >= 500 && fund.aum <= 10000) {
    return { rawScore: 20, explanation: `AUM of ₹${fund.aum.toLocaleString()}Cr is in the ideal range (₹500-10,000Cr)` }
  }
  if (fund.aum < 500) {
    const rawScore = (fund.aum / 500) * 20
    const rounded = Math.round(rawScore * 100) / 100
    return { rawScore: rounded, explanation: `AUM of ₹${fund.aum.toLocaleString()}Cr is below ideal range` }
  }
  const rawScore = Math.max(0, 20 - ((fund.aum - 10000) / 40000) * 20)
  const rounded = Math.round(rawScore * 100) / 100
  return { rawScore: rounded, explanation: `AUM of ₹${fund.aum.toLocaleString()}Cr is above ideal range` }
}

function scoreBenchmarkSuitability(fund: ScorableFund): { rawScore: number; explanation: string } {
  if (!fund.benchmark) {
    return { rawScore: 0, explanation: 'No benchmark assigned to this fund' }
  }
  const bm = fund.benchmark.toLowerCase()
  if (bm.includes('tri') || bm.includes('index')) {
    return { rawScore: 20, explanation: `Benchmark "${fund.benchmark}" is a total return index — suitable benchmark` }
  }
  return { rawScore: 10, explanation: `Benchmark "${fund.benchmark}" is assigned but may not be a standard index` }
}

function scoreRollingReturnConsistency(): { rawScore: number; explanation: string } {
  return { rawScore: 10, explanation: 'Rolling-return consistency requires NAV history — placeholder score' }
}

function scoreVolatility(): { rawScore: number; explanation: string } {
  return { rawScore: 10, explanation: 'Volatility scoring requires NAV history — placeholder score' }
}

function scoreDrawdown(): { rawScore: number; explanation: string } {
  return { rawScore: 10, explanation: 'Drawdown analysis requires NAV history — placeholder score' }
}

function scoreExitLoad(fund: ScorableFund): { rawScore: number; explanation: string } {
  if (!fund.exitLoad) {
    return { rawScore: 10, explanation: 'Exit load data unavailable — defaulting to middle score' }
  }
  if (!fund.exitLoad.exists) {
    return { rawScore: 20, explanation: 'No exit load — full liquidity' }
  }
  const dur = fund.exitLoad.durationYears
  if (dur === undefined || dur === null) {
    return { rawScore: 10, explanation: 'Exit load exists but duration unknown' }
  }
  if (dur < 1) return { rawScore: 15, explanation: `Exit load for ${dur} year(s) — relatively short lock-in` }
  if (dur < 2) return { rawScore: 10, explanation: `Exit load for ${dur} year(s) — moderate lock-in` }
  if (dur < 3) return { rawScore: 5, explanation: `Exit load for ${dur} year(s) — long lock-in` }
  return { rawScore: 0, explanation: `Exit load for ${dur} year(s) — very long lock-in` }
}

function scoreOverlap(): { rawScore: number; explanation: string } {
  return { rawScore: 10, explanation: 'Overlap analysis requires portfolio holdings — placeholder score' }
}

const ALL_FACTORS: { key: string; label: string; scorer: (fund: ScorableFund) => { rawScore: number; explanation: string } }[] = [
  { key: 'categoryFit', label: 'Category Fit', scorer: scoreCategoryFit },
  { key: 'cost', label: 'Cost', scorer: scoreCost },
  { key: 'fundAge', label: 'Fund Age', scorer: scoreFundAge },
  { key: 'aumSanity', label: 'AUM Sanity', scorer: scoreAumSanity },
  { key: 'benchmarkSuitability', label: 'Benchmark Suitability', scorer: scoreBenchmarkSuitability },
  { key: 'consistency', label: 'Rolling-Return Consistency', scorer: scoreRollingReturnConsistency },
  { key: 'volatility', label: 'Volatility', scorer: scoreVolatility },
  { key: 'drawdown', label: 'Drawdown', scorer: scoreDrawdown },
  { key: 'exitLoad', label: 'Exit Load', scorer: scoreExitLoad },
  { key: 'overlap', label: 'Overlap with Holdings', scorer: scoreOverlap },
]

const DEFAULT_WEIGHTS: ScorecardWeights = {
  consistency: 30,
  cost: 15,
  categoryFit: 15,
  benchmarkSuitability: 10,
  fundAge: 5,
  aumSanity: 5,
  volatility: 5,
  drawdown: 5,
  exitLoad: 5,
  overlap: 5,
}

function normalizeWeights(weights: ScorecardWeights): { normalized: Record<string, number>; wasNormalized: boolean } {
    const entries = Object.entries(weights).filter(([, w]) => w !== undefined && w !== null && !isNaN(w)) as [string, number][]
  if (entries.length === 0) {
    return { normalized: {}, wasNormalized: true }
  }
  const sum = entries.reduce((acc, [, w]) => acc + w, 0)
  if (sum === 100) {
    const result: Record<string, number> = {}
    for (const [k, v] of entries) result[k] = v
    return { normalized: result, wasNormalized: false }
  }
  const factor = sum === 0 ? 0 : 100 / sum
  const normalized: Record<string, number> = {}
  for (const [k, v] of entries) {
    normalized[k] = factor === 0 ? 0 : Math.round(v * factor * 100) / 100
  }
  return { normalized, wasNormalized: true }
}

export function computeScore(
  fund: ScorableFund | undefined | null,
  weights?: ScorecardWeights,
): ComputeScoreResult {
  if (!fund) {
    return {
      compositeScore: 0,
      factors: ALL_FACTORS.map(fd => ({
        key: fd.key,
        label: fd.label,
        rawScore: 0,
        weight: 0,
        weightedContribution: 0,
        explanation: 'No fund data provided',
      })),
      weightsNormalized: false,
      maxPossibleScore: 100,
    }
  }
  const mergedWeights = { ...DEFAULT_WEIGHTS, ...weights }
  const { normalized, wasNormalized } = normalizeWeights(mergedWeights)

  const factors: ScoringFactor[] = []
  let totalWeighted = 0

  for (const factorDef of ALL_FACTORS) {
    const weight = normalized[factorDef.key] ?? 0
    if (weight === 0) {
      factors.push({
        key: factorDef.key,
        label: factorDef.label,
        rawScore: 0,
        weight: 0,
        weightedContribution: 0,
        explanation: 'Factor weight is zero — not scored',
      })
      continue
    }

    const { rawScore: raw, explanation } = factorDef.scorer(fund)
    const clamped = Math.min(20, Math.max(0, raw))
    const weightedContribution = Math.round((clamped / 20) * weight * 100) / 100
    totalWeighted += weightedContribution

    factors.push({
      key: factorDef.key,
      label: factorDef.label,
      rawScore: clamped,
      weight,
      weightedContribution,
      explanation,
    })
  }

  const compositeScore = Math.round(Math.min(100, Math.max(0, totalWeighted)) * 100) / 100

  return {
    compositeScore,
    factors,
    weightsNormalized: wasNormalized,
    maxPossibleScore: 100,
  }
}
