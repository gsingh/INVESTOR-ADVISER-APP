import { useState } from 'react'
import { AddTransactionForm, TransactionList, PortfolioSummary, AllocationDonut, HoldingsTable, GoalBreakdown, usePortfolio } from '@/features/portfolio'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TermInfo } from '@/components/features/TermInfo'

export default function Portfolio() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const portfolio = usePortfolio()

  const hasTransactions = !portfolio.loading && portfolio.totalInvested > 0

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-display font-semibold text-foreground">Portfolio</h2>
          <p className="text-body text-muted-foreground">Track your investments</p>
        </div>
        <AddTransactionForm open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>

      {hasTransactions ? (
        <>
          <PortfolioSummary data={portfolio} />

          <Card>
            <CardHeader>
              <CardTitle className="text-body font-semibold">
                Allocation by Category <TermInfo slug="allocation" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AllocationDonut
                data={portfolio.categoryAllocation}
                loading={portfolio.loading}
                totalValue={portfolio.totalValue}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-body font-semibold">Holdings by Fund</CardTitle>
            </CardHeader>
            <CardContent>
              <HoldingsTable
                data={portfolio.fundContributions}
                loading={portfolio.loading}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-body font-semibold">By Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <GoalBreakdown
                data={portfolio.goalBreakdown}
                loading={portfolio.loading}
                totalValue={portfolio.totalValue}
              />
            </CardContent>
          </Card>

          <div>
            <h3 className="mb-4 text-body font-semibold text-foreground">Transactions</h3>
            <TransactionList onAddClick={() => setDialogOpen(true)} />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-body text-muted-foreground">
            No transactions yet. Log a SIP or lump-sum purchase to track your holdings.
          </p>
          <Button className="mt-4" onClick={() => setDialogOpen(true)}>
            Add Transaction
          </Button>
        </div>
      )}
    </div>
  )
}
