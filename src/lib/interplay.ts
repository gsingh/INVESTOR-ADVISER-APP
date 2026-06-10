import type { ComputeScoreResult, ScoringFactor } from '@/types/scorecard'

export interface InterplayWarning {
  ruleId: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  parameters: string[]
}

export function computeInterplayWarnings(
  score: ComputeScoreResult,
  fundCategory?: string,
): InterplayWarning[] {
  const factorMap = new Map(score.factors.map(f => [f.key, f]))
  const warnings: InterplayWarning[] = []

  const getScore = (key: string): number | undefined => factorMap.get(key)?.rawScore
  const getExplanation = (key: string): string | undefined => factorMap.get(key)?.explanation

  const hasData = (key: string): boolean => {
    const expl = getExplanation(key)
    return expl !== undefined && !expl.includes('unavailable') && !expl.includes('Insufficient')
  }

  // Rule 1: High Alpha without good R-squared
  const alpha = getScore('alpha')
  const r2 = getScore('rSquared')
  if (alpha !== undefined && r2 !== undefined && hasData('alpha') && hasData('rSquared')) {
    if (alpha >= 12 && r2 < 12) {
      warnings.push({
        ruleId: 'alpha-r2-mismatch',
        severity: 'warning',
        message: 'Alpha is high but R-squared is low — outperformance may be coincidental rather than due to manager skill.',
        parameters: ['alpha', 'rSquared'],
      })
    }
  }

  // Rule 2: High expense ratio without compensating Alpha
  const cost = getScore('cost')
  if (cost !== undefined && alpha !== undefined && hasData('cost') && hasData('alpha')) {
    if (cost <= 8 && alpha < 8) {
      warnings.push({
        ruleId: 'high-cost-low-alpha',
        severity: 'warning',
        message: 'Expense ratio is relatively high but Alpha does not compensate — the fund may not be delivering value for its cost.',
        parameters: ['cost', 'alpha'],
      })
    }
  }

  // Rule 3: Up > 100 and Down > 100 (amplifies both gains and losses)
  const up = getScore('upCapture')
  const down = getScore('downCapture')
  if (up !== undefined && down !== undefined && hasData('upCapture') && hasData('downCapture')) {
    const upExplanation = getExplanation('upCapture') ?? ''
    const downExplanation = getExplanation('downCapture') ?? ''
    const upVal = parseCaptureValue(upExplanation)
    const downVal = parseCaptureValue(downExplanation)
    if (upVal !== null && downVal !== null && upVal > 100 && downVal > 100) {
      warnings.push({
        ruleId: 'amplifies-both-directions',
        severity: 'warning',
        message: `Fund amplifies both gains (up ${upVal.toFixed(0)}%) and losses (down ${downVal.toFixed(0)}%) — higher volatility than the market.`,
        parameters: ['upCapture', 'downCapture'],
      })
    }
  }

  // Rule 4: High trailing returns but low rolling consistency
  const consistency = getScore('consistency')
  if (alpha !== undefined && consistency !== undefined && hasData('consistency')) {
    if (alpha >= 12 && consistency < 10) {
      warnings.push({
        ruleId: 'returns-without-consistency',
        severity: 'info',
        message: 'Fund has positive Alpha but low rolling-return consistency — strong recent returns may not be sustainable.',
        parameters: ['alpha', 'consistency'],
      })
    }
  }

  // Rule 5: Large AUM relative to category
  const aumSanity = getScore('aumSanity')
  if (aumSanity !== undefined && fundCategory) {
    const cat = fundCategory.toLowerCase()
    if (aumSanity < 10 && (cat.includes('mid cap') || cat.includes('small cap') || cat.includes('micro'))) {
      warnings.push({
        ruleId: 'large-aum-small-cap',
        severity: 'info',
        message: 'AUM may be large for this category — can constrain the manager\'s ability to deploy capital in smaller stocks.',
        parameters: ['aumSanity'],
      })
    }
  }

  // Rule 6: High volatility without compensating Sharpe
  const vol = getScore('volatility')
  const sharpe = getScore('sharpeRatio')
  if (vol !== undefined && sharpe !== undefined && hasData('volatility') && hasData('sharpeRatio')) {
    if (vol < 8 && sharpe < 8) {
      warnings.push({
        ruleId: 'high-vol-low-sharpe',
        severity: 'warning',
        message: 'Volatility is high but risk-adjusted returns (Sharpe) are low — the fund takes on risk without adequate compensation.',
        parameters: ['volatility', 'sharpeRatio'],
      })
    }
  }

  return warnings
}

function parseCaptureValue(explanation: string): number | null {
  const match = explanation.match(/(\d+(?:\.\d+)?)%/)
  return match ? parseFloat(match[1]) : null
}

export function computeAllInterplayWarnings(
  scores: ComputeScoreResult[],
  categories?: (string | undefined)[],
): InterplayWarning[][] {
  return scores.map((score, i) =>
    computeInterplayWarnings(score, categories?.[i]),
  )
}
