export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  const targetMonth = d.getMonth() + months
  d.setMonth(targetMonth)
  if (d.getMonth() !== ((targetMonth % 12) + 12) % 12) {
    d.setDate(0)
  }
  return d
}

export function getCurrentQuarter(): string {
  const now = new Date()
  const year = now.getFullYear()
  const quarter = Math.floor(now.getMonth() / 3) + 1
  return `${year}-Q${quarter}`
}
