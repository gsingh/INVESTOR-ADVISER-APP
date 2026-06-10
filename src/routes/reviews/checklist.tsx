import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ClipboardCheck, ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { useReviewSettings } from '@/features/settings/hooks/useReviewSettings'
import { useReviewSteps } from '@/features/reviews/hooks/useReviewSteps'
import { useReviewSubmit } from '@/features/reviews/hooks/useReviewSubmit'
import type { ReviewStep } from '@/stores/db'

const BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  pass: 'success',
  warn: 'warning',
  fail: 'destructive',
}

const STEP_LABELS: Record<ReviewStep['name'], string> = {
  drift_check: '1. Drift Check',
  category_exposure: '2. Category Exposure',
  fund_role_fit: '3. Fund-Role Fit',
  benchmark_comparison: '4. Benchmark Comparison',
  rationale_outcome: '5. Rationale & Outcome',
}

function StepCard({
  step,
  isExpanded,
  onToggle,
}: {
  step: ReviewStep
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <Card className="border-l-4" style={{
      borderLeftColor: step.status === 'fail' ? '#DC2626' : step.status === 'warn' ? '#F59E0B' : '#22C55E',
    }}>
      <button
        type="button"
        className="flex w-full items-center gap-3 p-4 text-left"
        onClick={onToggle}
      >
        {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
        <span className="flex-1 text-body font-semibold">{STEP_LABELS[step.name]}</span>
        <Badge variant={BADGE_VARIANT[step.status]}>
          {step.status.toUpperCase()}
        </Badge>
      </button>
      {isExpanded && (
        <CardContent className="pt-0">
          <p className="whitespace-pre-wrap text-body text-muted-foreground">{step.details}</p>
        </CardContent>
      )}
    </Card>
  )
}

export default function ReviewChecklist() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { steps, loading } = useReviewSteps()
  const { submit, submitting } = useReviewSubmit()
  const { frequency, loading: settingsLoading } = useReviewSettings()
  const [expandedStep, setExpandedStep] = useState<number>(0)
  const [outcome, setOutcome] = useState<'aligned' | 'action_taken' | null>(null)
  const [rationale, setRationale] = useState('')

  if (loading || settingsLoading) {
    return (
      <div className="space-y-6 py-6">
        <h2 className="text-display font-semibold text-foreground">Review Checklist</h2>
        <p className="text-body text-muted-foreground">Loading review data...</p>
      </div>
    )
  }

  if (!frequency) {
    return (
      <div className="space-y-6 py-6">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardCheck className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-body text-muted-foreground">
            Set a review frequency in Settings before starting a review.
          </p>
          <Button className="mt-4" onClick={() => navigate({ to: '/settings' })}>
            Go to Settings
          </Button>
        </div>
      </div>
    )
  }

  async function handleSubmit() {
    if (!outcome || !rationale.trim()) return
    try {
      await submit(outcome, rationale.trim(), steps)
      addToast({ title: 'Review submitted successfully' })
      setTimeout(() => navigate({ to: '/reviews' }), 300)
    } catch {
      addToast({ title: 'Failed to submit review', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 py-6">
      <div>
        <h2 className="text-display font-semibold text-foreground">Review Checklist</h2>
        <p className="text-body text-muted-foreground">
          Step through each area and record your assessment.
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <StepCard
            key={step.name}
            step={step}
            isExpanded={expandedStep === i}
            onToggle={() => setExpandedStep(expandedStep === i ? -1 : i)}
          />
        ))}
      </div>

      {steps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-body font-semibold">5. Rationale & Outcome</CardTitle>
            <CardDescription className="text-label text-muted-foreground">
              Record your decision and reasoning for this review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button
                variant={outcome === 'aligned' ? 'success' : 'outline'}
                onClick={() => setOutcome('aligned')}
              >
                No action needed — portfolio is aligned with plan
              </Button>
              <Button
                variant={outcome === 'action_taken' ? 'default' : 'outline'}
                onClick={() => setOutcome('action_taken')}
              >
                Take action
              </Button>
            </div>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Write your rationale for this review..."
              value={rationale}
              onChange={e => setRationale(e.target.value)}
            />
            <Button
              disabled={!outcome || !rationale.trim() || submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
