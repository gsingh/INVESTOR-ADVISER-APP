import type { NavEntry, PortfolioHolding, RollingReturn } from './api'

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
  /** NAV history for volatility & drawdown scoring */
  navHistory?: NavEntry[]
  /** Rolling returns for consistency scoring */
  rollingReturns?: RollingReturn[]
  /** Portfolio holdings for overlap scoring */
  portfolioHoldings?: PortfolioHolding[]
}

export interface ScoringContext {
  /** User's existing portfolio holdings for overlap comparison */
  userPortfolioHoldings?: { name: string; percentage: number }[]
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
  sharpeRatio?: number
  sortinoRatio?: number
  alpha?: number
  beta?: number
  rSquared?: number
  informationRatio?: number
  upCapture?: number
  downCapture?: number
  trailing1YReturn?: number
  trailing3YReturn?: number
  trailing5YReturn?: number
  sinceInceptionReturn?: number
  yearwiseConsistency?: number
}

export type ScorecardWeightKey = keyof ScorecardWeights

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
