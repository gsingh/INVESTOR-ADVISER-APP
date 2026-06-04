import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TermInfo } from '@/components/features/TermInfo'
import { type Goal } from '@/stores/db'
import { useGoals, type GoalFormData } from '../hooks/useGoals'

const DRAFT_KEY = 'goal-form-draft'

const goalTypes: Goal['type'][] = ['Emergency', 'Medium-Term', 'Long-Term', 'Custom']

interface GoalFormProps {
  initialData?: Goal
  onSuccess?: () => void
}

export function GoalForm({ initialData, onSuccess }: GoalFormProps) {
  const navigate = useNavigate()
  const { createGoal, updateGoal } = useGoals()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(initialData?.name ?? '')
  const [type, setType] = useState<Goal['type']>(initialData?.type ?? 'Long-Term')
  const [startingAmount, setStartingAmount] = useState(
    initialData ? String(initialData.currentAmount) : '',
  )
  const [targetAmount, setTargetAmount] = useState(
    initialData ? String(initialData.targetAmount) : '',
  )
  const [targetDate, setTargetDate] = useState(initialData?.targetDate ?? '')

  const [nameError, setNameError] = useState<string | null>(null)
  const [targetAmountError, setTargetAmountError] = useState<string | null>(null)
  const [startingAmountError, setStartingAmountError] = useState<string | null>(null)
  const [targetDateError, setTargetDateError] = useState<string | null>(null)

  useEffect(() => {
    if (initialData) return
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY)
      if (!saved) return
      try {
        const parsed = JSON.parse(saved) as GoalFormData
        setName(parsed.name)
        setType(parsed.type)
        setStartingAmount(String(parsed.startingAmount))
        setTargetAmount(String(parsed.targetAmount))
        setTargetDate(parsed.targetDate)
      } catch { /* ignore corrupt draft */ }
    } catch { /* ignore storage errors */ }
  }, [initialData])

  useEffect(() => {
    if (initialData) return
    const draft: GoalFormData = {
      name,
      type,
      startingAmount: Number(startingAmount.replace(/,/g, '')) || 0,
      targetAmount: Number(targetAmount.replace(/,/g, '')) || 0,
      targetDate,
    }
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch { /* ignore storage errors */ }
  }, [name, type, startingAmount, targetAmount, targetDate, initialData])

  function validateName() {
    if (!name.trim()) {
      setNameError('Goal name is required')
      return false
    }
    setNameError(null)
    return true
  }

  function validateTargetAmount() {
    const num = Number(targetAmount.replace(/,/g, ''))
    if (!targetAmount.trim() || num <= 0) {
      setTargetAmountError('Target amount must be greater than 0')
      return false
    }
    const startNum = Number(startingAmount.replace(/,/g, '')) || 0
    if (num <= startNum) {
      setTargetAmountError('Target amount must be greater than starting amount')
      return false
    }
    setTargetAmountError(null)
    return true
  }

  function validateTargetDate() {
    if (!targetDate) {
      setTargetDateError('Target date is required')
      return false
    }
    const [y, m, d] = targetDate.split('-').map(Number)
    if (m < 1 || m > 12) {
      setTargetDateError('Invalid month')
      return false
    }
    if (d < 1 || d > 31) {
      setTargetDateError('Invalid day')
      return false
    }
    const date = new Date(y, m - 1, d)
    if (isNaN(date.getTime())) {
      setTargetDateError('Invalid date')
      return false
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date <= today) {
      setTargetDateError('Target date must be in the future')
      return false
    }
    setTargetDateError(null)
    return true
  }

  function formatCurrency(value: string) {
    const num = Number(value.replace(/,/g, ''))
    if (isNaN(num)) return value
    return new Intl.NumberFormat('en-IN').format(num)
  }

  function validateStartingAmount() {
    const num = Number(startingAmount.replace(/,/g, ''))
    if (startingAmount.trim() && num < 0) {
      setStartingAmountError('Starting amount cannot be negative')
      return false
    }
    setStartingAmountError(null)
    return true
  }

  function handleStartingAmountBlur() {
    if (startingAmount) {
      setStartingAmount(formatCurrency(startingAmount))
    }
    validateStartingAmount()
  }

  function handleTargetAmountBlur() {
    if (targetAmount) {
      setTargetAmount(formatCurrency(targetAmount))
    }
    validateTargetAmount()
  }

    async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return

    const nameValid = validateName()
    const startValid = validateStartingAmount()
    const amountValid = validateTargetAmount()
    const dateValid = validateTargetDate()
    if (!nameValid || !startValid || !amountValid || !dateValid) return

    setSubmitting(true)
    setError(null)

    try {
      const data: GoalFormData = {
        name: name.trim(),
        type,
        startingAmount: Number(startingAmount.replace(/,/g, '')) || 0,
        targetAmount: Number(targetAmount.replace(/,/g, '')) || 0,
        targetDate,
      }

      if (initialData) {
        if (initialData.id == null || isNaN(initialData.id)) {
          setError('Cannot update goal: missing ID')
          setSubmitting(false)
          return
        }
        await updateGoal(initialData.id, data)
        onSuccess?.()
      } else {
        const id = await createGoal(data)
        sessionStorage.removeItem(DRAFT_KEY)
        onSuccess?.()
        navigate({ to: `/goals/$goalId`, params: { goalId: String(id) } })
      }
    } catch {
      setError('Failed to save goal. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <Target className="mx-auto mb-2 h-10 w-10 text-primary" />
        <h2 className="text-display-sm font-semibold text-foreground">
          {initialData ? 'Edit Goal' : 'Create Goal'}
        </h2>
        <p className="mt-1 text-body text-muted-foreground">
          {initialData
            ? 'Update your financial goal details.'
            : 'Define a new financial goal to track your investments.'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-label">Goal Details</CardTitle>
          <CardDescription>Tell us about your financial goal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal-name">Goal name</Label>
            <Input
              id="goal-name"
              placeholder="e.g. Emergency Corpus"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={validateName}
              required
            />
            {nameError && (
              <p className="text-small text-destructive">{nameError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-type">Goal type</Label>
            <Select value={type} onValueChange={v => setType(v as Goal['type'])}>
              <SelectTrigger id="goal-type" aria-label="Goal type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {goalTypes.map(t => (
                  <SelectItem key={t} value={t}>
                    {t === 'Medium-Term' ? 'Medium Term' : t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="starting-amount">
              Starting amount (₹)
              <TermInfo slug="target-amount" />
            </Label>
            <Input
              id="starting-amount"
              type="text"
              inputMode="numeric"
              placeholder="e.g. 50,000"
              value={startingAmount}
              onChange={e => setStartingAmount(e.target.value.replace(/[^0-9,]/g, ''))}
              onBlur={handleStartingAmountBlur}
            />
            {startingAmountError && (
              <p className="text-small text-destructive">{startingAmountError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-amount">
              Target amount (₹)
              <TermInfo slug="target-amount" />
            </Label>
            <Input
              id="target-amount"
              type="text"
              inputMode="numeric"
              placeholder="e.g. 3,00,000"
              value={targetAmount}
              onChange={e => setTargetAmount(e.target.value.replace(/[^0-9,]/g, ''))}
              onBlur={handleTargetAmountBlur}
              required
            />
            {targetAmountError && (
              <p className="text-small text-destructive">{targetAmountError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-date">
              Target date
              <TermInfo slug="time-horizon" />
            </Label>
            <Input
              id="target-date"
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              onBlur={validateTargetDate}
              required
            />
            {targetDateError && (
              <p className="text-small text-destructive">{targetDateError}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-center text-small text-destructive">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Saving...' : initialData ? 'Update Goal' : 'Create Goal'}
      </Button>
    </form>
  )
}
