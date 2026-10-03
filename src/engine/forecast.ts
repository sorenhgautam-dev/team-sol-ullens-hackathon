/**
 * Forecast = a dry run of the same engine with surprises hidden.
 * Events that are foreseeable (wedding, festival) or already decided still apply; scammers do not.
 */
import { simulate } from './simulate'
import type { DecisionLog, Ledger, Profile, Scenario } from './types'

export function forecast(scenario: Scenario, profile: Profile, decisions: DecisionLog, seed: number): Ledger {
  return simulate(scenario, profile, decisions, seed, { includeUnresolvedEvents: false, includeScams: false })
}

/** The month as lived so far: only decided events and scams count, nothing is assumed. */
export function lived(scenario: Scenario, profile: Profile, decisions: DecisionLog, seed: number, throughDay: number): Ledger {
  return simulate(scenario, profile, decisions, seed, { includeUnresolvedEvents: false, includeForeseeable: false, throughDay })
}

export interface GapInfo {
  /** Deepest pre-bridge balance from `fromDay` onward (0 if never negative). */
  deepest: number
  firstDay: number | null
  lastDay: number | null
  shortfallDays: number
  /** Positive amount needed to cover the deepest point. */
  amountNeeded: number
}

/** Describe the shortfall in a ledger from a given day onward. The UI reads this, never recomputes it. */
export function describeGap(ledger: Ledger, fromDay = 1): GapInfo {
  let deepest = 0
  let firstDay: number | null = null
  let lastDay: number | null = null
  let shortfallDays = 0
  for (const d of ledger.days) {
    if (d.day < fromDay) continue
    if (d.preBridgeBalance < deepest) deepest = d.preBridgeBalance
    if (d.shortfall) {
      shortfallDays++
      firstDay ??= d.day
      lastDay = d.day
    }
  }
  return { deepest, firstDay, lastDay, shortfallDays, amountNeeded: Math.max(0, -deepest) }
}
