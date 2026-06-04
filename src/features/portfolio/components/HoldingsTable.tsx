import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { formatINR, formatPercentage } from '@/lib/formatters'

interface HoldingsTableProps {
  data: { schemeCode: string; schemeName: string; value: number; percentage: number }[]
  loading: boolean
}

export function HoldingsTable({ data, loading }: HoldingsTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <p className="py-4 text-body text-muted-foreground">No holdings yet</p>
    )
  }

  return (
    <div className="relative w-full overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fund Name</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead className="text-right">% of Portfolio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(row => (
            <TableRow key={row.schemeCode}>
              <TableCell className="max-w-[300px] truncate" title={row.schemeName}>
                {row.schemeName}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatINR(row.value)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPercentage(row.percentage)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
