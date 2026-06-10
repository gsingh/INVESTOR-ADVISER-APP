import { useQuery } from '@tanstack/react-query'
import { getmfdataSearchResponseSchema, getmfdataFundResponseSchema } from '@/types/getmfdata'
import { mapSchemeCategory } from '@/lib/getmfdata-mapper'
import { extractPlan, extractOption, extractAmc } from '@/types/mf-utils'

const GMFDATA_BASE = '/api/getmfdata'

export function useGetMfDataSearch(query: string) {
  return useQuery({
    queryKey: ['getmfdata-search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return []
      const res = await fetch(`${GMFDATA_BASE}/api/search?q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error(`getmfdata search error: ${res.status}`)
      const raw = await res.json()
      const parsed = getmfdataSearchResponseSchema.parse(raw)
      const items = parsed.data ?? []
      return items.map(item => ({
        schemeCode: String(item.scheme_code),
        schemeName: item.fund_name,
        amc: item.amc || extractAmc(item.fund_name),
        category: mapSchemeCategory(item.scheme_category),
        subCategory: mapSchemeCategory(item.scheme_category),
        plan: item.plan_type || extractPlan(item.fund_name),
        option: item.option_type || extractOption(item.fund_name),
        nav: item.nav ?? 0,
        navDate: item.nav_date ?? '',
        rank: item.rank ?? 0,
      }))
    },
    enabled: query.length >= 2,
    staleTime: 60_000,
  })
}

export function useGetMfDataFund(schemeCode: string) {
  return useQuery({
    queryKey: ['getmfdata-fund', schemeCode],
    queryFn: async () => {
      const res = await fetch(`${GMFDATA_BASE}/api/funds/${schemeCode}`)
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`getmfdata fund error: ${res.status}`)
      const raw = await res.json()
      const parsed = getmfdataFundResponseSchema.parse(raw)
      if (!parsed.data) return null
      const item = parsed.data
      return {
        schemeCode: String(item.scheme_code),
        schemeName: item.fund_name,
        amc: item.amc || extractAmc(item.fund_name),
        category: mapSchemeCategory(item.scheme_category),
        subCategory: mapSchemeCategory(item.scheme_category),
        plan: extractPlan(item.fund_name),
        option: extractOption(item.fund_name),
        nav: item.nav ?? 0,
        navDate: item.nav_date ?? '',
      }
    },
    enabled: !!schemeCode,
    staleTime: 300_000,
    retry: 1,
  })
}
