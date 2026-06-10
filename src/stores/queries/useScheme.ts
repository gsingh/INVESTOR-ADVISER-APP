import { useQuery, useQueryClient } from '@tanstack/react-query'
import { schemeDetailResponseSchema, mfdataSchemeResponseSchema, mfdataSectorsResponseSchema, type MFFund } from '@/types/api'
import { estimateRiskLabel, estimateExpenseRatio, estimateAum, estimateExitLoad } from '@/lib/fund-enrichment'
import { db } from '@/stores/db'

const API_BASE = '/api/mfapi'
const MFDATA_BASE = '/api/mfdata'

async function fetchMfdataSectors(schemeCode: string, signal?: AbortSignal) {
  try {
    const timeoutMs = 5000
    const timeoutSignal = AbortSignal.timeout(timeoutMs)
    const combined = signal ? anySignal(signal, timeoutSignal) : timeoutSignal

    const profileRes = await fetch(`${MFDATA_BASE}/api/v1/schemes/${schemeCode}`, { signal: combined })
    if (!profileRes.ok) throw new Error('Profile fetch failed')
    const profile = mfdataSchemeResponseSchema.parse(await profileRes.json())
    if (!profile.data.family_id) throw new Error('No family_id')

    const sectorsRes = await fetch(`${MFDATA_BASE}/api/v1/families/${profile.data.family_id}/sectors`, { signal: combined })
    if (!sectorsRes.ok) throw new Error('Sectors fetch failed')
    const sectors = mfdataSectorsResponseSchema.parse(await sectorsRes.json())
    const entries = sectors.data.sectors ?? []

    const result = entries
      .filter(s => s.sector && s.weight_pct > 0)
      .map(s => ({ sector: s.sector, percentage: s.weight_pct }))

    await db.mfdataCache.put({ schemeCode, sectors: result, cachedAt: Date.now() }).catch(() => {})

    return result
  } catch {
    const cached = await db.mfdataCache.get(schemeCode)
    if (cached && cached.sectors.length > 0) return cached.sectors
    return null
  }
}

function anySignal(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController()
  for (const s of signals) {
    if (s.aborted) {
      controller.abort(s.reason)
      return controller.signal
    }
    s.addEventListener('abort', () => controller.abort(s.reason), { once: true })
  }
  return controller.signal
}

export function useScheme(schemeCode: string) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['scheme', schemeCode],
    queryFn: async ({ signal }) => {
      const res = await fetch(`${API_BASE}/mf/${schemeCode}`, { signal })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      const scheme = schemeDetailResponseSchema.parse(data)
      if (!scheme) return null

      const fundList = queryClient.getQueryData<MFFund[]>(['funds'])
      const fundFromList = fundList?.find(f => f.schemeCode === scheme.schemeCode)

      let expenseRatio = scheme.expenseRatio
      let aum = scheme.aum
      let riskLabel = scheme.riskLabel
      let plan = scheme.plan

      if (fundFromList) {
        expenseRatio = fundFromList.expenseRatio || expenseRatio
        aum = fundFromList.aum || aum
        riskLabel = fundFromList.riskLabel || riskLabel
        plan = fundFromList.plan || plan
      }

      if (!expenseRatio || expenseRatio <= 0) {
        expenseRatio = estimateExpenseRatio(scheme.subCategory || scheme.category, plan)
      }
      if (!aum || aum <= 0) {
        aum = estimateAum(scheme.subCategory || scheme.category)
      }
      if (!riskLabel) {
        riskLabel = estimateRiskLabel(scheme.subCategory || scheme.category)
      }

      let exitLoad = scheme.exitLoad
      if (!exitLoad?.exists) {
        exitLoad = estimateExitLoad(scheme.subCategory || scheme.category)
      }

      const mfdataSectors = await fetchMfdataSectors(schemeCode, signal).catch(() => null)

      return {
        ...scheme,
        expenseRatio,
        aum,
        riskLabel,
        plan,
        option: fundFromList?.option || scheme.option,
        benchmark: fundFromList?.benchmark || scheme.benchmark,
        exitLoad,
        sectorAllocation: mfdataSectors ?? scheme.sectorAllocation,
      }
    },
    staleTime: Infinity,
    retry: 3,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10000),
  })
}
