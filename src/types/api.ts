import { z } from 'zod'
import { estimateRiskLabel, estimateExpenseRatio, estimateAum, estimateBenchmark, extractCategoryFromName } from '@/lib/fund-enrichment'
import { extractPlan, extractOption, extractAmc } from './mf-utils'

export const mfFundSchema = z.object({
  schemeCode: z.number().or(z.string()).transform(String),
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
  const len = raw.length
  const result: MFFund[] = new Array(len)
  for (let i = 0; i < len; i++) {
    const item = raw[i]
    if (typeof item !== 'object' || item === null) continue
    const obj = item as Record<string, unknown>
    const schemeCode = typeof obj.schemeCode === 'number' ? String(obj.schemeCode) : String(obj.schemeCode ?? '')
    const schemeName = String(obj.schemeName ?? '')
    const plan = extractPlan(schemeName)
    const category = extractCategoryFromName(schemeName)
    result[i] = {
      schemeCode,
      schemeName,
      amc: extractAmc(schemeName),
      category,
      subCategory: category,
      plan,
      option: extractOption(schemeName),
      benchmark: estimateBenchmark(category),
      expenseRatio: estimateExpenseRatio(category, plan),
      aum: estimateAum(category),
      riskLabel: estimateRiskLabel(category),
    }
  }
  return result.filter(Boolean)
})

export const navEntrySchema = z.object({
  date: z.string(),
  nav: z.number(),
})

export type NavEntry = z.infer<typeof navEntrySchema>

function parseDate(dateStr: string): Date | null {
  const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})$/
  const match = dateStr.match(ddmmyyyy)
  if (match) {
    const [, d, m, y] = match
    return new Date(Number(y), Number(m) - 1, Number(d))
  }
  const t = new Date(dateStr).getTime()
  return Number.isFinite(t) ? new Date(t) : null
}

export const navHistoryResponseSchema = z.unknown().transform((raw): NavEntry[] => {
  if (typeof raw !== 'object' || raw === null) return []
  const obj = raw as Record<string, unknown>
  const dataArr = Array.isArray(obj.data) ? obj.data : []
  return dataArr
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
      const d = parseDate(e.date)
      return d !== null
    })
    .sort((a, b) => {
      const da = parseDate(a.date)
      const db = parseDate(b.date)
      if (!da || !db) return 0
      return da.getTime() - db.getTime()
    })
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
  launchDate: z.string().optional(),
})

export type SchemeDetail = z.infer<typeof schemeDetailSchema>

function parseCategory(categoryStr: string): { category: string; subCategory: string } {
  const parts = categoryStr.split(' - ')
  if (parts.length >= 2) {
    return { category: parts[0].trim(), subCategory: parts.slice(1).join(' - ').trim() }
  }
  return { category: categoryStr, subCategory: categoryStr }
}

const mfdataWrapperSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ status: z.string(), data })

const mfdataSchemeSchema = z.object({
  amfi_code: z.string(),
  name: z.string(),
  family_id: z.number().optional(),
  nav: z.number().optional(),
  nav_date: z.string().optional(),
  expense_ratio: z.number().optional(),
  morningstar: z.number().optional(),
})

export const mfdataSchemeResponseSchema = mfdataWrapperSchema(mfdataSchemeSchema)

const mfdataSectorEntrySchema = z.object({
  sector: z.string(),
  weight_pct: z.number(),
})

const mfdataSectorsDataSchema = z.object({
  sectors: z.array(mfdataSectorEntrySchema).optional().default([]),
  family_id: z.number().optional(),
  family_name: z.string().optional(),
}).passthrough()

export const mfdataSectorsResponseSchema = mfdataWrapperSchema(mfdataSectorsDataSchema)

export type MfdataSectorEntry = z.infer<typeof mfdataSectorEntrySchema>

export const schemeDetailResponseSchema = z.unknown().transform((raw): SchemeDetail | null => {
  if (typeof raw !== 'object' || raw === null) return null
  const obj = raw as Record<string, unknown>
  const meta = obj.meta as Record<string, unknown> | undefined

  if (!meta || !meta.scheme_code) return null

  const schemeCode = String(meta.scheme_code)
  const rawCategory = String(meta.scheme_category ?? meta.category ?? '')
  const { category, subCategory } = parseCategory(rawCategory)

  return schemeDetailSchema.parse({
    schemeCode,
    schemeName: String(meta.scheme_name ?? ''),
    amc: String(meta.fund_house ?? ''),
    category,
    subCategory,
    plan: '',
    option: '',
    expenseRatio: 0,
    aum: 0,
    riskLabel: '',
    benchmark: '',
    exitLoad: { exists: false },
    portfolioHoldings: [],
    sectorAllocation: [],
    rollingReturns: [],
  })
})
