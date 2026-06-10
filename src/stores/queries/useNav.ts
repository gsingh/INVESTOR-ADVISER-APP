import { useQuery } from '@tanstack/react-query'
import { navHistoryResponseSchema } from '@/types/api'

const API_BASE = '/api/mfapi'

export function useNav(schemeCode: string) {
  return useQuery({
    queryKey: ['nav', schemeCode],
    queryFn: async ({ signal }) => {
      const res = await fetch(`${API_BASE}/mf/${schemeCode}`, { signal })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      return navHistoryResponseSchema.parse(data)
    },
    staleTime: 30 * 60 * 1000,
    retry: 3,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10000),
  })
}
