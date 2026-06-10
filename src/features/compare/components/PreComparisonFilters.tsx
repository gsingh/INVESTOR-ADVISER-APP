import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import type { ScorableFund } from '@/types/scorecard'

interface FilterResult {
  label: string
  pass: boolean
  message: string
}

function checkPreFilters(funds: ScorableFund[]): FilterResult[] {
  const results: FilterResult[] = []

  const subCategories = [...new Set(funds.map(f => f.subCategory).filter(Boolean))]
  results.push({
    label: 'Same SEBI Sub-Category',
    pass: subCategories.length <= 1,
    message: subCategories.length <= 1
      ? `All funds are in "${subCategories[0] ?? 'Unknown'}" category`
      : `Funds span multiple sub-categories: ${subCategories.join(', ')}`,
  })

  const plans = [...new Set(funds.map(f => f.plan).filter(Boolean))]
  results.push({
    label: 'Same Plan Type',
    pass: plans.length <= 1,
    message: plans.length <= 1
      ? `All funds are ${plans[0] ? `"${plans[0]}" plans` : 'same plan type'}`
      : `Funds have different plan types: ${plans.join(', ')}. Mixing Direct and Regular distorts comparison.`,
  })

  const benchmarks = [...new Set(funds.map(f => f.benchmark).filter(Boolean))]
  results.push({
    label: 'Appropriate Benchmark',
    pass: benchmarks.length > 0,
    message: benchmarks.length > 0
      ? `Benchmarks: ${benchmarks.join(', ')}`
      : 'Benchmark data not available for all funds',
  })

  const hasHistory = funds.map(f => {
    const age = f.launchDate ? (Date.now() - new Date(f.launchDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000) : 0
    return { name: f.schemeName, age, pass: age >= 3 }
  })
  const allHaveHistory = hasHistory.every(h => h.pass)
  results.push({
    label: 'Sufficient History (≥ 3 years)',
    pass: allHaveHistory,
    message: allHaveHistory
      ? 'All funds have 3+ year track records'
      : `${hasHistory.filter(h => !h.pass).map(h => h.name).join(', ')} ${hasHistory.filter(h => !h.pass).length > 1 ? 'have' : 'has'} less than 3 years of history`,
  })

  return results
}

interface PreComparisonFiltersProps {
  funds: ScorableFund[]
}

export function PreComparisonFilters({ funds }: PreComparisonFiltersProps) {
  const filters = funds.length >= 2 ? checkPreFilters(funds) : []
  const allPass = filters.every(f => f.pass)
  const failed = filters.filter(f => !f.pass)

  if (allPass) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-3 w-3" />
        {filters.length} pre-checks passed
      </span>
    )
  }

  if (funds.length < 2) return null

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
          {failed.length} pre-check{failed.length > 1 ? 's' : ''} failed
        </span>
      </div>
      {failed.map(f => (
        <div key={f.label} className="flex items-start gap-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
          <div className="text-xs">
            <span className="font-medium">{f.label}</span>
            <p className="text-muted-foreground">{f.message}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
