import type { DriftResult, DriftStatus } from '@/lib/drift-calculator'
import { Badge } from '@/components/ui/badge'

interface DriftPillProps {
  drift: DriftResult
  size?: 'sm' | 'md'
}

const sizeClasses: Record<string, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
}

const colorClasses: Record<DriftStatus, string> = {
  on_track: 'bg-green-500 hover:bg-green-500 text-white',
  watch: 'bg-amber-500 hover:bg-amber-500 text-white',
  review: 'bg-red-500 hover:bg-red-500 text-white',
}

export function DriftPill({ drift, size = 'md' }: DriftPillProps) {
  const colorClass = colorClasses[drift.status] ?? 'bg-gray-500 text-white'
  const sizeClass = sizeClasses[size] ?? sizeClasses.md
  return (
    <Badge className={`rounded-full ${colorClass} ${sizeClass}`}>
      {drift.label}
    </Badge>
  )
}
