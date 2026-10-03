/** Side-action content for the Moves tab / corner shop. Amounts are data; the engine books them. */
export interface SellableItem {
  id: string
  emoji: string
  nameKey: string
  fairPrice: number
  /** What a hurried buyer would pay. */
  quickPrice: number
}

export const SELLABLE_ITEMS: SellableItem[] = [
  { id: 'oldTv', emoji: '📺', nameKey: 'item.oldTv', fairPrice: 3_000, quickPrice: 1_800 },
  { id: 'goldEarring', emoji: '💍', nameKey: 'item.goldEarring', fairPrice: 6_000, quickPrice: 4_000 },
  { id: 'sewingMachine', emoji: '🧵', nameKey: 'item.sewingMachine', fairPrice: 4_500, quickPrice: 3_000 },
]

export const EXTRA_SHIFT_PAY = 800
export const TREATS = [
  { id: 'eatOut', emoji: '🍜', labelKey: 'treat.eatOut', amount: 300, stressDelta: -5 },
  { id: 'cook', emoji: '🍲', labelKey: 'treat.cook', amount: 0, stressDelta: 0 },
] as const
