import type { Goal, GoalHolding, Portfolio } from '@/stores/db'
import type { Alert } from '@/types/review'

export function computeAlerts(
  _goals: Goal[],
  holdings: GoalHolding[],
  portfolios: Portfolio[],
  dismissedIds: string[],
): Alert[] {
  const alerts: Alert[] = []
  const now = new Date().toISOString()
  const dismissedSet = new Set(dismissedIds)

  for (const holding of holdings) {
    if (holding.targetAllocation <= 0) continue
    const drift =
      (holding.currentValue - holding.targetAllocation) / holding.targetAllocation
    const driftPct = Math.abs(Math.round(drift * 100))
    if (driftPct > 5) {
      const severity = driftPct > 10 ? 'critical' : 'warning'
      const id = `drift-${holding.id ?? `${holding.goalId}-${holding.fundName}`}`
      if (dismissedSet.has(id)) continue
      const direction = drift > 0 ? 'over' : 'under'
      const category = holding.amfiCategory || 'Unknown'
      alerts.push({
        id,
        type: 'drift',
        severity,
        title: `Drift alert: ${category} is ${driftPct}% ${direction} target`,
        description: `Your ${holding.fundName} allocation is ${driftPct}% ${direction} target. ${drift > 0 ? 'Consider rebalancing.' : 'Consider increasing allocation.'}`,
        timestamp: now,
        dismissed: false,
        relatedGoalId: holding.goalId,
      })
    }
  }

  const categoryGroups = new Map<string, GoalHolding[]>()
  for (const holding of holdings) {
    const cat = holding.amfiCategory || 'Unknown'
    const group = categoryGroups.get(cat) ?? []
    group.push(holding)
    categoryGroups.set(cat, group)
  }

  for (const [category, group] of categoryGroups) {
    if (group.length >= 2) {
      const id = `duplicate-${category}`
      if (dismissedSet.has(id)) continue
      alerts.push({
        id,
        type: 'duplicate_exposure',
        severity: 'warning',
        title: `Duplicate exposure: ${group.length} funds in ${category} sector`,
        description: `You have ${group.length} funds in the ${category} category. Review concentration risk.`,
        timestamp: now,
        dismissed: false,
      })
    }
  }

  for (const portfolio of portfolios) {
    if (!portfolio.category) {
      const id = `role-mismatch-${portfolio.schemeCode}`
      if (dismissedSet.has(id)) continue
      const categoryLabel = portfolio.category || 'Unknown'
      alerts.push({
        id,
        type: 'role_mismatch',
        severity: 'warning',
        title: `Fund ${portfolio.schemeName} (${categoryLabel}) role needs review`,
        description: `This fund's category data is unavailable. Verify it still fits its role.`,
        timestamp: now,
        dismissed: false,
        relatedSchemeCode: portfolio.schemeCode,
      })
    }
  }

  alerts.sort((a, b) => {
    const sev = { critical: 0, warning: 1 }
    const sa = sev[a.severity]
    const sb = sev[b.severity]
    if (sa !== sb) return sa - sb
    const ta = a.timestamp ?? ''
    const tb = b.timestamp ?? ''
    if (ta !== tb) return tb.localeCompare(ta)
    return a.id.localeCompare(b.id)
  })

  return alerts
}
