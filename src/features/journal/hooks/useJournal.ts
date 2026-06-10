import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Journal } from '@/stores/db'

export interface JournalEntryInput {
  fundName?: string
  goalId?: number
  reviewId?: number
  whyBought: string
  role: string
  exitTrigger: string
  nextReviewDate?: string
  notes: string
}

export function filterEntries(entries: Journal[], query: string): Journal[] {
  if (!query.trim()) return entries
  const q = query.toLowerCase()
  return entries.filter(
    (e) =>
      e.fundName?.toLowerCase().includes(q) ||
      e.whyBought?.toLowerCase().includes(q) ||
      e.role?.toLowerCase().includes(q) ||
      e.exitTrigger?.toLowerCase().includes(q) ||
      e.notes?.toLowerCase().includes(q),
  )
}

export function validateEntry(data: JournalEntryInput): string | null {
  if (data.goalId != null && data.goalId <= 0) {
    return 'Invalid goal selected.'
  }
  if (!data.fundName && !data.goalId && !data.reviewId) {
    return 'At least one of Fund, Goal, or Review must be tagged.'
  }
  return null
}

interface UseJournalReturn {
  entries: Journal[] | undefined
  loading: boolean
  createEntry: (data: JournalEntryInput) => Promise<number>
  updateEntry: (id: number, data: Partial<JournalEntryInput>) => Promise<void>
  deleteEntry: (id: number) => Promise<void>
}

export function useJournal(): UseJournalReturn {
  const entries = useLiveQuery(async () => {
    const all = await db.journals.orderBy('createdAt').toArray()
    return all.reverse()
  })

  const createEntry = useCallback(async (data: JournalEntryInput) => {
    const id = await db.journals.add({
      fundName: data.fundName,
      goalId: data.goalId,
      reviewId: data.reviewId,
      whyBought: data.whyBought,
      role: data.role,
      exitTrigger: data.exitTrigger,
      nextReviewDate: data.nextReviewDate,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    })
    return id
  }, [])

  const updateEntry = useCallback(async (id: number, data: Partial<JournalEntryInput>) => {
    const patch: Partial<Journal> = {}
    if (data.fundName !== undefined) patch.fundName = data.fundName
    if (data.goalId !== undefined) patch.goalId = data.goalId
    if (data.reviewId !== undefined) patch.reviewId = data.reviewId
    if (data.whyBought !== undefined) patch.whyBought = data.whyBought
    if (data.role !== undefined) patch.role = data.role
    if (data.exitTrigger !== undefined) patch.exitTrigger = data.exitTrigger
    if (data.nextReviewDate !== undefined) patch.nextReviewDate = data.nextReviewDate
    if (data.notes !== undefined) patch.notes = data.notes
    await db.journals.update(id, patch)
  }, [])

  const deleteEntry = useCallback(async (id: number) => {
    await db.journals.delete(id)
  }, [])

  return {
    entries,
    loading: entries === undefined,
    createEntry,
    updateEntry,
    deleteEntry,
  }
}
