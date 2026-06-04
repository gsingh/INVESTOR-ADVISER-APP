import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { MoreHorizontal, Pencil, XCircle, Target, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { db } from '@/stores/db'
import { useGoals } from '@/features/goals'
import { GoalForm } from '@/features/goals'
import { formatINR, formatPercentage, formatDate } from '@/lib/formatters'
import { SIPCalculator, CategoryAllocator, AllocationDrift } from '@/features/goals'

const typeLabels: Record<string, string> = {
  Emergency: 'Emergency',
  'Medium-Term': 'Medium Term',
  'Long-Term': 'Long Term',
  Custom: 'Custom',
}

export default function GoalDetail() {
  const { goalId } = useParams({ from: '/goals/$goalId' })
  const navigate = useNavigate()
  const { closeGoal } = useGoals()
  const [showEdit, setShowEdit] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [closing, setClosing] = useState(false)

  const goalIdNum = Number(goalId)

  if (isNaN(goalIdNum)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Target className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-display-sm font-semibold text-foreground">Invalid goal</h2>
        <p className="mt-2 text-body text-muted-foreground">
          The goal identifier provided is not valid.
        </p>
        <Button className="mt-6" onClick={() => navigate({ to: '/goals' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Goals
        </Button>
      </div>
    )
  }

  const goal = useLiveQuery(
    () => db.goals.get(goalIdNum).then(r => r ?? null),
    [goalIdNum],
  )

  if (goal === undefined) {
    return (
      <div className="space-y-4 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    )
  }

  if (goal === null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Target className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-display-sm font-semibold text-foreground">Goal not found</h2>
        <p className="mt-2 text-body text-muted-foreground">
          This goal doesn't exist or has been removed.
        </p>
        <Button className="mt-6" onClick={() => navigate({ to: '/goals' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Goals
        </Button>
      </div>
    )
  }

  const progress = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0
  const progressPercent = Math.min(progress, 1)

  async function handleClose() {
    if (goal.id == null || isNaN(goal.id)) return
    setClosing(true)
    try {
      await closeGoal(goal.id)
      setShowCloseDialog(false)
      navigate({ to: '/goals' })
    } catch {
      setShowCloseDialog(false)
    } finally {
      setClosing(false)
    }
  }

  if (showEdit) {
    return (
      <div className="py-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setShowEdit(false)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <GoalForm
          initialData={goal}
          onSuccess={() => setShowEdit(false)}
        />
      </div>
    )
  }

  return (
    <div className="py-8">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate({ to: '/goals' })}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Goals
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-display-sm font-semibold">
              {goal.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                {typeLabels[goal.type] ?? goal.type}
              </Badge>
              {goal.status === 'closed' && (
                <Badge variant="outline" className="rounded-full text-muted-foreground">
                  Closed
                </Badge>
              )}
            </div>
          </div>

          {goal.status === 'active' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Goal actions">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEdit(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowCloseDialog(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Close Goal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Progress value={progressPercent * 100} className="h-3" />
            <div className="flex items-center justify-between text-body text-muted-foreground">
              <span>
                {formatINR(goal.currentAmount)}
                {' / '}
                {formatINR(goal.targetAmount)}
              </span>
              <span className="text-label">{formatPercentage(progressPercent)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-body">
            <div>
              <p className="text-label text-muted-foreground">Target date</p>
              <p className="text-foreground">{formatDate(goal.targetDate)}</p>
            </div>
            {goal.closedAt && (
              <div>
                <p className="text-label text-muted-foreground">Closed on</p>
                <p className="text-foreground">{formatDate(goal.closedAt)}</p>
              </div>
            )}
          </div>

          <SIPCalculator goalId={goalIdNum} />

          <CategoryAllocator goalId={goalIdNum} />

          <AllocationDrift goalId={goalIdNum} />
        </CardContent>
      </Card>

      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Goal</DialogTitle>
            <DialogDescription>
              Are you sure you want to close "{goal.name}"? The goal will be archived
              but its holdings will remain visible in your portfolio.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCloseDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClose}
              disabled={closing}
            >
              {closing ? 'Closing...' : 'Close Goal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
