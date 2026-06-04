import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useRef } from 'react'
import { db, type Goal } from '@/stores/db'
import type { AmfiSuperCategory } from '@/lib/category-taxonomy'
import { categoryTaxonomy } from '@/lib/category-taxonomy'

export interface CategoryRecommendation {
  category: string
  allocation: number
  termSlug: string
  isOverride: boolean
  originalCategory: string | null
}

interface RiskProfileRow {
  profile: 'Conservative' | 'Moderate' | 'Aggressive'
  timeHorizon: number
}

const mappingTable: Record<string, { superCategory: AmfiSuperCategory; allocation: number; termSlug: string }[]> = {
  'Conservative_<3': [
    { superCategory: 'Liquid', allocation: 1.0, termSlug: 'liquid-funds' },
  ],
  'Conservative_3-7': [
    { superCategory: 'Debt', allocation: 0.7, termSlug: 'debt-funds' },
    { superCategory: 'Liquid', allocation: 0.3, termSlug: 'liquid-funds' },
  ],
  'Conservative_>7': [
    { superCategory: 'Debt', allocation: 0.6, termSlug: 'debt-funds' },
    { superCategory: 'Hybrid', allocation: 0.4, termSlug: 'hybrid-funds' },
  ],
  'Moderate_<3': [
    { superCategory: 'Debt', allocation: 0.7, termSlug: 'debt-funds' },
    { superCategory: 'Liquid', allocation: 0.3, termSlug: 'liquid-funds' },
  ],
  'Moderate_3-7': [
    { superCategory: 'Hybrid', allocation: 0.5, termSlug: 'hybrid-funds' },
    { superCategory: 'Debt', allocation: 0.3, termSlug: 'debt-funds' },
    { superCategory: 'Liquid', allocation: 0.2, termSlug: 'liquid-funds' },
  ],
  'Moderate_>7': [
    { superCategory: 'Equity', allocation: 0.6, termSlug: 'equity-funds' },
    { superCategory: 'Hybrid', allocation: 0.3, termSlug: 'hybrid-funds' },
    { superCategory: 'Debt', allocation: 0.1, termSlug: 'debt-funds' },
  ],
  'Aggressive_<3': [
    { superCategory: 'Hybrid', allocation: 0.6, termSlug: 'hybrid-funds' },
    { superCategory: 'Debt', allocation: 0.4, termSlug: 'debt-funds' },
  ],
  'Aggressive_3-7': [
    { superCategory: 'Equity', allocation: 0.6, termSlug: 'equity-funds' },
    { superCategory: 'Hybrid', allocation: 0.3, termSlug: 'hybrid-funds' },
    { superCategory: 'Debt', allocation: 0.1, termSlug: 'debt-funds' },
  ],
  'Aggressive_>7': [
    { superCategory: 'Equity', allocation: 0.8, termSlug: 'equity-funds' },
    { superCategory: 'Hybrid', allocation: 0.2, termSlug: 'hybrid-funds' },
  ],
}

function getTimeHorizonBucket(years: number): string {
  if (years < 3) return '<3'
  if (years <= 7) return '3-7'
  return '>7'
}

function getDefaultSubCategory(superCategory: AmfiSuperCategory): string {
  const node = categoryTaxonomy.find(n => n.superCategory === superCategory)
  if (!node) return superCategory
  return node.subCategories[0]
}

function resolveCategory(input: string): string {
  const node = categoryTaxonomy.find(n => n.superCategory === input)
  if (node) return node.subCategories[0] ?? input
  return input
}

export function useCategoryMapping(goalId: number) {
  const goal = useLiveQuery(
    () => db.goals.get(goalId).then(r => r ?? null),
    [goalId],
  )
  const riskProfile = useLiveQuery(
    () => db.riskProfiles.orderBy('id').last() as Promise<RiskProfileRow | undefined>,
    [],
  )

  const loading = goal === undefined || riskProfile === undefined

  let error: string | null = null
  let recommendations: CategoryRecommendation[] = []

  if (!loading) {
    if (!goal) {
      error = 'Goal not found.'
    } else if (!riskProfile) {
      error = 'no_profile'
    } else if (goal.targetDate) {
      const targetDate = new Date(goal.targetDate)
      if (!isNaN(targetDate.getTime())) {
        const timeHorizonYears = Math.max(0, (targetDate.getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000))
        const bucket = getTimeHorizonBucket(timeHorizonYears)
        const key = `${riskProfile.profile}_${bucket}`
        const rows = mappingTable[key] ?? []

        const savedAllocation = goal.categoryAllocation as Record<string, number> | undefined

        recommendations = rows.map(row => {
          const displayCat = getDefaultSubCategory(row.superCategory)

          if (savedAllocation && savedAllocation[displayCat] !== undefined) {
            return {
              category: displayCat,
              allocation: savedAllocation[displayCat],
              termSlug: row.termSlug,
              isOverride: true,
              originalCategory: displayCat,
            }
          }

          return {
            category: displayCat,
            allocation: row.allocation,
            termSlug: row.termSlug,
            isOverride: false,
            originalCategory: null,
          }
        })
      }
    }
  }

  const recommendationsRef = useRef(recommendations)
  recommendationsRef.current = recommendations

  const saveOverride = useCallback(async (originalCategory: string, newCategory: string) => {
    if (!goal?.id) return
    const savedGoal = await db.goals.get(goal.id)
    if (!savedGoal) return
    const resolvedCategory = resolveCategory(newCategory)
    if (resolvedCategory === originalCategory) return
    const current = { ...((savedGoal.categoryAllocation ?? {}) as Record<string, number>) }
    const alloc = current[resolvedCategory] ?? recommendationsRef.current.find(r => r.category === originalCategory)?.allocation ?? 0
    delete current[originalCategory]
    current[resolvedCategory] = alloc
    await db.goals.update(goal.id, { categoryAllocation: current })
  }, [goal])

  return { recommendations, loading, error, saveOverride } as const
}
