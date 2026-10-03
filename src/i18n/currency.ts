/**
 * The one currency helper. All amounts in engines are NPR; display conversion is illustrative.
 */
export type Currency = 'NPR' | 'USD' | 'INR' | 'EUR'

/** Illustrative display rates per NPR 1. */
const RATES: Record<Currency, number> = { NPR: 1, USD: 1 / 133, INR: 1 / 1.6, EUR: 1 / 145 }
const SYMBOLS: Record<Currency, string> = { NPR: 'NPR', USD: '$', INR: '₹', EUR: '€' }

export function convert(amountNpr: number, currency: Currency): number {
  return amountNpr * RATES[currency]
}

export function formatMoney(amountNpr: number, currency: Currency = 'NPR'): string {
  const v = convert(amountNpr, currency)
  const digits = currency === 'NPR' || currency === 'INR' ? 0 : 2
  const num = new Intl.NumberFormat('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Math.abs(v))
  const sign = v < 0 ? '−' : ''
  return currency === 'NPR' ? `${sign}${SYMBOLS.NPR} ${num}` : `${sign}${SYMBOLS[currency]}${num}`
}
