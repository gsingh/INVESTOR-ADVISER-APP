import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/stores/db'
import type { ScorecardWeights } from '@/types/scorecard'

const DEFAULT_WEIGHTS: ScorecardWeights = {
  consistency: 10,
  cost: 8,
  sharpeRatio: 8,
  trailing3YReturn: 8,
  categoryFit: 5,
  sortinoRatio: 5,
  alpha: 5,
  yearwiseConsistency: 5,
  trailing1YReturn: 4,
  trailing5YReturn: 4,
  benchmarkSuitability: 4,
  volatility: 4,
  drawdown: 4,
  informationRatio: 4,
  fundAge: 3,
  aumSanity: 3,
  exitLoad: 3,
  overlap: 3,
  upCapture: 3,
  downCapture: 3,
  beta: 2,
  rSquared: 2,
  sinceInceptionReturn: 2,
}

function dbWeightsToObject(): Promise<ScorecardWeights> {
  return db.scorecardWeights.toArray().then(rows => {
    const result = { ...DEFAULT_WEIGHTS }
    for (const row of rows) {
      if (row.factor in DEFAULT_WEIGHTS) {
        result[row.factor as keyof ScorecardWeights] = row.weight as number
      }
    }
    return result
  })
}

export function useScorecardWeights() {
  const weightsFromDb = useLiveQuery(dbWeightsToObject, [], undefined)
  const [weights, setWeights] = useState<ScorecardWeights>(DEFAULT_WEIGHTS)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const pendingRef = useRef<Partial<ScorecardWeights>>({})
  const loadedRef = useRef(false)

  useEffect(() => {
    if (weightsFromDb && !loadedRef.current) {
      loadedRef.current = true
      setWeights(weightsFromDb)
    }
  }, [weightsFromDb])

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  const updateWeight = useCallback((key: keyof ScorecardWeights, value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }))

    pendingRef.current[key] = value

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const batch = pendingRef.current
      pendingRef.current = {}
      await db.transaction('rw', db.scorecardWeights, async () => {
        for (const [k, v] of Object.entries(batch)) {
          await db.scorecardWeights.put({ factor: k, weight: v as number })
        }
      })
    }, 500)
  }, [])

  const resetToDefaults = useCallback(() => {
    setWeights(DEFAULT_WEIGHTS)
    pendingRef.current = {}
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      db.scorecardWeights.clear()
    }, 500)
  }, [])

  const weightSum = Object.values(weights).reduce((a, b) => a + (b ?? 0), 0)

  return { weights, weightSum, updateWeight, resetToDefaults }
}
