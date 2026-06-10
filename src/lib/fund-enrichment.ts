interface CategoryEstimate {
  riskLabel: string
  directExpenseRatioRange: [number, number]
  exitLoadRate: number
  exitLoadDurationYears: number
}

const categoryEstimates: Record<string, CategoryEstimate> = {
  liquid: { riskLabel: 'Low', directExpenseRatioRange: [0.05, 0.15], exitLoadRate: 0, exitLoadDurationYears: 0 },
  'ultra short': { riskLabel: 'Low', directExpenseRatioRange: [0.08, 0.25], exitLoadRate: 0, exitLoadDurationYears: 0 },
  'low duration': { riskLabel: 'Moderately Low', directExpenseRatioRange: [0.10, 0.30], exitLoadRate: 0, exitLoadDurationYears: 0 },
  'money market': { riskLabel: 'Low', directExpenseRatioRange: [0.08, 0.20], exitLoadRate: 0.007, exitLoadDurationYears: 0.02 },
  'short duration': { riskLabel: 'Moderately Low', directExpenseRatioRange: [0.10, 0.35], exitLoadRate: 0.25, exitLoadDurationYears: 0.08 },
  'medium duration': { riskLabel: 'Moderate', directExpenseRatioRange: [0.15, 0.45], exitLoadRate: 0.5, exitLoadDurationYears: 0.08 },
  'medium to long': { riskLabel: 'Moderate', directExpenseRatioRange: [0.20, 0.50], exitLoadRate: 0.5, exitLoadDurationYears: 0.08 },
  'long duration': { riskLabel: 'Moderate', directExpenseRatioRange: [0.25, 0.60], exitLoadRate: 0.5, exitLoadDurationYears: 0.08 },
  'dynamic bond': { riskLabel: 'Moderate', directExpenseRatioRange: [0.15, 0.50], exitLoadRate: 0.5, exitLoadDurationYears: 0.08 },
  'corporate bond': { riskLabel: 'Moderately Low', directExpenseRatioRange: [0.10, 0.35], exitLoadRate: 0.25, exitLoadDurationYears: 0.04 },
  'banking and psu': { riskLabel: 'Moderately Low', directExpenseRatioRange: [0.10, 0.30], exitLoadRate: 0.25, exitLoadDurationYears: 0.04 },
  gilt: { riskLabel: 'Moderately Low', directExpenseRatioRange: [0.08, 0.25], exitLoadRate: 0.25, exitLoadDurationYears: 0.04 },
  'credit risk': { riskLabel: 'Moderate', directExpenseRatioRange: [0.20, 0.50], exitLoadRate: 0.5, exitLoadDurationYears: 0.08 },
  floater: { riskLabel: 'Low', directExpenseRatioRange: [0.08, 0.20], exitLoadRate: 0, exitLoadDurationYears: 0 },
  overnight: { riskLabel: 'Low', directExpenseRatioRange: [0.04, 0.12], exitLoadRate: 0, exitLoadDurationYears: 0 },
  'large cap': { riskLabel: 'Moderately High', directExpenseRatioRange: [0.20, 0.70], exitLoadRate: 1, exitLoadDurationYears: 1 },
  'large & mid cap': { riskLabel: 'Moderately High', directExpenseRatioRange: [0.25, 0.80], exitLoadRate: 1, exitLoadDurationYears: 1 },
  'multi cap': { riskLabel: 'Moderately High', directExpenseRatioRange: [0.25, 0.80], exitLoadRate: 1, exitLoadDurationYears: 1 },
  'mid cap': { riskLabel: 'High', directExpenseRatioRange: [0.30, 0.90], exitLoadRate: 1, exitLoadDurationYears: 1 },
  'small cap': { riskLabel: 'Very High', directExpenseRatioRange: [0.35, 1.20], exitLoadRate: 1, exitLoadDurationYears: 1 },
  'flexi cap': { riskLabel: 'Moderately High', directExpenseRatioRange: [0.25, 0.80], exitLoadRate: 1, exitLoadDurationYears: 1 },
  'focused': { riskLabel: 'High', directExpenseRatioRange: [0.30, 1.00], exitLoadRate: 1, exitLoadDurationYears: 1 },
  'dividend yield': { riskLabel: 'Moderately High', directExpenseRatioRange: [0.20, 0.70], exitLoadRate: 1, exitLoadDurationYears: 1 },
  value: { riskLabel: 'Moderately High', directExpenseRatioRange: [0.25, 0.80], exitLoadRate: 1, exitLoadDurationYears: 1 },
  contra: { riskLabel: 'Moderately High', directExpenseRatioRange: [0.25, 0.80], exitLoadRate: 1, exitLoadDurationYears: 1 },
  'elss (tax saving)': { riskLabel: 'Moderately High', directExpenseRatioRange: [0.20, 0.75], exitLoadRate: 0, exitLoadDurationYears: 0 },
  sectoral: { riskLabel: 'Very High', directExpenseRatioRange: [0.40, 1.50], exitLoadRate: 1, exitLoadDurationYears: 1 },
  thematic: { riskLabel: 'Very High', directExpenseRatioRange: [0.40, 1.50], exitLoadRate: 1, exitLoadDurationYears: 1 },
  'index funds': { riskLabel: 'Moderately High', directExpenseRatioRange: [0.05, 0.30], exitLoadRate: 0.25, exitLoadDurationYears: 0.04 },
  etf: { riskLabel: 'Moderately High', directExpenseRatioRange: [0.03, 0.25], exitLoadRate: 0, exitLoadDurationYears: 0 },
  'fund of funds': { riskLabel: 'Moderately High', directExpenseRatioRange: [0.15, 0.60], exitLoadRate: 1, exitLoadDurationYears: 1 },
  'international': { riskLabel: 'High', directExpenseRatioRange: [0.30, 1.00], exitLoadRate: 1, exitLoadDurationYears: 1 },
  hybrid: { riskLabel: 'Moderate', directExpenseRatioRange: [0.15, 0.60], exitLoadRate: 1, exitLoadDurationYears: 1 },
  aggressive: { riskLabel: 'Moderately High', directExpenseRatioRange: [0.25, 0.80], exitLoadRate: 1, exitLoadDurationYears: 1 },
  conservative: { riskLabel: 'Moderately Low', directExpenseRatioRange: [0.15, 0.50], exitLoadRate: 1, exitLoadDurationYears: 1 },
  balanced: { riskLabel: 'Moderate', directExpenseRatioRange: [0.15, 0.55], exitLoadRate: 1, exitLoadDurationYears: 1 },
  arbitrage: { riskLabel: 'Low', directExpenseRatioRange: [0.15, 0.40], exitLoadRate: 0.25, exitLoadDurationYears: 0.04 },
  'equity savings': { riskLabel: 'Moderate', directExpenseRatioRange: [0.20, 0.65], exitLoadRate: 0.5, exitLoadDurationYears: 0.25 },
}

