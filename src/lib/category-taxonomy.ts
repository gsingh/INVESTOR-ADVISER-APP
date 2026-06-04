import { z } from 'zod'

export const amfiSuperCategorySchema = z.enum([
  'Equity',
  'Debt',
  'Hybrid',
  'Liquid',
  'Other',
])

export type AmfiSuperCategory = z.infer<typeof amfiSuperCategorySchema>

export const amfiSubCategorySchema = z.string()

export interface CategoryNode {
  superCategory: AmfiSuperCategory
  subCategories: string[]
}

export const categoryTaxonomy: CategoryNode[] = [
  {
    superCategory: 'Equity',
    subCategories: [
      'Large Cap',
      'Mid Cap',
      'Small Cap',
      'Flexi Cap',
      'Multi Cap',
      'Large & Mid Cap',
      'ELSS',
      'Contra Fund',
      'Focused Fund',
      'Sectoral/Thematic',
      'Dividend Yield',
      'Value Fund',
    ],
  },
  {
    superCategory: 'Debt',
    subCategories: [
      'Corporate Bond',
      'Gilt',
      'Banking & PSU',
      'Dynamic Bond',
      'Short Duration',
      'Medium Duration',
      'Long Duration',
      'Money Market',
      'Credit Risk',
      'Floater',
    ],
  },
  {
    superCategory: 'Hybrid',
    subCategories: [
      'Aggressive Hybrid',
      'Balanced Advantage',
      'Conservative Hybrid',
      'Multi Asset Allocation',
      'Equity Savings',
      'Arbitrage',
    ],
  },
  {
    superCategory: 'Liquid',
    subCategories: [
      'Liquid',
      'Overnight',
      'Ultra Short Duration',
      'Low Duration',
    ],
  },
  {
    superCategory: 'Other',
    subCategories: [
      'Index Funds/ETF',
      'Fund of Funds',
      'Gold ETF',
      'International',
    ],
  },
]

export function getSuperCategory(subCategory: string): AmfiSuperCategory | null {
  for (const node of categoryTaxonomy) {
    if (node.subCategories.includes(subCategory)) return node.superCategory
  }
  return null
}

export const superCategoryLabels: Record<AmfiSuperCategory, string> = {
  Equity: 'Equity',
  Debt: 'Debt',
  Hybrid: 'Hybrid',
  Liquid: 'Liquid',
  Other: 'Other',
}

export const categoryTermSlugs: Record<string, string> = {
  'Large Cap': 'large-cap',
  'Mid Cap': 'mid-cap',
  'Small Cap': 'small-cap',
  'Flexi Cap': 'flexi-cap',
  'Multi Cap': 'multi-cap',
  'Large & Mid Cap': 'large-mid-cap',
  ELSS: 'elss',
  'Contra Fund': 'contra-fund',
  'Focused Fund': 'focused-fund',
  'Sectoral/Thematic': 'sectoral-thematic',
  'Dividend Yield': 'dividend-yield',
  'Value Fund': 'value-fund',
  'Corporate Bond': 'corporate-bond',
  Gilt: 'gilt',
  'Banking & PSU': 'banking-psu',
  'Dynamic Bond': 'dynamic-bond',
  'Short Duration': 'short-duration',
  'Medium Duration': 'medium-duration',
  'Long Duration': 'long-duration',
  'Money Market': 'money-market',
  'Credit Risk': 'credit-risk',
  Floater: 'floater-fund',
  'Aggressive Hybrid': 'aggressive-hybrid',
  'Balanced Advantage': 'balanced-advantage',
  'Conservative Hybrid': 'conservative-hybrid',
  'Multi Asset Allocation': 'multi-asset-allocation',
  'Equity Savings': 'equity-savings',
  Arbitrage: 'arbitrage-fund',
  Liquid: 'liquid-funds',
  Overnight: 'overnight-fund',
  'Ultra Short Duration': 'ultra-short-duration',
  'Low Duration': 'low-duration',
  'Index Funds/ETF': 'index-funds-etf',
  'Fund of Funds': 'fund-of-funds',
  'Gold ETF': 'gold-etf',
  International: 'international-funds',
}
