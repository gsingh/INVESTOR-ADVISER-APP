import type { GlossaryEntry } from './db'

export const glossarySeedData: Omit<GlossaryEntry, 'id'>[] = [
  {
    slug: 'nav',
    term: 'NAV',
    definition:
      'Net Asset Value is the per-unit market price of a mutual fund scheme. It represents the total value of all assets in the fund divided by the number of units outstanding.',
    example:
      'If a fund has ₹100 crore in assets and 5 crore units outstanding, the NAV is ₹20. When you buy at NAV ₹25 and it rises to ₹30, your ₹10,000 investment grows to ₹12,000.',
    whyMatters:
      'NAV is the price at which you buy and sell mutual fund units. It changes daily based on the market value of the fund\'s underlying investments.',
  },
  {
    slug: 'aum',
    term: 'AUM',
    definition:
      'Assets Under Management is the total market value of all investments managed by a mutual fund scheme. It reflects the size and popularity of the fund.',
    example:
      'A fund with AUM of ₹5,000 crore means investors have collectively invested ₹5,000 crore in that scheme. Large AUM (>₹1,000 Cr) usually means better liquidity and lower expense ratios.',
    whyMatters:
      'AUM indicates fund stability. Very small AUM (<₹100 Cr) may face liquidity issues or redemption pressure during market downturns.',
  },
  {
    slug: 'expense-ratio',
    term: 'Expense Ratio',
    definition:
      'The annual fee expressed as a percentage of AUM that the fund charges to cover management, administrative, and operational costs. It is deducted from the fund\'s returns.',
    example:
      'If a fund has a 1.2% expense ratio and you invest ₹1,00,000, you pay ₹1,200 per year in fees. Over 10 years at 12% return, a 1.2% vs 0.6% expense ratio could cost you over ₹30,000 in lost returns.',
    whyMatters:
      'Lower expense ratios mean more of your money stays invested. For long-term SIPs, even a 0.5% difference can significantly impact final corpus size.',
  },
  {
    slug: 'sip',
    term: 'SIP',
    definition:
      'Systematic Investment Plan lets you invest a fixed amount in a mutual fund at regular intervals (weekly, monthly, quarterly) instead of a one-time lump sum.',
    example:
      'A monthly SIP of ₹5,000 in an equity fund for 15 years with 12% annual return would grow to approximately ₹25,00,000 through the power of compounding and rupee cost averaging.',
    whyMatters:
      'SIP removes the need to time the market. You buy more units when prices are low and fewer when prices are high, averaging out your purchase cost over time.',
  },
  {
    slug: 'lump-sum',
    term: 'Lump Sum',
    definition:
      'A lump sum investment is a one-time, single payment made into a mutual fund scheme, as opposed to periodic installments through SIP.',
    example:
      'If you receive a bonus of ₹2,00,000 and invest it all at once in a fund at NAV ₹50, you receive 4,000 units. The entire amount is deployed immediately and starts earning returns.',
    whyMatters:
      'Lump sum works best when markets are at reasonable valuations. During volatile markets, staggering a lump sum into a SIP over 6-12 months can reduce timing risk.',
  },
  {
    slug: 'xirr',
    term: 'XIRR',
    definition:
      'Extended Internal Rate of Return is a method to calculate annualized returns for investments with multiple cash flows at irregular intervals, like SIPs with varying amounts or dates.',
    example:
      'If you invested ₹5,000 monthly for 12 months (total ₹60,000) and your portfolio is now worth ₹72,000, the XIRR would be approximately 18.5% — a more accurate picture than simply dividing profit by investment.',
    whyMatters:
      'XIRR gives you the true annualized return of your portfolio accounting for the timing of each cash flow, unlike absolute returns which ignore when money was invested.',
  },
  {
    slug: 'benchmark',
    term: 'Benchmark',
    definition:
      'A benchmark is a standard index (like Nifty 50 or BSE Sensex) against which a fund\'s performance is measured. It tells you whether the fund is beating the market.',
    example:
      'A large-cap fund\'s benchmark is the Nifty 50. If the fund returned 14% in a year but the Nifty 50 returned 16%, the fund underperformed its benchmark by 2%.',
    whyMatters:
      'Benchmark comparison reveals whether a fund\'s active management is adding value. A fund that consistently underperforms its benchmark may not justify its expense ratio.',
  },
  {
    slug: 'exit-load',
    term: 'Exit Load',
    definition:
      'An exit load is a fee charged when you redeem (sell) mutual fund units before a specified holding period. It discourages short-term trading.',
    example:
      'A fund with 1% exit load for redemption within 90 days: if you redeem ₹1,00,000 worth of units after 60 days, you pay ₹1,000 as exit load and receive ₹99,000.',
    whyMatters:
      'Exit loads make short-term trading expensive. For SIP investors, each installment has its own holding period clock, so early installments may be exit-load-free while recent ones still incur charges.',
  },
  {
    slug: 'drift',
    term: 'Drift',
    definition:
      'Drift is the deviation between your actual asset allocation and your target allocation. It happens when some investments grow faster than others, unbalancing your portfolio.',
    example:
      'If your target was 70% equity and 30% debt, but equity markets rallied and your portfolio is now 78% equity and 22% debt, you have a +8% drift in equity. Drift above 5% usually triggers a rebalancing review.',
    whyMatters:
      'Unchecked drift can expose you to more risk (if equity overgrows) or lower returns (if debt overgrows) than planned. Regular reviews and rebalancing keep your portfolio aligned with your goals.',
  },
  {
    slug: 'amfi-category',
    term: 'AMFI Category',
    definition:
      'AMFI (Association of Mutual Funds in India) categorizes mutual fund schemes into standardized categories like Large Cap, Mid Cap, Flexi Cap, etc., based on their investment mandate.',
    example:
      'A fund categorized as "Large Cap" must invest at least 80% of its assets in the top 100 companies by market capitalization. "Mid Cap" funds invest in companies ranked 101-250.',
    whyMatters:
      'Category tells you what a fund invests in. Two funds in the same category should have similar risk-return profiles, making it easier to compare apples-to-apples.',
  },
  {
    slug: 'direct-plan',
    term: 'Direct Plan',
    definition:
      'A Direct Plan is a mutual fund variant where you invest directly with the Asset Management Company (AMC) without any intermediary like a distributor or broker.',
    example:
      'A fund\'s Direct Plan might have an expense ratio of 0.6% while its Regular Plan charges 1.2%. On a ₹10,00,000 investment over 10 years, the Direct Plan saves you approximately ₹60,000 in fees.',
    whyMatters:
      'Direct Plans have lower expense ratios because there is no commission paid to distributors. For long-term investors, choosing Direct over Regular can significantly boost net returns.',
  },
  {
    slug: 'regular-plan',
    term: 'Regular Plan',
    definition:
      'A Regular Plan is a mutual fund variant where you invest through a distributor, broker, or financial advisor who receives a commission included in the expense ratio.',
    example:
      'You invest ₹5,000/month via SIP in a fund\'s Regular Plan. The expense ratio of 1.2% includes ~0.5% distributor commission. Over 10 years, that commission reduces your returns compared to the Direct Plan.',
    whyMatters:
      'Regular Plans are suitable if you value professional advice. The higher expense ratio pays for the guidance. If you make your own decisions, the Direct Plan is more cost-effective.',
  },
  {
    slug: 'time-horizon',
    term: 'Time Horizon',
    definition:
      'Time horizon is the length of time you expect to hold an investment before withdrawing the money. It determines which types of funds are suitable for your goal.',
    example:
      'A 3-year time horizon means you will need the money in 3 years. Short horizons (<3 years) suit debt funds; long horizons (>7 years) suit equity funds.',
    whyMatters:
      'Your time horizon dictates how much risk you can take. Longer horizons let you ride out market volatility and benefit from compounding.',
  },
  {
    slug: 'drawdown',
    term: 'Drawdown',
    definition:
      'Drawdown measures the peak-to-trough decline in your investment value during a specific period. It shows how much your portfolio could temporarily lose.',
    example:
      'If you invest ₹1,00,000 and the portfolio drops to ₹85,000 before recovering, that is a 15% drawdown. Understanding drawdown comfort helps choose the right funds.',
    whyMatters:
      'Knowing your drawdown tolerance prevents panic-selling during market downturns. Higher potential returns usually come with larger drawdowns.',
  },
  {
    slug: 'emergency-fund',
    term: 'Emergency Fund',
    definition:
      'An emergency fund is cash set aside for unexpected expenses such as medical bills, job loss, or urgent home repairs. It should be kept in highly liquid instruments.',
    example:
      'If your monthly expenses are ₹30,000, a 6-month emergency fund would be ₹1,80,000 held in a savings account or liquid fund.',
    whyMatters:
      'An emergency fund ensures you do not have to sell long-term investments at a loss when unexpected expenses arise.',
  },
  {
    slug: 'income-stability',
    term: 'Income Stability',
    definition:
      'Income stability measures how predictable and reliable your monthly earnings are. Steady income allows for more aggressive investing.',
    example:
      'A salaried employee with a permanent job has high income stability. A freelancer with variable monthly income has lower stability.',
    whyMatters:
      'Stable income lets you take more investment risk because you can withstand short-term losses without needing to withdraw.',
  },
  {
    slug: 'investing-experience',
    term: 'Investing Experience',
    definition:
      'Investing experience reflects your familiarity with financial markets, investment products, and risk management concepts.',
    example:
      'A beginner may only know savings accounts and fixed deposits, while an expert understands asset allocation, market cycles, and rebalancing.',
    whyMatters:
      'Experience affects your ability to stay calm during market volatility and make informed decisions without emotional bias.',
  },
  {
    slug: 'growth-option',
    term: 'Growth Option',
    definition:
      'The Growth Option in a mutual fund keeps the profits (capital gains) invested in the scheme rather than distributing them as dividends. Your investment grows through NAV appreciation.',
    example:
      `You invest ₹1,00,000 in a fund's Growth Option at NAV ₹50. Over 5 years, the NAV rises to ₹90. Your investment is now worth ₹1,80,000 — all gains are reinvested and compounding works fully.`,
    whyMatters:
      'Growth options maximize long-term wealth creation through compounding. Unlike dividend options, there is no periodic cash distribution, so your entire corpus stays invested.',
  },
]
