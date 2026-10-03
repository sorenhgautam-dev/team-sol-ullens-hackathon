/**
 * The one currency helper. The budgeting engine works in NPR; the scam game works in
 * US dollars. Both are converted here for display. Rates are illustrative, not live.
 */
export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'NPR'
export const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'INR', 'NPR']
/** Which currency an amount was written in. */
export type Base = 'NPR' | 'USD'

/** Illustrative display rates per US$1. */
const PER_USD: Record<Currency, number> = { USD: 1, EUR: 0.92, GBP: 0.79, INR: 83, NPR: 133 }
const SYMBOLS: Record<Currency, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹', NPR: 'NPR ' }

export function convert(amount: number, currency: Currency, base: Base = 'NPR'): number {
  const usd = base === 'USD' ? amount : amount / PER_USD.NPR
  return usd * PER_USD[currency]
}

/** Small amounts keep cents; larger ones are shown in whole units. */
export function digitsFor(value: number, currency: Currency): number {
  if (currency === 'NPR' || currency === 'INR') return 0
  return Math.abs(value) < 10 && !Number.isInteger(value) ? 2 : 0
}

export function formatMoney(amount: number, currency: Currency = 'NPR', base: Base = 'NPR'): string {
  const v = convert(amount, currency, base)
  const digits = digitsFor(v, currency)
  const locale = currency === 'NPR' || currency === 'INR' ? 'en-IN' : 'en-US'
  const num = new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Math.abs(v))
  const sign = v < 0 ? '−' : ''
  return `${sign}${SYMBOLS[currency]}${num}`
}
