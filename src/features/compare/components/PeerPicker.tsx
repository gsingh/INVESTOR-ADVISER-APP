import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useFundList } from '@/stores/queries/useFunds'
import { computeScore } from '@/lib/scorecard'
import { toScorableFund } from '@/features/compare/hooks/useComparison'
import type { MFFund } from '@/types/api'

interface PeerPickerProps {
  sourceFund: MFFund
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PeerPicker({ sourceFund, open, onOpenChange }: PeerPickerProps) {
  const navigate = useNavigate()
  const { data: allFunds, isLoading } = useFundList({})
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const peers = useMemo(() => {
    if (!allFunds) return []
    const sourceCat = (sourceFund.subCategory || sourceFund.category || '').toLowerCase()
    const sourcePlan = (sourceFund.plan || '').toLowerCase()

    return allFunds
      .filter((f) => {
        if (f.schemeCode === sourceFund.schemeCode) return false
        const fCat = (f.subCategory || f.category || '').toLowerCase()
        const fPlan = (f.plan || '').toLowerCase()
        return fCat === sourceCat && fPlan === sourcePlan
      })
      .map((f) => ({
        fund: f,
        score: computeScore(toScorableFund(f)),
      }))
      .sort((a, b) => b.score.compositeScore - a.score.compositeScore)
      .slice(0, 20)
  }, [allFunds, sourceFund])

  const togglePeer = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
      } else {
        if (next.size >= 3) return prev
        next.add(code)
      }
      return next
    })
  }

  const handleCompare = () => {
    const codes = [sourceFund.schemeCode, ...selected].join(',')
    onOpenChange(false)
    setSelected(new Set())
    navigate({ to: '/scorecard/compare', search: { codes } })
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) setSelected(new Set())
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Compare with category peers</DialogTitle>
          <DialogDescription>
            Select up to 3 funds in the same peer group as{' '}
            <span className="font-medium text-foreground">
              {sourceFund.schemeName?.split('-')[0]?.trim() || sourceFund.schemeName}
            </span>
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Loading funds...
          </div>
        )}

        {!isLoading && peers.length === 0 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No peers found in{' '}
            <span className="font-medium">
              {sourceFund.subCategory || sourceFund.category || '—'}
            </span>{' '}
            · {sourceFund.plan || '—'}
          </div>
        )}

        {!isLoading && peers.length > 0 && (
          <div className="max-h-[320px] space-y-1 overflow-y-auto">
            {peers.map(({ fund, score }) => {
              const isSelected = selected.has(fund.schemeCode)
              return (
                <button
                  key={fund.schemeCode}
                  type="button"
                  onClick={() => togglePeer(fund.schemeCode)}
                  className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                    isSelected ? 'bg-accent ring-1 ring-primary' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input'
                      }`}
                    >
                      {isSelected && (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{fund.schemeName}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {fund.amc} · Score: {score.compositeScore.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="ml-2 shrink-0 text-[10px] px-1.5 py-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  >
                    {score.compositeScore.toFixed(0)}
                  </Badge>
                </button>
              )
            })}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">
            {selected.size} of 3 peers selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCompare} disabled={selected.size === 0}>
              Compare {selected.size > 0 ? `(${selected.size + 1} funds)` : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
