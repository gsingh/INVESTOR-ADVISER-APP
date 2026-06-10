import { Fragment } from 'react'
import { getParameter } from '@/lib/parameters'
import type { ComparedFund } from '../hooks/useComparison'

type RowCategory = 'pre-filter' | 'return' | 'risk' | 'risk-adjusted' | 'portfolio' | 'debt'

interface TableRow {
  paramId: string
  label: string
  category: RowCategory
  getValue: (fund: ComparedFund) => string
  better: 'higher' | 'lower' | 'context'
}

const COMPARISON_ROWS: TableRow[] = [
  { paramId: 'trailing1YReturn', label: '1Y Return', category: 'return', getValue: f => extractScoreExplanation(f, 'trailing1YReturn'), better: 'higher' },
  { paramId: 'trailing3YReturn', label: '3Y Return (Annualised)', category: 'return', getValue: f => extractScoreExplanation(f, 'trailing3YReturn'), better: 'higher' },
  { paramId: 'trailing5YReturn', label: '5Y Return (Annualised)', category: 'return', getValue: f => extractScoreExplanation(f, 'trailing5YReturn'), better: 'higher' },
  { paramId: 'sinceInceptionReturn', label: 'Since Inception', category: 'return', getValue: f => extractScoreExplanation(f, 'sinceInceptionReturn'), better: 'higher' },
  { paramId: 'yearwiseConsistency', label: 'Year-Wise Consistency', category: 'return', getValue: f => extractScoreExplanation(f, 'yearwiseConsistency'), better: 'higher' },
  { paramId: 'rollingReturns', label: 'Rolling Return Consistency', category: 'return', getValue: f => extractScoreExplanation(f, 'consistency'), better: 'higher' },
  { paramId: 'expenseRatio', label: 'Expense Ratio', category: 'risk', getValue: f => extractScoreExplanation(f, 'cost'), better: 'lower' },
  { paramId: 'sharpeRatio', label: 'Sharpe Ratio', category: 'risk-adjusted', getValue: f => extractScoreExplanation(f, 'sharpeRatio'), better: 'higher' },
  { paramId: 'sortinoRatio', label: 'Sortino Ratio', category: 'risk-adjusted', getValue: f => extractScoreExplanation(f, 'sortinoRatio'), better: 'higher' },
  { paramId: 'alpha', label: 'Alpha', category: 'risk-adjusted', getValue: f => extractScoreExplanation(f, 'alpha'), better: 'higher' },
  { paramId: 'beta', label: 'Beta', category: 'risk', getValue: f => extractScoreExplanation(f, 'beta'), better: 'context' },
  { paramId: 'rSquared', label: 'R-Squared', category: 'risk', getValue: f => extractScoreExplanation(f, 'rSquared'), better: 'higher' },
  { paramId: 'informationRatio', label: 'Information Ratio', category: 'risk-adjusted', getValue: f => extractScoreExplanation(f, 'informationRatio'), better: 'higher' },
  { paramId: 'standardDeviation', label: 'Volatility (SD)', category: 'risk', getValue: f => extractScoreExplanation(f, 'volatility'), better: 'lower' },
  { paramId: 'maxDrawdown', label: 'Max Drawdown', category: 'risk', getValue: f => extractScoreExplanation(f, 'drawdown'), better: 'lower' },
  { paramId: 'upCapture', label: 'Up Capture', category: 'risk-adjusted', getValue: f => extractScoreExplanation(f, 'upCapture'), better: 'higher' },
  { paramId: 'downCapture', label: 'Down Capture', category: 'risk-adjusted', getValue: f => extractScoreExplanation(f, 'downCapture'), better: 'lower' },
  { paramId: 'fundAge', label: 'Fund Age', category: 'risk', getValue: f => extractScoreExplanation(f, 'fundAge'), better: 'higher' },
  { paramId: 'aum', label: 'AUM Sanity', category: 'portfolio', getValue: f => extractScoreExplanation(f, 'aumSanity'), better: 'higher' },
]

function extractScoreExplanation(fund: ComparedFund, factorKey: string): string {
  const score = fund.enrichedScore ?? fund.basicScore
  const factor = score.factors.find(f => f.key === factorKey)
  if (!factor) return '—'
  return `${factor.rawScore.toFixed(1)}/20 — ${factor.explanation}`
}

function extractRawScore(fund: ComparedFund, factorKey: string): number {
  const score = fund.enrichedScore ?? fund.basicScore
  const factor = score.factors.find(f => f.key === factorKey)
  return factor?.rawScore ?? 0
}

