import { RiskQuestionnaire } from '@/features/profiling/components/RiskQuestionnaire'
import { RiskProfileCard } from '@/features/profiling/components/RiskProfileCard'
import { useProfile } from '@/features/profiling/hooks/useProfile'
import type { Answer } from '@/features/profiling/hooks/useProfile'

export default function Profiling() {
  const { profile, loading, saveProfile, retakeProfile } = useProfile()

  async function handleSubmit(answers: Answer[], monthlyCapacity: number, timeHorizon: number) {
    await saveProfile(answers, monthlyCapacity, timeHorizon)
  }

  async function handleRetake() {
    await retakeProfile()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    )
  }

  if (profile) {
    return (
      <div className="py-8">
        <RiskProfileCard profile={profile} onRetake={handleRetake} />
      </div>
    )
  }

  return (
    <div className="py-8">
      <RiskQuestionnaire onSubmit={handleSubmit} />
    </div>
  )
}
