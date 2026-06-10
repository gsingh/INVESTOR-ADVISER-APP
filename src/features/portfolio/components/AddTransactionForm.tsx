import { useState, useEffect, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { db } from '@/stores/db'
import { useGoals } from '@/features/goals/hooks/useGoals'
import { useTransactions } from '../hooks/useTransactions'
import type { TransactionFormData } from '@/types/transaction'

interface AddTransactionFormProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function AddTransactionForm({ open: controlledOpen, onOpenChange, onSuccess }: AddTransactionFormProps) {
  const { addTransaction } = useTransactions()
  const { goals } = useGoals()
  const { addToast } = useToast()

  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [type, setType] = useState<'SIP' | 'Lump-sum'>('Lump-sum')
  const [schemeCode, setSchemeCode] = useState('')
  const [date, setDate] = useState('')
  const [amount, setAmount] = useState('')
  const [nav, setNav] = useState('')
  const [goalId, setGoalId] = useState('')
  const [sipSchedule, setSipSchedule] = useState('')

  const [schemeError, setSchemeError] = useState<string | null>(null)
  const [dateError, setDateError] = useState<string | null>(null)
  const [amountError, setAmountError] = useState<string | null>(null)
  const [navError, setNavError] = useState<string | null>(null)

  const portfolios = useLiveQuery(async () => {
    const items = await db.portfolios.toArray()
    const unique = new Map<string, { schemeCode: string; schemeName: string }>()
    for (const item of items) {
      if (!unique.has(item.schemeCode)) {
        unique.set(item.schemeCode, { schemeCode: item.schemeCode, schemeName: item.schemeName })
      }
    }
    return Array.from(unique.values()).sort((a, b) => a.schemeName.localeCompare(b.schemeName))
  })

  const activeGoals = goals?.filter(g => g.status === 'active') ?? []

  useEffect(() => {
    if (!open) {
      setType('Lump-sum')
      setSchemeCode('')
      setDate('')
      setAmount('')
      setNav('')
      setGoalId('')
      setSipSchedule('')
      setError(null)
      setSchemeError(null)
      setDateError(null)
      setAmountError(null)
      setNavError(null)
    }
  }, [open])

  const navNum = Number(nav)
  const amountNum = Number(amount.replace(/,/g, ''))
  const computedUnits = navNum > 0 && amountNum > 0 ? Math.round((amountNum / navNum) * 10000) / 10000 : 0

  function formatCurrency(value: string) {
    const num = Number(value.replace(/,/g, ''))
    if (isNaN(num)) return value
    return new Intl.NumberFormat('en-IN').format(num)
  }

  function validateScheme() {
    if (!schemeCode) {
      setSchemeError('Please select a fund')
      return false
    }
    setSchemeError(null)
    return true
  }

  function validateAmount() {
    const num = Number(amount.replace(/,/g, ''))
    if (!amount.trim() || num <= 0) {
      setAmountError('Amount must be greater than 0')
      return false
    }
    setAmountError(null)
    return true
  }

  function validateNav() {
    const num = Number(nav)
    if (!nav.trim() || num <= 0) {
      setNavError('NAV must be greater than 0')
      return false
    }
    setNavError(null)
    return true
  }

  function validateDate() {
    if (!date) {
      setDateError('Date is required')
      return false
    }
    setDateError(null)
    return true
  }

  function handleAmountBlur() {
    const formatted = amount ? formatCurrency(amount) : amount
    if (formatted !== amount) setAmount(formatted)
    const num = Number((formatted || '').replace(/,/g, ''))
    if (!formatted.trim() || num <= 0) {
      setAmountError('Amount must be greater than 0')
    } else {
      setAmountError(null)
    }
  }

  function handleNavBlur() {
    validateNav()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return

    const schemeValid = validateScheme()
    const amountValid = validateAmount()
    const navValid = validateNav()
    const dateValid = validateDate()
    if (!schemeValid || !amountValid || !navValid || !dateValid) return

    setSubmitting(true)
    setError(null)

    try {
      const data: TransactionFormData = {
        schemeCode,
        type,
        date,
        amount: amountNum,
        nav: navNum,
        goalId: goalId && goalId !== 'none' ? Number(goalId) : undefined,
        sipSchedule: type === 'SIP' ? sipSchedule || undefined : undefined,
      }

      await addTransaction(data)
      addToast({ title: 'Transaction logged', variant: 'default' })
      setOpen(false)
      onSuccess?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to log transaction'
      setError(message)
      addToast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tx-type">Type</Label>
            <Select value={type} onValueChange={v => setType(v as 'SIP' | 'Lump-sum')}>
              <SelectTrigger id="tx-type" aria-label="Transaction type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lump-sum">Lump-sum</SelectItem>
                <SelectItem value="SIP">SIP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-fund">Fund</Label>
            {portfolios === undefined ? (
              <p className="text-sm text-muted-foreground">Loading funds...</p>
            ) : portfolios.length > 0 ? (
              <>
                <Select value={schemeCode} onValueChange={v => { setSchemeCode(v); setSchemeError(null) }}>
                  <SelectTrigger id="tx-fund" aria-label="Select fund" onBlur={validateScheme}>
                    <SelectValue placeholder="Select a fund" />
                  </SelectTrigger>
                  <SelectContent>
                    {portfolios.map(p => (
                      <SelectItem key={p.schemeCode} value={p.schemeCode}>
                        {p.schemeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {schemeError && <p className="text-small text-destructive">{schemeError}</p>}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No funds in portfolio. Add funds via the Screener first.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-date">Date</Label>
            <Input
              id="tx-date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              onBlur={validateDate}
              max={new Date().toISOString().split('T')[0]}
              required
            />
            {dateError && <p className="text-small text-destructive">{dateError}</p>}
          </div>

          {type === 'SIP' && (
            <div className="space-y-2">
              <Label htmlFor="tx-sip-schedule">Schedule name (optional)</Label>
              <Input
                id="tx-sip-schedule"
                placeholder="e.g. Monthly Flexi Cap"
                value={sipSchedule}
                onChange={e => setSipSchedule(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tx-amount">Amount (₹)</Label>
              <Input
                id="tx-amount"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 5,000"
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/[^0-9,]/g, ''))}
                onBlur={handleAmountBlur}
                required
              />
              {amountError && <p className="text-small text-destructive">{amountError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tx-nav">NAV (₹)</Label>
              <Input
                id="tx-nav"
                type="number"
                inputMode="decimal"
                step="0.0001"
                placeholder="e.g. 123.4567"
                value={nav}
                onChange={e => setNav(e.target.value)}
                onBlur={handleNavBlur}
                required
              />
              {navError && <p className="text-small text-destructive">{navError}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Units (auto-computed)</Label>
            <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
              {computedUnits > 0 ? computedUnits.toFixed(4) : '—'}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-goal">Linked goal (optional)</Label>
            <Select value={goalId} onValueChange={setGoalId}>
              <SelectTrigger id="tx-goal" aria-label="Link to goal">
                <SelectValue placeholder="No goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No goal</SelectItem>
                {activeGoals.map(g => (
                  <SelectItem key={g.id} value={String(g.id)}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-small text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={submitting || !portfolios || portfolios.length === 0}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Log Transaction'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