const categoryBenchmarks: Record<string, string> = {
  'Large Cap': 'Nifty 50 TRI',
  'Mid Cap': 'Nifty 500 TRI',
  'Small Cap': 'Nifty 500 TRI',
  'Flexi Cap': 'Nifty 500 TRI',
  'Multi Cap': 'Nifty 500 TRI',
  'Large & Mid Cap': 'Nifty 500 TRI',
  'ELSS': 'Nifty 500 TRI',
  'Contra Fund': 'Nifty 500 TRI',
  'Focused Fund': 'Nifty 500 TRI',
  'Sectoral/Thematic': 'Nifty 500 TRI',
  'Dividend Yield': 'Nifty 500 TRI',
  'Value Fund': 'Nifty 500 TRI',
}

export function estimateBenchmark(subCategory: string): string {
  if (categoryBenchmarks[subCategory]) return categoryBenchmarks[subCategory]
  const lower = subCategory.toLowerCase()
  if (lower.includes('large')) return 'Nifty 50 TRI'
  if (lower.includes('mid cap') || lower.includes('small cap') || lower.includes('flexi') || lower.includes('multi')) return 'Nifty 500 TRI'
  if (lower.includes('sectoral') || lower.includes('thematic') || lower.includes('elss') || lower.includes('value') || lower.includes('contra') || lower.includes('focused') || lower.includes('dividend')) return 'Nifty 500 TRI'
  return ''
}

export function estimateRiskLabel(category: string): string {
  const lower = category.toLowerCase().trim()
  for (const [key, est] of Object.entries(categoryEstimates)) {
    if (lower.includes(key)) return est.riskLabel
  }
  return 'Moderate'
}

