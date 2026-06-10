export interface Alert {
  id: string
  type: 'drift' | 'duplicate_exposure' | 'role_mismatch'
  severity: 'warning' | 'critical'
  title: string
  description: string
  timestamp: string
  dismissed: boolean
  relatedGoalId?: number
  relatedSchemeCode?: string
}
