import type { ScorableFund, ScorecardWeights, ComputeScoreResult, ScoringFactor, ScoringContext } from '@/types/scorecard'
import type { NavEntry, RollingReturn } from '@/types/api'
import {
  computeTrailingReturn,
  computeSinceInception,
  computeCalendarYearReturns,
} from './yearwise-returns'

const RISK_FREE_RATE = 6.5

function getYearsSince(dateStr: string | undefined): number | undefined {
  if (!dateStr) return undefined
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return undefined
  const years = (Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  return Math.max(0, years)
}

function computeDailyReturnsFromNav(navHistory: NavEntry[]): number[] | null {
  if (!navHistory || navHistory.length < 5) return null
  const returns: number[] = []
  for (let i = 1; i < navHistory.length; i++) {
    const prev = navHistory[i - 1].nav
    const curr = navHistory[i].nav
    if (prev > 0 && curr > 0) {
      returns.push(Math.log(curr / prev))
    }
  }
  return returns.length >= 5 ? returns : null
}

function annualizedReturnAndVol(dailyReturns: number[]): { annualizedReturn: number; annualizedVol: number } | null {
  if (dailyReturns.length < 5) return null
  const mean = dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length
  const variance = dailyReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / (dailyReturns.length - 1)
  return {
    annualizedReturn: mean * 252 * 100,
    annualizedVol: Math.sqrt(variance) * Math.sqrt(252) * 100,
  }
}

function computeDownsideDeviation(dailyReturns: number[]): number | null {
  if (dailyReturns.length < 5) return null
  const negativeReturns = dailyReturns.filter(r => r < 0)
  if (negativeReturns.length < 2) return null
  const mean = negativeReturns.reduce((s, r) => s + r, 0) / negativeReturns.length
  const variance = negativeReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / (negativeReturns.length - 1)
  return Math.sqrt(variance) * Math.sqrt(252) * 100
}

function computeRollingRegression(rollingReturns: RollingReturn[]): {
  alpha: number; beta: number; rSquared: number; trackingError: number; infoRatio: number
} | null {
  if (!rollingReturns || rollingReturns.length < 3) return null

  const fundReturns = rollingReturns.map(r => r.fund)
  const bmReturns = rollingReturns.map(r => r.benchmark)
  const n = fundReturns.length

  const fundMean = fundReturns.reduce((s, v) => s + v, 0) / n
  const bmMean = bmReturns.reduce((s, v) => s + v, 0) / n

  let cov = 0
  let varBm = 0
  let varFund = 0
  for (let i = 0; i < n; i++) {
    const fd = fundReturns[i] - fundMean
    const bd = bmReturns[i] - bmMean
    cov += fd * bd
    varBm += bd * bd
    varFund += fd * fd
  }
  cov /= (n - 1)
  varBm /= (n - 1)
  varFund /= (n - 1)

  if (varBm === 0) return null

  const beta = cov / varBm
  const alpha = fundMean - beta * bmMean

  const rSquared = (varBm > 0 && varFund > 0)
    ? (cov / Math.sqrt(varBm * varFund)) ** 2
    : 0

  const diffs = rollingReturns.map(r => r.fund - r.benchmark)
  const diffMean = diffs.reduce((s, v) => s + v, 0) / n
  const trackingError = Math.sqrt(diffs.reduce((s, v) => s + (v - diffMean) ** 2, 0) / (n - 1))

  const infoRatio = trackingError > 0 ? diffMean / trackingError : 0

  return { alpha, beta, rSquared: rSquared * 100, trackingError, infoRatio }
}

function computeCaptureRatios(rollingReturns: RollingReturn[]): { upCapture: number; downCapture: number } | null {
  if (!rollingReturns || rollingReturns.length < 2) return null

  const upPeriods: { fund: number; bm: number }[] = []
  const downPeriods: { fund: number; bm: number }[] = []

  for (const r of rollingReturns) {
    if (r.benchmark > 0) upPeriods.push({ fund: r.fund, bm: r.benchmark })
    else if (r.benchmark < 0) downPeriods.push({ fund: r.fund, bm: r.benchmark })
  }

  if (upPeriods.length === 0 || downPeriods.length === 0) return null

  const avgUpFund = upPeriods.reduce((s, p) => s + p.fund, 0) / upPeriods.length
  const avgUpBm = upPeriods.reduce((s, p) => s + p.bm, 0) / upPeriods.length
  const avgDownFund = downPeriods.reduce((s, p) => s + p.fund, 0) / downPeriods.length
  const avgDownBm = downPeriods.reduce((s, p) => s + p.bm, 0) / downPeriods.length

  return {
    upCapture: avgUpBm > 0 ? (avgUpFund / avgUpBm) * 100 : 100,
    downCapture: avgDownBm !== 0 ? (avgDownFund / avgDownBm) * 100 : 100,
  }
}

function scoreCategoryFit(fund: ScorableFund): { rawScore: number; explanation: string } {
  const subCat = fund.subCategory?.trim()
  if (subCat && subCat !== 'Others' && subCat !== 'Unknown' && subCat !== '---') {
    return { rawScore: 20, explanation: `Fund belongs to ${fund.subCategory}, a well-defined AMFI sub-category` }
  }
  if (fund.category) {
    return { rawScore: 10, explanation: `Fund is classified under ${fund.category} but has no specific sub-category` }
  }
  return { rawScore: 0, explanation: 'No category classification available for this fund' }
}

function scoreCost(fund: ScorableFund): { rawScore: number; explanation: string } {
  if (fund.expenseRatio === undefined || fund.expenseRatio === null || isNaN(fund.expenseRatio)) {
    return { rawScore: 10, explanation: 'Expense ratio data unavailable — defaulting to middle score' }
  }
  if (fund.expenseRatio >= 2.5) {
    return { rawScore: 0, explanation: `Expense ratio of ${fund.expenseRatio.toFixed(2)}% is very high (max threshold 2.5%)` }
  }
  if (fund.expenseRatio < 0) {
    return { rawScore: 10, explanation: `Expense ratio of ${fund.expenseRatio}% is invalid (negative) — defaulting to middle score` }
  }
  if (fund.expenseRatio <= 0.5) {
    return { rawScore: 20, explanation: `Expense ratio of ${fund.expenseRatio.toFixed(2)}% is excellent (≤ 0.5%)` }
  }
  const rawScore = 20 - (fund.expenseRatio - 0.5) * 10
  const rounded = Math.round(rawScore * 100) / 100
  return { rawScore: rounded, explanation: `Expense ratio of ${fund.expenseRatio.toFixed(2)}% scores ${rounded.toFixed(1)}/20` }
}

function scoreFundAge(fund: ScorableFund): { rawScore: number; explanation: string } {
  const years = getYearsSince(fund.launchDate)
  if (years === undefined) {
    return { rawScore: 10, explanation: 'Fund launch date unavailable — defaulting to middle score' }
  }
  if (years < 1) {
    return { rawScore: 0, explanation: `Fund is only ${years.toFixed(1)} years old — very short track record` }
  }
  if (years >= 20) {
    return { rawScore: 20, explanation: `Fund has a ${years.toFixed(0)}-year track record — excellent` }
  }
  let rawScore: number
  if (years < 3) rawScore = 5 * ((years - 1) / 2)
  else if (years < 5) rawScore = 5 + 5 * ((years - 3) / 2)
  else if (years < 10) rawScore = 10 + 5 * ((years - 5) / 5)
  else rawScore = 15 + 5 * ((years - 10) / 10)
  const rounded = Math.round(rawScore * 100) / 100
  return { rawScore: rounded, explanation: `Fund is ${years.toFixed(1)} years old (score: ${rounded.toFixed(1)}/20)` }
}

function scoreAumSanity(fund: ScorableFund): { rawScore: number; explanation: string } {
  if (fund.aum === undefined || fund.aum === null || isNaN(fund.aum)) {
    return { rawScore: 10, explanation: 'AUM data unavailable — defaulting to middle score' }
  }
  if (fund.aum <= 0) {
    return { rawScore: 0, explanation: 'AUM is zero or negative — possible data issue' }
  }
  if (fund.aum >= 500 && fund.aum <= 10000) {
    return { rawScore: 20, explanation: `AUM of ₹${fund.aum.toLocaleString()}Cr is in the ideal range (₹500-10,000Cr)` }
  }
  if (fund.aum < 500) {
    const rawScore = (fund.aum / 500) * 20
    const rounded = Math.round(rawScore * 100) / 100
    return { rawScore: rounded, explanation: `AUM of ₹${fund.aum.toLocaleString()}Cr is below ideal range` }
  }
  const rawScore = Math.max(0, 20 - ((fund.aum - 10000) / 40000) * 20)
  const rounded = Math.round(rawScore * 100) / 100
  return { rawScore: rounded, explanation: `AUM of ₹${fund.aum.toLocaleString()}Cr is above ideal range` }
}

function scoreBenchmarkSuitability(fund: ScorableFund): { rawScore: number; explanation: string } {
  if (!fund.benchmark) {
    return { rawScore: 0, explanation: 'No benchmark assigned to this fund' }
  }
  const bm = fund.benchmark.toLowerCase()
  if (bm.includes('tri') || bm.includes('index')) {
    return { rawScore: 20, explanation: `Benchmark "${fund.benchmark}" is a total return index — suitable benchmark` }
  }
  return { rawScore: 10, explanation: `Benchmark "${fund.benchmark}" is assigned but may not be a standard index` }
}

function scoreRollingReturnConsistency(fund: ScorableFund): { rawScore: number; explanation: string } {
  const returns = fund.rollingReturns
  if (!returns || returns.length === 0) {
    return { rawScore: 10, explanation: 'Rolling-return data unavailable — defaulting to middle score' }
  }

  let beatCount = 0
  let totalOutperformance = 0
  const details: string[] = []

  for (const r of returns) {
    const fundReturn = r.fund ?? 0
    const bmReturn = r.benchmark ?? 0
    const diff = fundReturn - bmReturn

    if (diff > 0) {
      beatCount++
      totalOutperformance += diff
      details.push(`${r.period}: +${diff.toFixed(1)}% vs benchmark`)
    } else if (diff < 0) {
      details.push(`${r.period}: ${diff.toFixed(1)}% vs benchmark`)
    } else {
      details.push(`${r.period}: equal to benchmark`)
    }
  }

  if (beatCount === 0) {
    return {
      rawScore: 0,
      explanation: `Fund underperforms benchmark across all ${returns.length} periods (${details.join('; ')})`,
    }
  }

  const beatRatio = beatCount / returns.length
  const avgOutperformance = returns.length > 0 ? totalOutperformance / returns.length : 0

  let rawScore = beatRatio * 20

  const bonus = Math.min(4, avgOutperformance * 1.5)
  rawScore = Math.min(20, rawScore + bonus)

  const rounded = Math.round(rawScore * 100) / 100
  const pct = Math.round(beatRatio * 100)

  return {
    rawScore: rounded,
    explanation: `Fund beats benchmark in ${beatCount}/${returns.length} periods (${pct}%)${bonus > 0 ? ` with avg +${avgOutperformance.toFixed(1)}% outperformance bonus` : ''}`,
  }
}

function scoreVolatility(fund: ScorableFund): { rawScore: number; explanation: string } {
  const dailyReturns = computeDailyReturnsFromNav(fund.navHistory ?? [])
  if (!dailyReturns) {
    return { rawScore: 10, explanation: 'Insufficient NAV history for volatility calculation — defaulting to middle score' }
  }

  const stats = annualizedReturnAndVol(dailyReturns)
  if (!stats) {
    return { rawScore: 10, explanation: 'Insufficient daily returns for volatility calculation' }
  }

  const annualizedVol = stats.annualizedVol

  if (annualizedVol <= 8) {
    return { rawScore: 20, explanation: `Very low volatility (${annualizedVol.toFixed(1)}% annualized) — excellent stability` }
  }
  if (annualizedVol >= 30) {
    return { rawScore: 0, explanation: `Very high volatility (${annualizedVol.toFixed(1)}% annualized) — high risk` }
  }

  const rawScore = 20 - ((annualizedVol - 8) / (30 - 8)) * 20
  const rounded = Math.round(rawScore * 100) / 100
  return { rawScore: rounded, explanation: `Annualized volatility ${annualizedVol.toFixed(1)}% (score: ${rounded.toFixed(1)}/20)` }
}

function scoreDrawdown(fund: ScorableFund): { rawScore: number; explanation: string } {
  const navData = fund.navHistory
  if (!navData || navData.length < 2) {
    return { rawScore: 10, explanation: 'Insufficient NAV history for drawdown calculation — defaulting to middle score' }
  }

  let peak = navData[0].nav
  let maxDrawdown = 0

  for (let i = 1; i < navData.length; i++) {
    const nav = navData[i].nav
    if (nav > peak) {
      peak = nav
    }
    const drawdown = ((peak - nav) / peak) * 100
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  }

  if (maxDrawdown <= 10) {
    return { rawScore: 20, explanation: `Max drawdown is only ${maxDrawdown.toFixed(1)}% — excellent downside protection` }
  }
  if (maxDrawdown >= 50) {
    return { rawScore: 0, explanation: `Max drawdown is ${maxDrawdown.toFixed(1)}% — severe downside risk` }
  }

  const rawScore = 20 - ((maxDrawdown - 10) / (50 - 10)) * 20
  const rounded = Math.round(rawScore * 100) / 100
  return { rawScore: rounded, explanation: `Max drawdown is ${maxDrawdown.toFixed(1)}% (score: ${rounded.toFixed(1)}/20)` }
}

function scoreExitLoad(fund: ScorableFund): { rawScore: number; explanation: string } {
  if (!fund.exitLoad) {
    return { rawScore: 10, explanation: 'Exit load data unavailable — defaulting to middle score' }
  }
  if (!fund.exitLoad.exists) {
    return { rawScore: 20, explanation: 'No exit load — full liquidity' }
  }
  const dur = fund.exitLoad.durationYears
  if (dur === undefined || dur === null) {
    return { rawScore: 10, explanation: 'Exit load exists but duration unknown' }
  }
  if (dur < 1) return { rawScore: 15, explanation: `Exit load for ${dur} year(s) — relatively short lock-in` }
  if (dur < 2) return { rawScore: 10, explanation: `Exit load for ${dur} year(s) — moderate lock-in` }
  if (dur < 3) return { rawScore: 5, explanation: `Exit load for ${dur} year(s) — long lock-in` }
  return { rawScore: 0, explanation: `Exit load for ${dur} year(s) — very long lock-in` }
}

function scoreOverlap(fund: ScorableFund, context?: ScoringContext): { rawScore: number; explanation: string } {
  const fundHoldings = fund.portfolioHoldings
  const userHoldings = context?.userPortfolioHoldings

  if (!fundHoldings || fundHoldings.length === 0) {
    return { rawScore: 10, explanation: 'Fund portfolio holdings unavailable for overlap analysis' }
  }

  if (!userHoldings || userHoldings.length === 0) {
    return { rawScore: 10, explanation: 'No user portfolio holdings to compare against — add holdings for overlap analysis' }
  }

  const userStockNames = new Set(
    userHoldings.map(h => h.name.toLowerCase().trim()).filter(Boolean),
  )

  const fundTopStocks = fundHoldings
    .filter(h => h.name)
    .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0))
    .slice(0, 10)

  if (fundTopStocks.length === 0) {
    return { rawScore: 10, explanation: 'Fund portfolio holdings available but no stock names found' }
  }

  let overlapCount = 0
  let overlapPct = 0
  const overlappingStocks: string[] = []

  for (const holding of fundTopStocks) {
    const name = holding.name.toLowerCase().trim()
    if (userStockNames.has(name)) {
      overlapCount++
      overlapPct += holding.percentage ?? 0
      overlappingStocks.push(holding.name)
    }
  }

  const overlapRatio = overlapCount / fundTopStocks.length
  const rawScore = Math.max(0, 20 - overlapRatio * 20)
  const rounded = Math.round(rawScore * 100) / 100

  if (overlapCount === 0) {
    return { rawScore: 20, explanation: `Zero overlap — fund's top ${fundTopStocks.length} holdings are completely distinct from your portfolio` }
  }

  return {
    rawScore: rounded,
    explanation: `${overlapCount}/${fundTopStocks.length} top holdings overlap (${overlappingStocks.slice(0, 3).join(', ')}${overlappingStocks.length > 3 ? ', ...' : ''}) — ${overlapPct.toFixed(0)}% overlapped exposure`,
  }
}

