export interface SIPParams {
  targetAmount: number
  targetDate: string
  startingAmount: number
  expectedInflation: number
  monthlyContribution: number
}

export interface ScenarioResult {
  label: string
  rate: number
  monthlySIP: number
  projectedValue: number
}

export interface GapResult {
  amount: number
  status: 'on_track' | 'minor_gap' | 'significant_gap' | 'past_due'
  suggestedIncrease: number
}

export interface SIPResult {
  scenarios: ScenarioResult[]
  gap: GapResult
  monthlyData: {
    month: number
    conservative: number
    moderate: number
    optimistic: number
    target: number
  }[]
}

function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth()
}

function monthlyRate(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / 12) - 1
}

export function calculateSIP(params: SIPParams): SIPResult {
  const now = new Date()
  const target = new Date(params.targetDate)
  if (isNaN(target.getTime())) {
    return {
      scenarios: [],
      gap: { amount: 0, status: 'past_due', suggestedIncrease: 0 },
      monthlyData: [],
    }
  }
  const n = monthsBetween(now, target)

  if (n < 0) {
    return {
      scenarios: [],
      gap: { amount: 0, status: 'past_due', suggestedIncrease: 0 },
      monthlyData: [],
    }
  }

  const effectiveTarget = params.targetAmount * Math.pow(1 + params.expectedInflation, n / 12)

  const scenarios = [
    { label: 'Conservative 6%', rate: 0.06 },
    { label: 'Moderate 8%', rate: 0.08 },
    { label: 'Optimistic 10%', rate: 0.10 },
  ].map(scenario => {
    const r = monthlyRate(scenario.rate)
    const fvStarting = params.startingAmount * Math.pow(1 + r, n)
    const fvFactor = n > 0 ? ((Math.pow(1 + r, n) - 1) / r) * (1 + r) : 0
    const requiredSIP = Math.max(0, n > 0 ? (effectiveTarget - fvStarting) / fvFactor : 0)
    const projectedValue = fvStarting + params.monthlyContribution * fvFactor
    return {
      label: scenario.label,
      rate: scenario.rate,
      monthlySIP: Math.round(requiredSIP),
      projectedValue: Math.round(projectedValue),
    }
  })

  const moderateResult = scenarios.find(s => s.label === 'Moderate 8%')!
  const gapAmount = moderateResult.projectedValue - effectiveTarget
  let gapStatus: GapResult['status'] = 'on_track'
  if (gapAmount < 0) {
    const shortfallPct = effectiveTarget > 0 ? Math.abs(gapAmount) / effectiveTarget : 0
    gapStatus = shortfallPct >= 0.2 ? 'significant_gap' : 'minor_gap'
  }
  const rModerate = monthlyRate(0.08)
  const fvStartingModerate = params.startingAmount * Math.pow(1 + rModerate, n)
  const fvFactorModerate = n > 0 ? ((Math.pow(1 + rModerate, n) - 1) / rModerate) * (1 + rModerate) : 0
  const requiredAtModerate = n > 0 ? Math.max(0, (effectiveTarget - fvStartingModerate) / fvFactorModerate) : Math.max(0, effectiveTarget - fvStartingModerate)
  const suggestedIncrease = n > 0 ? Math.max(0, Math.round(requiredAtModerate - params.monthlyContribution)) : 0

  const monthlyData = []
  const rC = monthlyRate(0.06)
  const rM = monthlyRate(0.08)
  const rO = monthlyRate(0.10)
  for (let i = 0; i < n; i++) {
    const conservative = Math.round(params.startingAmount * Math.pow(1 + rC, i) + params.monthlyContribution * ((Math.pow(1 + rC, i) - 1) / rC) * (1 + rC))
    const moderate = Math.round(params.startingAmount * Math.pow(1 + rM, i) + params.monthlyContribution * ((Math.pow(1 + rM, i) - 1) / rM) * (1 + rM))
    const optimistic = Math.round(params.startingAmount * Math.pow(1 + rO, i) + params.monthlyContribution * ((Math.pow(1 + rO, i) - 1) / rO) * (1 + rO))
    monthlyData.push({ month: i, conservative, moderate, optimistic, target: effectiveTarget })
  }

  return {
    scenarios,
    gap: { amount: gapAmount, status: gapStatus, suggestedIncrease },
    monthlyData,
  }
}