function getCategoryLabel(cat: RowCategory): string {
  switch (cat) {
    case 'return': return 'Return Metrics'
    case 'risk': return 'Risk Metrics'
    case 'risk-adjusted': return 'Risk-Adjusted Metrics'
    case 'portfolio': return 'Portfolio Characteristics'
    default: return 'Other'
  }
}

function getCategoryOrder(cat: RowCategory): number {
  switch (cat) {
    case 'return': return 0
    case 'risk': return 1
    case 'risk-adjusted': return 2
    case 'portfolio': return 3
    default: return 4
  }
}

function getBestIndex(funds: ComparedFund[], row: TableRow): number | null {
  if (funds.length < 2) return null
  const scores = funds.map(f => extractRawScore(f, mapParamToFactorKey(row.paramId)))
  const uniqueScores = [...new Set(scores)]
  if (uniqueScores.length <= 1) return null
  if (row.better === 'higher') return scores.indexOf(Math.max(...scores))
  if (row.better === 'lower') return scores.indexOf(Math.min(...scores))
  return null
}

function mapParamToFactorKey(paramId: string): string {
  const map: Record<string, string> = {
    expenseRatio: 'cost',
    standardDeviation: 'volatility',
    maxDrawdown: 'drawdown',
    rollingReturns: 'consistency',
    aum: 'aumSanity',
    sharpeRatio: 'sharpeRatio',
    sortinoRatio: 'sortinoRatio',
    rSquared: 'rSquared',
    informationRatio: 'informationRatio',
  }
  return map[paramId] ?? paramId
}

function scoreColor(score: number): string {
  if (score >= 15) return 'text-green-700 font-bold'
  if (score >= 10) return 'text-amber-700'
  if (score >= 5) return 'text-orange-600'
  return 'text-red-600'
}

interface ComparisonTableProps {
  funds: ComparedFund[]
}

export function ComparisonTable({ funds }: ComparisonTableProps) {
  const categories = [...new Set(COMPARISON_ROWS.map(r => r.category))]
    .sort((a, b) => getCategoryOrder(a) - getCategoryOrder(b))

  if (funds.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center text-small text-muted-foreground">
        No funds selected for comparison.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 text-left text-small font-medium text-muted-foreground">
              Parameter
            </th>
            {funds.map((f, i) => (
              <th
                key={f.fund.schemeCode}
                className={`px-3 py-2 text-left text-small font-medium text-muted-foreground ${i > 0 ? 'border-l' : ''}`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-mono text-xs text-muted-foreground">#{i + 1}</span>
                  <span className="truncate">{f.fund.schemeName}</span>
                  {f.isEnriching && (
                    <span className="ml-1 h-2 w-2 animate-pulse rounded-full bg-amber-400" title="Enriching data..." />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <Fragment key={cat}>
              <tr className="border-b bg-muted/20">
                <td
                  colSpan={funds.length + 1}
                  className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  {getCategoryLabel(cat)}
                </td>
              </tr>
              {COMPARISON_ROWS.filter(r => r.category === cat).map(row => {
                const bestIdx = getBestIndex(funds, row)
                return (
                  <tr key={row.paramId} className="border-b last:border-0 hover:bg-muted/10">
                    <td className="sticky left-0 z-10 bg-background px-3 py-2.5 text-small font-medium">
                      {row.label}
                    </td>
                    {funds.map((f, i) => {
                      const isBest = bestIdx !== null && i === bestIdx
                      return (
                        <td
                          key={f.fund.schemeCode}
                          className={`px-3 py-2.5 text-small ${i > 0 ? 'border-l' : ''} ${isBest ? 'bg-green-50 dark:bg-green-950/30' : ''}`}
                        >
                          {renderValue(row, f)}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderValue(row: TableRow, fund: ComparedFund) {
  const score = fund.enrichedScore ?? fund.basicScore
  const factor = score.factors.find(f => f.key === mapParamToFactorKey(row.paramId))
  const rawScore = factor?.rawScore ?? 0
  const explanation = factor?.explanation ?? ''

  const isDefaulting = explanation.includes('unavailable') || explanation.includes('Insufficient') || explanation.includes('No fund data')

  const shortExplanation = isDefaulting
    ? 'Data unavailable'
    : (explanation.split('—').pop()?.trim() ?? explanation)

  return (
    <div className="max-w-[250px]">
      <div className={`text-mono tabular-nums ${scoreColor(rawScore)}`}>
        {rawScore.toFixed(1)}
        <span className="text-muted-foreground font-normal">/20</span>
      </div>
      <p className="mt-0.5 truncate text-xs text-muted-foreground" title={explanation}>
        {shortExplanation}
      </p>
    </div>
  )
}
