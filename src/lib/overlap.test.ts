import { describe, it, expect } from 'vitest'
import { computeOverlap } from './overlap'
import type { SectorEntry } from './overlap'

describe('computeOverlap', () => {
  const fundSectors: SectorEntry[] = [
    { sector: 'Financial Services', percentage: 25 },
    { sector: 'Technology', percentage: 20 },
    { sector: 'Healthcare', percentage: 15 },
  ]

  it('returns zero overlap when portfolio is empty', () => {
    const result = computeOverlap(fundSectors, [])
    expect(result.newExposurePct).toBe(60)
    expect(result.overlapPct).toBe(0)
    expect(result.explanations).toHaveLength(1)
    expect(result.explanations[0]).toContain('No existing holdings')
  })

  it('returns overlap data when portfolio has matching sectors', () => {
    const portfolio: SectorEntry[] = [
      { sector: 'Financial Services', percentage: 30 },
      { sector: 'Technology', percentage: 10 },
    ]
    const result = computeOverlap(fundSectors, portfolio)
    expect(result.overlapPct).toBe(35)
    expect(result.newExposurePct).toBe(25)
    expect(result.explanations).toHaveLength(3)
  })

  it('handles case-insensitive sector matching', () => {
    const portfolio: SectorEntry[] = [
      { sector: 'financial services', percentage: 20 },
    ]
    const result = computeOverlap(fundSectors, portfolio)
    expect(result.overlapPct).toBeGreaterThan(0)
    expect(result.explanations[0]).toContain('Financial Services')
  })

  it('handles empty fund sectors', () => {
    const result = computeOverlap([], [{ sector: 'Tech', percentage: 50 }])
    expect(result.newExposurePct).toBe(0)
    expect(result.overlapPct).toBe(0)
    expect(result.explanations).toHaveLength(0)
  })

  it('handles single sector', () => {
    const fund: SectorEntry[] = [{ sector: 'Healthcare', percentage: 100 }]
    const portfolio: SectorEntry[] = [{ sector: 'Healthcare', percentage: 20 }]
    const result = computeOverlap(fund, portfolio)
    expect(result.overlapPct).toBe(20)
    expect(result.newExposurePct).toBe(80)
    expect(result.explanations).toHaveLength(1)
  })

  it('handles complete sector mismatch', () => {
    const fund: SectorEntry[] = [{ sector: 'Healthcare', percentage: 100 }]
    const portfolio: SectorEntry[] = [{ sector: 'Technology', percentage: 50 }]
    const result = computeOverlap(fund, portfolio)
    expect(result.overlapPct).toBe(0)
    expect(result.newExposurePct).toBe(100)
  })

  it('handles partial overlap correctly', () => {
    const fund: SectorEntry[] = [
      { sector: 'A', percentage: 50 },
      { sector: 'B', percentage: 50 },
    ]
    const portfolio: SectorEntry[] = [{ sector: 'A', percentage: 30 }]
    const result = computeOverlap(fund, portfolio)
    expect(result.overlapPct).toBe(30)
    expect(result.newExposurePct).toBe(70)
  })

  it('aggregates multiple portfolio entries for same sector', () => {
    const fund: SectorEntry[] = [{ sector: 'Tech', percentage: 30 }]
    const portfolio: SectorEntry[] = [
      { sector: 'tech', percentage: 20 },
      { sector: 'Tech', percentage: 10 },
    ]
    const result = computeOverlap(fund, portfolio)
    expect(result.overlapPct).toBe(30)
    expect(result.newExposurePct).toBe(0)
  })

  it('returns informative explanations', () => {
    const portfolio: SectorEntry[] = [{ sector: 'Financial Services', percentage: 40 }]
    const result = computeOverlap(fundSectors, portfolio)
    expect(result.explanations.length).toBe(3)
    expect(result.explanations[0]).toContain('40.0%')
    expect(result.explanations[0]).toContain('Financial Services')
  })
})
