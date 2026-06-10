import { useCallback, useEffect, useMemo, useDeferredValue, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Search, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { useFundList, useAmcList } from '@/stores/queries/useFunds'
import { FilterPanel, FundRow, useUniverseFilters } from '@/features/screener'
import { SearchSuggestions } from '@/features/screener/components/SearchSuggestions'
import { getSuperCategory } from '@/lib/category-taxonomy'
import { computeScore } from '@/lib/scorecard'
import type { AmfiSuperCategory } from '@/lib/category-taxonomy'
import type { MFFund } from '@/types/api'
import type { ScorableFund } from '@/types/scorecard'

const SUPER_CATEGORIES: (AmfiSuperCategory | 'All')[] = ['All', 'Equity', 'Debt', 'Hybrid', 'Liquid', 'Other']
const PAGE_SIZES = [25, 50, 100]

export default function UniverseBrowser() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { filters, setFilter, resetFilters, activeFilterCount } = useUniverseFilters()
  const { data: amcOptions = [] } = useAmcList()
  const { data: funds, isLoading, isError, refetch } = useFundList(filters)

  const deferredFunds = useDeferredValue(funds)

  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<string>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [activeSuperCategory, setActiveSuperCategory] = useState<AmfiSuperCategory | 'All'>('All')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  useEffect(() => {
    setPage(1)
  }, [searchQuery, filters, activeSuperCategory, sortField, sortDir])

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

  const handleSort = useCallback((field: string) => {
    setSortDir(prev => sortField === field ? (prev === 'asc' ? 'desc' : 'asc') : 'asc')
    setSortField(field)
  }, [sortField])

  const searchedFunds = useMemo(() => {
    const arr = deferredFunds ?? []
    if (!searchQuery.trim()) return arr
    const q = searchQuery.toLowerCase()
    return arr.filter(fund =>
      fund.schemeName.toLowerCase().includes(q) ||
      (fund.amc && fund.amc.toLowerCase().includes(q)) ||
      (fund.subCategory && fund.subCategory.toLowerCase().includes(q)) ||
      (fund.category && fund.category.toLowerCase().includes(q))
    )
  }, [deferredFunds, searchQuery])

  const categoryFilteredFunds = useMemo(() => {
    if (activeSuperCategory === 'All') return searchedFunds
    return searchedFunds.filter(fund => {
      const sc = getSuperCategory(fund.subCategory ?? '')
      return sc === activeSuperCategory
    })
  }, [searchedFunds, activeSuperCategory])

  const sortedFunds = useMemo(() => {
    const arr = [...categoryFilteredFunds]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'name':
          cmp = a.schemeName.localeCompare(b.schemeName)
          break
        case 'expenseRatio':
          cmp = (a.expenseRatio ?? 0) - (b.expenseRatio ?? 0)
          break
        case 'aum':
          cmp = (a.aum ?? 0) - (b.aum ?? 0)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [categoryFilteredFunds, sortField, sortDir])

  const totalCount = sortedFunds.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const safePage = Math.min(page, totalPages)

  const pageFunds = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return sortedFunds.slice(start, start + pageSize)
  }, [sortedFunds, safePage, pageSize])

  const fundScores = useMemo(() => {
    const scores: Record<string, number> = {}
    for (const fund of pageFunds) {
      const scorable: ScorableFund = {
        schemeCode: fund.schemeCode,
        schemeName: fund.schemeName,
        category: fund.category || undefined,
        subCategory: fund.subCategory || undefined,
        expenseRatio: fund.expenseRatio || undefined,
        aum: fund.aum || undefined,
        riskLabel: fund.riskLabel || undefined,
        benchmark: fund.benchmark || undefined,
        plan: fund.plan || undefined,
        option: fund.option || undefined,
      }
      scores[fund.schemeCode] = computeScore(scorable).compositeScore
    }
    return scores
  }, [pageFunds])

  const SORT_OPTIONS = [
    { value: 'name', label: 'Name' },
    { value: 'expenseRatio', label: 'ER' },
    { value: 'aum', label: 'AUM' },
    { value: 'score', label: 'Score' },
  ] as const

  const renderPagination = () => {
    if (totalCount <= pageSize) return null
    const start = (safePage - 1) * pageSize + 1
    const end = Math.min(safePage * pageSize, totalCount)

    return (
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{start.toLocaleString()}</span> to{' '}
          <span className="font-medium">{end.toLocaleString()}</span> of{' '}
          <span className="font-medium">{totalCount.toLocaleString()}</span> funds
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Per page</span>
            <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1) }}>
              <SelectTrigger className="h-8 w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map(ps => (
                  <SelectItem key={ps} value={String(ps)}>{ps}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (safePage <= 3) {
                pageNum = i + 1
              } else if (safePage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = safePage - 2 + i
              }
              return (
                <Button
                  key={pageNum}
                  variant={safePage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  className="min-w-9"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-display font-semibold text-foreground">Universe Browser</h1>
        <p className="mt-1 text-body text-muted-foreground">
          Browse mutual funds by AMFI category
        </p>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <FilterPanel
          filters={filters}
          onFilterChange={setFilter}
          onApply={handleApply}
          onReset={handleReset}
          amcOptions={amcOptions}
          activeCount={activeFilterCount}
        />
        <div className="flex gap-1">
          {SUPER_CATEGORIES.map(sc => (
            <button
              key={sc}
              onClick={() => setActiveSuperCategory(sc)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                activeSuperCategory === sc
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {sc}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search funds by name, AMC, or category..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => {}}
          />
          <SearchSuggestions
            query={searchQuery}
            onSelect={() => setSearchQuery('')}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-xs text-muted-foreground">Sort by:</span>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleSort(opt.value)}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                sortField === opt.value
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {opt.label}
              {sortField === opt.value ? (
                sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
              ) : (
                <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
              )}
            </button>
          ))}
        </div>
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
      ) : totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-display-sm font-semibold text-foreground">No funds match your criteria</h2>
          <p className="mt-2 text-body text-muted-foreground">
            {searchQuery.trim() ? 'Try a different search term.' : 'Try adjusting your filters.'}
          </p>
          <Button className="mt-6" variant="outline" onClick={() => { setSearchQuery(''); setActiveSuperCategory('All'); resetFilters() }}>
            Clear all
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {pageFunds.map(fund => (
            <FundRow
              key={`${fund.schemeCode}-${fund.plan ?? ''}-${fund.option ?? ''}`}
              fund={fund}
              score={fundScores[fund.schemeCode]}
              onClick={() => navigate({ to: '/scorecard/$schemeCode', params: { schemeCode: fund.schemeCode } })}
            />
          ))}
          {renderPagination()}
        </div>
      )}
    </div>
  )
}
