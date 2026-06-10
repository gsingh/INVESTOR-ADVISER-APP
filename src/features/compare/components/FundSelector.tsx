import { useState, useMemo, useRef, useEffect, type KeyboardEvent } from 'react'
import { X, Search, Plus, List, ToggleRight, ToggleLeft } from 'lucide-react'
import { useFundList } from '@/stores/queries/useFunds'
import { Badge } from '@/components/ui/badge'
import type { MFFund } from '@/types/api'

const MAX_FUNDS = 4

interface FundSelectorProps {
  selected: MFFund[]
  onSelect: (fund: MFFund) => void
  onRemove: (schemeCode: string) => void
}

type SuggestionGroup = 'peer' | 'diff-plan' | 'diff-category'

interface GroupedSuggestion {
  fund: MFFund
  group: SuggestionGroup
}

function getGroup(
  fund: MFFund,
  anchorSubCategory?: string,
  anchorPlan?: string,
): SuggestionGroup {
  const fundCat = (fund.subCategory || fund.category || '').toLowerCase()
  const anchorCat = (anchorSubCategory || '').toLowerCase()
  const fundPlan = (fund.plan || '').toLowerCase()
  const anchorP = (anchorPlan || '').toLowerCase()

  if (!anchorCat) return 'peer'
  if (anchorCat && fundCat !== anchorCat) return 'diff-category'
  if (anchorP && fundPlan !== anchorP) return 'diff-plan'
  return 'peer'
}

const GROUP_LABELS: Record<SuggestionGroup, string> = {
  peer: 'Same peer group',
  'diff-plan': 'Different plan type',
  'diff-category': 'Different category',
}

const GROUP_BADGE_VARIANTS: Record<SuggestionGroup, string> = {
  peer: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'diff-plan': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  'diff-category': 'bg-muted text-muted-foreground',
}