const keyToTaxonomy: Record<string, string> = {
  'large cap': 'Large Cap',
  'mid cap': 'Mid Cap',
  'small cap': 'Small Cap',
  'flexi cap': 'Flexi Cap',
  'multi cap': 'Multi Cap',
  'large & mid cap': 'Large & Mid Cap',
  'elss (tax saving)': 'ELSS',
  contra: 'Contra Fund',
  focused: 'Focused Fund',
  sectoral: 'Sectoral/Thematic',
  thematic: 'Sectoral/Thematic',
  'dividend yield': 'Dividend Yield',
  value: 'Value Fund',
  'corporate bond': 'Corporate Bond',
  gilt: 'Gilt',
  'banking and psu': 'Banking & PSU',
  'dynamic bond': 'Dynamic Bond',
  'short duration': 'Short Duration',
  'medium duration': 'Medium Duration',
  'long duration': 'Long Duration',
  'medium to long': 'Medium Duration',
  'money market': 'Money Market',
  'credit risk': 'Credit Risk',
  floater: 'Floater',
  overnight: 'Overnight',
  liquid: 'Liquid',
  'ultra short': 'Ultra Short Duration',
  'low duration': 'Low Duration',
  'index funds': 'Index Funds/ETF',
  etf: 'Index Funds/ETF',
  'fund of funds': 'Fund of Funds',
  international: 'International',
  aggressive: 'Aggressive Hybrid',
  conservative: 'Conservative Hybrid',
  balanced: 'Balanced Advantage',
  arbitrage: 'Arbitrage',
  'equity savings': 'Equity Savings',
}

export function extractCategoryFromName(schemeName: string): string {
  const normalized = schemeName.toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ').trim()
  const aliases: Record<string, string> = {
    bluechip: 'large cap',
    'blue chip': 'large cap',
    'nifty 50': 'large cap',
    'nifty next 50': 'large cap',
    sensex: 'large cap',
    'fund of fund': 'fund of funds',
    fof: 'fund of funds',
    infrastructure: 'sectoral',
    technology: 'sectoral',
    pharma: 'sectoral',
    banking: 'sectoral',
    consumption: 'sectoral',
    energy: 'sectoral',
  }
  const keywords = Object.keys(categoryEstimates)
  for (const [alias, target] of Object.entries(aliases)) {
    if (normalized.includes(alias)) return keyToTaxonomy[target] ?? target
  }
  keywords.sort((a, b) => b.length - a.length)
  for (const key of keywords) {
    if (normalized.includes(key)) return keyToTaxonomy[key] ?? key.charAt(0).toUpperCase() + key.slice(1)
  }
  return ''
}

export function estimateExpenseRatio(category: string, plan: string): number {
  const lower = category.toLowerCase().trim()
  const isDirect = /direct/i.test(plan)
  for (const [key, est] of Object.entries(categoryEstimates)) {
    if (lower.includes(key)) {
      const [min, max] = est.directExpenseRatioRange
      const mid = (min + max) / 2
      return isDirect ? mid : mid * 1.6
    }
  }
  return isDirect ? 0.5 : 0.8
}

export function estimateExitLoad(category: string): { exists: boolean; rate: number; durationYears: number } {
  const lower = category.toLowerCase().trim()
  for (const [key, est] of Object.entries(categoryEstimates)) {
    if (lower.includes(key)) {
      if (est.exitLoadRate <= 0) return { exists: false, rate: 0, durationYears: 0 }
      return { exists: true, rate: est.exitLoadRate, durationYears: est.exitLoadDurationYears }
    }
  }
  return { exists: true, rate: 1, durationYears: 1 }
}

export function estimateAum(category: string): number {
  const lower = category.toLowerCase().trim()
  if (lower.includes('liquid') || lower.includes('overnight') || lower.includes('money market')) return 5000
  if (lower.includes('ultra short') || lower.includes('low duration')) return 2000
  if (lower.includes('short') || lower.includes('corporate') || lower.includes('banking')) return 1500
  if (lower.includes('gilt') || lower.includes('floater')) return 800
  if (lower.includes('large cap') || lower.includes('index') || lower.includes('etf')) return 3000
  if (lower.includes('flexi cap') || lower.includes('multi cap')) return 2500
  if (lower.includes('mid cap')) return 1500
  if (lower.includes('small cap')) return 800
  if (lower.includes('elss')) return 1200
  if (lower.includes('sectoral') || lower.includes('thematic')) return 500
  if (lower.includes('hybrid') || lower.includes('balanced') || lower.includes('aggressive')) return 1500
  if (lower.includes('arbitrage')) return 1000
  return 1000
}
