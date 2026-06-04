import { useState, useMemo, useRef, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Calculator, AlertTriangle, ArrowDown, TrendingUp } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ReferenceArea,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { db } from '@/stores/db'
import { calculateSIP, type SIPResult } from '@/lib/sip-calculator'
import { formatINR } from '@/lib/formatters'

interface SIPCalculatorProps {
  goalId: number
}

const LINE_COLORS = {
  conservative: '#F59E0B',
  moderate: '#3B82F6',
  optimistic: '#2E8B57',
  target: '#DC2626',
}

export function SIPCalculator({ goalId }: SIPCalculatorProps) {
  const goal = useLiveQuery(() => db.goals.get(goalId), [goalId])

  const [targetAmountInput, setTargetAmountInput] = useState('')
  const [targetDateInput, setTargetDateInput] = useState('')
  const [startingAmount, setStartingAmount] = useState('')
  const [expectedInflation, setExpectedInflation] = useState('4')
  const [monthlyContribution, setMonthlyContribution] = useState('')
  const [result, setResult] = useState<SIPResult | null>(null)
  const [calculated, setCalculated] = useState(false)
  const monthlyInputRef = useRef<HTMLInputElement>(null)
  const initializedRef = useRef(false)

  const goalData = useMemo(() => {
    if (!goal) return null
    return {
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate,
      currentAmount: goal.currentAmount,
    }
  }, [goal])

  useEffect(() => {
    if (goal && !initializedRef.current) {
      setTargetAmountInput(String(goal.targetAmount))
      setTargetDateInput(goal.targetDate)
      initializedRef.current = true
    }
  }, [goal])

  function handleCalculate() {
    if (!goalData) return

    const mc = Number(monthlyContribution.replace(/,/g, '')) || 0
    const sa = Number(startingAmount.replace(/,/g, '')) || goalData.currentAmount
    const inf = expectedInflation === '' ? 0.04 : Number(expectedInflation) / 100
    const ta = Number(targetAmountInput.replace(/,/g, '')) || goalData.targetAmount
    const td = targetDateInput || goalData.targetDate

    const sipResult = calculateSIP({
      targetAmount: ta,
      targetDate: td,
      startingAmount: sa,
      expectedInflation: inf,
      monthlyContribution: mc,
    })

    setResult(sipResult)
    setCalculated(true)
  }

  if (!goal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-label">SIP Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Calculator className="mr-2 h-5 w-5" />
            <span className="text-body">Loading goal data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const gapBadge = (() => {
    if (!result) return null
    switch (result.gap.status) {
      case 'on_track':
        return <Badge className="rounded-full bg-green-500 hover:bg-green-500">On track</Badge>
      case 'minor_gap':
        return <Badge className="rounded-full bg-amber-500 hover:bg-amber-500">Minor gap</Badge>
      case 'significant_gap':
        return <Badge className="rounded-full bg-red-500 hover:bg-red-500">Significant gap</Badge>
      case 'past_due':
        return <Badge variant="outline" className="rounded-full">Past due</Badge>
    }
  })()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-label">
          <Calculator className="h-4 w-4" />
          SIP Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sip-target-amount">Target amount (₹)</Label>
          <Input
            id="sip-target-amount"
            type="text"
            inputMode="numeric"
            placeholder={String(goal.targetAmount)}
            value={targetAmountInput}
            onChange={e => setTargetAmountInput(e.target.value.replace(/[^0-9,]/g, ''))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sip-target-date">Target date</Label>
          <Input
            id="sip-target-date"
            type="date"
            value={targetDateInput}
            onChange={e => setTargetDateInput(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sip-starting">Starting amount (₹)</Label>
          <Input
            id="sip-starting"
            type="text"
            inputMode="numeric"
            placeholder={String(goal.currentAmount)}
            value={startingAmount}
            onChange={e => setStartingAmount(e.target.value.replace(/[^0-9,]/g, ''))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sip-inflation">Expected inflation (%)</Label>
          <Input
            id="sip-inflation"
            type="text"
            inputMode="numeric"
            placeholder="4"
            value={expectedInflation}
            onChange={e => setExpectedInflation(e.target.value.replace(/[^0-9.]/g, ''))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sip-monthly">Monthly contribution (₹)</Label>
          <Input
            id="sip-monthly"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 5,000"
            value={monthlyContribution}
            onChange={e => setMonthlyContribution(e.target.value.replace(/[^0-9,]/g, ''))}
            ref={monthlyInputRef}
          />
        </div>

        <Button onClick={handleCalculate} className="w-full">
          <TrendingUp className="mr-2 h-4 w-4" />
          Calculate
        </Button>

        {result && result.gap.status === 'past_due' && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
            <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-amber-500" />
            <p className="text-body text-muted-foreground">
              This goal's target date has passed. Projections cannot be calculated.
            </p>
          </div>
        )}

        {result && result.gap.status !== 'past_due' && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-label text-muted-foreground">Required SIP</p>
                {gapBadge}
              </div>
              {result.scenarios.map(s => (
                <div
                  key={s.label}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <span className="text-body text-foreground">{s.label}</span>
                  <span className="text-body font-medium">
                    {formatINR(s.monthlySIP)} / mo
                    <span className="ml-2 text-small text-muted-foreground">
                      → {formatINR(s.projectedValue)}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            {result.gap.amount < 0 && (
              <div
                className={`rounded-lg border-l-4 p-4 ${
                  result.gap.status === 'significant_gap'
                    ? 'border-l-red-500 bg-red-50'
                    : 'border-l-amber-500 bg-amber-50'
                }`}
              >
                <p className="text-body text-foreground">
                  Current projection {formatINR(result.scenarios[1].projectedValue)} vs target{' '}
                  {formatINR(goal.targetAmount)}.{' '}
                  {result.gap.suggestedIncrease > 0 && (
                    <>
                      Increase monthly SIP by{' '}
                      <span className="font-semibold">{formatINR(result.gap.suggestedIncrease)}</span>
                      {' '}to close the gap at 8% return.
                    </>
                  )}
                </p>
                {result.gap.suggestedIncrease > 0 && (
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => {
                      const newVal = (Number(monthlyContribution.replace(/,/g, '')) || 0) + result.gap.suggestedIncrease
                      setMonthlyContribution(String(newVal))
                      monthlyInputRef.current?.focus()
                    }}
                  >
                    <ArrowDown className="mr-2 h-4 w-4" />
                    Adjust SIP
                  </Button>
                )}
              </div>
            )}

            {result.monthlyData.length > 0 && (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.monthlyData}>
                    <XAxis
                      dataKey="month"
                      tickFormatter={v => `${Math.floor(v / 12)}y`}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tickFormatter={v => `₹${(v / 100000).toFixed(1)}L`} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => formatINR(value)}
                      labelFormatter={label => `Month ${label}`}
                    />
                    <Legend verticalAlign="bottom" />
                    {result.gap.amount < 0 && (
                      <ReferenceArea
                        y1={result.scenarios[1].projectedValue}
                        y2={goal.targetAmount}
                        fill="#F59E0B"
                        fillOpacity={0.15}
                      />
                    )}
                    <ReferenceLine
                      y={goal.targetAmount}
                      stroke={LINE_COLORS.target}
                      strokeDasharray="6 4"
                      label="Target"
                    />
                    <Line
                      type="monotone"
                      dataKey="optimistic"
                      stroke={LINE_COLORS.optimistic}
                      name="Optimistic 10%"
                      dot={false}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="moderate"
                      stroke={LINE_COLORS.moderate}
                      name="Moderate 8%"
                      dot={false}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="conservative"
                      stroke={LINE_COLORS.conservative}
                      name="Conservative 6%"
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        {!calculated && (
          <div className="rounded-lg border border-border bg-muted/30 p-6 text-center">
            <TrendingUp className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-body text-muted-foreground">
              Enter your monthly contribution and click Calculate to see projections.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
