export type DriftStatus = 'on_track' | 'watch' | 'review'

export interface DriftResult {
  pctChange: number
  status: DriftStatus
  label: string
}

export function computeDrift(currentPct: number, targetPct: number): DriftResult {
  if (!isFinite(currentPct) || !isFinite(targetPct)) {
    return { pctChange: 0, status: 'review', label: 'Review' }
  }
  if (currentPct === 0 && targetPct === 0) {
    return { pctChange: 0, status: 'on_track', label: 'On track' }
  }
  if (targetPct === 0) {
    return { pctChange: 0, status: 'review', label: 'Review' }
  }
  const pctChange = Math.round(((currentPct - targetPct) / targetPct) * 1e10) / 1e10
  const absChange = Math.abs(pctChange)

  if (absChange < 0.05) {
    return { pctChange, status: 'on_track', label: 'On track' }
  }
  if (absChange <= 0.10) {
    return { pctChange, status: 'watch', label: 'Watch' }
  }
  return { pctChange, status: 'review', label: 'Review' }
}
