import { useQuery } from '@tanstack/react-query'
import { schemeDetailResponseSchema } from '@/types/api'

const API_BASE = '/api/mfdata'

export function useScheme(schemeCode: string) {
  return useQuery({
    queryKey: ['scheme', schemeCode],
    queryFn: async ({ signal }) => {
      const res = await fetch(`${API_BASE}/scheme/${schemeCode}`, { signal })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      return schemeDetailResponseSchema.parse(data)
    },
    staleTime: Infinity,
    retry: 3,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10000),
  })
}