function scoreSharpeRatio(fund: ScorableFund): { rawScore: number; explanation: string } {
  const dailyReturns = computeDailyReturnsFromNav(fund.navHistory ?? [])
  if (!dailyReturns) {
    return { rawScore: 10, explanation: 'Insufficient NAV history for Sharpe calculation — defaulting to middle score' }
  }

  const stats = annualizedReturnAndVol(dailyReturns)
  if (!stats || stats.annualizedVol <= 0) {
    return { rawScore: 10, explanation: 'Insufficient data for Sharpe calculation' }
  }

  const sharpe = (stats.annualizedReturn - RISK_FREE_RATE) / stats.annualizedVol

  let rawScore: number
  if (sharpe >= 1.5) rawScore = 20
  else if (sharpe >= 1.0) rawScore = 15 + (sharpe - 1.0) * 10
  else if (sharpe >= 0.5) rawScore = 10 + (sharpe - 0.5) * 10
  else if (sharpe >= 0) rawScore = (sharpe / 0.5) * 10
  else rawScore = 0

  const rounded = Math.round(rawScore * 100) / 100
  return { rawScore: rounded, explanation: `Sharpe ratio of ${sharpe.toFixed(2)} (score: ${rounded.toFixed(1)}/20)` }
}

function scoreSortinoRatio(fund: ScorableFund): { rawScore: number; explanation: string } {
  const dailyReturns = computeDailyReturnsFromNav(fund.navHistory ?? [])
  if (!dailyReturns) {
    return { rawScore: 10, explanation: 'Insufficient NAV history for Sortino calculation — defaulting to middle score' }
  }

  const stats = annualizedReturnAndVol(dailyReturns)
  const downsideDev = computeDownsideDeviation(dailyReturns)

  if (!stats || !downsideDev || downsideDev <= 0) {
    return { rawScore: 10, explanation: 'Insufficient data for Sortino calculation' }
  }

  const sortino = (stats.annualizedReturn - RISK_FREE_RATE) / downsideDev

  let rawScore: number
  if (sortino >= 2.0) rawScore = 20
  else if (sortino >= 1.5) rawScore = 15 + (sortino - 1.5) * 10
  else if (sortino >= 0.75) rawScore = 10 + (sortino - 0.75) * (10 / 0.75)
  else if (sortino >= 0) rawScore = (sortino / 0.75) * 10
  else rawScore = 0

  const rounded = Math.round(rawScore * 100) / 100
  return { rawScore: rounded, explanation: `Sortino ratio of ${sortino.toFixed(2)} (score: ${rounded.toFixed(1)}/20)` }
}

