export type TownEventEffect =
  | { type: 'scam'; wardId?: string; delta: number }
  | { type: 'drain'; wardId?: string; amount: number }
  | { type: 'rentExtra'; wardId: string; amount: number }
  | { type: 'delayIncome'; wardId: string }

export interface TownEventDef {
  id: string
  emoji: string
  titleKey: string
  effects: TownEventEffect[]
}

/** Section 5.7 weekly events, drawn with the seeded PRNG. */
export const TOWN_EVENTS: TownEventDef[] = [
  { id: 'loan_ad', emoji: '📲', titleKey: 'tevent.loanAd', effects: [{ type: 'scam', wardId: 'buspark', delta: 15 }] },
  { id: 'festival', emoji: '🪔', titleKey: 'tevent.festival', effects: [{ type: 'drain', amount: 2_000 }] },
  { id: 'kiln_late', emoji: '🧱', titleKey: 'tevent.kilnLate', effects: [{ type: 'delayIncome', wardId: 'brickkilns' }] },
  { id: 'viral_prize', emoji: '👻', titleKey: 'tevent.viralPrize', effects: [{ type: 'scam', delta: 8 }] },
  { id: 'rent_raise', emoji: '🏘️', titleKey: 'tevent.rentRaise', effects: [{ type: 'rentExtra', wardId: 'collegehill', amount: 1_000 }] },
  { id: 'remit_wave', emoji: '⏳', titleKey: 'tevent.remitWave', effects: [{ type: 'delayIncome', wardId: 'riverside' }, { type: 'delayIncome', wardId: 'newcolony' }] },
]
