import { useState, useCallback } from 'react'
import type { FundFilters } from '@/stores/queries/useFunds'

function getDefaultFilters(): FundFilters {
  return {}
}

function parseFiltersFromUrl(): FundFilters {
  const params = new URLSearchParams(window.location.search)
  const filters: FundFilters = {}
  const categories = params.get('categories')
  if (categories) filters.categories = categories.split(',')
  const planType = params.get('planType')
  if (planType === 'direct' || planType === 'regular') filters.planType = planType
  const growthOnly = params.get('growthOnly')
  if (growthOnly === 'true') filters.growthOnly = true
  const amc = params.get('amc')
  if (amc) filters.amc = amc
  const expenseRatioMax = params.get('expenseRatioMax')
  if (expenseRatioMax) filters.expenseRatioMax = Number(expenseRatioMax)
  const aumMin = params.get('aumMin')
  if (aumMin) filters.aumMin = Number(aumMin)
  const aumMax = params.get('aumMax')
  if (aumMax) filters.aumMax = Number(aumMax)
  const benchmarkTypes = params.get('benchmarkTypes')
  if (benchmarkTypes) filters.benchmarkTypes = benchmarkTypes.split(',')
  return Object.keys(filters).length > 0 ? filters : getDefaultFilters()
}

function filtersToUrl(f: FundFilters): string {
  const params = new URLSearchParams()
  if (f.categories?.length) params.set('categories', f.categories.join(','))
  if (f.planType) params.set('planType', f.planType)
  if (f.growthOnly) params.set('growthOnly', 'true')
  if (f.amc) params.set('amc', f.amc)
  if (f.expenseRatioMax !== undefined) params.set('expenseRatioMax', String(f.expenseRatioMax))
  if (f.aumMin !== undefined) params.set('aumMin', String(f.aumMin))
  if (f.aumMax !== undefined) params.set('aumMax', String(f.aumMax))
  if (f.benchmarkTypes?.length) params.set('benchmarkTypes', f.benchmarkTypes.join(','))
  return params.toString()
}

const SYNC_TO_URL = true

export function useUniverseFilters(initial?: FundFilters) {
  const [filters, setFiltersState] = useState<FundFilters>(() => {
    const fromUrl = parseFiltersFromUrl()
    return fromUrl ?? initial ?? getDefaultFilters()
  })

  const syncToUrl = useCallback((f: FundFilters) => {
    if (!SYNC_TO_URL) return
    const qs = filtersToUrl(f)
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
  }, [])

  const setFilter = useCallback(<K extends keyof FundFilters>(key: K, value: FundFilters[K]) => {
    setFiltersState(prev => {
      const next = { ...prev, [key]: value }
      syncToUrl(next)
      return next
    })
  }, [syncToUrl])

  const resetFilters = useCallback(() => {
    const next = getDefaultFilters()
    setFiltersState(next)
    syncToUrl(next)
  }, [syncToUrl])

  const activeFilterCount = Object.values(filters).filter(
    v => v !== undefined && v !== '' && v !== false && !(Array.isArray(v) && v.length === 0),
  ).length

  return { filters, setFilter, resetFilters, activeFilterCount }
}
