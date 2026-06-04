import Dexie, { type Table } from 'dexie'

export interface Goal {
  id?: number
  name: string
  type: 'Emergency' | 'Medium-Term' | 'Long-Term' | 'Custom'
  targetAmount: number
  currentAmount: number
  targetDate: string
  riskProfile: string
  categoryAllocation: Record<string, number>
  status: 'active' | 'closed'
  createdAt: string
  closedAt?: string
}

export interface Transaction {
  id?: number
  schemeCode: string
  type: 'SIP' | 'Lump-sum'
  date: string
  amount: number
  nav: number
  units: number
  goalId?: number
  sipSchedule?: string
}

export interface Portfolio {
  id?: number
  schemeCode: string
  schemeName: string
  category: string
  goalId?: number
  units: number
  targetAllocation: number
}

export interface GoalHolding {
  id?: number
  goalId: number
  fundName: string
  amfiCategory: string
  currentValue: number
  targetAllocation: number
  createdAt: string
  updatedAt: string
}

export interface Journal {
  id?: number
  fundName?: string
  goalId?: number
  reviewId?: number
  whyBought: string
  role: string
  exitTrigger: string
  nextReviewDate?: string
  notes: string
  createdAt: string
}

export interface ScorecardWeight {
  id?: number
  factor: string
  weight: number
}

export interface RiskProfile {
  id?: number
  profile: 'Conservative' | 'Moderate' | 'Aggressive'
  answers: Record<string, string | number>
  monthlyCapacity: number
  timeHorizon: number
  createdAt: string
}

export interface GlossaryEntry {
  id?: number
  term: string
  slug: string
  definition: string
  example: string
  whyMatters: string
}

export class InvestorDB extends Dexie {
  goals!: Table<Goal>
  transactions!: Table<Transaction>
  portfolios!: Table<Portfolio>
  journals!: Table<Journal>
  scorecardWeights!: Table<ScorecardWeight>
  riskProfiles!: Table<RiskProfile>
  glossary!: Table<GlossaryEntry>
  goalHoldings!: Table<GoalHolding>

  constructor() {
    super('InvestorAdviserDB')
    this.version(1).stores({
      goals: '++id, status',
      transactions: '++id, schemeCode, date, goalId',
      portfolios: '++id, schemeCode, goalId',
      journals: '++id, goalId, reviewId, createdAt',
      scorecardWeights: '++id, factor',
      riskProfiles: '++id',
      glossary: '++id, slug',
    })

    this.version(2).stores({
      goals: '++id, status',
      transactions: '++id, schemeCode, date, goalId',
      portfolios: '++id, schemeCode, goalId',
      journals: '++id, goalId, reviewId, createdAt',
      scorecardWeights: '++id, factor',
      riskProfiles: '++id',
      glossary: '++id, slug',
      goalHoldings: '++id, goalId',
    })
  }
}

let db: InvestorDB

try {
  db = new InvestorDB()
} catch (e) {
  console.error('IndexedDB is unavailable:', e)
  throw new Error(
    'IndexedDB is required for this app. Please ensure you are not in private browsing mode and have sufficient storage quota.',
  )
}

export { db }