function scoreAlpha(fund: ScorableFund): { rawScore: number; explanation: string } {
  const regression = computeRollingRegression(fund.rollingReturns ?? [])
  if (!regression) {
    return { rawScore: 10, explanation: 'Insufficient rolling-return data for Alpha calculation — defaulting to middle score' }
  }

  const alpha = regression.alpha

  let rawScore: number
  if (alpha >= 3) rawScore = 20
  else if (alpha >= 2) rawScore = 16 + (alpha - 2) * 4
  else if (alpha >= 1) rawScore = 12 + (alpha - 1) * 4
  else if (alpha >= 0) rawScore = 8 + alpha * 4
  else if (alpha >= -1) rawScore = 4 + (alpha + 1) * 4
  else rawScore = 0

  const rounded = Math.round(rawScore * 100) / 100
  return { rawScore: rounded, explanation: `Alpha of ${alpha.toFixed(2)}% (score: ${rounded.toFixed(1)}/20)` }
}

function scoreBeta(fund: ScorableFund): { rawScore: number; explanation: string } {
  const regression = computeRollingRegression(fund.rollingReturns ?? [])
  if (!regression) {
    return { rawScore: 10, explanation: 'Insufficient rolling-return data for Beta calculation — defaulting to middle score' }
  }

  const beta = regression.beta
  const distFrom1 = Math.abs(beta - 1)

  let rawScore: number
  if (distFrom1 <= 0.05) rawScore = 20
  else if (distFrom1 <= 0.10) rawScore = 16
  else if (distFrom1 <= 0.20) rawScore = 12
  else if (distFrom1 <= 0.30) rawScore = 8
  else rawScore = 4

  const rounded = Math.round(rawScore * 100) / 100
  return { rawScore: rounded, explanation: `Beta of ${beta.toFixed(2)} (score: ${rounded.toFixed(1)}/20)` }
}

