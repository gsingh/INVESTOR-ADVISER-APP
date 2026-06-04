import { useState } from 'react'
import { SlidersHorizontal, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
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
  const [open, setOpen] = useState(true)

  const toggleCategory = (subCategory: string) => {
    const current = filters.categories ?? []
    const next = current.includes(subCategory)
      ? current.filter(c => c !== subCategory)
      : [...current, subCategory]
    onFilterChange('categories', next)
  }

  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeCount}
            </span>
          )}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="space-y-4 px-4 pb-4">
          <Separator />

          <div>
            <Label className="mb-2 flex items-center gap-1">
              AMFI Category <TermInfo slug="amfi-category" />
            </Label>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {categoryTaxonomy.map(superCat => (
                <div key={superCat.superCategory}>
                  <p className="px-1 py-1 text-xs font-semibold text-muted-foreground">
                    {superCat.superCategory}
                  </p>
                  {superCat.subCategories.map(sub => (
                    <label
                      key={sub}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={filters.categories?.includes(sub) ?? false}
                        onChange={() => toggleCategory(sub)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      {sub}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 flex items-center gap-1">
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

            <div>
              <Label className="mb-2 flex items-center gap-1">
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

          <Separator />

          <div>
            <Label className="mb-2 flex items-center gap-1">
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

          <Separator />

          <div>
            <Label className="mb-2 flex items-center gap-1">
              Expense Ratio <TermInfo slug="expense-ratio" />
            </Label>
            <div className="space-y-2">
              <input
                type="range"
                min={0}
                max={2.5}
                step={0.05}
                value={filters.expenseRatioMax ?? 2.5}
                onChange={e => {
                  const v = Number(e.target.value)
                  onFilterChange('expenseRatioMax', v === 2.5 ? undefined : v)
                }}
                className="w-full cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-small text-muted-foreground">
                <span>0%</span>
                <span>{formatPercentage((filters.expenseRatioMax ?? 2.5) / 100)}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <Label className="mb-2 flex items-center gap-1">
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

          <Separator />

          <div>
            <Label className="mb-2 flex items-center gap-1">
              Benchmark Type <TermInfo slug="benchmark" />
            </Label>
            <div className="max-h-32 space-y-1 overflow-y-auto">
              {['Nifty 50 TRI', 'Nifty 500 TRI', 'S&P BSE Sensex TRI', 'S&P BSE 500 TRI'].map(bm => (
                <label
                  key={bm}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={filters.benchmarkTypes?.includes(bm) ?? false}
                    onChange={() => {
                      const current = filters.benchmarkTypes ?? []
                      const next = current.includes(bm)
                        ? current.filter(b => b !== bm)
                        : [...current, bm]
                      onFilterChange('benchmarkTypes', next.length > 0 ? next : undefined)
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  {bm}
                </label>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between pt-2">
            <Button size="sm" onClick={onReset} variant="ghost">
              <RotateCcw className="mr-1 h-3 w-3" />
              Clear all
            </Button>
            <Button size="sm" onClick={onApply}>
              Apply filters
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
