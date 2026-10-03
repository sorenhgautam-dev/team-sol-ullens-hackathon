import type { Bill } from '@/engine/types'

/** Section 3 demo bills. Tests depend on these exact numbers. */
export const DEMO_BILLS: Bill[] = [
  { id: 'rent', nameKey: 'bill.rent', emoji: '🏠', amount: 12_000, dueDays: [5], flexible: 'maybe', owner: 'landlord', lateFee: 1_000 },
  { id: 'school', nameKey: 'bill.school', emoji: '🎒', amount: 4_000, dueDays: [10], flexible: 'maybe', lateFee: 400 },
  { id: 'electricity', nameKey: 'bill.electricity', emoji: '💡', amount: 1_500, dueDays: [12], flexible: 'yes', lateFee: 150 },
  { id: 'internet', nameKey: 'bill.internet', emoji: '📶', amount: 1_200, dueDays: [15], flexible: 'yes' },
  { id: 'groceries', nameKey: 'bill.groceries', emoji: '🥬', amount: 2_000, dueDays: [1, 8, 15, 22, 29], flexible: 'no' },
]

/** Sum of all demo bills over one month (used in the Stability Score denominator). */
export const DEMO_MONTHLY_BILLS = DEMO_BILLS.reduce((s, b) => s + b.amount * b.dueDays.length, 0) // 28,700