function scoreRSquared(fund: ScorableFund): { rawScore: number; explanation: string } {
  const regression = computeRollingRegression(fund.rollingReturns ?? [])
  if (!regression) {
    return { rawScore: 10, explanation: 'Insufficient rolling-return data for R² calculation — defaulting to middle score' }
  }

  const r2 = regression.rSquared

  let rawScore: number
  if (r2 >= 90) rawScore = 20
  else if (r2 >= 80) rawScore = 16
  else if (r2 >= 70) rawScore = 12
  else if (r2 >= 50) rawScore = 8
  else rawScore = 4

  const rounded = Math.round(rawScore * 100) / 100
  return { rawScore: rounded, explanation: `R-squared of ${r2.toFixed(0)}% (score: ${rounded.toFixed(1)}/20)` }
}

function scoreInformationRatio(fund: ScorableFund): { rawScore: number; explanation: string } {
  const regression = computeRollingRegression(fund.rollingReturns ?? [])
  if (!regression) {
    return { rawScore: 10, explanation: 'Insufficient rolling-return data for Information Ratio — defaulting to middle score' }
  }

  const ir = regression.infoRatio

  let rawScore: number
  if (ir >= 1.0) rawScore = 20
  else if (ir >= 0.5) rawScore = 12 + (ir - 0.5) * 16
  else if (ir >= 0) rawScore = 4 + (ir / 0.5) * 8
  else rawScore = 0

  const rounded = Math.round(rawScore * 100) / 100
  return { rawScore: rounded, explanation: `Information ratio of ${ir.toFixed(2)} (score: ${rounded.toFixed(1)}/20)` }
}

