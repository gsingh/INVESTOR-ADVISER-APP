import { describe, it, expect } from 'vitest'
import { filterEntries, validateEntry } from './useJournal'
import type { Journal } from '@/stores/db'

function makeEntry(overrides: Partial<Journal> = {}): Journal {
  return {
    id: 1,
    fundName: 'Test Fund',
    goalId: 1,
    reviewId: undefined,
    whyBought: 'Good performance',
    role: 'Core equity holding',
    exitTrigger: 'Underperforms for 2 quarters',
    nextReviewDate: '2026-09-01',
    notes: 'Keep watching',
    createdAt: '2026-06-01T10:00:00.000Z',
    ...overrides,
  }
}

describe('filterEntries', () => {
  const entries: Journal[] = [
    makeEntry({ id: 1, fundName: 'HDFC Top 100', whyBought: 'Large cap stability', exitTrigger: 'Underperforms for 2 quarters', notes: 'Solid fund' }),
    makeEntry({ id: 2, fundName: 'SBI Small Cap', whyBought: 'Growth potential', role: 'Satellite bet', exitTrigger: 'Market crash >30%', notes: 'High risk' }),
    makeEntry({ id: 3, fundName: undefined, goalId: 2, exitTrigger: '', notes: 'General note' }),
  ]

  it('returns all entries when query is empty', () => {
    expect(filterEntries(entries, '')).toEqual(entries)
  })

  it('returns all entries when query is whitespace only', () => {
    expect(filterEntries(entries, '   ')).toEqual(entries)
  })

  it('filters by fundName (case-insensitive)', () => {
    const result = filterEntries(entries, 'hdfc')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })

  it('filters by whyBought', () => {
    const result = filterEntries(entries, 'growth')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(2)
  })

  it('filters by role', () => {
    const result = filterEntries(entries, 'satellite')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(2)
  })

  it('filters by exitTrigger', () => {
    const result = filterEntries(entries, 'quarters')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })

  it('filters by notes', () => {
    const result = filterEntries(entries, 'risk')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(2)
  })

  it('returns empty array when no match', () => {
    const result = filterEntries(entries, 'zzzznotfound')
    expect(result).toHaveLength(0)
  })

  it('handles undefined fields gracefully', () => {
    const result = filterEntries(entries, 'general')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(3)
  })
})

describe('validateEntry', () => {
  it('returns null when fundName is provided', () => {
    expect(validateEntry({ fundName: 'HDFC', whyBought: '', role: '', exitTrigger: '', notes: '' })).toBeNull()
  })

  it('returns null when goalId is provided', () => {
    expect(validateEntry({ goalId: 1, whyBought: '', role: '', exitTrigger: '', notes: '' })).toBeNull()
  })

  it('returns null when reviewId is provided', () => {
    expect(validateEntry({ reviewId: 1, whyBought: '', role: '', exitTrigger: '', notes: '' })).toBeNull()
  })

  it('returns error when no tags are set', () => {
    const err = validateEntry({ whyBought: '', role: '', exitTrigger: '', notes: '' })
    expect(err).toBeTruthy()
    expect(err).toContain('tagged')
  })

  it('returns error for invalid goalId', () => {
    const err = validateEntry({ goalId: 0, whyBought: '', role: '', exitTrigger: '', notes: '' })
    expect(err).toBeTruthy()
    expect(err).toContain('Invalid goal')
  })
})
