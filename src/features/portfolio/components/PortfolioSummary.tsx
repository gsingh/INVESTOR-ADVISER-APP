import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TermInfo } from '@/components/features/TermInfo'
import { formatINR, formatPercentage } from '@/lib/formatters'
import type { PortfolioSummary as PortfolioSummaryType } from '../hooks/usePortfolio'

interface PortfolioSummaryProps {
  data: PortfolioSummaryType
}

export function PortfolioSummary({ data }: PortfolioSummaryProps) {
  if (data.loading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="mb-2 h-3 w-20" />
            <Skeleton className="h-7 w-32" />
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: 'Total Value',
      value: formatINR(data.totalValue),
      term: 'nav',
    },
    {
      label: 'XIRR Since Inception',
      value: data.xirr != null ? formatPercentage(data.xirr) : '—',
      term: 'xirr',
      valueClass: data.xirr != null && data.xirr >= 0 ? 'text-green-600' : 'text-red-600',
    },
    {
      label: 'Unrealized Gain/Loss',
      value: data.unrealizedGainLoss >= 0 ? `+${formatINR(data.unrealizedGainLoss)}` : formatINR(data.unrealizedGainLoss),
      term: 'xirr',
      valueClass: data.unrealizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600',
    },
    {
      label: 'Total Invested',
      value: formatINR(data.totalInvested),
      term: 'sip',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map(card => (
        <Card key={card.label} className="p-4">
          <p className="mb-1 text-label text-muted-foreground">
            {card.label} <TermInfo slug={card.term} />
          </p>
          <p className={`font-mono text-display-sm font-semibold ${card.valueClass ?? ''}`}>
            {card.value}
          </p>
        </Card>
      ))}
    </div>
  )
}
