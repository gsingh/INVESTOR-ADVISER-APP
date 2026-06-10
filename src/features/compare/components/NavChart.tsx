import { useNavigate } from '@tanstack/react-router'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/card'
import type { NavEntry, MFFund } from '@/types/api'

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

function sampleData(data: NavEntry[], maxPoints: number): NavEntry[] {
  if (data.length <= maxPoints) return data
  const step = Math.ceil(data.length / maxPoints)
  const last = data[data.length - 1]
  const filtered = data.filter((_, i) => i % step === 0)
  if (filtered[filtered.length - 1] !== last) filtered.push(last)
  return filtered
}

const CHART_COLORS = ['#2E8B57', '#2563EB', '#D97706', '#DC2626']

interface MiniNavChartCardProps {
  fund: MFFund
  navData: NavEntry[]
  colorIndex?: number
}

export function MiniNavChartCard({ fund, navData, colorIndex = 0 }: MiniNavChartCardProps) {
  const navigate = useNavigate()
  const color = CHART_COLORS[colorIndex % CHART_COLORS.length]
  const sampled = sampleData(navData, 100)
  const hasData = sampled.length > 0

  return (
    <Card
      className="p-3 cursor-pointer transition-colors hover:bg-muted/50"
      onClick={() => navigate({ to: '/scorecard/$schemeCode', params: { schemeCode: fund.schemeCode } })}
    >
      <p className="mb-1 truncate text-xs font-medium text-muted-foreground">{fund.schemeName}</p>
      <div className="h-20">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sampled} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <Line type="monotone" dataKey="nav" stroke={color} dot={false} strokeWidth={1.5} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-[10px] text-muted-foreground">No data</span>
          </div>
        )}
      </div>
    </Card>
  )
}

interface DetailNavChartProps {
  data: NavEntry[]
}

export function DetailNavChart({ data }: DetailNavChartProps) {
  if (!data.length) {
    return <p className="py-8 text-center text-small text-muted-foreground">No NAV history available.</p>
  }
  const sampled = sampleData(data, 200)
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
          labelFormatter={d => {
            const pd = parseDDMMYYYY(String(d))
            if (!pd) return String(d)
            return pd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          }}
          formatter={(value: number) => [`₹${value.toFixed(2)}`, 'NAV']}
        />
        <Line type="monotone" dataKey="nav" stroke="#2E8B57" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}

interface CompareNavChartsProps {
  funds: { fund: MFFund; navData: NavEntry[] }[]
}

export function CompareNavCharts({ funds }: CompareNavChartsProps) {
  const hasAnyData = funds.some(f => f.navData.length > 0)
  if (!hasAnyData) return null
  return (
    <div>
      <h3 className="mb-3 text-label font-semibold">NAV History</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {funds.map((f, i) => (
          <MiniNavChartCard key={f.fund.schemeCode} fund={f.fund} navData={f.navData} colorIndex={i} />
        ))}
      </div>
    </div>
  )
}
