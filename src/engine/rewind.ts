/**
 * Month Rewind: change one past decision; every later decision auto-replays as originally made.
 * Impossible ones come back from the engine marked Blocked (with its defined fallback).
 */
import { simulate } from './simulate'
import type { ActionOutcome, DecisionLog, Ledger, PlayerAction, Profile, Scenario, SimulateOptions } from './types'

/** A finished month only counts what was actually decided; undecided events never fired. */
export const FINAL_MONTH_OPTS: SimulateOptions = { includeUnresolvedEvents: false, includeForeseeable: false }

export interface RewindDelta {
  shortfallDays: number
  lowestBalance: number
  endBalance: number
  gapCost: number
  scamLoss: number
}

export interface RewindResult {
  original: Ledger
  rewound: Ledger
  decisions: DecisionLog
  /** Later decisions the engine could not replay. */
  blocked: ActionOutcome[]
  delta: RewindDelta
}

export function diffSummaries(a: Ledger, b: Ledger): RewindDelta {
  return {
    shortfallDays: b.summary.shortfallDays - a.summary.shortfallDays,
    lowestBalance: b.summary.lowestBalance - a.summary.lowestBalance,
    endBalance: b.summary.endBalance - a.summary.endBalance,
    gapCost: b.summary.gapCost - a.summary.gapCost,
    scamLoss: b.summary.scamLoss - a.summary.scamLoss,
  }
}

/**
 * Replace (or remove, with `replacement = null`) the action with `changedActionId`.
 * The world stays seed-locked; only the decision log changes.
 */
export function rewind(
  scenario: Scenario,
  profile: Profile,
  decisions: DecisionLog,
  seed: number,
  changedActionId: string,
  replacement: PlayerAction | null,
  opts: SimulateOptions = FINAL_MONTH_OPTS,
): RewindResult {
  const original = simulate(scenario, profile, decisions, seed, opts)
  const next: DecisionLog = []
  for (const a of decisions) {
    if (a.id !== changedActionId) next.push(a)
    else if (replacement) next.push({ ...replacement, id: a.id, day: replacement.day || a.day })
  }
  if (replacement && !decisions.some((a) => a.id === changedActionId)) next.push(replacement)
  const rewound = simulate(scenario, profile, next, seed, opts)
  const originallyApplied = new Set(original.actionOutcomes.filter((o) => o.status === 'applied').map((o) => o.actionId))
  const blocked = rewound.actionOutcomes.filter((o) => o.status === 'blocked' && originallyApplied.has(o.actionId) && o.actionId !== changedActionId)
  return { original, rewound, decisions: next, blocked, delta: diffSummaries(original, rewound) }
}

/** Alternatives the Rewind timeline can offer for a given logged action. */
export function alternativesFor(action: PlayerAction, scenario: Scenario): PlayerAction[] {
  switch (action.type) {
    case 'eventChoice': {
      const ev = scenario.events.find((e) => e.id === action.eventId)
      return (ev?.choices ?? []).filter((c) => c.id !== action.choiceId).map((c) => ({ ...action, choiceId: c.id }))
    }
    case 'scamResponse': {
      const all: PlayerAction['type'] extends never ? never : Array<Extract<PlayerAction, { type: 'scamResponse' }>['response']> = ['verify', 'wait', 'block', 'ask', 'comply']
      return all.filter((r) => r !== action.response).map((r) => ({ ...action, response: r }))
    }
    case 'bridge':
      return scenario.bridges.filter((b) => b.id !== action.optionId).map((b) => ({ ...action, optionId: b.id }))
    default:
      return []
  }
}
