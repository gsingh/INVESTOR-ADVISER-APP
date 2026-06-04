import { useNavigate } from '@tanstack/react-router'
import { Target, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useGoals } from '@/features/goals'
import { GoalCard } from '@/features/goals'

export default function Goals() {
  const navigate = useNavigate()
  const { goals, loading } = useGoals()

  if (loading) {
    return (
      <div className="space-y-4 py-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  const activeGoals = goals ?? []

  return (
    <div className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-display font-semibold text-foreground">Goals</h1>
        <Button onClick={() => navigate({ to: '/goals/new' })}>
          <Plus className="mr-2 h-4 w-4" />
          Create Goal
        </Button>
      </div>

      {activeGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Target className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-display-sm font-semibold text-foreground">
            No goals yet
          </h2>
          <p className="mt-2 text-body text-muted-foreground">
            Create your first goal to start tracking your investments.
          </p>
          <Button
            className="mt-6"
            onClick={() => navigate({ to: '/goals/new' })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Goal
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {activeGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onClick={() => {
                if (goal.id == null) return
                navigate({ to: '/goals/$goalId', params: { goalId: String(goal.id) } })
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
