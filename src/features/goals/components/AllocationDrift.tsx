import { useDriftTracking } from '../hooks/useDriftTracking'
import { DriftPill } from './DriftPill'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { TermInfo } from '@/components/features/TermInfo'
import { formatINR, formatPercentage } from '@/lib/formatters'

interface AllocationDriftProps {
  goalId: number
}

export function AllocationDrift({ goalId }: AllocationDriftProps) {
  const { holdings, loading, error } = useDriftTracking(goalId)

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-body text-destructive">{error}</p>
    )
  }

  if (holdings.length === 0) {
    return (
      <p className="text-body text-muted-foreground">
        No funds allocated to this goal yet. Browse the fund universe to find suitable funds.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="divide-y rounded-lg border">
        {holdings.map(h => (
          <div
            key={h.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-body font-medium text-foreground">
                {h.fundName}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-full text-xs">
                  {h.amfiCategory}
                </Badge>
                <span className="text-small text-muted-foreground">
                  {formatINR(h.currentValue)}
                </span>
              </div>
              <p className="text-small text-muted-foreground">
                <TermInfo slug="allocation" inline />
                {' Actual '}{formatPercentage(h.actualPct)}
                {' '}
                &middot; Target {formatPercentage(h.targetPct)}
              </p>
            </div>
            <DriftPill drift={h.drift} size="sm" />
          </div>
        ))}
      </div>
    </div>
  )
}
