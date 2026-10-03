/**
 * Realistic local money, per currency. Amounts are NOT converted with exchange rates:
 * each currency has its own typical pay, so a rider's week in Nepal is NPR 7,000, not
 * NPR 80,000. Scam amounts are shares of the character's pay, rounded to local numbers.
 * All figures are illustrative, chosen to be typical rather than exact.
 */
import type { Currency } from '@/i18n/currency'
import type { CharacterId } from './characters'

export interface Economy {
  /** Pay that lands on payday, per character. */
  payday: Record<CharacterId, number>
  /** A typical "small fee" a fake parcel text asks for. */
  fee: number
  /** An hourly rate that sounds too good for easy work. */
  hourly: number
  /** A coffee at a café. */
  coffee: number
}

export const ECONOMIES: Record<Currency, Economy> = {
  // Sita: money from her husband abroad. Bikash: a week of deliveries. Aarav: a first monthly salary.
  USD: { payday: { sita: 800, bikash: 600, aarav: 2_400 }, fee: 1.99, hourly: 30, coffee: 4.5 },
  EUR: { payday: { sita: 700, bikash: 500, aarav: 2_000 }, fee: 1.99, hourly: 28, coffee: 3.5 },
  GBP: { payday: { sita: 600, bikash: 450, aarav: 1_800 }, fee: 1.99, hourly: 25, coffee: 3.5 },
  INR: { payday: { sita: 20_000, bikash: 4_500, aarav: 22_000 }, fee: 49, hourly: 900, coffee: 150 },
  NPR: { payday: { sita: 30_000, bikash: 7_000, aarav: 28_000 }, fee: 99, hourly: 1_200, coffee: 200 },
}

/** Round to a number people would actually see in that currency. */
export function nice(value: number, currency: Currency): number {
  if (currency === 'INR' || currency === 'NPR') {
    const step = value < 2_000 ? 50 : value < 20_000 ? 100 : 500
    return Math.max(step, Math.round(value / step) * step)
  }
  const step = value < 100 ? 5 : 10
  return Math.max(step, Math.round(value / step) * step)
}

export function paydayFor(currency: Currency, character: CharacterId): number {
  return ECONOMIES[currency].payday[character]
}
