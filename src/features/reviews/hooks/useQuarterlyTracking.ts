import { useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/stores/db'
import { getCurrentQuarter } from '@/lib/date-utils'
import type { GoalHolding, QuarterlySnapshot } from '@/stores/db'

export function useQuarterlySnapshots(holdings: GoalHolding[] | undefined) {
  const currentQuarter = getCurrentQuarter()
  const hasSnapshot = useRef(false)

  const existingSnapshots = useLiveQuery(
    () => db.quarterlySnapshots.where('quarter').equals(currentQuarter).toArray(),
    [currentQuarter],
  )

  useEffect(() => {
    if (!holdings || holdings.length === 0) return
    if (hasSnapshot.current) return
    if (existingSnapshots === undefined) return
    if (existingSnapshots.length > 0) {
      hasSnapshot.current = true
      return
    }

    const snapshots: Omit<QuarterlySnapshot, 'id'>[] = holdings.map(h => ({
      holdingId: h.id ?? 0,
      goalId: h.goalId,
      fundName: h.fundName,
      amfiCategory: h.amfiCategory,
      currentValue: h.currentValue,
      targetAllocation: h.targetAllocation,
      quarter: currentQuarter,
      snapshotDate: new Date().toISOString(),
    }))

    db.quarterlySnapshots.bulkAdd(snapshots as QuarterlySnapshot[]).catch(() => {})
    hasSnapshot.current = true
  }, [holdings, existingSnapshots, currentQuarter])
}

export function usePreviousSnapshots(
  holdings: GoalHolding[] | undefined,
): QuarterlySnapshot[] {
  return useLiveQuery(
    async () => {
      if (!holdings || holdings.length === 0) return []
      const holdingIds = holdings.map(h => h.id).filter((id): id is number => id != null)
      if (holdingIds.length === 0) return []
      return db.quarterlySnapshots
        .where('holdingId')
        .anyOf(holdingIds)
        .toArray()
    },
    [holdings],
    [],
  )
}
