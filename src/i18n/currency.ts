/**
 * The one currency helper. Scam Town never converts between currencies: each one has its
 * own realistic local pay and prices (content/economy.ts), formatted here.
 */
export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'NPR'
export const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'INR', 'NPR']

const SYMBOLS: Record<Currency, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹', NPR: 'Rs. ' }

/** Small amounts keep cents; larger ones are shown in whole units. Rupees never show paise. */
export function digitsFor(value: number, currency: Currency): number {
  if (currency === 'NPR' || currency === 'INR') return 0
  return Math.abs(value) < 10 && !Number.isInteger(value) ? 2 : 0
}

export function formatMoney(amount: number, currency: Currency): string {
  const digits = digitsFor(amount, currency)
  const locale = currency === 'NPR' || currency === 'INR' ? 'en-IN' : 'en-US'
  const num = new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Math.abs(amount))
  const sign = amount < 0 ? '−' : ''
  return `${sign}${SYMBOLS[currency]}${num}`
}
