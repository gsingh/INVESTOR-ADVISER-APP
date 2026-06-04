export interface SectorEntry {
  sector: string
  percentage: number
}

export interface OverlapResult {
  newExposurePct: number
  overlapPct: number
  explanations: string[]
  isEmptyPortfolio?: boolean
}

export function computeOverlap(
  fundSectors: SectorEntry[],
  portfolioSectors: SectorEntry[],
): OverlapResult {
  if (!fundSectors.length) {
    return { newExposurePct: 0, overlapPct: 0, explanations: [] }
  }

  if (!portfolioSectors.length) {
    const totalNew = fundSectors.reduce((sum, s) => sum + (Number.isFinite(s.percentage) ? Math.max(0, s.percentage) : 0), 0)
    return {
      newExposurePct: Math.round(totalNew * 100) / 100,
      overlapPct: 0,
      isEmptyPortfolio: true,
      explanations: ['No existing holdings to compare against. Add holdings to see overlap analysis.'],
    }
  }

  const portfolioMap = new Map<string, number>()
  for (const ps of portfolioSectors) {
    const key = ps.sector.toLowerCase().trim()
    portfolioMap.set(key, (portfolioMap.get(key) || 0) + ps.percentage)
  }

  let overlapTotal = 0
  let newExposureTotal = 0
  const explanations: string[] = []

  for (const fs of fundSectors) {
    const pct = Number.isFinite(fs.percentage) ? Math.max(0, fs.percentage) : 0
    const key = fs.sector.toLowerCase().trim()
    const existingPct = portfolioMap.get(key) || 0
    if (existingPct > 0) {
      const overlap = Math.min(pct, existingPct)
      const remainder = pct - overlap
      overlapTotal += overlap
      newExposureTotal += remainder
      if (remainder > 0) {
        explanations.push(
          `Your portfolio already has ${existingPct.toFixed(1)}% in ${fs.sector}. This fund adds ${remainder.toFixed(1)}% more beyond your current exposure.`,
        )
      } else {
        explanations.push(
          `Your portfolio already has ${existingPct.toFixed(1)}% in ${fs.sector} — fund's ${pct.toFixed(1)}% is fully overlapped.`,
        )
      }
    } else {
      newExposureTotal += pct
      explanations.push(
        `This fund adds ${pct.toFixed(1)}% exposure to ${fs.sector} not in your portfolio.`,
      )
    }
  }

  return {
    newExposurePct: Math.round(newExposureTotal * 100) / 100,
    overlapPct: Math.round(overlapTotal * 100) / 100,
    explanations,
  }
}
