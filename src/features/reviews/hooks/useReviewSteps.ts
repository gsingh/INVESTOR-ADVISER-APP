import { useCallback, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/stores/db'
import type { Goal, GoalHolding, Portfolio, QuarterlySnapshot, ReviewStep } from '@/stores/db'
import { useQuarterlySnapshots, usePreviousSnapshots } from './useQuarterlyTracking'

export const CATEGORY_CONCENTRATION_THRESHOLD = 2

const BENCHMARK_RATES: Record<string, { rate: number; index: string }> = {
  'Large Cap': { rate: 12, index: 'Nifty 50 TRI' },
  'Mid Cap': { rate: 14, index: 'Nifty Midcap 150 TRI' },
  'Small Cap': { rate: 16, index: 'Nifty Smallcap 250 TRI' },
  'Flexi Cap': { rate: 13, index: 'Nifty 500 TRI' },
  'Multi Cap': { rate: 13, index: 'Nifty 500 TRI' },
  'ELSS': { rate: 12, index: 'Nifty 50 TRI' },
  'Value': { rate: 12, index: 'Nifty 50 TRI' },
  'Contra': { rate: 12, index: 'Nifty 50 TRI' },
  'Dividend Yield': { rate: 10, index: 'Nifty Dividend Opportunities TRI' },
  'Banking': { rate: 13, index: 'Nifty Bank TRI' },
  'Financial Services': { rate: 13, index: 'Nifty Financial Services TRI' },
  'Sectoral/Thematic': { rate: 15, index: 'Nifty Sector Index' },
  'Debt': { rate: 7, index: 'CRISIL Bond Index' },
  'Liquid': { rate: 5, index: 'CRISIL Liquid Index' },
  'Money Market': { rate: 6, index: 'CRISIL Money Market Index' },
  'Gilt': { rate: 7, index: 'CRISIL Gilt Index' },
  'Corporate Bond': { rate: 7.5, index: 'CRISIL Corporate Bond Index' },
  'Short Duration': { rate: 6.5, index: 'CRISIL Short Term Bond Index' },
  'Medium Duration': { rate: 7, index: 'CRISIL Medium Duration Index' },
  'Long Duration': { rate: 8, index: 'CRISIL Long Duration Index' },
  'Dynamic Bond': { rate: 7.5, index: 'CRISIL Dynamic Bond Index' },
  'Credit Risk': { rate: 8.5, index: 'CRISIL Credit Risk Index' },
}

function getQuarterLabel(quarter: string): string {
  const q = quarter.split('-Q')[1]
  const y = quarter.split('-Q')[0]
  return `Q${q} ${y}`
}

export function computeSteps(
  _goals: Goal[],
  holdings: GoalHolding[],
  portfolios: Portfolio[],
  snapshots: QuarterlySnapshot[] = [],
): ReviewStep[] {
  const steps: ReviewStep[] = []

  const driftDetails: string[] = []
  let driftHasWarn = false
  let driftHasFail = false
  for (const holding of holdings) {
    if (holding.targetAllocation <= 0) {
      driftDetails.push(`${holding.fundName}: excluded (zero target allocation)`)
      continue
    }
    const drift = Math.abs(
      ((holding.currentValue - holding.targetAllocation) / holding.targetAllocation) * 100,
    )
    const category = holding.amfiCategory || 'Unknown'
    if (drift > 10) {
      driftHasFail = true
      driftDetails.push(`${category} (${holding.fundName}): FAIL (${Math.round(drift)}%)`)
    } else if (drift > 5) {
      driftHasWarn = true
      driftDetails.push(`${category} (${holding.fundName}): WARN (${Math.round(drift)}%)`)
    } else {
      driftDetails.push(`${category} (${holding.fundName}): PASS (${Math.round(drift)}%)`)
    }
  }
  if (holdings.length === 0) {
    driftDetails.push('No holdings to evaluate.')
  }
  const driftStatus = driftHasFail ? 'fail' : driftHasWarn ? 'warn' : 'pass'
  steps.push({ name: 'drift_check', status: driftStatus, details: driftDetails.join('\n') })

  const categoryCounts = new Map<string, number>()
  for (const holding of holdings) {
    const cat = holding.amfiCategory || 'Unknown'
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1)
  }
  const catDetails: string[] = []
  let catHasWarn = false
  for (const [cat, count] of categoryCounts) {
    if (count >= CATEGORY_CONCENTRATION_THRESHOLD) {
      catHasWarn = true
      catDetails.push(`${cat}: WARN (${count} funds)`)
    } else {
      catDetails.push(`${cat}: PASS (${count} fund)`)
    }
  }
  if (holdings.length === 0) {
    catDetails.push('No holdings to evaluate.')
  }
  steps.push({
    name: 'category_exposure',
    status: catHasWarn ? 'warn' : 'pass',
    details: catDetails.join('\n'),
  })

  const roleDetails: string[] = []
  let roleHasWarn = false
  for (const portfolio of portfolios) {
    if (!portfolio.category) {
      roleHasWarn = true
      roleDetails.push(`${portfolio.schemeName}: WARN (category data unavailable)`)
    } else {
      roleDetails.push(`${portfolio.schemeName}: PASS (category: ${portfolio.category})`)
    }
  }
  if (portfolios.length === 0) {
    roleDetails.push('No portfolio funds to evaluate.')
  }
  steps.push({
    name: 'fund_role_fit',
    status: roleHasWarn ? 'warn' : 'pass',
    details: roleDetails.join('\n'),
  })

  const benchmarkDetails: string[] = []
  let benchmarkHasWarn = false
  let benchmarkHasFail = false

  if (holdings.length === 0) {
    benchmarkDetails.push('No holdings to evaluate.')
  } else {
    const snapshotsByHolding = new Map<number, QuarterlySnapshot[]>()
    for (const snap of snapshots) {
      const list = snapshotsByHolding.get(snap.holdingId) ?? []
      list.push(snap)
      snapshotsByHolding.set(snap.holdingId, list)
    }

    for (const holding of holdings) {
      if (holding.targetAllocation <= 0) continue
      if (!holding.id) continue

      const benchmark = BENCHMARK_RATES[holding.amfiCategory || 'Unknown']
      if (!benchmark) {
        benchmarkHasWarn = true
        benchmarkDetails.push(`${holding.fundName} (${holding.amfiCategory || 'Unknown'}): WARN — no benchmark data for this category`)
        continue
      }

      const holdingSnapshots = snapshotsByHolding.get(holding.id) ?? []
      const sortedSnaps = [...holdingSnapshots].sort((a, b) => a.quarter.localeCompare(b.quarter))
      const lastTwo = sortedSnaps.slice(-2)

      if (lastTwo.length < 2) {
        benchmarkDetails.push(`${holding.fundName} (${holding.amfiCategory}): ${benchmark.index} (${benchmark.rate}% expected) — insufficient quarterly data`)
        continue
      }

      const older = lastTwo[0]
      const newer = lastTwo[1]
      const quarterlyReturn = older.currentValue > 0
        ? ((newer.currentValue - older.currentValue) / older.currentValue) * 100
        : 0
      const expectedQuarterlyReturn = benchmark.rate / 4
      const underperformance = quarterlyReturn - expectedQuarterlyReturn

      if (underperformance < -2) {
        benchmarkHasFail = true
        benchmarkDetails.push(
          `${holding.fundName}: FAIL — ${Math.abs(underperformance).toFixed(1)}% below ${benchmark.index} ` +
          `(${getQuarterLabel(older.quarter)} → ${getQuarterLabel(newer.quarter)}). ` +
          `${holding.fundName} has underperformed its benchmark for 2 consecutive quarters.`,
        )
      } else {
        benchmarkDetails.push(
          `${holding.fundName}: PASS — ${quarterlyReturn.toFixed(1)}% quarterly vs ${benchmark.index} ${benchmark.rate}% annual ` +
          `(${getQuarterLabel(older.quarter)} → ${getQuarterLabel(newer.quarter)})`,
        )
      }
    }

    if (holdings.length > 0 && [...snapshotsByHolding.keys()].length === 0) {
      benchmarkDetails.push('No quarterly snapshot data available yet — snapshots will be recorded on review start.')
    }

    benchmarkDetails.push('')
    benchmarkDetails.push('Note: Quarterly returns computed from snapshot value changes. Full accuracy requires cost-basis data.')
  }

  steps.push({
    name: 'benchmark_comparison',
    status: benchmarkHasFail ? 'fail' : benchmarkHasWarn ? 'warn' : 'pass',
    details: benchmarkDetails.join('\n'),
  })

  steps.push({
    name: 'rationale_outcome',
    status: 'pass',
    details: 'Complete the form below to record your decision and rationale.',
  })

  return steps
}

export function useReviewSteps(): {
  steps: ReviewStep[]
  loading: boolean
  recompute: () => void
} {
  const goals = useLiveQuery(() => db.goals.where('status').equals('active').toArray())
  const holdings = useLiveQuery(() => db.goalHoldings.toArray())
  const portfolios = useLiveQuery(() => db.portfolios.toArray())

  const loading = goals === undefined || holdings === undefined || portfolios === undefined

  useQuarterlySnapshots(holdings)
  const snapshots = usePreviousSnapshots(holdings)

  const [refreshKey, setRefreshKey] = useState(0)

  const steps = useMemo(() => {
    if (!goals || !holdings || !portfolios) return []
    return computeSteps(goals, holdings, portfolios, snapshots)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals, holdings, portfolios, snapshots, refreshKey])

  const recompute = useCallback(() => setRefreshKey(k => k + 1), [])

  return { steps, loading, recompute }
}
