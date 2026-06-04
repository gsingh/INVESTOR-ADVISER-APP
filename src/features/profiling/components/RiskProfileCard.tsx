import { RotateCcw, TrendingUp, Shield, Zap, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TermInfo } from '@/components/features/TermInfo'
import type { RiskProfile } from '@/stores/db'
import { categoryMapping } from '../hooks/useProfile'

const profileIcons: Record<string, React.ReactNode> = {
  Conservative: <Shield className="h-5 w-5 text-blue-500" />,
  Moderate: <TrendingUp className="h-5 w-5 text-amber-500" />,
  Aggressive: <Zap className="h-5 w-5 text-green-500" />,
}

const profileColors: Record<string, string> = {
  Conservative: 'bg-blue-100 text-blue-800',
  Moderate: 'bg-amber-100 text-amber-800',
  Aggressive: 'bg-green-100 text-green-800',
}

function profileIcon(profile: string) {
  return profileIcons[profile] ?? <Shield className="h-5 w-5 text-muted-foreground" />
}

function profileColor(profile: string) {
  return profileColors[profile] ?? 'bg-muted text-muted-foreground'
}

const answerLabels: Record<string, string> = {
  'time-horizon': 'Time Horizon',
  'drawdown': 'Drawdown Comfort',
  'income-stability': 'Income Stability',
  'emergency-fund': 'Emergency Reserve',
  'investing-experience': 'Investing Experience',
}

interface RiskProfileCardProps {
  profile: RiskProfile
  onRetake: () => void
}

export function RiskProfileCard({ profile, onRetake }: RiskProfileCardProps) {
  const categories = categoryMapping(profile.profile)
  const monthlyFmt = new Intl.NumberFormat('en-IN').format(profile.monthlyCapacity)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mb-2 flex justify-center">
            {profileIcon(profile.profile)}
          </div>
          <CardTitle className="text-display-sm">Your Risk Profile</CardTitle>
          <CardDescription>
            Based on your answers, here is your investor profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <Badge className={`px-4 py-1.5 text-label ${profileColor(profile.profile)}`}>
              {profile.profile}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="text-small text-muted-foreground">Monthly Capacity</p>
              <p className="mt-1 font-mono text-display-sm font-semibold text-foreground">
                ₹{monthlyFmt}
              </p>
            </div>
            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="text-small text-muted-foreground">Time Horizon</p>
              <p className="mt-1 font-mono text-display-sm font-semibold text-foreground">
                {profile.timeHorizon} yr
              </p>
            </div>
          </div>

          <details className="group">
            <summary className="flex cursor-pointer items-center gap-2 text-small text-muted-foreground hover:text-foreground">
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              <span>View raw answers</span>
            </summary>
            <div className="mt-3 space-y-2 pl-6">
              {Object.entries(profile.answers).map(([key, value]) => (
                <div key={key} className="flex justify-between text-small">
                  <span className="text-muted-foreground">
                    {answerLabels[key] ?? key}
                    <TermInfo slug={key} />
                  </span>
                  <span className="font-medium text-foreground">{value as number}/4</span>
                </div>
              ))}
            </div>
          </details>

          <div className="pt-2 text-center">
            <Button variant="link" className="gap-2 text-muted-foreground" onClick={onRetake}>
              <RotateCcw className="h-4 w-4" />
              Retake assessment
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-label">Recommended Categories</CardTitle>
          <CardDescription>
            These AMFI categories match your <strong>{profile.profile}</strong> profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <Badge key={cat} variant="secondary" className="px-3 py-1 text-small">
                {cat}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
