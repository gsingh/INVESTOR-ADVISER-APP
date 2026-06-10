import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { Loader2, ArrowLeftRight, GitCompare } from 'lucide-react'
import { FactorBreakdown } from './FactorBreakdown'
import { PeerPicker } from '@/features/compare/components/PeerPicker'
import type { ScoredFund, EnrichedScoreResult } from '../hooks/useScoredFunds'
import type { ScoringContext } from '@/types/scorecard'
import type { ComputeScoreResult } from '@/types/scorecard'

interface ScoredFundTableProps {
  scoredFunds: ScoredFund[]
  isLoading: boolean
  error: Error | null
  onRetry: () => void
  enrichFund: (schemeCode: string, context?: ScoringContext) => Promise<EnrichedScoreResult | null>
  isEnriching: (schemeCode: string) => boolean
  enrichedScores: Record<string, EnrichedScoreResult>
}

export function ScoredFundTable({ scoredFunds, isLoading, error, onRetry, enrichFund, isEnriching, enrichedScores }: ScoredFundTableProps) {
  const navigate = useNavigate()
  const [expandedCode, setExpandedCode] = useState<string | null>(null)
  const [peerPickerFund, setPeerPickerFund] = useState<ScoredFund | null>(null)
  const { addToast } = useToast()
  const toastedErrorRef = useRef<string | null>(null)
  const enrichedTriggeredRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (error && error.message !== toastedErrorRef.current) {
      toastedErrorRef.current = error.message
      addToast({ title: 'Couldn\'t fetch fund data. Try again later.', variant: 'destructive' })
    }
    if (!error) {
      toastedErrorRef.current = null
    }
  }, [addToast, error])

  const toggleExpand = useCallback((code: string) => {
    setExpandedCode(prev => prev === code ? null : code)
  }, [])

  useEffect(() => {
    if (expandedCode && !enrichedTriggeredRef.current.has(expandedCode) && !isEnriching(expandedCode)) {
      enrichedTriggeredRef.current.add(expandedCode)
      enrichFund(expandedCode)
    }
  }, [expandedCode, enrichFund, isEnriching])

  const handleRowKeyDown = useCallback((code: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleExpand(code)
    }
  }, [toggleExpand])

  if (error) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-body text-muted-foreground">Couldn't fetch fund data. Try again later.</p>
        <button
          onClick={onRetry}
          className="mt-3 rounded-md bg-primary px-4 py-2 text-small text-primary-foreground hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border p-3">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    )
  }

  if (!scoredFunds.length) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-body text-muted-foreground">No funds match your criteria.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-1.5">
        <span className="text-small text-muted-foreground">
          {scoredFunds.length} fund{scoredFunds.length !== 1 ? 's' : ''} scored
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ to: '/scorecard/compare' })}
          className="h-7 text-xs"
        >
          <ArrowLeftRight className="mr-1 h-3.5 w-3.5" />
          Compare Funds
        </Button>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-small text-muted-foreground">
            <th className="w-10 px-3 py-2 font-medium">#</th>
            <th className="px-3 py-2 font-medium">Fund Name</th>
            <th className="w-24 px-3 py-2 font-medium">Category</th>
            <th className="w-20 px-3 py-2 text-right font-medium">Score</th>
            <th className="w-16 px-3 py-2 text-center font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {scoredFunds.map((item, i) => (
            <tr
              key={item.fund.schemeCode}
              tabIndex={0}
              role="button"
              className={`cursor-pointer border-b last:border-0 hover:bg-muted/20 ${i % 2 === 1 ? 'bg-muted/10' : ''}`}
              onClick={() => toggleExpand(item.fund.schemeCode)}
              onKeyDown={e => handleRowKeyDown(item.fund.schemeCode, e)}
            >
              <td className="px-3 py-2.5 text-small text-muted-foreground">{i + 1}</td>
              <td className="px-3 py-2.5">
                <span className="text-body font-medium">{item.fund.schemeName}</span>
              </td>
              <td className="px-3 py-2.5">
                <Badge variant="outline" className="text-small">
                  {item.fund.subCategory || item.fund.category || '—'}
                </Badge>
              </td>
              <td className="px-3 py-2.5 text-right">
                <span className="text-mono text-display-sm font-bold tabular-nums">
                  {item.score.compositeScore.toFixed(1)}
                </span>
                {enrichedScores[item.fund.schemeCode] && (
                  <span className="ml-1 text-small text-green-600" title="Enriched score available">
                    &#9679;
                  </span>
                )}
                {isEnriching(item.fund.schemeCode) && (
                  <Loader2 className="ml-1 inline-block h-3 w-3 animate-spin text-muted-foreground" />
                )}
              </td>
              <td className="px-3 py-2.5 text-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPeerPickerFund(item)
                  }}
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  title="Compare with category peers"
                >
                  <GitCompare className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {scoredFunds.map(item => {
        if (expandedCode !== item.fund.schemeCode) return null
        const enriched = enrichedScores[item.fund.schemeCode]
        const isBusy = isEnriching(item.fund.schemeCode)
        const displayScore: ComputeScoreResult = enriched?.enrichedScore ?? item.score
        const isEnriched = !!enriched

        return (
          <div key={item.fund.schemeCode}>
            <FactorBreakdown
              factors={displayScore.factors}
              open={true}
              onToggle={() => setExpandedCode(null)}
              isLoading={isBusy && !isEnriched}
              isEnriched={isEnriched}
            />
          </div>
        )
      })}

      {peerPickerFund && (
        <PeerPicker
          sourceFund={peerPickerFund.fund}
          open={true}
          onOpenChange={(open) => {
            if (!open) setPeerPickerFund(null)
          }}
        />
      )}
    </div>
  )
}
