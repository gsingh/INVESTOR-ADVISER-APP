import { useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useGetMfDataSearch } from '@/stores/queries/useGetMfData'

interface SearchSuggestionsProps {
  query: string
  onSelect?: () => void
}

export function SearchSuggestions({ query, onSelect }: SearchSuggestionsProps) {
  const navigate = useNavigate()
  const { data: results, isLoading } = useGetMfDataSearch(query)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    setSelectedIndex(-1)
  }, [results])

  const handleSelect = useCallback((schemeCode: string) => {
    onSelect?.()
    navigate({ to: '/scorecard/$schemeCode', params: { schemeCode } })
  }, [navigate, onSelect])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!results?.length) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => (i + 1) % results.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => (i <= 0 ? results.length - 1 : i - 1))
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault()
        handleSelect(results[selectedIndex].schemeCode)
      } else if (e.key === 'Escape') {
        onSelect?.()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [results, selectedIndex, handleSelect, onSelect])

  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const el = listRef.current.children[selectedIndex] as HTMLElement
      el?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  if (!query || query.length < 2) return null
  if (isLoading) {
    return (
      <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border bg-card shadow-lg">
        <div className="px-3 py-2 text-xs text-muted-foreground">Searching getmfdata.com...</div>
      </div>
    )
  }
  if (!results?.length) return null

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border bg-card shadow-lg">
      <div className="border-b px-3 py-1.5 text-[10px] text-muted-foreground">
        Results from getmfdata.com
      </div>
      <ul ref={listRef} className="max-h-72 overflow-y-auto">
        {results.map((item, i) => (
          <li
            key={item.schemeCode}
            className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-muted ${
              i === selectedIndex ? 'bg-muted' : ''
            }`}
            onMouseEnter={() => setSelectedIndex(i)}
            onClick={() => handleSelect(item.schemeCode)}
          >
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{item.schemeName}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {item.amc && <span>{item.amc}</span>}
                {item.subCategory && (
                  <>
                    <span>·</span>
                    <span className="rounded bg-primary/10 px-1 py-0.5 text-primary">{item.subCategory}</span>
                  </>
                )}
              </div>
            </div>
            {item.nav > 0 && (
              <div className="ml-3 shrink-0 text-right">
                <div className="text-xs font-medium tabular-nums">₹{item.nav.toFixed(2)}</div>
                {item.rank > 0 && (
                  <div className="text-[10px] text-muted-foreground">#{Math.round(item.rank * 100)}</div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
