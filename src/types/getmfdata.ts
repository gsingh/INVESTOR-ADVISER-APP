import { z } from 'zod'

const getmfdataWrapperSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ data, error: z.string().nullable() })

const getmfdataSearchItemSchema = z.object({
  scheme_code: z.number(),
  isin_growth: z.string().optional(),
  fund_name: z.string(),
  base_fund_name: z.string().optional(),
  plan_type: z.string().optional(),
  option_type: z.string().optional(),
  amc: z.string().optional(),
  scheme_category: z.string().optional(),
  scheme_type: z.string().optional(),
  nav: z.number().optional(),
  nav_date: z.string().optional(),
  rank: z.number().optional(),
})

export const getmfdataSearchResponseSchema = getmfdataWrapperSchema(z.array(getmfdataSearchItemSchema))

export type GetMfDataSearchItem = z.infer<typeof getmfdataSearchItemSchema>

const getmfdataFundItemSchema = z.object({
  scheme_code: z.number(),
  isin_growth: z.string().optional(),
  fund_name: z.string(),
  amc: z.string().optional(),
  scheme_category: z.string().optional(),
  nav: z.number().optional(),
  nav_date: z.string().optional(),
  source: z.string().optional(),
})

export const getmfdataFundResponseSchema = getmfdataWrapperSchema(getmfdataFundItemSchema)

export type GetMfDataFundItem = z.infer<typeof getmfdataFundItemSchema>