function scoreUpCapture(fund: ScorableFund): { rawScore: number; explanation: string } {
  const capture = computeCaptureRatios(fund.rollingReturns ?? [])
  if (!capture) {
    return { rawScore: 10, explanation: 'Insufficient rolling-return data for Up Capture — defaulting to middle score' }
  }

  const up = capture.upCapture

  let rawScore: number
  if (up >= 120) rawScore = 20
  else if (up >= 100) rawScore = 15 + (up - 100) / 20 * 5
  else if (up >= 80) rawScore = 10 + (up - 80) / 20 * 5
  else if (up >= 60) rawScore = 5 + (up - 60) / 20 * 5
  else rawScore = 0

  const rounded = Math.round(rawScore * 100) / 100
  return { rawScore: rounded, explanation: `Up capture of ${up.toFixed(0)}% (score: ${rounded.toFixed(1)}/20)` }
}

function scoreDownCapture(fund: ScorableFund): { rawScore: number; explanation: string } {
  const capture = computeCaptureRatios(fund.rollingReturns ?? [])
  if (!capture) {
    return { rawScore: 10, explanation: 'Insufficient rolling-return data for Down Capture — defaulting to middle score' }
  }

  const down = capture.downCapture

  let rawScore: number
  if (down <= 60) rawScore = 20
  else if (down <= 80) rawScore = 15 + (80 - down) / 20 * 5
  else if (down <= 100) rawScore = 10 + (100 - down) / 20 * 5
  else if (down <= 120) rawScore = 5 + (120 - down) / 20 * 5
  else rawScore = 0

  const rounded = Math.round(rawScore * 100) / 100
  return { rawScore: rounded, explanation: `Down capture of ${down.toFixed(0)}% (score: ${rounded.toFixed(1)}/20)` }
}

