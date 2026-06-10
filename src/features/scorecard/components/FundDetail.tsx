import { useMemo, useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useQueries } from '@tanstack/react-query'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { BookOpen, GitCompare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { TermInfo } from '@/components/features/TermInfo'
import { useToast } from '@/components/ui/toast'
import { useNav } from '@/stores/queries/useNav'
import { useScheme } from '@/stores/queries/useScheme'
import { useFundList } from '@/stores/queries/useFunds'
import { useGetMfDataFund } from '@/stores/queries/useGetMfData'
import { estimateRiskLabel, estimateExitLoad } from '@/lib/fund-enrichment'
import { estimateExpenseRatio, estimateAum } from '@/lib/fund-enrichment'
import { computeOverlap } from '@/lib/overlap'
import type { SectorEntry } from '@/lib/overlap'
import { computeAllReturns } from '@/lib/yearwise-returns'
import { OverlapIndicator } from './OverlapIndicator'
import { PeerPicker } from '@/features/compare/components/PeerPicker'
import { schemeDetailResponseSchema } from '@/types/api'
import { db } from '@/stores/db'
import type { NavEntry, SchemeDetail } from '@/types/api'
import { cn } from '@/lib/utils'

function parseDDMMYYYY(dateStr: string): Date | null {
  const m = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

function formatNavDate(dateStr: string): string {
  const d = parseDDMMYYYY(dateStr)
  if (!d) return dateStr
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

function formatCurrency(n: number): string {
  if (!Number.isFinite(n)) return '—'
  if (n >= 10000) return `₹${(n / 1000).toFixed(1)}K Cr`
  if (n >= 100) return `₹${n.toFixed(0)} Cr`
  return `₹${n.toFixed(2)} Cr`
}

type Period = '1W' | '1M' | '6M' | '1Y' | '3Y' | '5Y' | '10Y' | 'ALL'

const PERIODS: { label: string; value: Period }[] = [
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
  { label: '6M', value: '6M' },
  { label: '1Y', value: '1Y' },
  { label: '3Y', value: '3Y' },
  { label: '5Y', value: '5Y' },
  { label: '10Y', value: '10Y' },
  { label: 'ALL', value: 'ALL' },
]

function filterNavByPeriod(data: NavEntry[], period: Period): NavEntry[] {
  if (period === 'ALL' || data.length === 0) return data
  const lastEntry = data[data.length - 1]
  const lastDate = parseDDMMYYYY(lastEntry.date)
  if (!lastDate) return data
  const cutoff = new Date(lastDate)
  switch (period) {
    case '1W':
      cutoff.setDate(cutoff.getDate() - 7)
      break
    case '1M':
      cutoff.setMonth(cutoff.getMonth() - 1)
      break
    case '6M':
      cutoff.setMonth(cutoff.getMonth() - 6)
      break
    case '1Y':
      cutoff.setFullYear(cutoff.getFullYear() - 1)
      break
    case '3Y':
      cutoff.setFullYear(cutoff.getFullYear() - 3)
      break
    case '5Y':
      cutoff.setFullYear(cutoff.getFullYear() - 5)
      break
    case '10Y':
      cutoff.setFullYear(cutoff.getFullYear() - 10)
      break
  }
  return data.filter(entry => {
    const d = parseDDMMYYYY(entry.date)
    return d && d >= cutoff
  })
}

interface InfoCardProps {
  label: string
  value: string
  termSlug: string
  estimated?: boolean
}

function InfoCard({ label, value, termSlug, estimated }: InfoCardProps) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1 text-small text-muted-foreground">
        <span>{label}</span>
        <TermInfo slug={termSlug} />
        {estimated && (
          <span className="rounded bg-amber-100 px-1 text-[10px] text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">est.</span>
        )}
      </div>
      <p className="mt-1 text-mono text-display-sm font-bold tabular-nums">{value}</p>
    </Card>
  )
}

function ReturnCard({ label, value, unit, sub }: { label: string; value: number | null; unit: string; sub?: string }) {
  return (
    <Card className="p-3">
      <div className="text-small text-muted-foreground">{label}</div>
      <p className={`mt-1 text-mono text-display-sm font-bold tabular-nums ${value === null ? 'text-muted-foreground' : value >= 0 ? 'text-green-700' : 'text-red-700'}`}>
        {value !== null ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}${unit}` : '—'}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </Card>
  )
}

function NavChart({ data }: { data: NavEntry[] }) {
  if (!data.length) {
    return <p className="py-8 text-center text-small text-muted-foreground">No NAV history available.</p>
  }
  const sampled = data.length > 200
    ? (() => {
        const step = Math.ceil(data.length / 200)
        const last = data[data.length - 1]
        const filtered = data.filter((_, i) => i % step === 0)
        if (filtered[filtered.length - 1] !== last) filtered.push(last)
        return filtered
      })()
    : data
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={sampled} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tickFormatter={formatNavDate}
          tick={{ fontSize: 11 }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fontSize: 11 }}
          tickFormatter={v => `₹${v}`}
        />
        <Tooltip
          labelFormatter={d => { const pd = parseDDMMYYYY(String(d)); return pd ? pd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : String(d) }}
          formatter={(value: number) => [`₹${value.toFixed(2)}`, 'NAV']}
        />
        <Line type="monotone" dataKey="nav" stroke="#2E8B57" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function HoldingsTable({ scheme }: { scheme: SchemeDetail }) {
  const holdings = scheme.portfolioHoldings
  if (!holdings.length) {
    return <p className="py-4 text-center text-small text-muted-foreground">No portfolio holdings data available.</p>
  }
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b bg-muted/50 text-left text-small text-muted-foreground">
          <th className="px-3 py-2 font-medium">Holding</th>
          <th className="px-3 py-2 text-right font-medium">Amount</th>
          <th className="px-3 py-2 text-right font-medium">% of Portfolio</th>
        </tr>
      </thead>
      <tbody>
        {holdings.map((h, i) => (
          <tr
            key={`${h.name}-${i}`}
            className={`border-b last:border-0 ${i % 2 === 1 ? 'bg-muted/20' : ''}`}
          >
            <td className="px-3 py-2 text-small font-medium">{h.name}</td>
            <td className="px-3 py-2 text-right text-mono text-small tabular-nums">
              {formatCurrency(h.amountCr)}
            </td>
            <td className="px-3 py-2 text-right text-mono text-small tabular-nums">
              {h.percentage.toFixed(1)}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function SectorChart({ scheme }: { scheme: SchemeDetail }) {
  const sectors = scheme.sectorAllocation
  if (!sectors.length) {
    return <p className="py-4 text-center text-small text-muted-foreground">No sector allocation data available.</p>
  }
  const sorted = [...sectors].sort((a, b) => b.percentage - a.percentage)
  return (
    <div className="space-y-2">
      {sorted.map(s => (
        <div key={s.sector} className="flex items-center gap-3">
          <span className="w-32 shrink-0 text-small text-muted-foreground">{s.sector}</span>
          <div className="flex h-5 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${s.percentage}%` }}
            />
          </div>
          <span className="w-12 text-right text-mono text-small tabular-nums text-muted-foreground">
            {s.percentage.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}

function ReturnsChart({ scheme }: { scheme: SchemeDetail }) {
  const returns = scheme.rollingReturns
  if (!returns.length) {
    return <p className="py-4 text-center text-small text-muted-foreground">No rolling returns data available.</p>
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={returns} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="period" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
        <Tooltip formatter={(value: number, name: string) => [`${value.toFixed(2)}%`, name]} />
        <Line type="monotone" dataKey="fund" stroke="#2E8B57" strokeWidth={2} dot={false} name="Fund" />
        <Line type="monotone" dataKey="benchmark" stroke="#6B7280" strokeWidth={2} dot={false} name="Benchmark" />
      </LineChart>
    </ResponsiveContainer>
  )
}

interface FundDetailProps {
  schemeCode: string
}

export function FundDetail({ schemeCode }: FundDetailProps) {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [peerPickerOpen, setPeerPickerOpen] = useState(false)
  const [period, setPeriod] = useState<Period>('ALL')

  useFundList({})
  const { data: navData, error: navError, refetch: refetchNav } = useNav(schemeCode)
  const { data: scheme, isLoading: schemeLoading, error: schemeError, refetch: refetchScheme } = useScheme(schemeCode)
  const { data: mfdataEnrichment } = useGetMfDataFund(schemeCode)
  const portfolios = useLiveQuery(() => db.portfolios.toArray(), [], [])

  const enrichedScheme = useMemo(() => {
    if (!scheme) return scheme
    if (!mfdataEnrichment) return scheme
    const realCategory = mfdataEnrichment.subCategory || scheme.subCategory
    const realPlan = mfdataEnrichment.plan || scheme.plan
    return {
      ...scheme,
      category: mfdataEnrichment.category || scheme.category,
      subCategory: realCategory,
      plan: realPlan,
      option: mfdataEnrichment.option || scheme.option,
      expenseRatio: estimateExpenseRatio(realCategory, realPlan),
      aum: estimateAum(realCategory),
      exitLoad: estimateExitLoad(realCategory),
      riskLabel: estimateRiskLabel(realCategory),
    }
  }, [scheme, mfdataEnrichment])

  const portfolioSchemeCodes = useMemo(() => {
    if (!portfolios || !portfolios.length) return []
    return [...new Set(portfolios.map(p => p.schemeCode))]
  }, [portfolios])

  const portfolioSchemeQueries = useQueries({
    queries: portfolioSchemeCodes.map(code => ({
      queryKey: ['scheme', code],
      queryFn: async ({ signal }: { signal: AbortSignal }) => {
        const res = await fetch(`/api/mfapi/mf/${code}`, { signal })
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        const data = await res.json()
        return schemeDetailResponseSchema.parse(data)
      },
      staleTime: Infinity,
      retry: 1,
    })),
  })

  const portfolioSchemeDetails = useMemo(
    () => portfolioSchemeQueries.map(q => q.data).filter((d): d is SchemeDetail => d !== null && d !== undefined),
    [portfolioSchemeQueries],
  )
  const portfolioSectorsLoading = portfolioSchemeQueries.some(q => q.isLoading && !q.data)

  const portfolioSectors = useMemo(() => {
    const sectors: SectorEntry[] = []
    for (const detail of portfolioSchemeDetails) {
      if (detail.sectorAllocation.length) {
        sectors.push(...detail.sectorAllocation)
      }
    }
    return sectors
  }, [portfolioSchemeDetails])
  const hasError = navError || schemeError
  const returnsSummary = useMemo(() => {
    if (!navData || navData.length < 2) return null
    return computeAllReturns(navData)
  }, [navData])

  const filteredNavData = useMemo(() => filterNavByPeriod(navData ?? [], period), [navData, period])

  const overlapResult = useMemo(() => {
    if (!enrichedScheme || !enrichedScheme.sectorAllocation.length) return null
    return computeOverlap(enrichedScheme.sectorAllocation, portfolioSectors)
  }, [enrichedScheme, portfolioSectors])

  useEffect(() => {
    if (hasError) {
      addToast({ title: "Couldn't fetch fund details", description: 'The data source may be temporarily unavailable.', variant: 'destructive' })
    }
  }, [hasError, addToast])

  if (!schemeCode) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-body text-muted-foreground">No fund selected.</p>
      </div>
    )
  }

  if (navError && schemeError) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-body text-muted-foreground">Couldn't fetch fund details. The data source may be temporarily unavailable.</p>
        <button
          onClick={() => { refetchNav(); refetchScheme() }}
          className="mt-3 rounded-md bg-primary px-4 py-2 text-small text-primary-foreground hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!scheme) {
    if (schemeLoading) {
      return (
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>
      )
    }
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-body text-muted-foreground">Fund not found.</p>
      </div>
    )
  }

  if (!enrichedScheme) return null

  const isEnriched = !!mfdataEnrichment

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-display font-semibold text-foreground">{enrichedScheme.schemeName}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline" className="text-small">{enrichedScheme.category || '—'}</Badge>
              <Badge variant="outline" className="text-small">{enrichedScheme.plan || '—'}</Badge>
              <Badge variant="outline" className="text-small">{enrichedScheme.option || '—'}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPeerPickerOpen(true)}
            >
              <GitCompare className="mr-2 h-4 w-4" />
              Compare with peers
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigate({ to: `/journal?fundName=${encodeURIComponent(enrichedScheme.schemeName)}` })
              }}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Write Journal Note
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <InfoCard label="Expense Ratio" value={`${enrichedScheme.expenseRatio.toFixed(2)}%`} termSlug="expense-ratio" estimated />
        <InfoCard label="AUM" value={formatCurrency(enrichedScheme.aum)} termSlug="aum" estimated />
        <InfoCard
          label="Exit Load"
          value={enrichedScheme.exitLoad?.exists ? `${enrichedScheme.exitLoad.rate ?? 0}% (${enrichedScheme.exitLoad.durationYears ?? 0}yr)` : '—'}
          termSlug="exit-load"
          estimated={!isEnriched}
        />
        <InfoCard label="Risk" value={enrichedScheme.riskLabel || '—'} termSlug="risk" estimated={!isEnriched} />
      </div>

      {mfdataEnrichment && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-xs text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          Enriched with real data from getmfdata.com
          {mfdataEnrichment.nav > 0 && (
            <span className="ml-2">· Latest NAV: ₹{mfdataEnrichment.nav.toFixed(2)} ({mfdataEnrichment.navDate})</span>
          )}
        </div>
      )}

      <Card className="p-4">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-label font-semibold">
            NAV History <TermInfo slug="nav" />
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {PERIODS.map(p => (
              <Button
                key={p.value}
                variant={period === p.value ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-7 px-2.5 text-xs',
                  period === p.value && 'bg-primary text-primary-foreground'
                )}
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
        <NavChart data={filteredNavData} />
      </Card>

      {returnsSummary && (
        <Card className="p-4">
          <h3 className="mb-3 text-label font-semibold">Returns</h3>
          <div className="grid gap-4 sm:grid-cols-4">
            <ReturnCard label="1Y Return" value={returnsSummary.trailing1Y.return} unit="%" />
            <ReturnCard label="3Y Return (Ann.)" value={returnsSummary.trailing3Y.return} unit="%" />
            <ReturnCard label="5Y Return (Ann.)" value={returnsSummary.trailing5Y.return} unit="%" />
            <ReturnCard
              label="Since Inception"
              value={returnsSummary.sinceInception.return}
              unit="%"
              sub={`${returnsSummary.sinceInception.years.toFixed(1)}Y`}
            />
          </div>
          {returnsSummary.calendarYears.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-2 text-small font-medium text-muted-foreground">Calendar Year Returns</h4>
              <div className="flex flex-wrap gap-2">
                {returnsSummary.calendarYears.map(cy => (
                  <div
                    key={cy.year}
                    className={`rounded-md px-3 py-1.5 text-center ${
                      cy.return === null ? 'bg-gray-100 text-gray-400' :
                      cy.return >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    <div className="text-xs font-medium">{cy.year}</div>
                    <div className="text-mono text-sm tabular-nums font-bold">
                      {cy.return !== null ? `${cy.return >= 0 ? '+' : ''}${cy.return.toFixed(1)}%` : '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 text-label font-semibold">
            Sector Allocation <TermInfo slug="sector-allocation" />
          </h3>
          <SectorChart scheme={enrichedScheme} />
        </Card>

        <div className="space-y-6">
          <Card className="p-4">
            <h3 className="mb-3 text-label font-semibold">
              Rolling Returns <TermInfo slug="rolling-returns" /> <TermInfo slug="benchmark" />
            </h3>
            <ReturnsChart scheme={enrichedScheme} />
          </Card>

          <OverlapIndicator overlap={overlapResult} isLoading={portfolioSectorsLoading} />
        </div>
      </div>

      <Card className="p-4">
        <h3 className="mb-3 text-label font-semibold">
          Portfolio Holdings <TermInfo slug="portfolio-holdings" />
        </h3>
        <HoldingsTable scheme={enrichedScheme} />
      </Card>

      <PeerPicker
        sourceFund={{
          schemeCode,
          schemeName: enrichedScheme.schemeName || schemeCode,
          amc: enrichedScheme.amc || '',
          category: enrichedScheme.category || '',
          subCategory: enrichedScheme.subCategory || '',
          plan: enrichedScheme.plan || '',
          option: enrichedScheme.option || '',
          benchmark: enrichedScheme.benchmark || '',
          expenseRatio: enrichedScheme.expenseRatio || 0,
          aum: enrichedScheme.aum || 0,
          riskLabel: enrichedScheme.riskLabel || '',
        }}
        open={peerPickerOpen}
        onOpenChange={setPeerPickerOpen}
      />
    </div>
  )
}
