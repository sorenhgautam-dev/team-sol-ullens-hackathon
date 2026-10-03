/** The desperation cycle: shortfalls feed scams, scams feed shortfalls. Pure functions. */
import type { WardDef } from '@/content/wards'

export const SCAM_BASE_GROWTH = 2.5
export const SPREAD_THRESHOLD = 40
export const SPREAD_SHARE = 0.15

/** growth = base × (1 + shortfallRate) × (1 − defense) */
export function scamGrowth(shortfallRate: number, defense: number, base = SCAM_BASE_GROWTH): number {
  return base * (1 + Math.max(0, shortfallRate)) * (1 - Math.min(0.9, Math.max(0, defense)))
}

/** Wards above the threshold push 15% of the excess into each Voronoi neighbour. Computed from a snapshot. */
export function spreadScams(levels: Record<string, number>, wards: WardDef[]): Record<string, number> {
  const next: Record<string, number> = { ...levels }
  for (const w of wards) {
    const level = levels[w.id] ?? 0
    if (level <= SPREAD_THRESHOLD) continue
    const push = (level - SPREAD_THRESHOLD) * SPREAD_SHARE
    for (const n of w.neighbors) next[n] = Math.min(100, (next[n] ?? 0) + push)
  }
  return next
}
