import { useLiveQuery } from 'dexie-react-hooks'
import { db, type GoalHolding } from '@/stores/db'
import { computeDrift, type DriftResult } from '@/lib/drift-calculator'

export interface GoalHoldingWithDrift extends GoalHolding {
  actualPct: number
  targetPct: number
  drift: DriftResult
}

export interface DriftTrackingResult {
  holdings: GoalHoldingWithDrift[]
  totalValue: number
  loading: boolean
  error: string | null
}

export function useDriftTracking(goalId: number): DriftTrackingResult {
  const goal = useLiveQuery(
    () => db.goals.get(goalId).then(r => r ?? null),
    [goalId],
  )
  const holdings = useLiveQuery(
    () => db.goalHoldings.where('goalId').equals(goalId).toArray(),
    [goalId],
  )

  const loading = goal === undefined || holdings === undefined

  if (loading) {
    return { holdings: [], totalValue: 0, loading: true, error: null }
  }

  if (!goal) {
    return { holdings: [], totalValue: 0, loading: false, error: 'Goal not found.' }
  }

  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0)

  const holdingsWithDrift = holdings.map(h => {
    const actualPct = totalValue > 0 ? h.currentValue / totalValue : 0
    const targetPct = h.targetAllocation
    const drift = computeDrift(actualPct, targetPct)
    return { ...h, actualPct, targetPct, drift }
  })

  return { holdings: holdingsWithDrift, totalValue, loading: false, error: null }
}
