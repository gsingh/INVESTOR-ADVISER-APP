import { Link } from '@tanstack/react-router'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { formatINR, formatPercentage } from '@/lib/formatters'

interface GoalBreakdownProps {
  data: { goalId: number; goalName: string; value: number }[]
  loading: boolean
  totalValue: number
}

export function GoalBreakdown({ data, loading, totalValue }: GoalBreakdownProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <p className="py-4 text-body text-muted-foreground">No goals linked to holdings</p>
    )
  }

  return (
    <div className="relative w-full overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Goal</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead className="text-right">% of Portfolio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(row => (
            <TableRow key={row.goalId}>
              <TableCell>
                <Link
                  to="/goals/$goalId"
                  params={{ goalId: String(row.goalId) }}
                  className="text-link hover:underline"
                >
                  {row.goalName}
                </Link>
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatINR(row.value)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {totalValue > 0 ? formatPercentage(row.value / totalValue) : '0.0%'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
