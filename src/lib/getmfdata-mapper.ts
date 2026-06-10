const categoryMappings: Record<string, string> = {
  'Large Cap Fund': 'Large Cap',
  'Mid Cap Fund': 'Mid Cap',
  'Small Cap Fund': 'Small Cap',
  'Flexi Cap Fund': 'Flexi Cap',
  'Multi Cap Fund': 'Multi Cap',
  'Large & Mid Cap Fund': 'Large & Mid Cap',
  'ELSS (Tax Saving) Fund': 'ELSS',
  'ELSS Fund': 'ELSS',
  'Contra Fund': 'Contra Fund',
  'Focused Fund': 'Focused Fund',
  'Sectoral/Thematic Fund': 'Sectoral/Thematic',
  'Dividend Yield Fund': 'Dividend Yield',
  'Value Fund': 'Value Fund',
  'Corporate Bond Fund': 'Corporate Bond',
  'Gilt Fund': 'Gilt',
  'Banking & PSU Fund': 'Banking & PSU',
  'Dynamic Bond Fund': 'Dynamic Bond',
  'Short Duration Fund': 'Short Duration',
  'Medium Duration Fund': 'Medium Duration',
  'Long Duration Fund': 'Long Duration',
  'Money Market Fund': 'Money Market',
  'Credit Risk Fund': 'Credit Risk',
  'Floater Fund': 'Floater',
  'Overnight Fund': 'Overnight',
  'Liquid Fund': 'Liquid',
  'Ultra Short Duration Fund': 'Ultra Short Duration',
  'Low Duration Fund': 'Low Duration',
  'Aggressive Hybrid Fund': 'Aggressive Hybrid',
  'Balanced Advantage Fund': 'Balanced Advantage',
  'Conservative Hybrid Fund': 'Conservative Hybrid',
  'Multi Asset Allocation Fund': 'Multi Asset Allocation',
  'Equity Savings Fund': 'Equity Savings',
  'Arbitrage Fund': 'Arbitrage',
  'Index Funds/ETF': 'Index Funds/ETF',
  'Fund of Funds': 'Fund of Funds',
  'Gold ETF': 'Gold ETF',
  International: 'International',
}

export function mapSchemeCategory(subCategory: string | undefined | null): string {
  if (!subCategory) return ''
  const cleaned = subCategory.replace(/^[^-]+-\s*/, '').trim()
  if (categoryMappings[cleaned]) return categoryMappings[cleaned]
  const fuzzy = Object.entries(categoryMappings).find(([key]) =>
    cleaned.toLowerCase().includes(key.toLowerCase().replace(' fund', '')) ||
    key.toLowerCase().includes(cleaned.toLowerCase())
  )
  return fuzzy ? fuzzy[1] : cleaned
}
