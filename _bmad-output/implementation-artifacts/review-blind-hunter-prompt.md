# Blind Hunter Review — Story 4.3

You receive ONLY the diff below. No project context, no spec.

Review this code adversarially. Look for:
- Logic errors, race conditions, incorrect assumptions
- Missing null/undefined checks
- API misuse (React hooks rules, TanStack Query patterns)
- TypeScript type safety issues
- Memory leaks or performance problems
- Security vulnerabilities (XSS, injection, data exposure)

Output findings as a Markdown list. Each finding: one-line title + severity (High/Med/Low) + evidence from the diff with line reference.

## Diff

```
diff --git a/src/features/portfolio/hooks/usePortfolio.ts b/src/features/portfolio/hooks/usePortfolio.ts
new file mode 100644
index 0000000..e5e16f8
--- /dev/null
+++ b/src/features/portfolio/hooks/usePortfolio.ts
@@ -0,0 +1,159 @@
+import { useMemo } from 'react'
+import { useQueries } from '@tanstack/react-query'
+import { useLiveQuery } from 'dexie-react-hooks'
+import { db } from '@/stores/db'
+import { computeXIRR, type XirrTransaction } from '@/lib/xirr'
+import { navHistoryResponseSchema } from '@/types/api'
+
+const API_BASE = '/api/mfapi'
+
+export interface PortfolioSummary {
+  totalValue: number
+  totalInvested: number
+  unrealizedGainLoss: number
+  xirr: number | null
+  categoryAllocation: { category: string; value: number; percentage: number }[]
+  fundContributions: { schemeCode: string; schemeName: string; value: number; percentage: number }[]
+  goalBreakdown: { goalId: number; goalName: string; value: number }[]
+  loading: boolean
+}
+
+export function usePortfolio(): PortfolioSummary {
+  const transactions = useLiveQuery(() => db.transactions.toArray())
+  const portfolios = useLiveQuery(() => db.portfolios.toArray())
+  const goals = useLiveQuery(() => db.goals.toArray())
+
+  const schemeCodes = useMemo(
+    () => [...new Set((portfolios ?? []).map(p => p.schemeCode))],
+    [portfolios],
+  )
+
+  const navQueries = useQueries({
+    queries: schemeCodes.map(code => ({
+      queryKey: ['nav', code],
+      queryFn: async ({ signal }) => {
+        const res = await fetch(`${API_BASE}/nav/${code}`, { signal })
+        if (!res.ok) throw new Error(`API error: ${res.status}`)
+        const data = await res.json()
+        return navHistoryResponseSchema.parse(data)
+      },
+      staleTime: 30 * 60 * 1000,
+      retry: 3,
+      retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10000),
+    })),
+  })
+
+  return useMemo(() => {
+    const loading =
+      transactions === undefined ||
+      portfolios === undefined ||
+      goals === undefined ||
+      navQueries.some(q => q.isLoading)
+
+    if (loading || !transactions || !portfolios || !goals) {
+      return {
+        totalValue: 0,
+        totalInvested: 0,
+        unrealizedGainLoss: 0,
+        xirr: null,
+        categoryAllocation: [],
+        fundContributions: [],
+        goalBreakdown: [],
+        loading: true,
+      }
+    }
+
+    const goalMap = new Map(goals.filter(g => g.id != null).map(g => [g.id!, g.name]))
+
+    const totalInvested = transactions
+      .filter(t => t.amount < 0)
+      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
+
+    const latestNavMap = new Map<string, number>()
+    schemeCodes.forEach((code, i) => {
+      const data = navQueries[i]?.data
+      if (data && data.length > 0) {
+        latestNavMap.set(code, data[data.length - 1].nav)
+      } else {
+        const lastTx = [...transactions].reverse().find(t => t.schemeCode === code)
+        if (lastTx) latestNavMap.set(code, lastTx.nav)
+      }
+    })
+
+    const portfolioValues = portfolios.map(p => ({
+      ...p,
+      currentValue: p.units * (latestNavMap.get(p.schemeCode) ?? 0),
+    }))
+
+    const totalValue = portfolioValues.reduce((sum, p) => sum + p.currentValue, 0)
+
+    const categoryMap = new Map<string, number>()
+    portfolioValues.forEach(p => {
+      const cat = p.category || 'Uncategorized'
+      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + p.currentValue)
+    })
+    const categoryAllocation = Array.from(categoryMap.entries())
+      .map(([category, value]) => ({
+        category,
+        value,
+        percentage: totalValue > 0 ? value / totalValue : 0,
+      }))
+      .sort((a, b) => b.value - a.value)
+
+    const fundMap = new Map<string, { schemeName: string; value: number }>()
+    portfolioValues.forEach(p => {
+      const existing = fundMap.get(p.schemeCode)
+      if (existing) {
+        existing.value += p.currentValue
+      } else {
+        fundMap.set(p.schemeCode, { schemeName: p.schemeName, value: p.currentValue })
+      }
+    })
+    const fundContributions = Array.from(fundMap.entries())
+      .map(([schemeCode, { schemeName, value }]) => ({
+        schemeCode,
+        schemeName,
+        value,
+        percentage: totalValue > 0 ? value / totalValue : 0,
+      }))
+      .sort((a, b) => b.value - a.value)
+
+    const goalValueMap = new Map<number, number>()
+    portfolioValues.forEach(p => {
+      if (p.goalId != null) {
+        goalValueMap.set(p.goalId, (goalValueMap.get(p.goalId) ?? 0) + p.currentValue)
+      }
+    })
+    const goalBreakdown = Array.from(goalValueMap.entries())
+      .map(([goalId, value]) => ({
+        goalId,
+        goalName: goalMap.get(goalId) ?? `Goal #${goalId}`,
+        value,
+      }))
+      .sort((a, b) => b.value - a.value)
+
+    let xirr: number | null = null
+    if (transactions.length > 0 && totalInvested > 0) {
+      const xirrInput: XirrTransaction[] = transactions.map(t => ({
+        date: t.date,
+        amount: -Math.abs(t.amount),
+      }))
+      xirrInput.push({
+        date: new Date().toISOString().split('T')[0],
+        amount: totalValue,
+      })
+      xirr = computeXIRR(xirrInput)
+    }
+
+    return {
+      totalValue,
+      totalInvested,
+      unrealizedGainLoss: totalValue - totalInvested,
+      xirr,
+      categoryAllocation,
+      fundContributions,
+      goalBreakdown,
+      loading: false,
+    }
+  }, [transactions, portfolios, goals, navQueries, schemeCodes])
+}
diff --git a/src/features/portfolio/components/PortfolioSummary.tsx b/src/features/portfolio/components/PortfolioSummary.tsx
new file mode 100644
index 0000000..04c1f44
--- /dev/null
+++ b/src/features/portfolio/components/PortfolioSummary.tsx
@@ -0,0 +1,68 @@
+import { Card } from '@/components/ui/card'
+import { Skeleton } from '@/components/ui/skeleton'
+import { TermInfo } from '@/components/features/TermInfo'
+import { formatINR, formatPercentage } from '@/lib/formatters'
+import type { PortfolioSummary as PortfolioSummaryType } from '../hooks/usePortfolio'
+
+interface PortfolioSummaryProps {
+  data: PortfolioSummaryType
+}
+
+export function PortfolioSummary({ data }: PortfolioSummaryProps) {
+  if (data.loading) {
+    return (
+      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
+        {Array.from({ length: 4 }).map((_, i) => (
+          <Card key={i} className="p-4">
+            <Skeleton className="mb-2 h-3 w-20" />
+            <Skeleton className="h-7 w-32" />
+          </Card>
+        ))}
+      </div>
+    )
+  }
+
+  const cards = [
+    {
+      label: 'Total Value',
+      value: formatINR(data.totalValue),
+      term: 'nav',
+      mono: true,
+    },
+    {
+      label: 'XIRR Since Inception',
+      value: data.xirr != null ? formatPercentage(data.xirr) : '—',
+      term: 'xirr',
+      mono: true,
+      valueClass: data.xirr != null && data.xirr >= 0 ? 'text-green-600' : 'text-red-600',
+    },
+    {
+      label: 'Unrealized Gain/Loss',
+      value: data.unrealizedGainLoss >= 0 ? `+${formatINR(data.unrealizedGainLoss)}` : formatINR(data.unrealizedGainLoss),
+      term: 'xirr',
+      mono: true,
+      valueClass: data.unrealizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600',
+    },
+    {
+      label: 'Total Invested',
+      value: formatINR(data.totalInvested),
+      term: 'sip',
+      mono: true,
+    },
+  ]
+
+  return (
+    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
+      {cards.map(card => (
+        <Card key={card.label} className="p-4">
+          <p className="mb-1 text-label text-muted-foreground">
+            {card.label} <TermInfo slug={card.term} />
+          </p>
+          <p className={`font-mono text-display-sm font-semibold ${card.valueClass ?? ''}`}>
+            {card.value}
+          </p>
+        </Card>
+      ))}
+    </div>
+  )
+}
diff --git a/src/features/portfolio/components/AllocationDonut.tsx b/src/features/portfolio/components/AllocationDonut.tsx
new file mode 100644
index 0000000..1d741f9
--- /dev/null
+++ b/src/features/portfolio/components/AllocationDonut.tsx
@@ -0,0 +1,78 @@
+import { useId } from 'react'
+import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
+import { Skeleton } from '@/components/ui/skeleton'
+import { formatINR } from '@/lib/formatters'
+
+const COLORS = [
+  '#2E8B57', '#1B3A5C', '#E8A317', '#D47559', '#5B8FA8',
+  '#7B68EE', '#CD853F', '#6B8E23', '#B8860B', '#A0522D',
+]
+
+interface AllocationDonutProps {
+  data: { category: string; value: number; percentage: number }[]
+  loading: boolean
+  totalValue: number
+}
+
+interface Payload {
+  name: string
+  value: number
+  payload: { category: string; value: number; percentage: number }
+}
+
+export function AllocationDonut({ data, loading, totalValue }: AllocationDonutProps) {
+  const id = useId()
+
+  if (loading) {
+    return (
+      <div className="flex items-center justify-center py-8">
+        <Skeleton className="h-48 w-48 rounded-full" />
+      </div>
+    )
+  }
+
+  if (data.length === 0 || totalValue === 0) {
+    return (
+      <div className="flex items-center justify-center py-8 text-body text-muted-foreground">
+        No holdings data
+      </div>
+    )
+  }
+
+  const chartData = data.map(d => ({
+    name: d.category,
+    value: d.value,
+    percentage: d.percentage,
+  }))
+
+  return (
+    <div className="flex justify-center">
+      <PieChart width={320} height={320}>
+        <Pie
+          data={chartData}
+          cx="50%"
+          cy="50%"
+          innerRadius={70}
+          outerRadius={110}
+          paddingAngle={2}
+          dataKey="value"
+        >
+          {chartData.map((_, index) => (
+            <Cell key={`${id}-${index}`} fill={COLORS[index % COLORS.length]} />
+          ))}
+        </Pie>
+        <Tooltip
+          formatter={(value: number, _name: string, entry: { payload: Payload['payload'] }) => [
+            formatINR(value),
+            entry.payload.category,
+          ]}
+        />
+        <Legend
+          formatter={(value: string) => (
+            <span className="text-label text-muted-foreground">{value}</span>
+          )}
+        />
+      </PieChart>
+    </div>
+  )
+}
diff --git a/src/features/portfolio/components/HoldingsTable.tsx b/src/features/portfolio/components/HoldingsTable.tsx
new file mode 100644
index 0000000..b7ea323
--- /dev/null
+++ b/src/features/portfolio/components/HoldingsTable.tsx
@@ -0,0 +1,55 @@
+import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
+import { Skeleton } from '@/components/ui/skeleton'
+import { formatINR, formatPercentage } from '@/lib/formatters'
+
+interface HoldingsTableProps {
+  data: { schemeCode: string; schemeName: string; value: number; percentage: number }[]
+  loading: boolean
+}
+
+export function HoldingsTable({ data, loading }: HoldingsTableProps) {
+  if (loading) {
+    return (
+      <div className="space-y-3">
+        {Array.from({ length: 5 }).map((_, i) => (
+          <Skeleton key={i} className="h-8 w-full" />
+        ))}
+      </div>
+    )
+  }
+
+  if (data.length === 0) {
+    return (
+      <p className="py-4 text-body text-muted-foreground">No holdings yet</p>
+    )
+  }
+
+  return (
+    <div className="relative w-full overflow-auto rounded-md border">
+      <Table>
+        <TableHeader>
+          <TableRow>
+            <TableHead>Fund Name</TableHead>
+            <TableHead className="text-right">Value</TableHead>
+            <TableHead className="text-right">% of Portfolio</TableHead>
+          </TableRow>
+        </TableHeader>
+        <TableBody>
+          {data.map(row => (
+            <TableRow key={row.schemeCode}>
+              <TableCell className="max-w-[300px] truncate" title={row.schemeName}>
+                {row.schemeName}
+              </TableCell>
+              <TableCell className="text-right font-medium tabular-nums">
+                {formatINR(row.value)}
+              </TableCell>
+              <TableCell className="text-right tabular-nums">
+                {formatPercentage(row.percentage)}
+              </TableCell>
+            </TableRow>
+          ))}
+        </TableBody>
+      </Table>
+    </div>
+  )
+}
diff --git a/src/features/portfolio/components/GoalBreakdown.tsx b/src/features/portfolio/components/GoalBreakdown.tsx
new file mode 100644
index 0000000..b2922e4
--- /dev/null
+++ b/src/features/portfolio/components/GoalBreakdown.tsx
@@ -0,0 +1,63 @@
+import { Link } from '@tanstack/react-router'
+import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
+import { Skeleton } from '@/components/ui/skeleton'
+import { formatINR, formatPercentage } from '@/lib/formatters'
+
+interface GoalBreakdownProps {
+  data: { goalId: number; goalName: string; value: number }[]
+  loading: boolean
+  totalValue: number
+}
+
+export function GoalBreakdown({ data, loading, totalValue }: GoalBreakdownProps) {
+  if (loading) {
+    return (
+      <div className="space-y-3">
+        {Array.from({ length: 3 }).map((_, i) => (
+          <Skeleton key={i} className="h-8 w-full" />
+        ))}
+      </div>
+    )
+  }
+
+  if (data.length === 0) {
+    return (
+      <p className="py-4 text-body text-muted-foreground">No goals linked to holdings</p>
+    )
+  }
+
+  return (
+    <div className="relative w-full overflow-auto rounded-md border">
+      <Table>
+        <TableHeader>
+          <TableRow>
+            <TableHead>Goal</TableHead>
+            <TableHead className="text-right">Value</TableHead>
+            <TableHead className="text-right">% of Portfolio</TableHead>
+          </TableRow>
+        </TableHeader>
+        <TableBody>
+          {data.map(row => (
+            <TableRow key={row.goalId}>
+              <TableCell>
+                <Link
+                  to="/goals/$goalId"
+                  params={{ goalId: String(row.goalId) }}
+                  className="text-link hover:underline"
+                >
+                  {row.goalName}
+                </Link>
+              </TableCell>
+              <TableCell className="text-right font-medium tabular-nums">
+                {formatINR(row.value)}
+              </TableCell>
+              <TableCell className="text-right tabular-nums">
+                {totalValue > 0 ? formatPercentage(row.value / totalValue) : '0.0%'}
+              </TableCell>
+            </TableRow>
+          ))}
+        </TableBody>
+      </Table>
+    </div>
+  )
+}
diff --git a/src/features/settings/hooks/useDataExport.ts b/src/features/settings/hooks/useDataExport.ts
new file mode 100644
index 0000000..bf022bb
--- /dev/null
+++ b/src/features/settings/hooks/useDataExport.ts
@@ -0,0 +1,106 @@
+import { useCallback } from 'react'
+import { db } from '@/stores/db'
+
+const TABLE_NAMES = [
+  'goals',
+  'transactions',
+  'portfolios',
+  'journals',
+  'scorecardWeights',
+  'riskProfiles',
+  'glossary',
+  'goalHoldings',
+] as const
+
+type TableName = (typeof TABLE_NAMES)[number]
+
+interface ExportData {
+  version: number
+  exportedAt: string
+  tables: Partial<Record<TableName, unknown[]>>
+}
+
+export function useDataExport() {
+  const exportData = useCallback(async () => {
+    const tables: ExportData['tables'] = {}
+
+    for (const name of TABLE_NAMES) {
+      const table = (db as any)[name]
+      if (table) {
+        tables[name] = await table.toArray()
+      }
+    }
+
+    const payload: ExportData = {
+      version: 1,
+      exportedAt: new Date().toISOString(),
+      tables,
+    }
+
+    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
+    const url = URL.createObjectURL(blob)
+    const a = document.createElement('a')
+    a.href = url
+    a.download = `investor-data-${new Date().toISOString().split('T')[0]}.json`
+    document.body.appendChild(a)
+    a.click()
+    document.body.removeChild(a)
+    URL.revokeObjectURL(url)
+  }, [])
+
+  const importData = useCallback(async (file: File) => {
+    const text = await file.text()
+    let data: unknown
+    try {
+      data = JSON.parse(text)
+    } catch {
+      return { success: false, tableCount: 0, error: 'Invalid JSON file' }
+    }
+
+    if (typeof data !== 'object' || data === null) {
+      return { success: false, tableCount: 0, error: 'Invalid export format' }
+    }
+
+    const payload = data as Record<string, unknown>
+    if (payload.version !== 1) {
+      return { success: false, tableCount: 0, error: 'Unsupported export version' }
+    }
+
+    const tables = payload.tables
+    if (typeof tables !== 'object' || tables === null) {
+      return { success: false, tableCount: 0, error: 'Missing tables data' }
+    }
+
+    const tableRecords = tables as Record<string, unknown[]>
+    const tableNames = Object.keys(tableRecords).filter(key =>
+      TABLE_NAMES.includes(key as TableName),
+    )
+
+    if (tableNames.length === 0) {
+      return { success: false, tableCount: 0, error: 'No recognizable tables found in export' }
+    }
+
+    try {
+      await db.transaction('rw', ...tableNames.map(n => (db as any)[n]), async () => {
+        for (const name of tableNames) {
+          const table = (db as any)[name]
+          await table.clear()
+          const records = tableRecords[name]
+          if (records && records.length > 0) {
+            await table.bulkAdd(records)
+          }
+        }
+      })
+    } catch (e) {
+      return {
+        success: false,
+        tableCount: 0,
+        error: `Import failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
+      }
+    }
+
+    return { success: true, tableCount: tableNames.length, error: undefined }
+  }, [])
+
+  return { exportData, importData }
+}
```
