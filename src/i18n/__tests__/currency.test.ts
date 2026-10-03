import { describe, expect, it } from 'vitest'
import { convert, formatMoney } from '../currency'

describe('currency helper', () => {
  it('formats US-dollar amounts in every display currency', () => {
    expect(formatMoney(800, 'USD', 'USD')).toBe('$800')
    expect(formatMoney(200, 'EUR', 'USD')).toBe('€184')
    expect(formatMoney(200, 'GBP', 'USD')).toBe('£158')
    expect(formatMoney(100, 'INR', 'USD')).toBe('₹8,300')
    expect(formatMoney(1.99, 'USD', 'USD')).toBe('$1.99')
  })
  it('keeps the budgeting engine NPR amounts working', () => {
    expect(formatMoney(12_000, 'NPR')).toBe('NPR 12,000')
    expect(convert(13_300, 'USD')).toBeCloseTo(100)
  })
})
