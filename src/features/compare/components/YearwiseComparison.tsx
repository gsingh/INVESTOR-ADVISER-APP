import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { computeAllReturns } from '@/lib/yearwise-returns'
import type { ComparedFund } from '../hooks/useComparison'
import type { YearwiseReturnSummary } from '@/lib/yearwise-returns'

interface YearwiseComparisonProps {
  funds: ComparedFund[]
}

function retClass(value: number | null): string {
  if (value === null) return 'text-muted-foreground'
  return value >= 0 ? 'text-green-700' : 'text-red-700'
}

function retPrefix(value: number | null): string {
  if (value === null) return ''
  return value >= 0 ? '+' : ''
}

function formatReturn(value: number | null): string {
  if (value === null) return '—'
  return `${retPrefix(value)}${value.toFixed(2)}%`
}

export function YearwiseComparison({ funds }: YearwiseComparisonProps) {
  const [trailingOpen, setTrailingOpen] = useState(true)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [quarterlyOpen, setQuarterlyOpen] = useState(false)

  const summaries = useMemo(() => {
    return funds.map(f => ({
      fund: f.fund,
      returns: f.navData.length >= 2 ? computeAllReturns(f.navData) : null,
    }))
  }, [funds])

  const allCalendarYears = useMemo(() => {
    const years = new Set<number>()
    for (const s of summaries) {
      if (!s.returns) continue
      for (const cy of s.returns.calendarYears) {
        years.add(cy.year)
      }
    }
    return [...years].sort((a, b) => b - a)
  }, [summaries])

  const allQuarters = useMemo(() => {
    const qs = new Set<string>()
    for (const s of summaries) {
      if (!s.returns) continue
      for (const q of s.returns.quarterly) {
        qs.add(q.label)
      }
    }
    return [...qs].sort((a, b) => {
      const [yA, qA] = a.split('-Q').map(Number)
      const [yB, qB] = b.split('-Q').map(Number)
      return yB - yA || qB - qA
    })
  }, [summaries])

  if (funds.length === 0) return null

  const anyReturns = summaries.some(s => s.returns !== null)
  if (!anyReturns) return null

  return (
    <div className="rounded-lg border">
      <div className="border-b bg-muted/30 px-3 py-1.5">
        <span className="text-small font-medium text-muted-foreground">Year-Wise Returns</span>
      </div>

      {/* Trailing Returns */}
      <div className="border-b">
        <button
          onClick={() => setTrailingOpen(!trailingOpen)}
          className="flex w-full items-center gap-2 bg-muted/20 px-3 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          {trailingOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          Trailing Returns
        </button>
        {trailingOpen && (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-small text-muted-foreground">
                <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 font-medium">Period</th>
                {summaries.map((s, i) => (
                  <th key={s.fund.schemeCode} className={`px-3 py-2 font-medium ${i > 0 ? 'border-l' : ''}`}>
                    <span className="truncate text-xs">{s.fund.schemeName}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <TrailingRow label="1Y Return" getRet={s => s?.trailing1Y.return ?? null} summaries={summaries} />
              <TrailingRow label="3Y Return (Ann.)" getRet={s => s?.trailing3Y.return ?? null} summaries={summaries} />
              <TrailingRow label="5Y Return (Ann.)" getRet={s => s?.trailing5Y.return ?? null} summaries={summaries} />
              <TrailingRow label="Since Inception" getRet={s => s?.sinceInception.return ?? null} summaries={summaries} />
            </tbody>
          </table>
        )}
      </div>

      {/* Calendar Year Returns */}
      {allCalendarYears.length > 0 && (
        <div className="border-b">
          <button
            onClick={() => setCalendarOpen(!calendarOpen)}
            className="flex w-full items-center gap-2 bg-muted/20 px-3 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            {calendarOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Calendar Year Returns ({allCalendarYears.length})
          </button>
          {calendarOpen && (
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-small text-muted-foreground">
                  <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 font-medium">Year</th>
                  {summaries.map((s, i) => (
                    <th key={s.fund.schemeCode} className={`px-3 py-2 font-medium ${i > 0 ? 'border-l' : ''}`}>
                      <span className="truncate text-xs">{s.fund.schemeName}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allCalendarYears.map(year => (
                  <tr key={year} className="border-b last:border-0 hover:bg-muted/10">
                    <td className="sticky left-0 z-10 bg-background px-3 py-2 text-small font-medium">{year}</td>
                    {summaries.map((s, i) => {
                      const cy = s.returns?.calendarYears.find(y => y.year === year)
                      const val = cy?.return ?? null
                      return (
                        <td key={s.fund.schemeCode} className={`px-3 py-2 text-mono text-small tabular-nums ${i > 0 ? 'border-l' : ''} ${retClass(val)}`}>
                          {formatReturn(val)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Quarterly Returns */}
      {allQuarters.length > 0 && (
        <div>
          <button
            onClick={() => setQuarterlyOpen(!quarterlyOpen)}
            className="flex w-full items-center gap-2 bg-muted/20 px-3 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            {quarterlyOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Quarterly Returns ({allQuarters.length})
          </button>
          {quarterlyOpen && (
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-small text-muted-foreground">
                    <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 font-medium">Quarter</th>
                    {summaries.map((s, i) => (
                      <th key={s.fund.schemeCode} className={`px-3 py-2 font-medium ${i > 0 ? 'border-l' : ''}`}>
                        <span className="truncate text-xs">{s.fund.schemeName}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allQuarters.map(qLabel => (
                    <tr key={qLabel} className="border-b last:border-0 hover:bg-muted/10">
                      <td className="sticky left-0 z-10 bg-background px-3 py-1.5 text-small font-medium">{qLabel}</td>
                      {summaries.map((s, i) => {
                        const q = s.returns?.quarterly.find(qq => qq.label === qLabel)
                        const val = q?.return ?? null
                        return (
                          <td key={s.fund.schemeCode} className={`px-3 py-1.5 text-mono text-small tabular-nums ${i > 0 ? 'border-l' : ''} ${retClass(val)}`}>
                            {formatReturn(val)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TrailingRow({
  label,
  getRet,
  summaries,
}: {
  label: string
  getRet: (s: YearwiseReturnSummary | null) => number | null
  summaries: { fund: { schemeCode: string; schemeName: string }; returns: YearwiseReturnSummary | null }[]
}) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/10">
      <td className="sticky left-0 z-10 bg-background px-3 py-2 text-small font-medium">{label}</td>
      {summaries.map((s, i) => {
        const val = getRet(s.returns)
        return (
          <td key={s.fund.schemeCode} className={`px-3 py-2 text-mono text-small tabular-nums ${i > 0 ? 'border-l' : ''} ${retClass(val)}`}>
            {formatReturn(val)}
          </td>
        )
      })}
    </tr>
  )
}