function scoreTrailing1YReturn(fund: ScorableFund): { rawScore: number; explanation: string } {
  const nav = fund.navHistory
  if (!nav || nav.length < 2) {
    return { rawScore: 10, explanation: 'Insufficient NAV history for 1Y return — defaulting to middle score' }
  }
  const result = computeTrailingReturn(nav, 1)
  if (result.return === null) {
    return { rawScore: 10, explanation: 'Could not compute trailing 1Y return — defaulting to middle score' }
  }
  const r = result.return
  let rawScore: number
  if (r >= 30) rawScore = 20
  else if (r >= 20) rawScore = 15 + ((r - 20) / 10) * 5
  else if (r >= 10) rawScore = 10 + ((r - 10) / 10) * 5
  else if (r >= 0) rawScore = (r / 10) * 10
  else rawScore = 0
  const rounded = Math.round(rawScore * 100) / 100
  return { rawScore: rounded, explanation: `1Y trailing return: ${r.toFixed(2)}% (${result.startDate} → ${result.endDate})` }
}

function scoreTrailing3YReturn(fund: ScorableFund): { rawScore: number; explanation: string } {
  const nav = fund.navHistory
  if (!nav || nav.length < 2) {
    return { rawScore: 10, explanation: 'Insufficient NAV history for 3Y return — defaulting to middle score' }
  }
  const result = computeTrailingReturn(nav, 3)
  if (result.return === null) {
    return { rawScore: 10, explanation: 'Could not compute trailing 3Y return — defaulting to middle score' }
  }
  const r = result.return
  let rawScore: number
  if (r >= 20) rawScore = 20
  else if (r >= 15) rawScore = 15 + ((r - 15) / 5) * 5
  else if (r >= 10) rawScore = 10 + ((r - 10) / 5) * 5
  else if (r >= 5) rawScore = 5 + ((r - 5) / 5) * 5
  else if (r >= 0) rawScore = (r / 5) * 5
  else rawScore = 0
  const rounded = Math.round(rawScore * 100) / 100
  return { rawScore: rounded, explanation: `3Y annualised return: ${r.toFixed(2)}% (${result.startDate} → ${result.endDate})` }
}

