import { Link, useNavigate } from '@tanstack/react-router'
import { Bell } from 'lucide-react'
import { useReviewSettings } from '@/features/settings/hooks/useReviewSettings'
import { useAlertsState } from '@/features/reviews/hooks/useAlertsState'
import { AlertCard } from '@/components/AlertCard'

export default function Dashboard() {
  const navigate = useNavigate()
  const { frequency, nextReviewDate, loading: settingsLoading } = useReviewSettings()
  const { alerts, dismissAlert, loading: alertsLoading } = useAlertsState()

  if (settingsLoading || alertsLoading) {
    return (
      <div className="space-y-6 py-6">
        <h2 className="text-display font-semibold text-foreground">Dashboard</h2>
        <p className="text-body text-muted-foreground">Loading your portfolio...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-display font-semibold text-foreground">Dashboard</h2>
          <p className="text-body text-muted-foreground">Your portfolio at a glance.</p>
        </div>
        {nextReviewDate && !isNaN(Date.parse(nextReviewDate)) && (
          <p className="text-body text-muted-foreground">
            Next review: {new Date(nextReviewDate).toLocaleDateString('en-IN')}
          </p>
        )}
      </div>

      {!frequency ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-body text-muted-foreground">
            Set a review frequency in Settings to get started.
          </p>
          <Link
            to="/settings"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to Settings
          </Link>
        </div>
      ) : alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onDismiss={() => dismissAlert(alert.id)}
              onStartReview={() => navigate({ to: '/reviews/checklist' })}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-body text-muted-foreground">No alerts. Your portfolio is on track.</p>
        </div>
      )}
    </div>
  )
}
