export interface XirrTransaction {
  date: string
  amount: number
}

const MAX_ITERATIONS = 1000
const CONVERGENCE_THRESHOLD = 1e-7
const DEFAULT_GUESS = 0.1

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return NaN
  return (d2.getTime() - d1.getTime()) / 86400000
}

export function computeXIRR(
  transactions: XirrTransaction[],
  guess?: number,
): number | null {
  if (transactions.length < 2) return null

  for (const t of transactions) {
    if (!Number.isFinite(t.amount)) return null
    if (isNaN(new Date(t.date).getTime())) return null
  }

  if (transactions.every(t => t.amount === 0)) return null

  const hasNegative = transactions.some(t => t.amount < 0)
  const hasPositive = transactions.some(t => t.amount > 0)
  if (!hasNegative || !hasPositive) return null

  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  const baseDate = sorted[0].date
  const years = sorted.map(t => daysBetween(baseDate, t.date) / 365)
  if (years.some(y => !Number.isFinite(y))) return null

  if (Math.abs(years[years.length - 1]) < 1e-10) return null

  let r = guess ?? DEFAULT_GUESS
  if (r <= -1) r = -0.5

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let f = 0
    let fPrime = 0

    const denom = 1 + r
    if (denom <= 0) return null

    for (let j = 0; j < sorted.length; j++) {
      const c = sorted[j].amount
      const t = years[j]
      f += c / Math.pow(denom, t)
      fPrime += (-t * c) / Math.pow(denom, t + 1)
    }

    if (Math.abs(f) < CONVERGENCE_THRESHOLD) return r
    if (Math.abs(fPrime) < 1e-12) return null

    const rNext = r - f / fPrime
    if (!Number.isFinite(rNext) || rNext <= -1) return null
    if (Math.abs(rNext - r) < CONVERGENCE_THRESHOLD) return rNext

    r = rNext
  }

  return null
}
