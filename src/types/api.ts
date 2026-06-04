import { z } from 'zod'

export const mfFundSchema = z.object({
  schemeCode: z.string().or(z.number()).transform(String),
  schemeName: z.string(),
  amc: z.string().optional().default(''),
  category: z.string().optional().default(''),
  subCategory: z.string().optional().default(''),
  plan: z.string().optional().default(''),
  option: z.string().optional().default(''),
  benchmark: z.string().optional().default(''),
  expenseRatio: z.number().optional().default(0),
  aum: z.number().optional().default(0),
  riskLabel: z.string().optional().default(''),
})

export type MFFund = z.infer<typeof mfFundSchema>

export const mfFundListSchema = z.array(mfFundSchema)

export const mfapiResponseSchema = z.unknown().transform((raw): MFFund[] => {
  if (!Array.isArray(raw)) return []
  return raw.map(item => {
    if (typeof item !== 'object' || item === null) return null
    const obj = item as Record<string, unknown>
    const safeNumber = (v: unknown, fallback = 0): number => {
      const n = Number(v)
      return Number.isFinite(n) ? n : fallback
    }
    return mfFundSchema.parse({
      schemeCode: obj.scheme_code ?? obj.schemeCode ?? '',
      schemeName: obj.scheme_name ?? obj.schemeName ?? '',
      amc: obj.amc ?? '',
      category: obj.category ?? obj.super_category ?? '',
      subCategory: obj.sub_category ?? obj.subCategory ?? '',
      plan: obj.plan ?? '',
      option: obj.option ?? '',
      benchmark: obj.benchmark ?? '',
      expenseRatio: safeNumber(obj.expense_ratio ?? obj.expenseRatio ?? 0),
      aum: safeNumber(obj.aum ?? 0),
      riskLabel: obj.risk_label ?? obj.riskLabel ?? '',
    })
  }).filter((f): f is MFFund => f !== null)
})

export const navEntrySchema = z.object({
  date: z.string(),
  nav: z.number(),
})

export type NavEntry = z.infer<typeof navEntrySchema>

export const navHistoryResponseSchema = z.unknown().transform((raw): NavEntry[] => {
  if (typeof raw !== 'object' || raw === null) return []
  const obj = raw as Record<string, unknown>
  if (!Array.isArray(obj.data)) return []
  return obj.data
    .map(item => {
      if (typeof item !== 'object' || item === null) return null
      const d = item as Record<string, unknown>
      const navVal = Number(d.nav)
      return {
        date: String(d.date ?? ''),
        nav: Number.isFinite(navVal) ? navVal : 0,
      }
    })
    .filter((e): e is NavEntry => {
      if (e === null || e.date === '') return false
      const t = new Date(e.date).getTime()
      return Number.isFinite(t)
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
})

export const portfolioHoldingSchema = z.object({
  name: z.string(),
  amountCr: z.number().optional().default(0),
  percentage: z.number().optional().default(0),
})

export type PortfolioHolding = z.infer<typeof portfolioHoldingSchema>

export const sectorAllocationSchema = z.object({
  sector: z.string(),
  percentage: z.number(),
})

export type SectorAllocation = z.infer<typeof sectorAllocationSchema>

export const rollingReturnSchema = z.object({
  period: z.string(),
  fund: z.number(),
  benchmark: z.number(),
})

export type RollingReturn = z.infer<typeof rollingReturnSchema>

export const schemeDetailSchema = z.object({
  schemeCode: z.string(),
  schemeName: z.string().optional().default(''),
  amc: z.string().optional().default(''),
  category: z.string().optional().default(''),
  subCategory: z.string().optional().default(''),
  plan: z.string().optional().default(''),
  option: z.string().optional().default(''),
  expenseRatio: z.number().optional().default(0),
  aum: z.number().optional().default(0),
  riskLabel: z.string().optional().default(''),
  benchmark: z.string().optional().default(''),
  exitLoad: z
    .object({
      exists: z.boolean().optional().default(false),
      durationYears: z.number().optional(),
      rate: z.number().optional(),
    })
    .optional()
    .default({ exists: false }),
  portfolioHoldings: z.array(portfolioHoldingSchema).optional().default([]),
  sectorAllocation: z.array(sectorAllocationSchema).optional().default([]),
  rollingReturns: z.array(rollingReturnSchema).optional().default([]),
})

export type SchemeDetail = z.infer<typeof schemeDetailSchema>

export const schemeDetailResponseSchema = z.unknown().transform((raw): SchemeDetail | null => {
  if (typeof raw !== 'object' || raw === null) return null
  const obj = raw as Record<string, unknown>
  const holdingsRaw = Array.isArray(obj.portfolio_holdings ?? obj.portfolioHoldings)
    ? (obj.portfolio_holdings ?? obj.portfolioHoldings).map((h: Record<string, unknown>) => ({
        name: h.name ?? h.security ?? '',
        amountCr: Number(h.amount_cr ?? h.amountCr ?? 0),
        percentage: Number(h.percentage ?? h.percent ?? 0),
      }))
    : []
  const sectorsRaw = Array.isArray(obj.sector_allocation ?? obj.sectorAllocation)
    ? (obj.sector_allocation ?? obj.sectorAllocation).map((s: Record<string, unknown>) => ({
        sector: s.sector ?? '',
        percentage: Number(s.percentage ?? 0),
      }))
    : []
  const returnsRaw = Array.isArray(obj.rolling_returns ?? obj.rollingReturns)
    ? (obj.rolling_returns ?? obj.rollingReturns).map((r: Record<string, unknown>) => ({
        period: r.period ?? '',
        fund: Number(r.fund ?? 0),
        benchmark: Number(r.benchmark ?? r.bm ?? 0),
      }))
    : []
  return schemeDetailSchema.parse({
    schemeCode: String(obj.scheme_code ?? obj.schemeCode ?? ''),
    schemeName: String(obj.scheme_name ?? obj.schemeName ?? ''),
    amc: String(obj.amc ?? ''),
    category: String(obj.category ?? obj.super_category ?? ''),
    subCategory: String(obj.sub_category ?? obj.subCategory ?? ''),
    plan: String(obj.plan ?? ''),
    option: String(obj.option ?? ''),
    expenseRatio: Number(obj.expense_ratio ?? obj.expenseRatio ?? 0),
    aum: Number(obj.aum ?? 0),
    riskLabel: String(obj.risk_label ?? obj.riskLabel ?? ''),
    benchmark: String(obj.benchmark ?? ''),
    exitLoad: (() => {
      const raw = obj.exit_load ?? obj.exitLoad
      if (raw && typeof raw === 'object') return raw
      return { exists: false }
    })(),
    portfolioHoldings: holdingsRaw.filter((h: PortfolioHolding) => h.name),
    sectorAllocation: sectorsRaw.filter((s: SectorAllocation) => s.sector),
    rollingReturns: returnsRaw.filter((r: RollingReturn) => r.period),
  })
})
