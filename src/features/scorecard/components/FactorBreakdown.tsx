import { ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react'
import { TermInfo } from '@/components/features/TermInfo'
import type { ScoringFactor } from '@/types/scorecard'

const FACTOR_SLUGS: Record<string, string> = {
  consistency: 'rolling-returns',
  cost: 'expense-ratio',
  categoryFit: 'amfi-category',
  benchmarkSuitability: 'benchmark',
  fundAge: 'nav',
  aumSanity: 'aum',
  volatility: 'nav',
  drawdown: 'nav',
  exitLoad: 'exit-load',
  overlap: 'nav',
  sharpeRatio: 'nav',
  sortinoRatio: 'nav',
  alpha: 'nav',
  beta: 'nav',
  rSquared: 'nav',
  informationRatio: 'nav',
  upCapture: 'nav',
  downCapture: 'nav',
  trailing1YReturn: 'nav',
  trailing3YReturn: 'nav',
  trailing5YReturn: 'nav',
  sinceInceptionReturn: 'nav',
  yearwiseConsistency: 'nav',
}

function contributionColor(value: number): string {
  if (value >= 12) return 'bg-green-500'
  if (value >= 6) return 'bg-amber-400'
  return 'bg-red-400'
}

function contributionBg(value: number): string {
  if (value >= 12) return 'bg-green-50'
  if (value >= 6) return 'bg-amber-50'
  return 'bg-red-50'
}

function scoreColor(value: number): string {
  if (value >= 12) return 'text-green-700'
  if (value >= 6) return 'text-amber-700'
  return 'text-red-700'
}

const MAX_CONTRIBUTION_BAR = 20

interface FactorBreakdownProps {
  factors: ScoringFactor[]
  open: boolean
  onToggle: () => void
  isLoading?: boolean
  isEnriched?: boolean
}

export function FactorBreakdown({ factors, open, onToggle, isLoading, isEnriched }: FactorBreakdownProps) {
  return (
    <div className="border-t">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-2 text-small text-muted-foreground hover:text-foreground"
      >
        <span className="flex items-center gap-2">
          Factor Breakdown
          {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
          {isEnriched && <Sparkles className="h-3 w-3 text-green-500" />}
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="px-4 pb-3">
          <div className="rounded-md border">
            <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-1.5 text-small font-medium text-muted-foreground">
              <span className="w-32 shrink-0">Factor</span>
              <span className="w-14 shrink-0 text-center">Weight</span>
              <span className="w-16 shrink-0 text-center">Score</span>
              <span className="w-32 shrink-0">Contribution</span>
              <span className="flex-1">Explanation</span>
            </div>
            {factors.map((factor, i) => (
              <div
                key={factor.key}
                className={`flex items-center gap-2 px-3 py-2 text-small ${i % 2 === 1 ? 'bg-muted/30' : ''}`}
              >
                <span className="flex w-32 shrink-0 items-center gap-1">
                  {factor.label}
                  <TermInfo slug={FACTOR_SLUGS[factor.key] ?? 'nav'} />
                </span>
                <span className="w-14 shrink-0 text-center text-mono tabular-nums text-muted-foreground">
                  {factor.weight}%
                </span>
                <span className={`w-16 shrink-0 text-center text-mono tabular-nums ${scoreColor(factor.rawScore)}`}>
                  {factor.rawScore.toFixed(1)}/20
                </span>
                <div className="flex w-32 shrink-0 items-center gap-2">
                  <div className={`h-3 flex-1 rounded-full ${contributionBg(factor.rawScore)}`}>
                    <div
                      className={`h-full rounded-full transition-all ${contributionColor(factor.rawScore)}`}
                      style={{ width: `${Math.min(100, (factor.rawScore / MAX_CONTRIBUTION_BAR) * 100)}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-mono tabular-nums text-muted-foreground">
                    {factor.weightedContribution.toFixed(1)}
                  </span>
                </div>
                <span className="flex-1 truncate text-muted-foreground">{factor.explanation}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
