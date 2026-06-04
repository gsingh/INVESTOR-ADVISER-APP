import type { Transaction } from '@/stores/db'

export interface TransactionFormData {
  schemeCode: string
  type: 'SIP' | 'Lump-sum'
  date: string
  amount: number
  nav: number
  goalId?: number
  sipSchedule?: string
}

export interface TransactionRow extends Transaction {
  schemeName: string
  goalName?: string
}
