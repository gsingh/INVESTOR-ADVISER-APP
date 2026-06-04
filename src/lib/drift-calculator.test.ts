import { describe, it, expect } from 'vitest'
import { computeDrift } from './drift-calculator'

describe('computeDrift', () => {
  it('returns on_track for exact match (0% drift)', () => {
    const result = computeDrift(0.30, 0.30)
    expect(result.status).toBe('on_track')
    expect(result.pctChange).toBe(0)
    expect(result.label).toBe('On track')
  })

  it('returns watch for 5% drift', () => {
    const result = computeDrift(0.315, 0.30)
    expect(result.status).toBe('watch')
    expect(result.pctChange).toBeCloseTo(0.05, 2)
    expect(result.label).toBe('Watch')
  })

  it('returns watch for exactly 10% drift boundary', () => {
    const result = computeDrift(0.33, 0.30)
    expect(result.status).toBe('watch')
    expect(result.pctChange).toBeCloseTo(0.10, 2)
  })

  it('returns review for over 10% drift', () => {
    const result = computeDrift(0.40, 0.30)
    expect(result.status).toBe('review')
    expect(result.pctChange).toBeCloseTo(0.333, 2)
    expect(result.label).toBe('Review')
  })

  it('returns review for negative drift over 10% (underweight)', () => {
    const result = computeDrift(0.15, 0.30)
    expect(result.status).toBe('review')
    expect(result.pctChange).toBeCloseTo(-0.5, 2)
  })

  it('returns review when target is zero', () => {
    const result = computeDrift(0.10, 0)
    expect(result.status).toBe('review')
    expect(result.label).toBe('Review')
  })

  it('returns on_track for negative drift under 5%', () => {
    const result = computeDrift(0.29, 0.30)
    expect(result.status).toBe('on_track')
    expect(result.pctChange).toBeCloseTo(-0.0333, 2)
  })

  it('returns on_track when both current and target are zero', () => {
    const result = computeDrift(0, 0)
    expect(result.status).toBe('on_track')
    expect(result.pctChange).toBe(0)
  })

  it('returns on_track for negative drift at exactly -5% boundary', () => {
    const result = computeDrift(0.285, 0.30)
    expect(result.status).toBe('watch')
    expect(result.pctChange).toBeCloseTo(-0.05, 2)
  })

  it('returns watch for negative drift at exactly -10% boundary', () => {
    const result = computeDrift(0.27, 0.30)
    expect(result.status).toBe('watch')
    expect(result.pctChange).toBeCloseTo(-0.10, 2)
  })

  it('returns review when inputs are NaN', () => {
    const result = computeDrift(NaN, 0.30)
    expect(result.status).toBe('review')
  })

  it('returns review when inputs are Infinity', () => {
    const result = computeDrift(Infinity, 0.30)
    expect(result.status).toBe('review')
  })
})
