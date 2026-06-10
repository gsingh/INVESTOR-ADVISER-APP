import { useState, type FormEvent } from 'react'
import { Calendar, Flag, Target, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { validateEntry } from '../hooks/useJournal'
import type { Journal } from '@/stores/db'

interface JournalEditorProps {
  goals: Array<{ id: number; name: string }>
  reviews: Array<{ id: number; reviewDate: string; outcome: string }>
  initialData?: Partial<Journal>
  isSubmitting?: boolean
  onSave: (data: {
    fundName?: string
    goalId?: number
    reviewId?: number
    whyBought: string
    role: string
    exitTrigger: string
    nextReviewDate?: string
    notes: string
  }) => void
  onCancel?: () => void
}

const textareaClasses =
  'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

export function JournalEditor({ goals, reviews, initialData, isSubmitting, onSave, onCancel }: JournalEditorProps) {
  const [fundName, setFundName] = useState(initialData?.fundName ?? '')
  const [goalId, setGoalId] = useState<number | undefined>(initialData?.goalId)
  const [reviewId, setReviewId] = useState<number | undefined>(initialData?.reviewId)
  const [whyBought, setWhyBought] = useState(initialData?.whyBought ?? '')
  const [role, setRole] = useState(initialData?.role ?? '')
  const [exitTrigger, setExitTrigger] = useState(initialData?.exitTrigger ?? '')
  const [nextReviewDate, setNextReviewDate] = useState(initialData?.nextReviewDate ?? '')
  const [notes, setNotes] = useState(initialData?.notes ?? '')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const data = {
      fundName: fundName.trim() || undefined,
      goalId: goalId && goalId > 0 ? goalId : undefined,
      reviewId: reviewId && reviewId > 0 ? reviewId : undefined,
      whyBought: whyBought.trim(),
      role: role.trim(),
      exitTrigger: exitTrigger.trim(),
      nextReviewDate: nextReviewDate || undefined,
      notes: notes.trim(),
    }

    const validationError = validateEntry(data)
    if (validationError) {
      setError(validationError)
      return
    }

    onSave(data)
  }

  function reset() {
    setFundName('')
    setGoalId(undefined)
    setReviewId(undefined)
    setWhyBought('')
    setRole('')
    setExitTrigger('')
    setNextReviewDate('')
    setNotes('')
    setError(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{initialData ? 'Edit Entry' : 'Write Journal Entry'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="fundName" className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" /> Fund Name
              </Label>
              <Input
                id="fundName"
                value={fundName}
                onChange={(e) => setFundName(e.target.value)}
                placeholder="e.g., HDFC Top 100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal" className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5" /> Goal
              </Label>
              <Select
                value={goalId ? String(goalId) : '__none__'}
                onValueChange={(v) => setGoalId(v === '__none__' ? undefined : Number(v))}
              >
                <SelectTrigger id="goal">
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {goals.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="review" className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Review
              </Label>
              <Select
                value={reviewId ? String(reviewId) : '__none__'}
                onValueChange={(v) => setReviewId(v === '__none__' ? undefined : Number(v))}
              >
                <SelectTrigger id="review">
                  <SelectValue placeholder="Link to review" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {reviews.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.reviewDate} — {r.outcome === 'aligned' ? 'Aligned' : 'Action taken'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whyBought">Why bought</Label>
            <textarea
              id="whyBought"
              className={textareaClasses}
              value={whyBought}
              onChange={(e) => setWhyBought(e.target.value)}
              placeholder="What made you invest in this fund?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">What role it plays</Label>
            <textarea
              id="role"
              className={textareaClasses}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="E.g., Core equity holding, satellite bet, debt anchor"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exitTrigger" className="flex items-center gap-1">
              <Flag className="h-3.5 w-3.5" /> What would trigger exit
            </Label>
            <textarea
              id="exitTrigger"
              className={textareaClasses}
              value={exitTrigger}
              onChange={(e) => setExitTrigger(e.target.value)}
              placeholder="Under what conditions would you sell this fund?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextReviewDate" className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Next review date
            </Label>
            <Input
              id="nextReviewDate"
              type="date"
              value={nextReviewDate}
              onChange={(e) => setNextReviewDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              className={textareaClasses}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional thoughts, observations, or context..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : initialData ? 'Update Entry' : 'Save Entry'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            {!initialData && (
              <Button type="button" variant="ghost" onClick={reset}>
                Reset
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
