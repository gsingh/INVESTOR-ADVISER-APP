export interface ScorableFund {
  schemeCode: string
  schemeName: string
  category?: string
  subCategory?: string
  expenseRatio?: number
  aum?: number
  riskLabel?: string
  exitLoad?: {
    exists: boolean
    durationYears?: number
    rate?: number
  }
  launchDate?: string
  benchmark?: string
  plan?: string
  option?: string
}

export interface ScorecardWeights {
  categoryFit?: number
  cost?: number
  fundAge?: number
  aumSanity?: number
  benchmarkSuitability?: number
  consistency?: number
  volatility?: number
  drawdown?: number
  exitLoad?: number
  overlap?: number
}

export interface ScoringFactor {
  key: string
  label: string
  rawScore: number
  weight: number
  weightedContribution: number
  explanation: string
}

export interface ComputeScoreResult {
  compositeScore: number
  factors: ScoringFactor[]
  weightsNormalized: boolean
  maxPossibleScore: number
}
