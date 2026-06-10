import { useCallback, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/stores/db'
import { computeAlerts } from './useAlerts'
import type { Alert } from '@/types/review'

const STORAGE_KEY = 'dismissedAlertIds'

function loadDismissedIds(): string[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function saveDismissedIds(ids: string[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // sessionStorage full or unavailable — silently ignore
  }
}

export function useAlertsState(): {
  alerts: Alert[]
  dismissAlert: (id: string) => void
  loading: boolean
} {
  const goals = useLiveQuery(() => db.goals.where('status').equals('active').toArray())
  const holdings = useLiveQuery(() => db.goalHoldings.toArray())
  const portfolios = useLiveQuery(() => db.portfolios.toArray())

  const loading = goals === undefined || holdings === undefined || portfolios === undefined

  const [dismissedIds, setDismissedIds] = useState<string[]>(loadDismissedIds)

  const alerts = useMemo(() => {
    if (!goals || !holdings || !portfolios) return []
    return computeAlerts(goals, holdings, portfolios, dismissedIds)
  }, [goals, holdings, portfolios, dismissedIds])

  const dismissAlert = useCallback((id: string) => {
    setDismissedIds(prev => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      saveDismissedIds(next)
      return next
    })
  }, [])

  return { alerts, dismissAlert, loading }
}
