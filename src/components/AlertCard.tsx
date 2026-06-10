import { useState } from 'react'
import { AlertTriangle, AlertCircle, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Alert } from '@/types/review'

interface AlertCardProps {
  alert: Alert
  onDismiss: () => void
  onStartReview: () => void
}

export function AlertCard({ alert, onDismiss, onStartReview }: AlertCardProps) {
  const [dismissing, setDismissing] = useState(false)
  const [removed, setRemoved] = useState(false)

  const borderColor = alert.severity === 'critical' ? '#DC2626' : '#F59E0B'
  const Icon = alert.severity === 'critical' ? AlertCircle : AlertTriangle

  function handleDismiss() {
    setDismissing(true)
    setTimeout(() => {
      setRemoved(true)
      onDismiss()
    }, 300)
  }

  if (removed) return null

  return (
    <Card
      className={`relative border-l-4 p-4 transition-opacity duration-300 ${
        dismissing ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ borderLeftColor: borderColor }}
    >
      <div className="flex items-start gap-3">
        <Icon
          className="mt-0.5 h-5 w-5 shrink-0"
          style={{ color: borderColor }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-body font-semibold text-foreground">{alert.title}</p>
          <p className="mt-1 text-body text-muted-foreground">{alert.description}</p>
          <p className="mt-1 text-small text-muted-foreground">
            {alert.timestamp
              ? new Date(alert.timestamp).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Date unavailable'}
          </p>
          <div className="mt-3">
            <Button variant="success" size="sm" onClick={onStartReview}>
              Start Review
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={handleDismiss}
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
