import { useState, useMemo, useEffect, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { db, type Journal } from '@/stores/db'
import { useJournal, filterEntries } from '@/features/journal/hooks/useJournal'
import { JournalEditor } from '@/features/journal/components/JournalEditor'
import { JournalTimeline } from '@/features/journal/components/JournalTimeline'

function getSearchParams(): { goalId?: number; fundName?: string } {
  const params = new URLSearchParams(window.location.search)
  const goalId = params.get('goalId')
  const fundName = params.get('fundName')
  return {
    goalId: goalId ? Number(goalId) : undefined,
    fundName: fundName || undefined,
  }
}

export default function Journal() {
  const { entries, loading, createEntry, updateEntry, deleteEntry } = useJournal()
  const { addToast } = useToast()

  const goals = useLiveQuery(() => db.goals.toArray())
  const reviews = useLiveQuery(() => db.reviews.toArray())

  const [searchQuery, setSearchQuery] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [editingEntry, setEditingEntry] = useState<Journal | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)

  const searchParams = getSearchParams()

  useEffect(() => {
    if (searchParams.fundName || searchParams.goalId) {
      setShowEditor(true)
    }
  }, [searchParams.fundName, searchParams.goalId])

  const filteredEntries = useMemo(() => {
    if (!entries) return []
    let result = entries

    if (searchParams.goalId) {
      result = result.filter((e) => e.goalId === searchParams.goalId)
    }
    if (searchParams.fundName) {
      result = result.filter((e) => e.fundName?.toLowerCase() === searchParams.fundName!.toLowerCase())
    }

    return filterEntries(result, searchQuery)
  }, [entries, searchQuery, searchParams.goalId, searchParams.fundName])

  const handleSave = useCallback(
    async (data: {
      fundName?: string
      goalId?: number
      reviewId?: number
      whyBought: string
      role: string
      exitTrigger: string
      nextReviewDate?: string
      notes: string
    }) => {
      setSubmitting(true)
      try {
        await createEntry(data)
        addToast({ title: 'Entry saved' })
        setShowEditor(false)
        setEditingEntry(undefined)
      } catch {
        addToast({ title: 'Failed to save entry', variant: 'destructive' })
      } finally {
        setSubmitting(false)
      }
    },
    [createEntry, addToast],
  )

  const handleUpdate = useCallback(
    async (data: {
      fundName?: string
      goalId?: number
      reviewId?: number
      whyBought: string
      role: string
      exitTrigger: string
      nextReviewDate?: string
      notes: string
    }) => {
      if (!editingEntry?.id) return
      setSubmitting(true)
      try {
        await updateEntry(editingEntry.id, data)
        addToast({ title: 'Entry updated' })
        setShowEditor(false)
        setEditingEntry(undefined)
      } catch {
        addToast({ title: 'Failed to update entry', variant: 'destructive' })
      } finally {
        setSubmitting(false)
      }
    },
    [editingEntry, updateEntry, addToast],
  )

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteEntry(id)
        addToast({ title: 'Entry deleted' })
      } catch {
        addToast({ title: 'Failed to delete entry', variant: 'destructive' })
      }
    },
    [deleteEntry, addToast],
  )

  const handleEdit = useCallback((entry: Journal) => {
    setEditingEntry(entry)
    setShowEditor(true)
  }, [])

  const handleCancel = useCallback(() => {
    setShowEditor(false)
    setEditingEntry(undefined)
  }, [])

  const goalOptions = useMemo(
    () =>
      (goals ?? []).map((g) => ({
        id: g.id!,
        name: g.name,
      })),
    [goals],
  )

  const reviewOptions = useMemo(
    () =>
      (reviews ?? []).map((r) => ({
        id: r.id!,
        reviewDate: r.reviewDate,
        outcome: r.outcome,
      })),
    [reviews],
  )

  if (loading) {
    return (
      <div className="space-y-6 py-6">
        <div>
          <h2 className="text-display font-semibold text-foreground">Investment Journal</h2>
          <p className="text-body text-muted-foreground">Document your investment decisions.</p>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-display font-semibold text-foreground">Investment Journal</h2>
          <p className="text-body text-muted-foreground">Document your investment decisions.</p>
        </div>
        {!showEditor && (
          <Button onClick={() => setShowEditor(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Write Entry
          </Button>
        )}
      </div>

      {(searchParams.fundName || searchParams.goalId) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtered by:</span>
          {searchParams.fundName && (
            <Badge variant="secondary" className="text-xs">
              Fund: {searchParams.fundName}
            </Badge>
          )}
          {searchParams.goalId && (
            <Badge variant="secondary" className="text-xs">
              Goal ID: {searchParams.goalId}
            </Badge>
          )}
        </div>
      )}

      {showEditor && (
        <JournalEditor
          goals={goalOptions}
          reviews={reviewOptions}
          initialData={
            editingEntry || {
              fundName: searchParams.fundName,
              goalId: searchParams.goalId,
            }
          }
          isSubmitting={submitting}
          onSave={editingEntry ? handleUpdate : handleSave}
          onCancel={handleCancel}
        />
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Search entries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <JournalTimeline
        entries={filteredEntries}
        goals={goals ?? []}
        reviews={reviews ?? []}
        searchQuery={searchQuery}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}
