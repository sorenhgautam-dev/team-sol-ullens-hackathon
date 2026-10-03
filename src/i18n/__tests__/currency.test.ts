import { describe, expect, it } from 'vitest'
import { formatMoney } from '../currency'

describe('currency helper', () => {
  it('formats local amounts in every currency, never converting them', () => {
    expect(formatMoney(800, 'USD')).toBe('$800')
    expect(formatMoney(700, 'EUR')).toBe('€700')
    expect(formatMoney(600, 'GBP')).toBe('£600')
    expect(formatMoney(20_000, 'INR')).toBe('₹20,000')
    expect(formatMoney(30_000, 'NPR')).toBe('Rs. 30,000')
    expect(formatMoney(1.99, 'USD')).toBe('$1.99')
  })
  it('groups rupees in lakhs', () => {
    expect(formatMoney(150_000, 'NPR')).toBe('Rs. 1,50,000')
  })
})
