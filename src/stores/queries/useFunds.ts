import { useQuery } from '@tanstack/react-query'
import { mfapiResponseSchema } from '@/types/api'

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

async function fetchFundList(filters: FundFilters) {
  const params = new URLSearchParams()
  if (filters.categories?.length) params.set('category', filters.categories.join(','))
  if (filters.planType) params.set('plan', filters.planType)
  if (filters.growthOnly) params.set('option', 'growth')
  if (filters.amc) params.set('amc', filters.amc)
  if (filters.expenseRatioMax !== undefined) params.set('expense_ratio_max', String(filters.expenseRatioMax))
  if (filters.aumMin !== undefined) params.set('aum_min', String(filters.aumMin))
  if (filters.aumMax !== undefined) params.set('aum_max', String(filters.aumMax))
  if (filters.benchmarkTypes?.length) params.set('benchmark', filters.benchmarkTypes.join(','))

  const url = params.toString() ? `${API_BASE}/funds?${params}` : `${API_BASE}/funds`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  return mfapiResponseSchema.parse(data)
}

export function useFundList(filters: FundFilters) {
  return useQuery({
    queryKey: ['funds', JSON.stringify(filters)],
    queryFn: () => fetchFundList(filters),
    staleTime: Infinity,
    retry: 3,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10000),
  })
}

export function useAmcList() {
  return useQuery({
    queryKey: ['amcs'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/amcs`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data: string[] = await res.json()
      return data
    },
    staleTime: Infinity,
    retry: 2,
  })
}
