import { useMemo } from 'react'
import { useFundList } from '@/stores/queries/useFunds'
import { computeScore } from '@/lib/scorecard'
import type { ScorecardWeights, ComputeScoreResult } from '@/types/scorecard'
import type { MFFund } from '@/types/api'

function toScorableFund(fund: MFFund) {
  return {
    schemeCode: fund.schemeCode,
    schemeName: fund.schemeName,
    category: fund.category || undefined,
    subCategory: fund.subCategory || undefined,
    expenseRatio: fund.expenseRatio || undefined,
    aum: fund.aum || undefined,
    riskLabel: fund.riskLabel || undefined,
    benchmark: fund.benchmark || undefined,
    plan: fund.plan || undefined,
    option: fund.option || undefined,
  }
}

export interface ScoredFund {
  fund: MFFund
  score: ComputeScoreResult
}

export function useScoredFunds(weights: ScorecardWeights) {
  const { data: funds, isLoading, error, refetch } = useFundList({})

  const scoredFunds = useMemo<ScoredFund[]>(() => {
    if (!funds || !Array.isArray(funds)) return []
    return funds
      .map(fund => ({
        fund,
        score: computeScore(toScorableFund(fund), weights),
      }))
      .sort((a, b) => b.score.compositeScore - a.score.compositeScore)
  }, [funds, weights])

  return { scoredFunds, isLoading, error, refetch }
}