function scoreTrailing5YReturn(fund: ScorableFund): { rawScore: number; explanation: string } {
  const nav = fund.navHistory
  if (!nav || nav.length < 2) {
    return { rawScore: 10, explanation: 'Insufficient NAV history for 5Y return — defaulting to middle score' }
  }
  const result = computeTrailingReturn(nav, 5)
  if (result.return === null) {
    return { rawScore: 10, explanation: 'Could not compute trailing 5Y return — defaulting to middle score' }
  }
  const r = result.return
  let rawScore: number
  if (r >= 18) rawScore = 20
  else if (r >= 14) rawScore = 15 + ((r - 14) / 4) * 5
  else if (r >= 10) rawScore = 10 + ((r - 10) / 4) * 5
  else if (r >= 5) rawScore = 5 + ((r - 5) / 5) * 5
  else if (r >= 0) rawScore = (r / 5) * 5
  else rawScore = 0
  const rounded = Math.round(rawScore * 100) / 100
  return { rawScore: rounded, explanation: `5Y annualised return: ${r.toFixed(2)}% (${result.startDate} → ${result.endDate})` }
}

function scoreSinceInceptionReturn(fund: ScorableFund): { rawScore: number; explanation: string } {
  const nav = fund.navHistory
  if (!nav || nav.length < 2) {
    return { rawScore: 10, explanation: 'Insufficient NAV history for since-inception return — defaulting to middle score' }
  }
  const result = computeSinceInception(nav)
  if (result.return === null || result.years < 1) {
    return { rawScore: 10, explanation: 'Could not compute since-inception return — fund too new' }
  }
  const r = result.return
  let rawScore: number
  if (r >= 18) rawScore = 20
  else if (r >= 14) rawScore = 15 + ((r - 14) / 4) * 5
  else if (r >= 10) rawScore = 10 + ((r - 10) / 4) * 5
  else if (r >= 5) rawScore = 5 + ((r - 5) / 5) * 5
  else if (r >= 0) rawScore = (r / 5) * 5
  else rawScore = 0
  const rounded = Math.round(rawScore * 100) / 100
  return { rawScore: rounded, explanation: `Since inception (${result.years.toFixed(1)}Y): ${r.toFixed(2)}% annualised (${result.startDate} → ${result.endDate})` }
}

function scoreYearwiseConsistency(fund: ScorableFund): { rawScore: number; explanation: string } {
  const nav = fund.navHistory
  if (!nav || nav.length < 2) {
    return { rawScore: 10, explanation: 'Insufficient NAV history for year-wise consistency — defaulting to middle score' }
  }
  const calYears = computeCalendarYearReturns(nav)
  const validYears = calYears.filter(y => y.return !== null)
  if (validYears.length < 2) {
    return { rawScore: 10, explanation: 'Need at least 2 calendar years of data for consistency scoring' }
  }
  const returns = validYears.map(y => y.return as number)
  const mean = returns.reduce((s, r) => s + r, 0) / returns.length
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length
  const stdDev = Math.sqrt(variance)
  const positiveYears = returns.filter(r => r > 0).length
  const pctPositive = (positiveYears / returns.length) * 100

  let rawScore: number
  if (stdDev <= 10 && pctPositive >= 80) rawScore = 20
  else if (stdDev <= 15 && pctPositive >= 60) rawScore = 15
  else if (stdDev <= 25 && pctPositive >= 50) rawScore = 10
  else if (stdDev <= 40) rawScore = 5
  else rawScore = 0
  const rounded = Math.round(rawScore * 100) / 100
  return {
    rawScore: rounded,
    explanation: `${validYears.length}Y volatility σ=${stdDev.toFixed(1)}%, ${pctPositive.toFixed(0)}% positive years (score: ${rounded.toFixed(1)}/20)`,
  }
}

const ALL_FACTORS: { key: string; label: string; scorer: (fund: ScorableFund, context?: ScoringContext) => { rawScore: number; explanation: string } }[] = [
  { key: 'categoryFit', label: 'Category Fit', scorer: scoreCategoryFit },
  { key: 'cost', label: 'Cost', scorer: scoreCost },
  { key: 'fundAge', label: 'Fund Age', scorer: scoreFundAge },
  { key: 'aumSanity', label: 'AUM Sanity', scorer: scoreAumSanity },
  { key: 'benchmarkSuitability', label: 'Benchmark Suitability', scorer: scoreBenchmarkSuitability },
  { key: 'consistency', label: 'Rolling-Return Consistency', scorer: scoreRollingReturnConsistency },
  { key: 'volatility', label: 'Volatility', scorer: scoreVolatility },
  { key: 'drawdown', label: 'Drawdown', scorer: scoreDrawdown },
  { key: 'exitLoad', label: 'Exit Load', scorer: scoreExitLoad },
  { key: 'overlap', label: 'Overlap with Holdings', scorer: scoreOverlap },
  { key: 'sharpeRatio', label: 'Sharpe Ratio', scorer: scoreSharpeRatio },
  { key: 'sortinoRatio', label: 'Sortino Ratio', scorer: scoreSortinoRatio },
  { key: 'alpha', label: 'Alpha', scorer: scoreAlpha },
  { key: 'beta', label: 'Beta', scorer: scoreBeta },
  { key: 'rSquared', label: 'R-Squared', scorer: scoreRSquared },
  { key: 'informationRatio', label: 'Information Ratio', scorer: scoreInformationRatio },
  { key: 'upCapture', label: 'Up Capture', scorer: scoreUpCapture },
  { key: 'downCapture', label: 'Down Capture', scorer: scoreDownCapture },
  { key: 'trailing1YReturn', label: '1Y Return', scorer: scoreTrailing1YReturn },
  { key: 'trailing3YReturn', label: '3Y Return', scorer: scoreTrailing3YReturn },
  { key: 'trailing5YReturn', label: '5Y Return', scorer: scoreTrailing5YReturn },
  { key: 'sinceInceptionReturn', label: 'Since Inception', scorer: scoreSinceInceptionReturn },
  { key: 'yearwiseConsistency', label: 'Year-Wise Consistency', scorer: scoreYearwiseConsistency },
]

