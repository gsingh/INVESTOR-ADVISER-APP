import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Transaction } from '@/stores/db'
import type { TransactionFormData } from '@/types/transaction'

interface UseTransactionsReturn {
  transactions: Transaction[] | undefined
  loading: boolean
  addTransaction: (data: TransactionFormData) => Promise<number>
  deleteTransaction: (id: number) => Promise<void>
  error: string | null
}

export function useTransactions(): UseTransactionsReturn {
  const transactions = useLiveQuery(async () => {
    const sorted = await db.transactions.orderBy('date').reverse().toArray()
    return sorted
  })

  const addTransaction = useCallback(async (data: TransactionFormData): Promise<number> => {
    if (!data.amount || data.amount <= 0) throw new Error('Amount must be greater than 0')
    if (!data.nav || data.nav <= 0) throw new Error('NAV must be greater than 0')
    if (!data.date) throw new Error('Date is required')
    if (!data.schemeCode) throw new Error('Fund is required')

    if (data.goalId) {
      const goal = await db.goals.get(data.goalId)
      if (!goal) throw new Error('Selected goal not found')
      if (goal.status === 'closed') throw new Error('Cannot add transaction to a closed goal')
    }

    const units = data.nav > 0 ? Math.round((data.amount / data.nav) * 10000) / 10000 : 0

    const id = await db.transactions.add({
      schemeCode: data.schemeCode,
      type: data.type,
      date: data.date,
      amount: data.amount,
      nav: data.nav,
      units,
      goalId: data.goalId,
      sipSchedule: data.sipSchedule,
    })
    return id
  }, [])

  const deleteTransaction = useCallback(async (id: number) => {
    await db.transactions.delete(id)
  }, [])

  return {
    transactions,
    loading: transactions === undefined,
    addTransaction,
    deleteTransaction,
    error: null,
  }
}
