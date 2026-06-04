import { useMemo, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { TermInfo } from '@/components/features/TermInfo'
import { useToast } from '@/components/ui/toast'
import { useNav } from '@/stores/queries/useNav'
import { useScheme } from '@/stores/queries/useScheme'
import { computeOverlap } from '@/lib/overlap'
import { OverlapIndicator } from './OverlapIndicator'
import { db } from '@/stores/db'
import type { NavEntry, SchemeDetail } from '@/types/api'

function formatNavDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
  } catch {
    return dateStr
  }
}

function formatCurrency(n: number): string {
  if (!Number.isFinite(n)) return '—'
  if (n >= 10000) return `₹${(n / 1000).toFixed(1)}K Cr`
  if (n >= 100) return `₹${n.toFixed(0)} Cr`
  return `₹${n.toFixed(2)} Cr`
}

interface InfoCardProps {
  label: string
  value: string
  termSlug: string
}

function InfoCard({ label, value, termSlug }: InfoCardProps) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1 text-small text-muted-foreground">
        <span>{label}</span>
        <TermInfo slug={termSlug} />
      </div>
      <p className="mt-1 text-mono text-display-sm font-bold tabular-nums">{value}</p>
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
          labelFormatter={d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
  if (!schemeCode) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-body text-muted-foreground">No fund selected.</p>
      </div>
    )
  }
  const { data: navData, isLoading: navLoading, error: navError, refetch: refetchNav } = useNav(schemeCode)
  const { data: scheme, isLoading: schemeLoading, error: schemeError, refetch: refetchScheme } = useScheme(schemeCode)
  const portfolios = useLiveQuery(() => db.portfolios.toArray(), [], [])
  const { addToast } = useToast()

  const isLoading = navLoading || schemeLoading
  const hasError = navError || schemeError

  const overlapResult = useMemo(() => {
    if (!scheme || !scheme.sectorAllocation.length) return null
    if (!portfolios || !portfolios.length) {
      return computeOverlap(scheme.sectorAllocation, [])
    }
    return null
  }, [scheme, portfolios])

  useEffect(() => {
    if (hasError) {
      addToast("Couldn't fetch fund details. The data source may be temporarily unavailable.", 'error')
    }
  }, [hasError, addToast])

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

  if (isLoading && !navData && !scheme) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-60 rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-48 rounded-lg" />
          <div className="space-y-6">
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-40 rounded-lg" />
      </div>
    )
  }

  if (!scheme) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-body text-muted-foreground">Fund not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display font-semibold text-foreground">{scheme.schemeName}</h1>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="outline" className="text-small">{scheme.category || '—'}</Badge>
          <Badge variant="outline" className="text-small">{scheme.plan || '—'}</Badge>
          <Badge variant="outline" className="text-small">{scheme.option || '—'}</Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <InfoCard label="Expense Ratio" value={`${scheme.expenseRatio.toFixed(2)}%`} termSlug="expense-ratio" />
        <InfoCard label="AUM" value={formatCurrency(scheme.aum)} termSlug="aum" />
        <InfoCard
          label="Exit Load"
          value={scheme.exitLoad?.exists ? `${scheme.exitLoad.rate ?? 0}% (${scheme.exitLoad.durationYears ?? 0}yr)` : 'None'}
          termSlug="exit-load"
        />
        <InfoCard label="Risk" value={scheme.riskLabel || '—'} termSlug="risk" />
      </div>

      <Card className="p-4">
        <h3 className="mb-3 text-label font-semibold">
          NAV History <TermInfo slug="nav" />
        </h3>
        <NavChart data={navData ?? []} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 text-label font-semibold">
            Sector Allocation <TermInfo slug="sector-allocation" />
          </h3>
          <SectorChart scheme={scheme} />
        </Card>

        <div className="space-y-6">
          <Card className="p-4">
            <h3 className="mb-3 text-label font-semibold">
              Rolling Returns <TermInfo slug="rolling-returns" /> <TermInfo slug="benchmark" />
            </h3>
            <ReturnsChart scheme={scheme} />
          </Card>

          <OverlapIndicator overlap={overlapResult} isLoading={false} />
        </div>
      </div>

      <Card className="p-4">
        <h3 className="mb-3 text-label font-semibold">
          Portfolio Holdings <TermInfo slug="portfolio-holdings" />
        </h3>
        <HoldingsTable scheme={scheme} />
      </Card>
    </div>
  )
}
