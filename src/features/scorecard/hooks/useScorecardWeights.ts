import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/stores/db'
import type { ScorecardWeights } from '@/types/scorecard'

const DEFAULT_WEIGHTS: ScorecardWeights = {
  consistency: 30,
  cost: 15,
  categoryFit: 15,
  benchmarkSuitability: 10,
  fundAge: 5,
  aumSanity: 5,
  volatility: 5,
  drawdown: 5,
  exitLoad: 5,
  overlap: 5,
}

const FACTOR_KEYS = Object.keys(DEFAULT_WEIGHTS) as (keyof ScorecardWeights)[]

function dbWeightsToObject(): Promise<ScorecardWeights | null> {
  return db.scorecardWeights.toArray().then(rows => {
    if (!rows.length) return null
    const result: Record<string, number> = {}
    for (const row of rows) {
      if (row.factor in DEFAULT_WEIGHTS) {
        result[row.factor] = row.weight
      }
    }
    return result as ScorecardWeights
  })
}

export function useScorecardWeights() {
  const weightsFromDb = useLiveQuery(dbWeightsToObject, [], null)
  const [weights, setWeights] = useState<ScorecardWeights>(DEFAULT_WEIGHTS)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (weightsFromDb) {
      setWeights(weightsFromDb)
    }
  }, [weightsFromDb])

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  const updateWeight = useCallback((key: keyof ScorecardWeights, value: number) => {
    setWeights(prev => {
      const next = { ...prev, [key]: value }
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(async () => {
        for (const [k, v] of Object.entries(next)) {
          const existing = await db.scorecardWeights.where('factor').equals(k).first()
          if (existing) {
            await db.scorecardWeights.put({ ...existing, weight: v as number })
          } else {
            await db.scorecardWeights.put({ factor: k, weight: v as number })
          }
        }
      }, 500)
      return next
    })
  }, [])

  const resetToDefaults = useCallback(() => {
    setWeights(DEFAULT_WEIGHTS)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      db.scorecardWeights.clear()
    }, 500)
  }, [])

  const weightSum = Object.values(weights).reduce((a, b) => a + (b ?? 0), 0)

  return { weights, weightSum, updateWeight, resetToDefaults }
}
