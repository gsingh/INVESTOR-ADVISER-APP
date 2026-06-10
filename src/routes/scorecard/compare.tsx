import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ChevronDown, ChevronUp, AlertTriangle, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useFundList } from '@/stores/queries/useFunds'
import { FundSelector } from '@/features/compare/components/FundSelector'
import { PreComparisonFilters } from '@/features/compare/components/PreComparisonFilters'
import { ComparisonTable } from '@/features/compare/components/ComparisonTable'
import { InterplayWarningsPanel } from '@/features/compare/components/InterplayWarnings'
import { CompareNavCharts } from '@/features/compare/components/NavChart'
import { YearwiseComparison } from '@/features/compare/components/YearwiseComparison'
import { useComparison, toScorableFund } from '@/features/compare/hooks/useComparison'
import { useScorecardWeights } from '@/features/scorecard/hooks/useScorecardWeights'
import type { MFFund } from '@/types/api'

export default function ComparePage() {
  const navigate = useNavigate()
  const { weights } = useScorecardWeights()
  const { data: allFunds } = useFundList({})

  const [selected, setSelected] = useState<MFFund[]>([])
  const [warningsOpen, setWarningsOpen] = useState(false)

  useEffect(() => {
    if (!allFunds) return
    const params = new URLSearchParams(window.location.search)
    const codes = params.get('codes')
    if (!codes) return
    const codesList = codes.split(',').filter(Boolean)
    const funds = codesList
      .map(code => allFunds.find(f => f.schemeCode === code))
      .filter((f): f is MFFund => f !== undefined)
    if (funds.length > 0) {
      setSelected(funds)
    }
  }, [allFunds])

  const syncUrl = useCallback((funds: MFFund[]) => {
    const params = new URLSearchParams(window.location.search)
    if (funds.length > 0) {
      params.set('codes', funds.map(f => f.schemeCode).join(','))
    } else {
      params.delete('codes')
    }
    const qs = params.toString()
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
  }, [])

  const handleSelect = useCallback((fund: MFFund) => {
    setSelected(prev => {
      if (prev.some(f => f.schemeCode === fund.schemeCode)) return prev
      if (prev.length >= 4) return prev
      const next = [...prev, fund]
      syncUrl(next)
      return next
    })
  }, [syncUrl])

  const handleRemove = useCallback((schemeCode: string) => {
    setSelected(prev => {
      const next = prev.filter(f => f.schemeCode !== schemeCode)
      syncUrl(next)
      return next
    })
  }, [syncUrl])

  const schemeCodes = useMemo(() => selected.map(f => f.schemeCode), [selected])

  const { comparedFunds, isLoading, isEmpty } = useComparison(schemeCodes, weights)

  const scorableFunds = useMemo(
    () => selected.map(f => toScorableFund(f)),
    [selected],
  )

  const hasFunds = comparedFunds.length >= 2

  const filtersAllPass = useMemo(() => {
    if (scorableFunds.length < 2) return true
    const subCategories = [...new Set(scorableFunds.map(f => f.subCategory).filter(Boolean))]
    const plans = [...new Set(scorableFunds.map(f => f.plan).filter(Boolean))]
    const benchmarks = scorableFunds.some(f => f.benchmark)
    const historyOk = scorableFunds.every(f => {
      if (!f.launchDate) return true
      return (Date.now() - new Date(f.launchDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000) >= 3
    })
    return subCategories.length <= 1 && plans.length <= 1 && benchmarks && historyOk
  }, [scorableFunds])

  const allWarnings = useMemo(
    () => comparedFunds.map(f => ({
      fundName: f.fund.schemeName,
      warnings: f.interplayWarnings,
    })),
    [comparedFunds],
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/scorecard' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-display font-semibold text-foreground">Compare Funds</h1>
          <p className="text-body text-muted-foreground">Compare up to 4 funds side-by-side</p>
        </div>
        {selected.length > 0 && (
          <Badge variant="secondary" className="gap-1 px-3 py-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            {selected.length} fund{selected.length > 1 ? 's' : ''} selected
          </Badge>
        )}
        {hasFunds && filtersAllPass && (
          <PreComparisonFilters funds={scorableFunds} />
        )}
      </div>

      <div>
        <FundSelector
          selected={selected}
          onSelect={handleSelect}
          onRemove={handleRemove}
        />
      </div>

      {hasFunds && !filtersAllPass && (
        <PreComparisonFilters funds={scorableFunds} />
      )}

      {isLoading && (
        <div className="rounded-lg border p-6 text-center text-small text-muted-foreground">
          Loading fund data...
        </div>
      )}

      <CompareNavCharts
        funds={comparedFunds.map(f => ({ fund: f.fund, navData: f.navData }))}
      />

      {hasFunds && <YearwiseComparison funds={comparedFunds} />}

      <ComparisonTable funds={comparedFunds} />

      {allWarnings.some(w => w.warnings.length > 0) && (
        <Card>
          <button
            onClick={() => setWarningsOpen(!warningsOpen)}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium"
          >
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Interplay Warnings
            <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              {allWarnings.reduce((sum, w) => sum + w.warnings.length, 0)} issues found
              {warningsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          </button>
          {warningsOpen && (
            <div className="border-t px-4 py-3">
              <InterplayWarningsPanel allWarnings={allWarnings} />
            </div>
          )}
        </Card>
      )}

      {selected.length >= 2 && comparedFunds.length === 0 && !isLoading && (
        <div className="rounded-lg border p-6 text-center text-small text-muted-foreground">
          Selected funds not found in the universe. Try selecting different funds.
        </div>
      )}
    </div>
  )
}
