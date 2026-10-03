/** Cozy-layer rules (Section 4.9). Pure helpers, no money math. */

export type SproutStage = 0 | 1 | 2 | 3

/** seed (<1 buffer day) → sprout (1–3) → leafy (4–6) → flowering (7+). */
export function sproutStage(bufferDays: number): SproutStage {
  if (bufferDays >= 7) return 3
  if (bufferDays >= 4) return 2
  if (bufferDays >= 1) return 1
  return 0
}

export const SPROUT_EMOJI: Record<SproutStage, string> = { 0: '🫘', 1: '🌱', 2: '🪴', 3: '🌼' }

/** Calendar face for a lived day. */
export function dayFace(balance: number): '😊' | '😐' | '😟' {
  if (balance < 0) return '😟'
  if (balance < 2_000) return '😐'
  return '😊'
}

/** 0 = morning … 3 = night, from energy left (3 → morning, 0 → night). */
export function timeOfDay(energy: number): 0 | 1 | 2 | 3 {
  const e = Math.max(0, Math.min(3, Math.round(energy)))
  return (3 - e) as 0 | 1 | 2 | 3
}
