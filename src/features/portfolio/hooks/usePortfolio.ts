import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/stores/db'
import { computeXIRR, type XirrTransaction } from '@/lib/xirr'
import { navHistoryResponseSchema } from '@/types/api'

const API_BASE = '/api/mfapi'

export interface PortfolioSummary {
  totalValue: number
  totalInvested: number
  unrealizedGainLoss: number
  xirr: number | null
  categoryAllocation: { category: string; value: number; percentage: number }[]
  fundContributions: { schemeCode: string; schemeName: string; value: number; percentage: number }[]
  goalBreakdown: { goalId: number; goalName: string; value: number }[]
  loading: boolean
}

export function usePortfolio(): PortfolioSummary {
  const transactions = useLiveQuery(() => db.transactions.toArray())
  const portfolios = useLiveQuery(() => db.portfolios.toArray())
  const goals = useLiveQuery(() => db.goals.toArray())

  const schemeCodes = useMemo(
    () => [...new Set((portfolios ?? []).map(p => p.schemeCode))],
    [portfolios],
  )

  const navQueries = useQueries({
    queries: schemeCodes.map(code => ({
      queryKey: ['nav', code],
      queryFn: async ({ signal }: { signal: AbortSignal }) => {
        const res = await fetch(`${API_BASE}/mf/${code}`, { signal })
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        const data = await res.json()
        return navHistoryResponseSchema.parse(data)
      },
      staleTime: 30 * 60 * 1000,
      retry: 3,
      retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 10000),
    })),
  })

  return useMemo(() => {
    const loading =
      transactions === undefined ||
      portfolios === undefined ||
      goals === undefined ||
      navQueries.some(q => q.isLoading)

    if (loading || !transactions || !portfolios || !goals) {
      return {
        totalValue: 0,
        totalInvested: 0,
        unrealizedGainLoss: 0,
        xirr: null,
        categoryAllocation: [],
        fundContributions: [],
        goalBreakdown: [],
        loading: true,
      }
    }

    const goalMap = new Map(goals.filter(g => g.id != null).map(g => [g.id!, g.name]))

    const totalInvested = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const latestNavMap = new Map<string, number>()
    schemeCodes.forEach((code, i) => {
      const data = navQueries[i]?.data
      if (data && data.length > 0) {
        latestNavMap.set(code, data[data.length - 1].nav)
      } else {
        const lastTx = [...transactions].reverse().find(t => t.schemeCode === code)
        if (lastTx) latestNavMap.set(code, lastTx.nav)
      }
    })

    const portfolioValues = portfolios.map(p => ({
      ...p,
      currentValue: p.units * (latestNavMap.get(p.schemeCode) ?? 0),
    }))

    const totalValue = portfolioValues.reduce((sum, p) => sum + p.currentValue, 0)

    const categoryMap = new Map<string, number>()
    portfolioValues.forEach(p => {
      const cat = p.category || 'Uncategorized'
      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + p.currentValue)
    })
    const categoryAllocation = Array.from(categoryMap.entries())
      .map(([category, value]) => ({
        category,
        value,
        percentage: totalValue > 0 ? value / totalValue : 0,
      }))
      .sort((a, b) => b.value - a.value)

    const fundMap = new Map<string, { schemeName: string; value: number }>()
    portfolioValues.forEach(p => {
      const existing = fundMap.get(p.schemeCode)
      if (existing) {
        existing.value += p.currentValue
      } else {
        fundMap.set(p.schemeCode, { schemeName: p.schemeName, value: p.currentValue })
      }
    })
    const fundContributions = Array.from(fundMap.entries())
      .map(([schemeCode, { schemeName, value }]) => ({
        schemeCode,
        schemeName,
        value,
        percentage: totalValue > 0 ? value / totalValue : 0,
      }))
      .sort((a, b) => b.value - a.value)

    const goalValueMap = new Map<number, number>()
    portfolioValues.forEach(p => {
      if (p.goalId != null) {
        goalValueMap.set(p.goalId, (goalValueMap.get(p.goalId) ?? 0) + p.currentValue)
      }
    })
    const goalBreakdown = Array.from(goalValueMap.entries())
      .map(([goalId, value]) => ({
        goalId,
        goalName: goalMap.get(goalId) ?? `Goal #${goalId}`,
        value,
      }))
      .sort((a, b) => b.value - a.value)

    let xirr: number | null = null
    if (transactions.length > 0 && totalInvested > 0) {
      const xirrInput: XirrTransaction[] = transactions.map(t => ({
        date: t.date,
        amount: -Math.abs(t.amount),
      }))
      xirrInput.push({
        date: new Date().toISOString().split('T')[0],
        amount: totalValue,
      })
      xirr = computeXIRR(xirrInput)
    }

    return {
      totalValue,
      totalInvested,
      unrealizedGainLoss: totalValue - totalInvested,
      xirr,
      categoryAllocation,
      fundContributions,
      goalBreakdown,
      loading: false,
    }
  }, [transactions, portfolios, goals, navQueries, schemeCodes])
}
