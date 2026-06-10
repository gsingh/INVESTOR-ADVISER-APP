const DIRECT_REGEX = /\b-?direct\b/i
const REGULAR_REGEX = /\b-?regular\b/i
const IDCW_REGEX = /\b-?\s*idcw\b/i
const GROWTH_REGEX = /\bgrowth\b/i

const KNOWN_AMCS = [
  'Aditya Birla Sun Life', 'Baroda BNP Paribas', 'Franklin Templeton',
  'Mahindra Manulife', 'White Oak Capital', 'NJ Mutual Fund',
  'ICICI Prudential', 'Kotak Mahindra', 'Motilal Oswal',
  'Canara Robeco', 'Mirae Asset', 'Nippon India', 'Bajaj Finserv',
  'PGIM India', 'Edelweiss', 'Sundaram', 'Bandhan',
  'Invesco', 'Shriram', 'HDFC', 'SBI', 'UTI',
  'Axis', 'DSP', 'Tata', 'Quant', 'Groww',
  'Navi', 'Union', 'HSBC', 'IDFC', 'JM Financial',
  'ITI', 'Samco', 'Trust', 'Zurich', 'Old Bridge',
  'Quantum', 'Taurus', 'LIC', 'IIFL', 'Bank of India',
  'Zerodha', 'NJM',
].sort((a, b) => b.length - a.length)

export function extractPlan(name: string): string {
  if (DIRECT_REGEX.test(name)) return 'Direct'
  if (REGULAR_REGEX.test(name)) return 'Regular'
  return ''
}

export function extractOption(name: string): string {
  if (IDCW_REGEX.test(name)) return 'IDCW'
  if (GROWTH_REGEX.test(name)) return 'Growth'
  if (/\bdividend\b/i.test(name)) return 'Dividend'
  return ''
}

export function extractAmc(name: string): string {
  for (const amc of KNOWN_AMCS) {
    if (name.toLowerCase().startsWith(amc.toLowerCase())) return amc
  }
  const idx = name.search(/\s+(?:Mutual\s+)?Fund\b/i)
  if (idx > 0) {
    const prefix = name.slice(0, idx)
    const words = prefix.split(' ')
    return words.slice(0, Math.min(2, words.length)).join(' ')
  }
  const dashIdx = name.search(/\s+-\s*(?:Direct|Regular|Growth|IDCW|Dividend)\b/i)
  if (dashIdx > 0) {
    const prefix = name.slice(0, dashIdx)
    const words = prefix.split(' ')
    return words.slice(0, Math.min(2, words.length)).join(' ')
  }
  return ''
}
