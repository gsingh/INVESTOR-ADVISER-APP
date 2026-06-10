import { useCallback, useState } from 'react'
import { db } from '@/stores/db'
import { addMonths } from '@/lib/date-utils'
import type { ReviewStep, Review } from '@/stores/db'

export function useReviewSubmit() {
  const [submitting, setSubmitting] = useState(false)

  const submit = useCallback(
    async (outcome: 'aligned' | 'action_taken', rationale: string, steps: ReviewStep[]) => {
      setSubmitting(true)
      try {
        const now = new Date().toISOString()
        const review: Review = {
          reviewDate: now.split('T')[0],
          outcome,
          rationale,
          steps,
          createdAt: now,
        }

        await db.transaction('rw', db.reviews, db.reviewSettings, async () => {
          await db.reviews.add(review)

          const settings = await db.reviewSettings.limit(1).first()
          if (settings?.frequency) {
            const next = addMonths(
              new Date(),
              settings.frequency === 'monthly' ? 1 : 3,
            )
            await db.reviewSettings.put({
              id: settings.id ?? 1,
              frequency: settings.frequency,
              nextReviewDate: next.toISOString().split('T')[0],
              updatedAt: now,
            })
          }
        })
      } finally {
        setSubmitting(false)
      }
    },
    [],
  )

  return { submit, submitting }
}
