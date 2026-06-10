import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type RiskProfile } from '@/stores/db'

export interface Answer {
  question: string
  label: string
  value: number
}

export function computeRiskProfile(answers: Answer[]): 'Conservative' | 'Moderate' | 'Aggressive' {
  const total = answers.reduce((sum, a) => sum + a.value, 0)
  if (total <= 7) return 'Conservative'
  if (total <= 12) return 'Moderate'
  return 'Aggressive'
}

export function categoryMapping(profile: 'Conservative' | 'Moderate' | 'Aggressive'): string[] {
  switch (profile) {
    case 'Conservative':
      return ['Debt Funds', 'Liquid Funds', 'Overnight Funds']
    case 'Moderate':
      return ['Aggressive Hybrid', 'Large Cap', 'Balanced Advantage']
    case 'Aggressive':
      return ['Flexi Cap', 'Mid Cap', 'Small Cap', 'Sectoral / Thematic']
    default:
      return []
  }
}

interface UseProfileReturn {
  profile: RiskProfile | undefined
  loading: boolean
  saveProfile: (answers: Answer[], monthlyCapacity: number, timeHorizon: number) => Promise<void>
  retakeProfile: () => Promise<void>
}

export function useProfile(): UseProfileReturn {
  const profile = useLiveQuery(() => db.riskProfiles.orderBy('id').last())
  const count = useLiveQuery(() => db.riskProfiles.count())

  const saveProfile = useCallback(async (answers: Answer[], monthlyCapacity: number, timeHorizon: number) => {
    const result = computeRiskProfile(answers)
    await db.riskProfiles.add({
      profile: result,
      answers: Object.fromEntries(answers.map(a => [a.question, a.value])),
      monthlyCapacity,
      timeHorizon,
      createdAt: new Date().toISOString(),
    })
  }, [])

  const retakeProfile = useCallback(async () => {
    await db.riskProfiles.clear()
  }, [])

  return {
    profile,
    loading: count === undefined,
    saveProfile,
    retakeProfile,
  }
}