const DEFAULT_WEIGHTS: ScorecardWeights = {
  consistency: 10,
  cost: 8,
  sharpeRatio: 8,
  trailing3YReturn: 8,
  categoryFit: 5,
  sortinoRatio: 5,
  alpha: 5,
  yearwiseConsistency: 5,
  trailing1YReturn: 4,
  trailing5YReturn: 4,
  benchmarkSuitability: 4,
  volatility: 4,
  drawdown: 4,
  informationRatio: 4,
  fundAge: 3,
  aumSanity: 3,
  exitLoad: 3,
  overlap: 3,
  upCapture: 3,
  downCapture: 3,
  beta: 2,
  rSquared: 2,
  sinceInceptionReturn: 2,
}

function normalizeWeights(weights: ScorecardWeights): { normalized: Record<string, number>; wasNormalized: boolean } {
    const entries = Object.entries(weights).filter(([, w]) => w !== undefined && w !== null && !isNaN(w)) as [string, number][]
  if (entries.length === 0) {
    return { normalized: {}, wasNormalized: true }
  }
  const sum = entries.reduce((acc, [, w]) => acc + w, 0)
  if (sum === 100) {
    const result: Record<string, number> = {}
    for (const [k, v] of entries) result[k] = v
    return { normalized: result, wasNormalized: false }
  }
  const factor = sum === 0 ? 0 : 100 / sum
  const normalized: Record<string, number> = {}
  for (const [k, v] of entries) {
    normalized[k] = factor === 0 ? 0 : Math.round(v * factor * 100) / 100
  }
  return { normalized, wasNormalized: true }
}

export function computeScore(
  fund: ScorableFund | undefined | null,
  weights?: ScorecardWeights,
  context?: ScoringContext,
): ComputeScoreResult {
  if (!fund) {
    return {
      compositeScore: 0,
      factors: ALL_FACTORS.map(fd => ({
        key: fd.key,
        label: fd.label,
        rawScore: 0,
        weight: 0,
        weightedContribution: 0,
        explanation: 'No fund data provided',
      })),
      weightsNormalized: false,
      maxPossibleScore: 100,
    }
  }
  const mergedWeights = { ...DEFAULT_WEIGHTS, ...weights }
  const { normalized, wasNormalized } = normalizeWeights(mergedWeights)

  const factors: ScoringFactor[] = []
  let totalWeighted = 0

  for (const factorDef of ALL_FACTORS) {
    const weight = normalized[factorDef.key] ?? 0
    if (weight === 0) {
      factors.push({
        key: factorDef.key,
        label: factorDef.label,
        rawScore: 0,
        weight: 0,
        weightedContribution: 0,
        explanation: 'Factor weight is zero — not scored',
      })
      continue
    }

    const { rawScore: raw, explanation } = factorDef.scorer(fund, context)
    const clamped = Math.min(20, Math.max(0, raw))
    const weightedContribution = Math.round((clamped / 20) * weight * 100) / 100
    totalWeighted += weightedContribution

    factors.push({
      key: factorDef.key,
      label: factorDef.label,
      rawScore: clamped,
      weight,
      weightedContribution,
      explanation,
    })
  }

  const compositeScore = Math.round(Math.min(100, Math.max(0, totalWeighted)) * 100) / 100

  return {
    compositeScore,
    factors,
    weightsNormalized: wasNormalized,
    maxPossibleScore: 100,
  }
}
