import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { db } from '@/stores/db'
import { formatDate, formatINR } from '@/lib/formatters'
import { useToast } from '@/components/ui/toast'
import { useTransactions } from '../hooks/useTransactions'
import type { TransactionRow } from '@/types/transaction'

const PAGE_SIZE = 10

interface TransactionListProps {
  onAddClick?: () => void
}

export function TransactionList({ onAddClick }: TransactionListProps) {
  const { transactions, loading, deleteTransaction } = useTransactions()
  const { addToast } = useToast()
  const [page, setPage] = useState(0)

  const portfolioMap = useLiveQuery(async () => {
    const items = await db.portfolios.toArray()
    return new Map(items.map(i => [i.schemeCode, i.schemeName]))
  })

  const goalMap = useLiveQuery(async () => {
    const items = await db.goals.toArray()
    return new Map(items.map(g => [g.id!, g.name]))
  })

  const rows: TransactionRow[] = (transactions ?? []).map(tx => ({
    ...tx,
    schemeName: portfolioMap?.get(tx.schemeCode) ?? `Scheme ${tx.schemeCode}`,
    goalName: tx.goalId ? goalMap?.get(tx.goalId) : undefined,
  }))

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const start = safePage * PAGE_SIZE
  const pageRows = rows.slice(start, start + PAGE_SIZE)

  async function handleDelete(id: number) {
    try {
      await deleteTransaction(id)
    } catch {
      addToast({ title: 'Failed to delete transaction', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-body text-muted-foreground">
          No transactions yet. Log a SIP or lump-sum purchase to track your holdings.
        </p>
        <Button className="mt-4" onClick={onAddClick}>
          Add Transaction
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="relative w-full overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Fund</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">NAV</TableHead>
              <TableHead className="text-right">Units</TableHead>
              <TableHead>Goal</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map(tx => (
              <TableRow key={tx.id}>
                <TableCell className="whitespace-nowrap">{formatDate(tx.date)}</TableCell>
                <TableCell className="max-w-[200px] truncate" title={tx.schemeName}>
                  {tx.schemeName}
                </TableCell>
                <TableCell>
                  <Badge variant={tx.type === 'SIP' ? 'secondary' : 'default'}>
                    {tx.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatINR(tx.amount)}</TableCell>
                <TableCell className="text-right tabular-nums">{tx.nav.toFixed(4)}</TableCell>
                <TableCell className="text-right tabular-nums">{tx.units.toFixed(4)}</TableCell>
                <TableCell className="max-w-[120px] truncate" title={tx.goalName}>
                  {tx.goalName ?? '—'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => tx.id != null && handleDelete(tx.id)}
                    aria-label="Delete transaction"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <p className="text-sm text-muted-foreground">
          Page {safePage + 1} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={safePage === 0}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
