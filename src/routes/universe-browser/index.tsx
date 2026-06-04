import { useCallback, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Search, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { useFundList, useAmcList } from '@/stores/queries/useFunds'
import { FilterPanel, FundRow, useUniverseFilters } from '@/features/screener'
import { getSuperCategory } from '@/lib/category-taxonomy'

export default function UniverseBrowser() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { filters, setFilter, resetFilters, activeFilterCount } = useUniverseFilters()
  const { data: amcOptions = [] } = useAmcList()
  const { data: funds, isLoading, isError, error, refetch } = useFundList(filters)

  useEffect(() => {
    if (isError) {
      addToast({ title: "Couldn't fetch fund data", description: 'The data source may be temporarily unavailable. Try again later.', variant: 'destructive' })
    }
  }, [isError, addToast])

  const handleApply = useCallback(() => {
    refetch().catch(() => {})
  }, [refetch])

  const handleReset = useCallback(() => {
    resetFilters()
  }, [resetFilters])

  const groupedFunds = (funds ?? []).reduce<Record<string, typeof funds>>((acc, fund) => {
    const key = getSuperCategory(fund.subCategory) ?? 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(fund)
    return acc
  }, {})

  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-display font-semibold text-foreground">Universe Browser</h1>
        <p className="mt-1 text-body text-muted-foreground">
          Browse mutual funds by AMFI category
        </p>
      </div>

      <div className="mb-6">
        <FilterPanel
          filters={filters}
          onFilterChange={setFilter}
          onApply={handleApply}
          onReset={handleReset}
          amcOptions={amcOptions}
          activeCount={activeFilterCount}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
          <p className="mt-2 text-center text-sm text-muted-foreground">Fetching fund data...</p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-display-sm font-semibold text-foreground">Couldn't fetch fund data</h2>
          <p className="mt-2 max-w-md text-body text-muted-foreground">
            The data source may be temporarily unavailable. Try again later.
          </p>
          <Button className="mt-6" onClick={() => refetch().catch(() => {})}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : funds?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-display-sm font-semibold text-foreground">No funds match your filters</h2>
          <p className="mt-2 text-body text-muted-foreground">
            Try adjusting your criteria.
          </p>
          <Button className="mt-6" variant="outline" onClick={handleReset}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedFunds).map(([superCategory, categoryFunds]) => (
            <div key={superCategory}>
              <h2 className="mb-3 text-display-sm font-semibold text-foreground">{superCategory}</h2>
              <div className="space-y-2">
                {categoryFunds.map(fund => (
                  <FundRow
                    key={fund.schemeCode}
                    fund={fund}
                    onClick={() => navigate({ to: '/scorecard/$schemeCode', params: { schemeCode: fund.schemeCode } })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
