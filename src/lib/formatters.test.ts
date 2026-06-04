import { describe, it, expect } from 'vitest'
import { formatINR, formatPercentage, formatDate } from './formatters'

describe('formatINR', () => {
  it('formats zero', () => {
    expect(formatINR(0)).toBe('₹0')
  })

  it('formats a small number', () => {
    expect(formatINR(5000)).toBe('₹5,000')
  })

  it('formats a large number with Indian commas', () => {
    expect(formatINR(100000)).toBe('₹1,00,000')
  })

  it('formats with rupee sign', () => {
    expect(formatINR(100)).toBe('₹100')
  })
})

describe('formatPercentage', () => {
  it('formats a decimal as percentage', () => {
    expect(formatPercentage(0.12)).toBe('12.0%')
  })

  it('formats zero', () => {
    expect(formatPercentage(0)).toBe('0.0%')
  })

  it('formats whole number', () => {
    expect(formatPercentage(1)).toBe('100.0%')
  })
})

describe('formatDate', () => {
  it('formats an ISO date string', () => {
    const result = formatDate('2026-12-25')
    expect(result).toContain('2026')
  })

  it('handles date with time component', () => {
    const result = formatDate('2026-06-03T10:00:00.000Z')
    expect(result).toContain('2026')
  })
})
