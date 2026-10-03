/**
 * Fix My Dates: find the bill-date changes that remove shortfall days from a real household.
 * Reuses the household engine over a 60-day horizon (two months of the same pattern).
 * Never moves bills marked "no".
 */
import { simulate } from './simulate'
import type { Bill, Flexibility, Income, Profile, Scenario } from './types'

export interface RealIncome {
  id: string
  label: string
  /** Day of the month, 1–28. */
  day: number
  amount: number
  /** Irregular income (gig, remittance) can arrive a few days late. */
  irregular?: boolean
}

export interface RealBill {
  id: string
  label: string
  amount: number
  dueDay: number
  flexible: Flexibility
}

export interface RealInputs {
  incomes: RealIncome[]
  bills: RealBill[]
  startingCash: number
}

export type Change = { type: 'move'; billId: string; fromDay: number; toDay: number } | { type: 'split'; billId: string; fromDay: number; days: [number, number] }

export interface Evaluation {
  shortfallDays: number
  deepest: number
  endBalance: number
  balances: number[]
}

export interface Suggestion extends Evaluation {
  id: string
  changes: Change[]
  /** The same changes if every irregular income arrives 3 days late (only when some income is irregular). */
  delayed?: Evaluation
}

export type WorldMode = 'onTime' | 'delayed' | 'uncertain'
export const LATE_DAYS = 3

export interface ShiftFinderResult {
  baseline: Evaluation
  suggestions: Suggestion[]
  candidatesTried: number
}

export const HORIZON_DAYS = 60

/** Build an engine scenario + profile for the real inputs with the given changes applied. */
export function buildWorld(inputs: RealInputs, changes: Change[] = [], horizon = HORIZON_DAYS, mode: WorldMode = 'onTime'): { scenario: Scenario; profile: Profile } {
  const bills: Bill[] = []
  for (const b of inputs.bills) {
    const move = changes.find((c): c is Extract<Change, { type: 'move' }> => c.type === 'move' && c.billId === b.id)
    const split = changes.find((c): c is Extract<Change, { type: 'split' }> => c.type === 'split' && c.billId === b.id)
    const monthly = (day: number) => [day, day + 30].filter((d) => d >= 1 && d <= horizon)
    if (split) {
      const first = Math.ceil(b.amount / 2)
      bills.push({ id: `${b.id}-a`, nameKey: b.label, emoji: '🧾', amount: first, dueDays: monthly(split.days[0]), flexible: b.flexible })
      bills.push({ id: `${b.id}-b`, nameKey: b.label, emoji: '🧾', amount: b.amount - first, dueDays: monthly(split.days[1]), flexible: b.flexible })
    } else {
      bills.push({ id: b.id, nameKey: b.label, emoji: '🧾', amount: b.amount, dueDays: monthly(move ? move.toDay : b.dueDay), flexible: b.flexible })
    }
  }
  const incomes: Income[] = []
  for (const inc of inputs.incomes) {
    const shift = inc.irregular && mode === 'delayed' ? LATE_DAYS : 0
    for (const [k, day] of [inc.day + shift, inc.day + 30 + shift].entries()) {
      if (day > horizon) continue
      incomes.push({
        id: `${inc.id}-m${k + 1}`,
        nameKey: inc.label,
        emoji: '💰',
        kind: 'salary',
        day,
        amount: inc.amount,
        uncertain: inc.irregular && mode === 'uncertain' ? { delayDays: LATE_DAYS, probability: 0.3 } : undefined,
      })
    }
  }
  const scenario: Scenario = { id: 'real', days: horizon, bills, events: [], bridges: [], scams: [] }
  const profile: Profile = {
    id: 'you',
    nameKey: 'fix.you',
    emoji: '🙂',
    blurbKey: 'fix.you',
    startingBalance: inputs.startingCash,
    incomes,
    trust: { landlord: 5, family: 5, friends: 5 },
    privacy: 100,
    stress: 0,
    hasFormalCredit: false,
  }
  return { scenario, profile }
}

export function evaluate(inputs: RealInputs, changes: Change[] = [], seed = 1, mode: WorldMode = 'onTime'): Evaluation {
  const { scenario, profile } = buildWorld(inputs, changes, HORIZON_DAYS, mode)
  const l = simulate(scenario, profile, [], seed)
  return { shortfallDays: l.summary.shortfallDays, deepest: l.summary.lowestBalance, endBalance: l.summary.endBalance, balances: l.days.map((d) => d.balance) }
}

function flexRank(f: Flexibility): number {
  return f === 'yes' ? 0 : f === 'maybe' ? 1 : 9
}

/** The deepest gap: how far below zero the balance goes (0 when it never does). */
export function gapOf(e: Evaluation): number {
  return Math.max(0, -e.deepest)
}

/** Shortfall days counted across the on-time world and, when income is irregular, the late world too. */
function robustDays(s: Suggestion): number {
  return s.shortfallDays + (s.delayed?.shortfallDays ?? 0)
}
function robustGap(s: Suggestion): number {
  return gapOf(s) + (s.delayed ? gapOf(s.delayed) : 0)
}

