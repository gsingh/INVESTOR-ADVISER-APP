import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Goal } from '@/stores/db'

export interface GoalFormData {
  name: string
  type: Goal['type']
  startingAmount: number
  targetAmount: number
  targetDate: string
}

interface UseGoalsReturn {
  goals: Goal[] | undefined
  loading: boolean
  createGoal: (data: GoalFormData) => Promise<number>
  updateGoal: (id: number, data: Partial<GoalFormData>) => Promise<void>
  closeGoal: (id: number) => Promise<void>
}

export function useGoals(): UseGoalsReturn {
  const goals = useLiveQuery(async () => {
    const sorted = await db.goals.where('status').equals('active').sortBy('createdAt')
    return sorted.reverse()
  })

  const createGoal = useCallback(async (data: GoalFormData) => {
    const id = await db.goals.add({
      name: data.name,
      type: data.type,
      targetAmount: data.targetAmount,
      currentAmount: data.startingAmount,
      targetDate: data.targetDate,
      riskProfile: '',
      categoryAllocation: {},
      status: 'active',
      createdAt: new Date().toISOString(),
    })
    return id
  }, [])

  const updateGoal = useCallback(async (id: number, data: Partial<GoalFormData>) => {
    const patch: Partial<Goal> = {}
    if (data.name !== undefined) patch.name = data.name
    if (data.type !== undefined) patch.type = data.type
    if (data.targetAmount !== undefined) patch.targetAmount = data.targetAmount
    if (data.targetDate !== undefined) patch.targetDate = data.targetDate
    if (data.startingAmount !== undefined) patch.currentAmount = data.startingAmount
    await db.goals.update(id, patch)
  }, [])

  const closeGoal = useCallback(async (id: number) => {
    await db.goals.update(id, {
      status: 'closed',
      closedAt: new Date().toISOString(),
    })
  }, [])

  return {
    goals,
    loading: goals === undefined,
    createGoal,
    updateGoal,
    closeGoal,
  }
}
