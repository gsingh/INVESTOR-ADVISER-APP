import { useState, type FormEvent } from 'react'
import { ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TermInfo } from '@/components/features/TermInfo'
import type { Answer } from '../hooks/useProfile'

interface Question {
  key: string
  slug: string
  label: string
  options: { label: string; value: number }[]
}

const questions: Question[] = [
  {
    key: 'time-horizon',
    slug: 'time-horizon',
    label: 'How long do you plan to stay invested?',
    options: [
      { label: 'Less than 1 year', value: 0 },
      { label: '1–3 years', value: 1 },
      { label: '3–7 years', value: 2 },
      { label: '7–12 years', value: 3 },
      { label: 'Over 12 years', value: 4 },
    ],
  },
  {
    key: 'drawdown',
    slug: 'drawdown',
    label: 'What is the largest temporary loss you can tolerate in a year?',
    options: [
      { label: 'None — I prefer safety', value: 0 },
      { label: 'Up to 5%', value: 1 },
      { label: 'Up to 10%', value: 2 },
      { label: 'Up to 20%', value: 3 },
      { label: 'Over 20%', value: 4 },
    ],
  },
  {
    key: 'income-stability',
    slug: 'income-stability',
    label: 'How stable is your monthly income?',
    options: [
      { label: 'Not stable', value: 0 },
      { label: 'Somewhat stable', value: 1 },
      { label: 'Stable', value: 2 },
      { label: 'Very stable', value: 3 },
      { label: 'Highly stable with savings', value: 4 },
    ],
  },
  {
    key: 'emergency-fund',
    slug: 'emergency-fund',
    label: 'Do you have an emergency fund covering your expenses?',
    options: [
      { label: 'No emergency fund', value: 0 },
      { label: 'Less than 1 month', value: 1 },
      { label: '1–3 months', value: 2 },
      { label: '3–6 months', value: 3 },
      { label: 'Over 6 months', value: 4 },
    ],
  },
  {
    key: 'investing-experience',
    slug: 'investing-experience',
    label: "How would you rate your investing knowledge?",
    options: [
      { label: 'Beginner', value: 0 },
      { label: 'Some knowledge', value: 1 },
      { label: 'Intermediate', value: 2 },
      { label: 'Advanced', value: 3 },
      { label: 'Expert', value: 4 },
    ],
  },
]

interface RiskQuestionnaireProps {
  onSubmit: (answers: Answer[], monthlyCapacity: number, timeHorizon: number) => Promise<void>
}

export function RiskQuestionnaire({ onSubmit }: RiskQuestionnaireProps) {
  const [selections, setSelections] = useState<Record<string, number>>({})
  const [monthlyCapacity, setMonthlyCapacity] = useState('')
  const [timeHorizon, setTimeHorizon] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allAnswered = questions.every(q => selections[q.key] !== undefined) && monthlyCapacity && timeHorizon

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!allAnswered || submitting) return

    setSubmitting(true)
    setError(null)
    try {
      const answers: Answer[] = questions.map(q => ({
        question: q.key,
        label: q.label,
        value: selections[q.key],
      }))

      await onSubmit(answers, Number(monthlyCapacity.replace(/,/g, '')), Number(timeHorizon))
    } catch {
      setError('Failed to save profile. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <ClipboardList className="mx-auto mb-2 h-10 w-10 text-primary" />
        <h2 className="text-display-sm font-semibold text-foreground">Risk Assessment</h2>
        <p className="mt-1 text-body text-muted-foreground">
          Answer a few questions to determine your investor risk profile.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-label">Your Profile</CardTitle>
          <CardDescription>Tell us about your financial situation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monthly-capacity">Monthly investment capacity (₹)</Label>
            <Input
              id="monthly-capacity"
              type="number"
              min="0"
              placeholder="e.g. 5000"
              value={monthlyCapacity}
              onChange={e => setMonthlyCapacity(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time-horizon-years">Investment time horizon (years)</Label>
            <Input
              id="time-horizon-years"
              type="number"
              min="1"
              max="50"
              placeholder="e.g. 10"
              value={timeHorizon}
              onChange={e => setTimeHorizon(e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      {questions.map(q => (
        <Card key={q.key}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-label">
              {q.label}
              <TermInfo slug={q.slug} inline />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selections[q.key]?.toString() ?? ''}
              onValueChange={v => setSelections(prev => ({ ...prev, [q.key]: Number(v) }))}
            >
              <SelectTrigger aria-label={q.label}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {q.options.map(opt => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      ))}

      {error && (
        <p className="text-center text-small text-destructive">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={!allAnswered || submitting}>
        {submitting ? 'Saving...' : 'Calculate My Risk Profile'}
      </Button>
    </form>
  )
}
