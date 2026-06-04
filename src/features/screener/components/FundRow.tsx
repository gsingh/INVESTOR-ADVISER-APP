import { Badge } from '@/components/ui/badge'
import { formatINR, formatPercentage } from '@/lib/formatters'
import type { MFFund } from '@/types/api'

interface FundRowProps {
  fund: MFFund
  onClick: () => void
}

const riskColors: Record<string, string> = {
  'Very Low': 'bg-green-100 text-green-800',
  Low: 'bg-green-100 text-green-800',
  'Moderately Low': 'bg-yellow-100 text-yellow-800',
  Moderate: 'bg-amber-100 text-amber-800',
  'Moderately High': 'bg-orange-100 text-orange-800',
  High: 'bg-red-100 text-red-800',
  VeryHigh: 'bg-red-100 text-red-800',
}

export function FundRow({ fund, onClick }: FundRowProps) {

  return (
    <div
      className="flex cursor-pointer items-center gap-4 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
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
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{fund.schemeName}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full text-xs">
            {fund.subCategory || fund.category || '—'}
          </Badge>
          {fund.plan && (
            <Badge variant="outline" className="rounded-full text-xs">
              {fund.plan}
            </Badge>
          )}
          {fund.riskLabel && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${riskColors[fund.riskLabel] ?? 'bg-gray-100 text-gray-800'}`}
            >
              {fund.riskLabel}
            </span>
          )}
        </div>
      </div>

      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-sm text-muted-foreground">
          ER: {fund.expenseRatio > 0 ? formatPercentage(fund.expenseRatio / 100) : '—'}
        </p>
        <p className="text-sm text-muted-foreground">
          AUM: {fund.aum > 0 ? formatINR(fund.aum * 10000000) : '—'}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm text-muted-foreground">Score</p>
        <p className="text-sm font-semibold">—</p>
      </div>
    </div>
  )
}
