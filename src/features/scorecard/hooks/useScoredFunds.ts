import { useCallback, useMemo, useState } from 'react'
import { useFundList } from '@/stores/queries/useFunds'
import { schemeDetailResponseSchema, navHistoryResponseSchema } from '@/types/api'
import { computeScore } from '@/lib/scorecard'
import type { ScorecardWeights, ComputeScoreResult, ScorableFund, ScoringContext } from '@/types/scorecard'
import type { MFFund, SchemeDetail, NavEntry } from '@/types/api'

const API_MFDATA = '/api/mfapi'
const API_MFAPI = '/api/mfapi'

function toScorableFund(fund: MFFund): ScorableFund {
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

function toEnrichedScorableFund(
  fund: MFFund,
  schemeDetail: SchemeDetail | null,
  navHistory: NavEntry[],
): ScorableFund {
  return {
    ...toScorableFund(fund),
    navHistory: navHistory.length > 0 ? navHistory : undefined,
    rollingReturns: schemeDetail?.rollingReturns?.length ? schemeDetail.rollingReturns : undefined,
    portfolioHoldings: schemeDetail?.portfolioHoldings?.length ? schemeDetail.portfolioHoldings : undefined,
    launchDate: schemeDetail?.launchDate ?? undefined,
    expenseRatio: schemeDetail?.expenseRatio ?? fund.expenseRatio ?? undefined,
    aum: schemeDetail?.aum ?? fund.aum ?? undefined,
    exitLoad: schemeDetail?.exitLoad ?? undefined,
    benchmark: schemeDetail?.benchmark || fund.benchmark || undefined,
  }
}

export interface ScoredFund {
  fund: MFFund
  score: ComputeScoreResult
}

export interface EnrichedScoreResult {
  basicScore: ComputeScoreResult
  enrichedScore: ComputeScoreResult
}

export function useScoredFunds(weights: ScorecardWeights) {
  const { data: funds, isLoading, error, refetch } = useFundList({})
  const [enrichingCodes, setEnrichingCodes] = useState<Set<string>>(new Set())
  const [enrichedScores, setEnrichedScores] = useState<Record<string, EnrichedScoreResult>>({})

  const scoredFunds = useMemo<ScoredFund[]>(() => {
    if (!funds || !Array.isArray(funds)) return []
    return funds
      .map(fund => ({
        fund,
        score: computeScore(toScorableFund(fund), weights),
      }))
      .sort((a, b) => b.score.compositeScore - a.score.compositeScore)
  }, [funds, weights])

  const enrichFund = useCallback(
    async (
      schemeCode: string,
      context?: ScoringContext,
    ): Promise<EnrichedScoreResult | null> => {
      if (enrichingCodes.has(schemeCode)) return null

      const fund = funds?.find(f => f.schemeCode === schemeCode)
      if (!fund) return null

      const basicScore = computeScore(toScorableFund(fund), weights)

      setEnrichingCodes(prev => new Set(prev).add(schemeCode))

      try {
        const [schemeRes, navRes] = await Promise.all([
          fetch(`${API_MFDATA}/mf/${schemeCode}`),
          fetch(`${API_MFAPI}/mf/${schemeCode}`),
        ])

        let schemeDetail: SchemeDetail | null = null
        if (schemeRes.ok) {
          const schemeData = await schemeRes.json()
          schemeDetail = schemeDetailResponseSchema.parse(schemeData)
        }

        let navHistory: NavEntry[] = []
        if (navRes.ok) {
          const navData = await navRes.json()
          navHistory = navHistoryResponseSchema.parse(navData)
        }

        const enrichedFund = toEnrichedScorableFund(fund, schemeDetail, navHistory)
        const enrichedScore = computeScore(enrichedFund, weights, context)

        const result: EnrichedScoreResult = { basicScore, enrichedScore }

        setEnrichedScores(prev => ({ ...prev, [schemeCode]: result }))
        return result
      } catch {
        return null
      } finally {
        setEnrichingCodes(prev => {
          const next = new Set(prev)
          next.delete(schemeCode)
          return next
        })
      }
    },
    [funds, weights, enrichingCodes],
  )

  const isEnriching = useCallback(
    (schemeCode: string) => enrichingCodes.has(schemeCode),
    [enrichingCodes],
  )

  const getEnrichedScore = useCallback(
    (schemeCode: string): ComputeScoreResult | undefined => {
      return enrichedScores[schemeCode]?.enrichedScore
    },
    [enrichedScores],
  )

  return { scoredFunds, isLoading, error, refetch, enrichFund, isEnriching, getEnrichedScore, enrichedScores }
}
