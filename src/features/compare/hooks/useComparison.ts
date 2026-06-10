import { useState, useEffect, useMemo } from 'react'
import { useFundList } from '@/stores/queries/useFunds'
import { schemeDetailResponseSchema, navHistoryResponseSchema } from '@/types/api'
import { computeScore } from '@/lib/scorecard'
import { computeInterplayWarnings } from '@/lib/interplay'
import type { ScorecardWeights, ComputeScoreResult, ScorableFund, ScoringContext } from '@/types/scorecard'
import type { MFFund, SchemeDetail, NavEntry } from '@/types/api'
import type { InterplayWarning } from '@/lib/interplay'

const API_MFDATA = '/api/mfapi'
const API_MFAPI = '/api/mfapi'

export function toScorableFund(fund: MFFund): ScorableFund {
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

export interface ComparedFund {
  fund: MFFund
  basicScore: ComputeScoreResult
  enrichedScore?: ComputeScoreResult
  interplayWarnings: InterplayWarning[]
  isEnriching: boolean
  navData: NavEntry[]
}

export function useComparison(schemeCodes: string[], weights?: ScorecardWeights) {
  const { data: funds, isLoading: fundsLoading } = useFundList({})
  const [enrichedData, setEnrichedData] = useState<Record<string, { scheme: SchemeDetail | null; nav: NavEntry[] }>>({})
  const [enrichingCodes, setEnrichingCodes] = useState<Set<string>>(new Set())

  const enrichedFunds = useMemo(() => {
    if (!funds) return []
    return schemeCodes
      .map(code => funds.find(f => f.schemeCode === code))
      .filter((f): f is MFFund => f !== undefined)
  }, [funds, schemeCodes])

  useEffect(() => {
    const codesToEnrich = enrichedFunds
      .map(f => f.schemeCode)
      .filter(code => !enrichedData[code] && !enrichingCodes.has(code))

    if (codesToEnrich.length === 0) return

    for (const code of codesToEnrich) {
      setEnrichingCodes(prev => new Set(prev).add(code))
      Promise.all([
        fetch(`${API_MFDATA}/mf/${code}`).then(r => r.ok ? r.json() : null),
        fetch(`${API_MFAPI}/mf/${code}`).then(r => r.ok ? r.json() : null),
      ]).then(([schemeRaw, navRaw]) => {
        const scheme = schemeRaw ? schemeDetailResponseSchema.parse(schemeRaw) : null
        const nav = navRaw ? navHistoryResponseSchema.parse(navRaw) : []
        setEnrichedData(prev => ({ ...prev, [code]: { scheme, nav } }))
      }).catch(() => {
        // silently fail
      }).finally(() => {
        setEnrichingCodes(prev => {
          const next = new Set(prev)
          next.delete(code)
          return next
        })
      })
    }
  }, [enrichedFunds, enrichedData, enrichingCodes])

  const comparedFunds: ComparedFund[] = useMemo(() => {
    return enrichedFunds.map(fund => {
      const basicScore = computeScore(toScorableFund(fund), weights)
      const enrichment = enrichedData[fund.schemeCode]
      const isBusy = enrichingCodes.has(fund.schemeCode)

      let enrichedScore: ComputeScoreResult | undefined
      if (enrichment) {
        const enrichedFund = toEnrichedScorableFund(fund, enrichment.scheme, enrichment.nav)
        enrichedScore = computeScore(enrichedFund, weights)
      }

      const interplayWarnings = computeInterplayWarnings(
        enrichedScore ?? basicScore,
        fund.subCategory || fund.category,
      )

      return {
        fund,
        basicScore,
        enrichedScore,
        interplayWarnings,
        isEnriching: isBusy && !enrichment,
        navData: enrichment?.nav ?? [],
      }
    })
  }, [enrichedFunds, weights, enrichedData, enrichingCodes])

  return {
    comparedFunds,
    isLoading: fundsLoading,
    isEmpty: enrichedFunds.length === 0,
  }
}
