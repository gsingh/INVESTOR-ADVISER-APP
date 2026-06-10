import { SlidersHorizontal, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet'
import { TermInfo } from '@/components/features/TermInfo'
import { categoryTaxonomy } from '@/lib/category-taxonomy'
import { formatINR, formatPercentage } from '@/lib/formatters'
import type { FundFilters } from '@/stores/queries/useFunds'

interface FilterPanelProps {
  filters: FundFilters
  onFilterChange: <K extends keyof FundFilters>(key: K, value: FundFilters[K]) => void
  onApply: () => void
  onReset: () => void
  amcOptions: string[]
  activeCount: number
}

export function FilterPanel({
  filters,
  onFilterChange,
  onApply,
  onReset,
  amcOptions,
  activeCount,
}: FilterPanelProps) {
  const toggleCategory = (subCategory: string) => {
    const current = filters.categories ?? []
    const next = current.includes(subCategory)
      ? current.filter(c => c !== subCategory)
      : [...current, subCategory]
    onFilterChange('categories', next)
  }

  const toggleBenchmark = (bm: string) => {
    const current = filters.benchmarkTypes ?? []
    const next = current.includes(bm)
      ? current.filter(b => b !== bm)
      : [...current, bm]
    onFilterChange('benchmarkTypes', next.length > 0 ? next : undefined)
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-0">
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <Tabs defaultValue="category" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-4">
            <TabsList className="w-full">
              <TabsTrigger value="category" className="flex-1">Category</TabsTrigger>
              <TabsTrigger value="fundamentals" className="flex-1">Fundamentals</TabsTrigger>
              <TabsTrigger value="benchmark" className="flex-1">Benchmark</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-4">
            <TabsContent value="category" className="mt-4 space-y-4">
              {categoryTaxonomy.map(superCat => (
                <div key={superCat.superCategory}>
                  <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {superCat.superCategory}
                  </p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {superCat.subCategories.map(sub => {
                      const checked = filters.categories?.includes(sub) ?? false
                      return (
                        <label
                          key={sub}
                          className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
                            checked ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCategory(sub)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          {sub}
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="fundamentals" className="mt-4 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Plan Type <TermInfo slug="direct-plan" />
                  </Label>
                  <Select
                    value={filters.planType ?? 'all'}
                    onValueChange={v => onFilterChange('planType', v === 'all' ? undefined : v as 'direct' | 'regular')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All plans" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All plans</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Growth Option <TermInfo slug="growth-option" />
                  </Label>
                  <Select
                    value={filters.growthOnly ? 'growth' : 'all'}
                    onValueChange={v => onFilterChange('growthOnly', v === 'growth')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All options" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All options</SelectItem>
                      <SelectItem value="growth">Growth only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  AMC <TermInfo slug="amc" />
                </Label>
                <Select
                  value={filters.amc ?? 'all'}
                  onValueChange={v => onFilterChange('amc', v === 'all' ? undefined : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All AMCs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All AMCs</SelectItem>
                    {amcOptions.map(amc => (
                      <SelectItem key={amc} value={amc}>{amc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Expense Ratio <TermInfo slug="expense-ratio" />
                </Label>
                <Slider
                  min={0}
                  max={2.5}
                  step={0.05}
                  value={[filters.expenseRatioMax ?? 2.5]}
                  onValueChange={([v]) => onFilterChange('expenseRatioMax', v === 2.5 ? undefined : v)}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>{formatPercentage((filters.expenseRatioMax ?? 2.5) / 100)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  AUM Range <TermInfo slug="aum" />
                </Label>
                <Slider
                  min={0}
                  max={50000}
                  step={500}
                  value={[filters.aumMin ?? 0, filters.aumMax ?? 50000]}
                  onValueChange={([min, max]) => {
                    onFilterChange('aumMin', min === 0 ? undefined : min)
                    onFilterChange('aumMax', max === 50000 ? undefined : max)
                  }}
                  formatLabel={v => formatINR(v * 10000000)}
                />
              </div>
            </TabsContent>

            <TabsContent value="benchmark" className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                Filter by benchmark index type
              </p>
              {['Nifty 50 TRI', 'Nifty 500 TRI', 'S&P BSE Sensex TRI', 'S&P BSE 500 TRI'].map(bm => {
                const checked = filters.benchmarkTypes?.includes(bm) ?? false
                return (
                  <label
                    key={bm}
                    className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
                      checked ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleBenchmark(bm)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    {bm}
                  </label>
                )
              })}
            </TabsContent>
          </div>

          <div className="border-t px-6 py-4 flex items-center justify-between">
            <Button size="sm" onClick={onReset} variant="ghost">
              <RotateCcw className="mr-1 h-3 w-3" />
              Clear all
            </Button>
            <SheetClose asChild>
              <Button size="sm" onClick={onApply}>
                Apply filters
              </Button>
            </SheetClose>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
