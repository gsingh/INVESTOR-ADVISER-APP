import { Link, useNavigate } from '@tanstack/react-router'
import { ClipboardCheck, Bell } from 'lucide-react'
import { useReviewSettings } from '@/features/settings/hooks/useReviewSettings'
import { useAlertsState } from '@/features/reviews/hooks/useAlertsState'
import { AlertCard } from '@/components/AlertCard'

export default function Reviews() {
  const navigate = useNavigate()
  const { frequency, loading: settingsLoading } = useReviewSettings()
  const { alerts, dismissAlert, loading: alertsLoading } = useAlertsState()

  if (settingsLoading || alertsLoading) {
    return (
      <div className="space-y-6 py-6">
        <h2 className="text-display font-semibold text-foreground">Reviews</h2>
        <p className="text-body text-muted-foreground">Loading reviews...</p>
      </div>
    )
  }

  if (!frequency) {
    return (
      <div className="space-y-6 py-6">
        <div>
          <h2 className="text-display font-semibold text-foreground">Reviews</h2>
          <p className="text-body text-muted-foreground">Scheduled portfolio reviews and alerts.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardCheck className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-body text-muted-foreground">
            No reviews scheduled. Set a review frequency to receive reminders.
          </p>
          <Link
            to="/settings"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to Settings
          </Link>
        </div>
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="space-y-6 py-6">
        <div>
          <h2 className="text-display font-semibold text-foreground">Reviews</h2>
          <p className="text-body text-muted-foreground">Scheduled portfolio reviews and alerts.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-body text-muted-foreground">No active alerts. Your portfolio is on track.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-6">
      <div>
        <h2 className="text-display font-semibold text-foreground">Reviews</h2>
        <p className="text-body text-muted-foreground">Scheduled portfolio reviews and alerts.</p>
      </div>
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
    </div>
  )
}
