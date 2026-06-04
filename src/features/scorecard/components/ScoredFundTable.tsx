import { useCallback, useEffect, useRef, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { FactorBreakdown } from './FactorBreakdown'
import type { ScoredFund } from '../hooks/useScoredFunds'

interface ScoredFundTableProps {
  scoredFunds: ScoredFund[]
  isLoading: boolean
  error: Error | null
  onRetry: () => void
}

export function ScoredFundTable({ scoredFunds, isLoading, error, onRetry }: ScoredFundTableProps) {
  const [expandedCode, setExpandedCode] = useState<string | null>(null)
  const { addToast } = useToast()
  const toastedErrorRef = useRef<string | null>(null)

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
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-small text-muted-foreground">
            <th className="w-10 px-3 py-2 font-medium">#</th>
            <th className="px-3 py-2 font-medium">Fund Name</th>
            <th className="w-24 px-3 py-2 font-medium">Category</th>
            <th className="w-20 px-3 py-2 text-right font-medium">Score</th>
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {scoredFunds.map(item => {
        if (expandedCode !== item.fund.schemeCode) return null
        return (
          <div key={item.fund.schemeCode}>
            <FactorBreakdown
              factors={item.score.factors}
              open={true}
              onToggle={() => setExpandedCode(null)}
            />
          </div>
        )
      })}
    </div>
  )
}
