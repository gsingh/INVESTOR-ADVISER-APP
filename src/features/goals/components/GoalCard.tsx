import { type Goal } from '@/stores/db'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatINR, formatPercentage, formatDate } from '@/lib/formatters'

interface GoalCardProps {
  goal: Goal
  onClick: () => void
}

const typeLabels: Record<Goal['type'], string> = {
  Emergency: 'Emergency',
  'Medium-Term': 'Medium Term',
  'Long-Term': 'Long Term',
  Custom: 'Custom',
}

export function GoalCard({ goal, onClick }: GoalCardProps) {
  const progress = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0
  const progressPercent = Math.min(progress, 1)

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/50"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <h3 className="text-display-sm font-semibold text-foreground">{goal.name}</h3>
        <Badge variant="secondary" className="rounded-full">
          {typeLabels[goal.type] ?? goal.type}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={progressPercent * 100} className="h-2" />
        <div className="flex items-center justify-between text-body text-muted-foreground">
          <span>
            {formatINR(goal.currentAmount)}
            {' '}/{' '}
            {formatINR(goal.targetAmount)}
          </span>
          <span className="text-label">{formatPercentage(progressPercent)}</span>
        </div>
        <p className="text-small text-muted-foreground">
          Target date: {formatDate(goal.targetDate)}
        </p>
      </CardContent>
    </Card>
  )
}
