import { useScorecardWeights } from '@/features/scorecard/hooks/useScorecardWeights'
import { useScoredFunds } from '@/features/scorecard/hooks/useScoredFunds'
import { WeightPanel } from '@/features/scorecard/components/WeightPanel'
import { ScoredFundTable } from '@/features/scorecard/components/ScoredFundTable'

export default function ScorecardPage() {
  const { weights, weightSum, updateWeight, resetToDefaults } = useScorecardWeights()
  const { scoredFunds, isLoading, error, refetch } = useScoredFunds(weights)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display font-semibold text-foreground">Scorecard</h1>
        <p className="mt-1 text-body text-muted-foreground">
          Score and rank funds by custom weighted criteria.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <WeightPanel
          weights={weights}
          weightSum={weightSum}
          onWeightChange={updateWeight}
          onReset={resetToDefaults}
        />

        <ScoredFundTable
          scoredFunds={scoredFunds}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
        />
      </div>
    </div>
  )
}
