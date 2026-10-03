export interface InitiativeDef {
  id: string
  nameKey: string
  emoji: string
  cost: number
  weeklyCost?: number
  deployWeeks: number
  scope: 'ward' | 'town'
  effectKey: string
  tradeoffKey: string
  allowedWardIds?: string[]
  repeatable: boolean
}

/** Section 5.6 initiatives. Numbers are data; the town engine applies them. */
export const INITIATIVES: InitiativeDef[] = [
  { id: 'theatre', nameKey: 'init.theatre', emoji: '🎭', cost: 20_000, deployWeeks: 1, scope: 'ward', effectKey: 'init.theatre.effect', tradeoffKey: 'init.theatre.tradeoff', repeatable: true },
  { id: 'hotline', nameKey: 'init.hotline', emoji: '☎️', cost: 80_000, weeklyCost: 10_000, deployWeeks: 2, scope: 'town', effectKey: 'init.hotline.effect', tradeoffKey: 'init.hotline.tradeoff', repeatable: false },
  { id: 'savings', nameKey: 'init.savings', emoji: '🪙', cost: 15_000, deployWeeks: 3, scope: 'ward', effectKey: 'init.savings.effect', tradeoffKey: 'init.savings.tradeoff', repeatable: false },
  { id: 'payday', nameKey: 'init.payday', emoji: '📆', cost: 40_000, deployWeeks: 2, scope: 'ward', effectKey: 'init.payday.effect', tradeoffKey: 'init.payday.tradeoff', allowedWardIds: ['oldtown', 'buspark', 'bazaar'], repeatable: false },
  { id: 'dateshift', nameKey: 'init.dateshift', emoji: '✉️', cost: 25_000, deployWeeks: 2, scope: 'ward', effectKey: 'init.dateshift.effect', tradeoffKey: 'init.dateshift.tradeoff', repeatable: true },
  { id: 'microfund', nameKey: 'init.microfund', emoji: '🏦', cost: 100_000, deployWeeks: 1, scope: 'ward', effectKey: 'init.microfund.effect', tradeoffKey: 'init.microfund.tradeoff', repeatable: false },
  { id: 'fasttrack', nameKey: 'init.fasttrack', emoji: '✈️', cost: 60_000, deployWeeks: 3, scope: 'town', effectKey: 'init.fasttrack.effect', tradeoffKey: 'init.fasttrack.tradeoff', repeatable: false },
  { id: 'report', nameKey: 'init.report', emoji: '📣', cost: 10_000, deployWeeks: 4, scope: 'town', effectKey: 'init.report.effect', tradeoffKey: 'init.report.tradeoff', repeatable: false },
]
export const INITIATIVES_BY_ID: Record<string, InitiativeDef> = Object.fromEntries(INITIATIVES.map((i) => [i.id, i]))