/** Rank: fewest shortfall days → smallest deepest gap → fewest changes → prefer "Yes" bills → day after payday. */
function compare(a: Suggestion, b: Suggestion, inputs: RealInputs): number {
  if (robustDays(a) !== robustDays(b)) return robustDays(a) - robustDays(b)
  if (robustGap(a) !== robustGap(b)) return robustGap(a) - robustGap(b)
  if (a.changes.length !== b.changes.length) return a.changes.length - b.changes.length
  const flex = (s: Suggestion) => s.changes.reduce((sum, c) => sum + flexRank(inputs.bills.find((x) => x.id === c.billId)?.flexible ?? 'no'), 0)
  if (flex(a) !== flex(b)) return flex(a) - flex(b)
  const paydays = inputs.incomes.map((i) => i.day)
  const dist = (s: Suggestion) =>
    s.changes.reduce((sum, c) => {
      const day = c.type === 'move' ? c.toDay : c.days[1]
      return sum + Math.min(...paydays.map((p) => Math.abs(day - (p + 1))), 99)
    }, 0)
  return dist(a) - dist(b)
}

export interface FindOptions {
  max?: number
  /** Bills the other party refused to move ("They said no"). */
  excludeBillIds?: string[]
  seed?: number
}

export function findShifts(inputs: RealInputs, opts: FindOptions = {}): ShiftFinderResult {
  const max = opts.max ?? 3
  const seed = opts.seed ?? 1
  const excluded = new Set(opts.excludeBillIds ?? [])
  const irregular = inputs.incomes.some((i) => i.irregular)
  const baseline = evaluate(inputs, [], seed)
  const baselineSug: Suggestion = { id: 'baseline', changes: [], ...baseline, delayed: irregular ? evaluate(inputs, [], seed, 'delayed') : undefined }
  const movable = inputs.bills.filter((b) => b.flexible !== 'no' && !excluded.has(b.id))
  const suggestions: Suggestion[] = []
  let tried = 0
  const push = (changes: Change[]) => {
    tried++
    const ev = evaluate(inputs, changes, seed)
    const delayed = irregular ? evaluate(inputs, changes, seed, 'delayed') : undefined
    suggestions.push({ id: changes.map((c) => (c.type === 'move' ? `${c.billId}>${c.toDay}` : `${c.billId}/${c.days.join('+')}`)).join(','), changes, ...ev, delayed })
  }

  // Single moves: any flexible bill to any day 1–28.
  const bestDaysPerBill = new Map<string, number[]>()
  for (const b of movable) {
    const scored: { day: number; s: Suggestion }[] = []
    for (let day = 1; day <= 28; day++) {
      if (day === b.dueDay) continue
      push([{ type: 'move', billId: b.id, fromDay: b.dueDay, toDay: day }])
      scored.push({ day, s: suggestions[suggestions.length - 1]! })
    }
    scored.sort((x, y) => compare(x.s, y.s, inputs))
    bestDaysPerBill.set(b.id, scored.slice(0, 4).map((x) => x.day))
  }
  // Pairs: each pair of flexible bills, using each bill's best single-move days.
  for (let i = 0; i < movable.length; i++) {
    for (let j = i + 1; j < movable.length; j++) {
      const a = movable[i]!
      const b = movable[j]!
      for (const da of bestDaysPerBill.get(a.id) ?? []) {
        for (const db of bestDaysPerBill.get(b.id) ?? []) {
          push([
            { type: 'move', billId: a.id, fromDay: a.dueDay, toDay: da },
            { type: 'move', billId: b.id, fromDay: b.dueDay, toDay: db },
          ])
        }
      }
    }
  }
  // Splits: half now, half after the next payday.
  const paydays = inputs.incomes.map((i) => i.day)
  for (const b of movable) {
    const targets = new Set<number>([Math.min(28, b.dueDay + 14), ...paydays.map((p) => Math.min(28, p + 1)).filter((d) => d > b.dueDay)])
    for (const second of targets) {
      if (second <= b.dueDay) continue
      push([{ type: 'split', billId: b.id, fromDay: b.dueDay, days: [b.dueDay, second] }])
    }
  }

  const improving = suggestions.filter((s) => robustDays(s) < robustDays(baselineSug) || (robustDays(s) === robustDays(baselineSug) && robustGap(s) < robustGap(baselineSug)))
  improving.sort((a, b) => compare(a, b, inputs))
  // Keep the top distinct outcomes so the three cards are not near-duplicates.
  const out: Suggestion[] = []
  const seen = new Set<string>()
  for (const s of improving) {
    const key = s.changes.map((c) => c.billId).sort().join('|') + `:${robustDays(s)}:${robustGap(s)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(s)
    if (out.length >= max) break
  }
  return { baseline, suggestions: out, candidatesTried: tried }
}
