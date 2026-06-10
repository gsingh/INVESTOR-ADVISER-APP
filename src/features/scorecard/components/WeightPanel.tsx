import { RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TermInfo } from '@/components/features/TermInfo'
import type { ScorecardWeights } from '@/types/scorecard'

const FACTOR_META: { key: keyof ScorecardWeights; label: string; slug: string }[] = [
  { key: 'consistency', label: 'Consistency', slug: 'rolling-returns' },
  { key: 'cost', label: 'Cost', slug: 'expense-ratio' },
  { key: 'sharpeRatio', label: 'Sharpe Ratio', slug: 'nav' },
  { key: 'trailing3YReturn', label: '3Y Return', slug: 'nav' },
  { key: 'categoryFit', label: 'Category Fit', slug: 'amfi-category' },
  { key: 'sortinoRatio', label: 'Sortino Ratio', slug: 'nav' },
  { key: 'alpha', label: 'Alpha', slug: 'nav' },
  { key: 'yearwiseConsistency', label: 'Year Consistency', slug: 'nav' },
  { key: 'trailing1YReturn', label: '1Y Return', slug: 'nav' },
  { key: 'trailing5YReturn', label: '5Y Return', slug: 'nav' },
  { key: 'benchmarkSuitability', label: 'Benchmark', slug: 'benchmark' },
  { key: 'volatility', label: 'Volatility', slug: 'nav' },
  { key: 'drawdown', label: 'Drawdown', slug: 'nav' },
  { key: 'informationRatio', label: 'Info Ratio', slug: 'nav' },
  { key: 'fundAge', label: 'Fund Age', slug: 'nav' },
  { key: 'aumSanity', label: 'AUM Sanity', slug: 'aum' },
  { key: 'exitLoad', label: 'Exit Load', slug: 'exit-load' },
  { key: 'overlap', label: 'Overlap', slug: 'nav' },
  { key: 'upCapture', label: 'Up Capture', slug: 'nav' },
  { key: 'downCapture', label: 'Down Capture', slug: 'nav' },
  { key: 'sinceInceptionReturn', label: 'Since Inception', slug: 'nav' },
  { key: 'beta', label: 'Beta', slug: 'nav' },
  { key: 'rSquared', label: 'R-Squared', slug: 'nav' },
]

interface WeightPanelProps {
  weights: ScorecardWeights
  weightSum: number
  onWeightChange: (key: keyof ScorecardWeights, value: number) => void
  onReset: () => void
}

export function WeightPanel({ weights, weightSum, onWeightChange, onReset }: WeightPanelProps) {
  const isNormalized = weightSum !== 100

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-label font-semibold">Weight Configuration</h3>
        <Button variant="outline" size="sm" onClick={onReset}>
          <RotateCcw className="h-3.5 w-3.5" />
          Reset to defaults
        </Button>
      </div>

      {isNormalized && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-small text-amber-800">
          Weights normalized to 100% — adjust sliders to take full control.
        </div>
      )}

      <div className="space-y-3">
        {FACTOR_META.map(({ key, label, slug }) => (
          <div key={key} className="flex items-center gap-3">
            <div className="flex w-36 items-center gap-1">
              <span className="text-small">{label}</span>
              <TermInfo slug={slug} />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={weights[key] ?? 0}
              onChange={e => onWeightChange(key, Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0"
              aria-label={`${label} weight`}
            />
            <Badge variant="outline" className="w-10 justify-center text-mono tabular-nums">
              {weights[key] ?? 0}
            </Badge>
          </div>
        ))}
      </div>

      <div className="border-t pt-2 text-small text-muted-foreground">
        Sum: <span className="font-medium">{weightSum}%</span>
        {!isNormalized && <span className="ml-2 text-green-600">✓</span>}
      </div>
    </div>
  )
}
