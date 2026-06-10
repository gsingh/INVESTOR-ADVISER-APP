import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/stores/db'
import { addMonths } from '@/lib/date-utils'

export function useReviewSettings() {
  const count = useLiveQuery(() => db.reviewSettings.count())
  const settings = useLiveQuery(() => db.reviewSettings.limit(1).first())

  const frequency = settings?.frequency ?? null
  const nextReviewDate = settings?.nextReviewDate ?? null
  const loading = count === undefined

  const setFrequency = useCallback(
    async (freq: 'monthly' | 'quarterly') => {
      const now = new Date()
      const next = addMonths(now, freq === 'monthly' ? 1 : 3)
      await db.reviewSettings.put({
        id: settings?.id ?? 1,
        frequency: freq,
        nextReviewDate: next.toISOString().split('T')[0],
        updatedAt: now.toISOString(),
      })
    },
    [settings?.id],
  )

  return { frequency, nextReviewDate, setFrequency, loading }
}
