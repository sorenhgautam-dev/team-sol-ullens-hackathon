import type { BridgeOption } from '@/engine/types'

/**
 * Section 4.4 Gap Bridge options. Rates are illustrative until `source` is set.
 * For Sita's NPR 11,700 gap over ~15 days these produce roughly:
 * late rent 1,000 · loan app 1,170 · card advance ~470 · moneylender ~290 · delay school 400 · family 0.
 */
export const BRIDGES: BridgeOption[] = [
  {
    id: 'late_rent',
    nameKey: 'bridge.lateRent',
    emoji: '🏠',
    mechanism: 'deferBill',
    billId: 'rent',
    fee: { type: 'flat', amount: 1_000 },
    term: { type: 'nextIncome' },
    hiddenCostKey: 'bridge.lateRent.hidden',
    trust: { who: 'landlord', delta: -1 },
  },
  {
    id: 'loan_app',
    nameKey: 'bridge.loanApp',
    emoji: '📲',
    mechanism: 'cash',
    fee: { type: 'flatPercent', percent: 10 },
    term: { type: 'days', days: 14 },
    hiddenCostKey: 'bridge.loanApp.hidden',
    privacy: -30,
    flags: ['loanApp'],
    aprPercent: 260,
  },
  {
    id: 'card_advance',
    nameKey: 'bridge.cardAdvance',
    emoji: '💳',
    mechanism: 'cash',
    fee: { type: 'percentPlusMonthly', percent: 3, monthlyPercent: 2 },
    term: { type: 'nextIncome' },
    hiddenCostKey: 'bridge.cardAdvance.hidden',
    requiresFormalCredit: true,
    aprPercent: 24,
  },
  {
    id: 'moneylender',
    nameKey: 'bridge.moneylender',
    emoji: '🧾',
    mechanism: 'cash',
    fee: { type: 'monthlyPercent', monthlyPercent: 5 },
    term: { type: 'nextIncome' },
    hiddenCostKey: 'bridge.moneylender.hidden',
    flags: ['moneylender'],
    aprPercent: 60,
  },
  {
    id: 'delay_school',
    nameKey: 'bridge.delaySchool',
    emoji: '🎒',
    mechanism: 'deferBill',
    billId: 'school',
    fee: { type: 'flat', amount: 400 },
    term: { type: 'nextIncome' },
    hiddenCostKey: 'bridge.delaySchool.hidden',
    flags: ['examWarning'],
  },
  {
    id: 'family',
    nameKey: 'bridge.family',
    emoji: '👪',
    mechanism: 'cash',
    fee: { type: 'none' },
    term: { type: 'nextIncome' },
    hiddenCostKey: 'bridge.family.hidden',
    trust: { who: 'family', delta: -1 },
  },
]

export const BRIDGES_BY_ID: Record<string, BridgeOption> = Object.fromEntries(BRIDGES.map((b) => [b.id, b]))
