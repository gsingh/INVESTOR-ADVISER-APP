import type { NavEntry } from '@/types/api'

function parseDate(dateStr: string): Date | null {
  const m = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

function findClosestNav(
  navHistory: NavEntry[],
  targetDate: Date,
  searchForward: boolean,
): { nav: number; date: Date } | null {
  const sorted = [...navHistory].sort((a, b) => {
    const da = parseDate(a.date)
    const db = parseDate(b.date)
    if (!da || !db) return 0
    return da.getTime() - db.getTime()
  })

  if (searchForward) {
    for (const entry of sorted) {
      const d = parseDate(entry.date)
      if (d && d.getTime() >= targetDate.getTime()) return { nav: entry.nav, date: d }
    }
  } else {
    for (let i = sorted.length - 1; i >= 0; i--) {
      const d = parseDate(sorted[i].date)
      if (d && d.getTime() <= targetDate.getTime()) return { nav: sorted[i].nav, date: d }
    }
  }

  const fallback = searchForward ? sorted[0] : sorted[sorted.length - 1]
  const fd = parseDate(fallback.date)
  return fd ? { nav: fallback.nav, date: fd } : null
}

function computeCAGR(startNav: number, endNav: number, years: number): number | null {
  if (startNav <= 0 || years <= 0) return null
  return (Math.pow(endNav / startNav, 1 / years) - 1) * 100
}

export function computeTrailingReturn(
  navHistory: NavEntry[],
  years: number,
): { return: number | null; startDate: string; endDate: string } {
  if (navHistory.length < 2) return { return: null, startDate: '', endDate: '' }

  const lastEntry = navHistory[navHistory.length - 1]
  const lastDate = parseDate(lastEntry.date)
  if (!lastDate) return { return: null, startDate: '', endDate: '' }

  const targetDate = new Date(lastDate.getTime() - years * 365.25 * 24 * 60 * 60 * 1000)
  const startData = findClosestNav(navHistory, targetDate, false)
  if (!startData || startData.nav <= 0) return { return: null, startDate: '', endDate: '' }

  const actualYears = (lastDate.getTime() - startData.date.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  if (actualYears < 0.5) return { return: null, startDate: '', endDate: '' }

  const cagr = computeCAGR(startData.nav, lastEntry.nav, actualYears)

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  return {
    return: cagr,
    startDate: fmt(startData.date),
    endDate: fmt(lastDate),
  }
}

export function computeSinceInception(navHistory: NavEntry[]): {
  return: number | null
  years: number
  startDate: string
  endDate: string
} {
  if (navHistory.length < 2) return { return: null, years: 0, startDate: '', endDate: '' }

  const firstEntry = navHistory[0]
  const lastEntry = navHistory[navHistory.length - 1]
  const firstDate = parseDate(firstEntry.date)
  const lastDate = parseDate(lastEntry.date)
  if (!firstDate || !lastDate) return { return: null, years: 0, startDate: '', endDate: '' }

  const years = (lastDate.getTime() - firstDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  if (years < 1 / 365 || firstEntry.nav <= 0) return { return: null, years: 0, startDate: '', endDate: '' }

  const cagr = computeCAGR(firstEntry.nav, lastEntry.nav, years)

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  return { return: cagr, years, startDate: fmt(firstDate), endDate: fmt(lastDate) }
}

export interface CalendarYearReturn {
  year: number
  return: number | null
  startDate: string
  endDate: string
}

export function computeCalendarYearReturns(navHistory: NavEntry[]): CalendarYearReturn[] {
  if (navHistory.length < 2) return []

  const years = new Map<number, { first: NavEntry; last: NavEntry }>()

  for (const entry of navHistory) {
    const d = parseDate(entry.date)
    if (!d) continue
    const y = d.getFullYear()
    const existing = years.get(y)
    if (!existing) {
      years.set(y, { first: entry, last: entry })
    } else {
      const existingFirst = parseDate(existing.first.date)
      const existingLast = parseDate(existing.last.date)
      if (existingFirst && d.getTime() < existingFirst.getTime()) {
        existing.first = entry
      }
      if (existingLast && d.getTime() > existingLast.getTime()) {
        existing.last = entry
      }
    }
  }

  const results: CalendarYearReturn[] = []
  for (const [year, { first, last }] of years) {
    if (first.nav <= 0) {
      results.push({ year, return: null, startDate: first.date, endDate: last.date })
      continue
    }
    const ret = ((last.nav - first.nav) / first.nav) * 100
    results.push({ year, return: ret, startDate: first.date, endDate: last.date })
  }

  return results.sort((a, b) => a.year - b.year)
}

export interface QuarterlyReturn {
  label: string
  year: number
  quarter: number
  return: number | null
  startDate: string
  endDate: string
}

export function computeQuarterlyReturns(navHistory: NavEntry[]): QuarterlyReturn[] {
  if (navHistory.length < 2) return []

  const quarters = new Map<string, { first: NavEntry; last: NavEntry }>()

  for (const entry of navHistory) {
    const d = parseDate(entry.date)
    if (!d) continue
    const q = Math.floor(d.getMonth() / 3) + 1
    const key = `${d.getFullYear()}-Q${q}`
    const existing = quarters.get(key)
    if (!existing) {
      quarters.set(key, { first: entry, last: entry })
    } else {
      const existingFirst = parseDate(existing.first.date)
      const existingLast = parseDate(existing.last.date)
      if (existingFirst && d.getTime() < existingFirst.getTime()) {
        existing.first = entry
      }
      if (existingLast && d.getTime() > existingLast.getTime()) {
        existing.last = entry
      }
    }
  }

  const results: QuarterlyReturn[] = []
  for (const [key, { first, last }] of quarters) {
    const [yStr, qStr] = key.split('-Q')
    const year = Number(yStr)
    const quarter = Number(qStr)
    if (first.nav <= 0) {
      results.push({ label: key, year, quarter, return: null, startDate: first.date, endDate: last.date })
      continue
    }
    const ret = ((last.nav - first.nav) / first.nav) * 100
    results.push({ label: key, year, quarter, return: ret, startDate: first.date, endDate: last.date })
  }

  return results.sort((a, b) => a.year - b.year || a.quarter - b.quarter)
}

export interface YearwiseReturnSummary {
  trailing1Y: { return: number | null; startDate: string; endDate: string }
  trailing3Y: { return: number | null; startDate: string; endDate: string }
  trailing5Y: { return: number | null; startDate: string; endDate: string }
  sinceInception: { return: number | null; years: number; startDate: string; endDate: string }
  calendarYears: CalendarYearReturn[]
  quarterly: QuarterlyReturn[]
}

export function computeAllReturns(navHistory: NavEntry[]): YearwiseReturnSummary {
  return {
    trailing1Y: computeTrailingReturn(navHistory, 1),
    trailing3Y: computeTrailingReturn(navHistory, 3),
    trailing5Y: computeTrailingReturn(navHistory, 5),
    sinceInception: computeSinceInception(navHistory),
    calendarYears: computeCalendarYearReturns(navHistory),
    quarterly: computeQuarterlyReturns(navHistory),
  }
}
