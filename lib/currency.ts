const API_URL =
  'https://v6.exchangerate-api.com/v6/18d5601938fbf030986adac8/latest/USD'

const FALLBACK_RATE = 93.25 // used if the API is unreachable

// Simple in-memory cache — revalidates every hour
let _cachedRate: number | null = null
let _cacheTimestamp = 0
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

export async function getUSDtoINRRate(): Promise<number> {
  const now = Date.now()
  if (_cachedRate !== null && now - _cacheTimestamp < CACHE_TTL_MS) {
    return _cachedRate
  }
  try {
    const res = await fetch(API_URL, { next: { revalidate: 3600 } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const rate: number = data?.conversion_rates?.INR
    if (!rate || typeof rate !== 'number') throw new Error('Bad rate data')
    _cachedRate = rate
    _cacheTimestamp = now
    return rate
  } catch {
    return _cachedRate ?? FALLBACK_RATE
  }
}

// Synchronous helpers — use the cached rate (or fallback)
// For server components, call getUSDtoINRRate() first and pass the rate down.
export function getRate(): number {
  return _cachedRate ?? FALLBACK_RATE
}

export function formatINR(amount: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits,
  }).format(amount)
}

export function formatUSD(amount: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits,
  }).format(amount)
}

export function convertINRtoUSD(amountINR: number, rate?: number): number {
  return amountINR / (rate ?? getRate())
}

export function formatCurrencyInline(
  amount: number,
  maximumFractionDigits = 2,
  rate?: number,
): string {
  return `${formatINR(amount, maximumFractionDigits)} (${formatUSD(convertINRtoUSD(amount, rate), maximumFractionDigits)})`
}
