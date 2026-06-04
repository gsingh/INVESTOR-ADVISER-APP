import { TermInfo } from '@/components/features/TermInfo'
import type { OverlapResult } from '@/lib/overlap'

interface OverlapIndicatorProps {
  overlap: OverlapResult | null
  isLoading: boolean
}

export function OverlapIndicator({ overlap, isLoading }: OverlapIndicatorProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border p-4">
        <div className="mb-2 h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-6 w-full animate-pulse rounded-full bg-muted" />
      </div>
    )
  }

  if (!overlap) {
    return (
      <div className="rounded-lg border p-4">
        <h4 className="mb-2 text-label font-medium">Overlap with Portfolio <TermInfo slug="overlap" /></h4>
        <p className="text-small text-muted-foreground">Overlap data unavailable for this fund.</p>
      </div>
    )
  }

  const noHoldings = overlap.isEmptyPortfolio

  if (!noHoldings && overlap.newExposurePct === 0 && overlap.overlapPct === 0 && !overlap.explanations.length) {
    return (
      <div className="rounded-lg border p-4">
        <h4 className="mb-2 text-label font-medium">Overlap with Portfolio <TermInfo slug="overlap" /></h4>
        <p className="text-small text-muted-foreground">Overlap data unavailable for this fund.</p>
      </div>
    )
  }

  if (noHoldings) {
    return (
      <div className="rounded-lg border p-4">
        <h4 className="mb-2 text-label font-medium">Overlap with Portfolio <TermInfo slug="overlap" /></h4>
        <p className="text-small text-muted-foreground">
          No existing holdings to compare against. Add holdings to see overlap analysis.
        </p>
      </div>
    )
  }

  const total = overlap.newExposurePct + overlap.overlapPct
  const newPct = total > 0 ? (overlap.newExposurePct / total) * 100 : 0
  const overlapBarPct = total > 0 ? (overlap.overlapPct / total) * 100 : 0

  return (
    <div className="rounded-lg border p-4">
      <h4 className="mb-3 text-label font-medium">Overlap with Portfolio <TermInfo slug="overlap" /></h4>
      <div className="relative h-8 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="absolute left-0 top-0 h-full bg-green-500 transition-all"
          style={{ width: `${newPct}%` }}
        />
        <div
          className="absolute top-0 h-full bg-gray-400 transition-all"
          style={{ left: `${newPct}%`, width: `${overlapBarPct}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="rounded bg-white/80 px-2 py-0.5 text-mono text-small font-medium tabular-nums">
            {overlap.newExposurePct.toFixed(1)}% new / {overlap.overlapPct.toFixed(1)}% overlap
          </span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-4 text-small text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500" />
          New exposure ({overlap.newExposurePct.toFixed(1)}%)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gray-400" />
          Overlap ({overlap.overlapPct.toFixed(1)}%)
        </span>
      </div>
      {overlap.explanations.length > 0 && (
        <div className="mt-2 space-y-1">
          {overlap.explanations.map((exp, i) => (
            <p key={i} className="text-small text-muted-foreground">{exp}</p>
          ))}
        </div>
      )}
    </div>
  )
}