export function FundSelector({ selected, onSelect, onRemove }: FundSelectorProps) {
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [focusedIdx, setFocusedIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const { data: allFunds, isLoading } = useFundList({})

  const selectedCodes = useMemo(
    () => new Set(selected.map((f) => f.schemeCode)),
    [selected],
  )

  const anchor = useMemo(() => {
    if (selected.length === 0) return null
    const first = selected[0]
    return { subCategory: first.subCategory, plan: first.plan }
  }, [selected])

  const isAtMax = selected.length >= MAX_FUNDS

  const { grouped, flat } = useMemo(() => {
    if (!allFunds) return { grouped: [], flat: [] }
    const q = query.toLowerCase().trim()
    const matched: MFFund[] = !q
      ? []
      : allFunds.filter(
          (f) =>
            f.schemeName?.toLowerCase().includes(q) ||
            f.schemeCode?.toLowerCase().includes(q) ||
            f.amc?.toLowerCase().includes(q),
        )

    return {
      flat: matched,
      grouped: matched
        .filter((f) => !selectedCodes.has(f.schemeCode))
        .map((f) => ({
          fund: f,
          group: getGroup(f, anchor?.subCategory, anchor?.plan),
        }))
        .sort((a, b) => {
          const order = { peer: 0, 'diff-plan': 1, 'diff-category': 2 }
          return order[a.group] - order[b.group]
        }),
    }
  }, [allFunds, query, anchor, selectedCodes])

  const displayList = useMemo(() => {
    if (!anchor || showAll) return flat
    return grouped
  }, [anchor, showAll, flat, grouped])

  useEffect(() => {
    setFocusedIdx(-1)
  }, [query, showAll, anchor])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!displayList.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIdx((prev) => (prev < displayList.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIdx((prev) => (prev > 0 ? prev - 1 : displayList.length - 1))
    } else if (e.key === 'Enter' && focusedIdx >= 0) {
      e.preventDefault()
      const item = displayList[focusedIdx]
      const fund = 'fund' in item ? item.fund : (item as MFFund)
      if (!selectedCodes.has(fund.schemeCode)) {
        onSelect(fund)
        setQuery('')
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isAtMax ? 'Maximum 4 funds selected' : 'Search funds by name, code, or AMC...'}
          disabled={isAtMax}
          className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
      </div>

      {anchor && (
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant="secondary"
              className="cursor-pointer gap-1 pr-1"
              onClick={() => setShowAll(!showAll)}
            >
              {anchor.subCategory || anchor.plan ? (
                <>
                  {anchor.subCategory && (
                    <span className="inline-flex items-center gap-1">
                      {anchor.subCategory}
                      <X className="h-3 w-3" />
                    </span>
                  )}
                  {anchor.plan && (
                    <span className="inline-flex items-center gap-1">
                      {anchor.plan}
                      <X className="h-3 w-3" />
                    </span>
                  )}
                </>
              ) : (
                'Peer filters'
              )}
            </Badge>
            <span className="text-xs text-muted-foreground self-center">
              based on {selected[0]?.schemeName?.split('-')[0]?.trim() || 'first fund'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAll ? (
              <ToggleRight className="h-4 w-4" />
            ) : (
              <ToggleLeft className="h-4 w-4" />
            )}
            {showAll ? 'Filtering on' : 'Show all funds'}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="text-sm text-muted-foreground py-4 text-center">
          Loading funds...
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((fund) => (
            <Badge
              key={fund.schemeCode}
              variant="secondary"
              className="gap-1 pr-1 pl-2 py-1"
            >
              <span className="text-xs max-w-[120px] truncate">
                {fund.schemeName || fund.schemeCode}
              </span>
              <button
                type="button"
                onClick={() => onRemove(fund.schemeCode)}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {query && displayList.length > 0 && (
        <div
          ref={listRef}
          className="max-h-80 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md"
        >
          {anchor && !showAll ? (
            <>
              {(['peer', 'diff-plan', 'diff-category'] as const).map((group) => {
                const items = displayList.filter(
                  (item): item is GroupedSuggestion => 'group' in item && item.group === group,
                )
                if (items.length === 0) return null
                return (
                  <div key={group}>
                    <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 sticky top-0">
                      {GROUP_LABELS[group]}
                    </div>
                    {items.map((item, i) => {
                      const idx = displayList.indexOf(item)
                      return (
                        <SuggestionRow
                          key={item.fund.schemeCode}
                          fund={item.fund}
                          group={item.group}
                          isFocused={idx === focusedIdx}
                          onClick={() => {
                            onSelect(item.fund)
                            setQuery('')
                          }}
                        />
                      )
                    })}
                  </div>
                )
              })}
            </>
          ) : (
            (displayList as MFFund[]).map((fund, i) => (
              <SuggestionRow
                key={fund.schemeCode}
                fund={fund}
                isFocused={i === focusedIdx}
                onClick={() => {
                  onSelect(fund)
                  setQuery('')
                }}
              />
            ))
          )}
        </div>
      )}

      {query && displayList.length === 0 && !isLoading && (
        <div className="text-sm text-muted-foreground py-4 text-center">
          No funds found matching "{query}"
        </div>
      )}

      {selected.length === 0 && !query && (
        <div className="text-sm text-muted-foreground py-2">
          Start typing to search for funds. Select up to {MAX_FUNDS} funds to compare.
        </div>
      )}
    </div>
  )
}

interface SuggestionRowProps {
  fund: MFFund
  group?: SuggestionGroup
  isFocused?: boolean
  onClick: () => void
}

function SuggestionRow({ fund, group, isFocused, onClick }: SuggestionRowProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
        isFocused ? 'bg-accent' : ''
      } ${group === 'diff-category' ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <div className="truncate font-medium">{fund.schemeName}</div>
          <div className="truncate text-xs text-muted-foreground">
            {fund.amc}
            {fund.subCategory && ` · ${fund.subCategory}`}
            {fund.plan && ` · ${fund.plan}`}
          </div>
        </div>
      </div>
      {group && (
        <Badge
          variant="outline"
          className={`ml-2 shrink-0 text-[10px] px-1.5 py-0 ${GROUP_BADGE_VARIANTS[group]}`}
        >
          {group === 'peer' && 'Peer'}
          {group === 'diff-plan' && '⚠ Diff plan'}
          {group === 'diff-category' && '✗ Diff category'}
        </Badge>
      )}
    </button>
  )
}
