import { useState } from 'react'
import { Calendar, FileText, Flag, Target, Pencil, Trash2, BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Journal, Goal, Review } from '@/stores/db'

interface JournalTimelineProps {
  entries: Journal[]
  goals: Goal[]
  reviews: Review[]
  searchQuery: string
  onEdit: (entry: Journal) => void
  onDelete: (id: number) => void
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(iso))
}

export function JournalTimeline({ entries, goals, reviews, searchQuery, onEdit, onDelete }: JournalTimelineProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [submittingDelete, setSubmittingDelete] = useState(false)

  const handleDeleteConfirm = async () => {
    if (deletingId == null) return
    setSubmittingDelete(true)
    try {
      await onDelete(deletingId)
    } finally {
      setSubmittingDelete(false)
      setDeletingId(null)
    }
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BookOpen className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-body text-muted-foreground">
          {searchQuery
            ? 'No entries match your search.'
            : 'No journal entries yet. Start by writing your first investment decision note.'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {entries.map((entry) => {
          const goal = goals.find((g) => g.id === entry.goalId)
          const review = reviews.find((r) => r.id === entry.reviewId)

          return (
            <Card key={entry.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <Calendar className="h-3 w-3" />
                      {formatDate(entry.createdAt)}
                    </Badge>
                    {entry.fundName && (
                      <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                        <FileText className="h-3 w-3" />
                        {entry.fundName}
                      </Badge>
                    )}
                    {goal && (
                      <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                        <Target className="h-3 w-3" />
                        {goal.name}
                      </Badge>
                    )}
                    {review && (
                      <Badge variant="outline" className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        Linked to review on {formatDate(review.reviewDate)} —{' '}
                        {review.outcome === 'aligned' ? 'Aligned' : 'Action taken'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(entry)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      disabled={deletingId === entry.id}
                      onClick={() => setDeletingId(entry.id ?? null)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {entry.whyBought && (
                  <div>
                    <span className="font-medium text-muted-foreground">Why bought:</span>{' '}
                    <span>{entry.whyBought}</span>
                  </div>
                )}
                {entry.role && (
                  <div>
                    <span className="font-medium text-muted-foreground">Role:</span>{' '}
                    <span>{entry.role}</span>
                  </div>
                )}
                {entry.exitTrigger && (
                  <div className="flex items-start gap-1">
                    <Flag className="mt-0.5 h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div>
                      <span className="font-medium text-muted-foreground">Exit trigger:</span>{' '}
                      <span>{entry.exitTrigger}</span>
                    </div>
                  </div>
                )}
                {entry.nextReviewDate && (
                  <div>
                    <span className="font-medium text-muted-foreground">Next review:</span>{' '}
                    <span>{formatDate(entry.nextReviewDate)}</span>
                  </div>
                )}
                {entry.notes && (
                  <div className="rounded-md border bg-muted/30 px-3 py-2 text-muted-foreground">
                    {entry.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={deletingId != null} onOpenChange={(open) => { if (!open) setDeletingId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Journal Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)} disabled={submittingDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={submittingDelete}>
              {submittingDelete ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
