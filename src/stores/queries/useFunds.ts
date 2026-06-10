import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { mfapiResponseSchema } from '@/types/api'
import type { MFFund } from '@/types/api'

export interface FundFilters {
  categories?: string[]
  planType?: 'direct' | 'regular'
  growthOnly?: boolean
  amc?: string
  expenseRatioMax?: number
  aumMin?: number
  aumMax?: number
  benchmarkTypes?: string[]
}

const API_BASE = '/api/mfapi'

const DIRECT_REGEX = /\bdirect\b/i
const GROWTH_REGEX = /\bgrowth\b/i

function applyFilters(funds: MFFund[], filters: FundFilters): MFFund[] {
  let result = funds

  const seen = new Set<string>()
  result = result.filter(f => {
    const key = `${f.schemeCode}-${f.plan ?? ''}-${f.option ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  if (filters.planType === 'direct') {
    result = result.filter(f => DIRECT_REGEX.test(f.schemeName))
  } else if (filters.planType === 'regular') {
    result = result.filter(f => !DIRECT_REGEX.test(f.schemeName))
  }

  if (filters.growthOnly) {
    result = result.filter(f => GROWTH_REGEX.test(f.schemeName))
  }

  if (filters.amc) {
    const amcLower = filters.amc.toLowerCase()
    result = result.filter(f =>
      (f.amc && f.amc.toLowerCase().includes(amcLower)) ||
      f.schemeName.toLowerCase().includes(amcLower),
    )
  }

  if (filters.expenseRatioMax !== undefined) {
    result = result.filter(f => f.expenseRatio <= filters.expenseRatioMax!)
  }

  if (filters.aumMin !== undefined) {
    result = result.filter(f => f.aum >= filters.aumMin!)
  }

  if (filters.aumMax !== undefined) {
    result = result.filter(f => f.aum <= filters.aumMax!)
  }

  if (filters.categories && filters.categories.length > 0) {
    const catLower = filters.categories.map(c => c.toLowerCase())
    result = result.filter(f => catLower.includes((f.subCategory ?? '').toLowerCase()))
  }

  if (filters.benchmarkTypes && filters.benchmarkTypes.length > 0) {
    result = result.filter(f =>
      filters.benchmarkTypes!.some(bm => f.benchmark?.includes(bm))
    )
  }

  return result
}

export function useFundList(filters: FundFilters) {
  const query = useQuery({
    queryKey: ['funds'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/mf`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      return mfapiResponseSchema.parse(data)
    },
    staleTime: Infinity,
    retry: 3,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10000),
  })

  const data = useMemo(
    () => (query.data ? applyFilters(query.data, filters) : undefined),
    [query.data, filters],
  )

  return { ...query, data }
}

export function useAmcList() {
  return useQuery({
    queryKey: ['amcs'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/mf`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      const funds = mfapiResponseSchema.parse(data)
      const amcSet = new Set<string>()
      for (const fund of funds) {
        if (fund.amc) amcSet.add(fund.amc)
      }
      return Array.from(amcSet).sort()
    },
    staleTime: Infinity,
    retry: 2,
  })
}
