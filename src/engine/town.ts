/**
 * Town engine: runs household archetypes through simulate() and aggregates.
 * Never duplicates money logic; same seed + same actions → identical town state.
 */
import { simulate } from './simulate'
import { subRng, hashString } from './rng'
import type { DecisionLog, Income, Ledger, Profile, Scenario } from './types'
import { scamGrowth, spreadScams } from './spread'
import { BASELINE_SCENARIO } from '@/content/scenario'
import { WARDS, WARDS_BY_ID, type WardDef } from '@/content/wards'
import { ARCHETYPES } from '@/content/profiles'
import { INITIATIVES_BY_ID } from '@/content/initiatives'
import { TOWN_EVENTS } from '@/content/townEvents'

export interface WardModifiers {
  paySplit: boolean
  rentMovedShare: number
  savingsBoost: number
  savingsActive: boolean
  fastTrack: boolean
  microFund: boolean
  rentExtra: number
  theatreUntil: number
  theatreStrength: number
  lastTheatreWeek: number
  dateShifts: number
}

export interface WardState {
  id: string
  shortfallRate: number
  scamLevel: number
  buffer: number
  trust: number
  defense: number
  mods: WardModifiers
}

export interface ActiveInitiative {
  id: string
  wardId?: string
  startedWeek: number
  readyWeek: number
}

export interface TownLogLine {
  week: number
  emoji: string
  key: string
  params?: Record<string, string | number>
  tone: 'neutral' | 'good' | 'bad' | 'warn'
}

export type TownOutcome = 'playing' | 'won' | 'lost'

export interface TownState {
  seed: number
  week: number
  budget: number
  debtDependency: number
  wards: WardState[]
  active: ActiveInitiative[]
  hotline: boolean
  reportedApps: 'none' | 'strong' | 'weak'
  log: TownLogLine[]
  outcome: TownOutcome
  lostReasonKey?: string
}

export type TownAction = { type: 'deploy'; initiativeId: string; wardId?: string }

export const TOWN_WEEKS = 24
export const START_BUDGET = 500_000
export const MONTHLY_FEES = 60_000
const VARIANTS = 8

export const DEFAULT_MODS: WardModifiers = {
  paySplit: false,
  rentMovedShare: 0,
  savingsBoost: 0,
  savingsActive: false,
  fastTrack: false,
  microFund: false,
  rentExtra: 0,
  theatreUntil: 0,
  theatreStrength: 0,
  lastTheatreWeek: -99,
  dateShifts: 0,
}

export function createTown(seed: number, opts: { demoOutbreak?: boolean } = {}): TownState {
  const state: TownState = {
    seed,
    week: 1,
    budget: START_BUDGET,
    debtDependency: 0,
    wards: WARDS.map((w) => ({ id: w.id, shortfallRate: 0, scamLevel: w.id === 'buspark' && opts.demoOutbreak ? 55 : 12, buffer: 0, trust: 55, defense: 0, mods: { ...DEFAULT_MODS } })),
    active: [],
    hotline: false,
    reportedApps: 'none',
    log: [],
    outcome: 'playing',
  }
  // Initial household picture.
  for (const ws of state.wards) {
    const hh = wardHouseholds(WARDS_BY_ID[ws.id]!, ws.mods, ws.scamLevel, seed, 1, 0, false)
    ws.shortfallRate = hh.shortfallRate
    ws.buffer = hh.buffer
  }
  return state
}

/* ---------- households ---------- */

function adjustIncomes(incomes: Income[], mods: WardModifiers, variantScale: number, delay: boolean): Income[] {
  const out: Income[] = []
  for (const inc of incomes) {
    if (inc.kind === 'gig') {
      out.push({ ...inc, base: Math.round(inc.base * variantScale) })
      continue
    }
    const amount = Math.round(inc.amount * variantScale)
    const uncertain = mods.fastTrack && inc.kind === 'remittance' ? undefined : inc.uncertain
    const day = delay ? Math.min(30, inc.day + 5) : inc.day
    if (mods.paySplit) {
      const half = Math.round(amount / 2)
      out.push({ ...inc, id: `${inc.id}-a`, day, amount: half, uncertain })
      out.push({ ...inc, id: `${inc.id}-b`, day: Math.min(28, day + 14), amount: amount - half, uncertain })
    } else out.push({ ...inc, day, amount, uncertain })
  }
  return out
}

function wardScenario(mods: WardModifiers): Scenario {
  if (mods.rentExtra === 0) return BASELINE_SCENARIO
  return { ...BASELINE_SCENARIO, bills: BASELINE_SCENARIO.bills.map((b) => (b.id === 'rent' ? { ...b, amount: b.amount + mods.rentExtra } : b)) }
}

/**
 * One household's month for a ward. `variant` = undefined gives the archetype exactly
 * (Riverside with no modifiers is Sita's ledger). Variants add deterministic heterogeneity.
 */
export function wardLedger(ward: WardDef, mods: WardModifiers, scamLevel: number, seed: number, variant?: number, extraDrain = 0, delay = false, moved = false): Ledger {
  const base = ARCHETYPES[ward.archetype]!
  const k = variant ?? 3.5
  const scale = variant === undefined ? 1 : 1 + (k - 3.5) * 0.035
  const cashShift = variant === undefined ? 0 : Math.round((k - 3.5) * 2_000)
  const drain = Math.round(scamLevel / 10) * 300 + extraDrain
  const profile: Profile = {
    ...base,
    startingBalance: base.startingBalance + mods.savingsBoost + cashShift - drain,
    incomes: adjustIncomes(base.incomes, mods, scale, delay),
    trust: moved ? { ...base.trust, landlord: Math.max(3, base.trust.landlord) } : base.trust,
  }
  const scenario = wardScenario(mods)
  const decisions: DecisionLog = []
  if (moved) {
    const payday = Math.max(0, ...profile.incomes.map((i) => (i.kind === 'gig' ? 0 : i.day)))
    const rent = scenario.bills.find((b) => b.id === 'rent')
    if (rent) decisions.push({ id: 'move-rent', type: 'moveBill', day: 1, billId: 'rent', fromDay: rent.dueDays[0] ?? 5, toDay: payday > 0 ? Math.min(28, payday + 1) : 15 })
  }
  const vseed = variant === undefined ? seed : (seed ^ hashString(`${ward.id}:${variant}`)) >>> 0
  return simulate(scenario, profile, decisions, vseed)
}

const hhCache = new Map<string, { shortfallRate: number; buffer: number }>()

/** Share of households with any shortfall day in this week's window, and their average buffer. Cached by parameters. */
export function wardHouseholds(ward: WardDef, mods: WardModifiers, scamLevel: number, seed: number, week: number, extraDrain: number, delay: boolean): { shortfallRate: number; buffer: number } {
  const key = `${ward.id}|${JSON.stringify(mods)}|${Math.round(scamLevel / 10)}|${seed}|${(week - 1) % 4}|${extraDrain}|${delay}`
  const hit = hhCache.get(key)
  if (hit) return hit
  const start = ((week - 1) * 7) % 30
  const windowDays = Array.from({ length: 7 }, (_, i) => (start + i) % 30)
  const measure = (moved: boolean) => {
    let hits = 0
    let buffer = 0
    for (let v = 0; v < VARIANTS; v++) {
      const l = wardLedger(ward, mods, scamLevel, seed, v, extraDrain, delay, moved)
      if (windowDays.some((d) => l.days[d]?.shortfall)) hits++
      buffer += l.days[windowDays[6] ?? 0]?.stats.bufferDays ?? 0
    }
    return { rate: hits / VARIANTS, buffer: buffer / VARIANTS }
  }
  const un = measure(false)
  const result = mods.rentMovedShare > 0 ? (() => {
    const mv = measure(true)
    const r = mods.rentMovedShare
    return { shortfallRate: un.rate * (1 - r) + mv.rate * r, buffer: un.buffer * (1 - r) + mv.buffer * r }
  })() : { shortfallRate: un.rate, buffer: un.buffer }
  hhCache.set(key, result)
  return result
}

/* ---------- weekly step ---------- */

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const clone = (s: TownState): TownState => ({ ...s, wards: s.wards.map((w) => ({ ...w, mods: { ...w.mods } })), active: s.active.map((a) => ({ ...a })), log: [...s.log] })

export function stepTown(prev: TownState, actions: TownAction[]): TownState {
  if (prev.outcome !== 'playing') return prev
  const s = clone(prev)
  const week = s.week
  const log = (line: Omit<TownLogLine, 'week'>) => s.log.push({ week, ...line })
  const rng = subRng(s.seed, `town-week-${week}`)
  const deployedThisWeek = new Set<string>()

  // 1. Member fees arrive monthly.
  if (week > 1 && (week - 1) % 4 === 0) {
    s.budget += MONTHLY_FEES
    log({ emoji: '💰', key: 'tlog.fees', params: { amount: MONTHLY_FEES }, tone: 'good' })
  }

  // 2. Deploy initiatives.
  for (const a of actions) {
    const def = INITIATIVES_BY_ID[a.initiativeId]
    if (!def) continue
    if (def.scope === 'ward' && (!a.wardId || !WARDS_BY_ID[a.wardId])) continue
    if (def.allowedWardIds && a.wardId && !def.allowedWardIds.includes(a.wardId)) {
      log({ emoji: '⛔', key: 'tlog.notAllowed', params: { name: def.nameKey, ward: WARDS_BY_ID[a.wardId]!.nameKey }, tone: 'warn' })
      continue
    }
    if (!def.repeatable && s.active.some((x) => x.id === def.id && x.wardId === a.wardId)) continue
    if (s.budget < def.cost) {
      log({ emoji: '⛔', key: 'tlog.noBudget', params: { name: def.nameKey }, tone: 'warn' })
      continue
    }
    s.budget -= def.cost
    s.active.push({ id: def.id, wardId: a.wardId, startedWeek: week, readyWeek: week + def.deployWeeks })
    if (a.wardId) deployedThisWeek.add(a.wardId)
    log({ emoji: def.emoji, key: 'tlog.deployed', params: { name: def.nameKey, ward: a.wardId ? WARDS_BY_ID[a.wardId]!.nameKey : 'town.wide', weeks: def.deployWeeks }, tone: 'neutral' })
  }

  // 3. Initiatives that become ready this week take effect.
  for (const act of s.active) {
    if (act.readyWeek !== week) continue
    const ward = act.wardId ? s.wards.find((w) => w.id === act.wardId) : undefined
    switch (act.id) {
      case 'theatre':
        if (ward) {
          const fatigued = week - ward.mods.lastTheatreWeek < 4
          ward.mods.theatreStrength = fatigued ? 0.15 : 0.3
          ward.mods.theatreUntil = week + 6
          ward.mods.lastTheatreWeek = week
          if (fatigued) log({ emoji: '🥱', key: 'tlog.fatigue', params: { ward: WARDS_BY_ID[ward.id]!.nameKey }, tone: 'warn' })
        }
        break
      case 'hotline':
        s.hotline = true
        break
      case 'savings':
        if (ward) ward.mods.savingsActive = true
        break
      case 'payday':
        if (ward) ward.mods.paySplit = true
        break
      case 'dateshift':
        if (ward) {
          ward.mods.dateShifts += 1
          ward.mods.rentMovedShare = Math.min(1, ward.mods.rentMovedShare + 0.5)
          if (ward.mods.dateShifts > 1) {
            ward.trust = clamp(ward.trust - 10, 0, 100)
            log({ emoji: '😠', key: 'tlog.goodwill', params: { ward: WARDS_BY_ID[ward.id]!.nameKey }, tone: 'bad' })
          }
        }
        break
      case 'microfund':
        if (ward) ward.mods.microFund = true
        break
      case 'fasttrack':
        for (const w of s.wards) if (WARDS_BY_ID[w.id]!.remittanceWard) w.mods.fastTrack = true
        break
      case 'report':
        s.reportedApps = rng() < 0.7 ? 'strong' : 'weak'
        log({ emoji: '📣', key: s.reportedApps === 'strong' ? 'tlog.reportStrong' : 'tlog.reportWeak', tone: s.reportedApps === 'strong' ? 'good' : 'warn' })
        break
    }
    if (act.id !== 'report') log({ emoji: INITIATIVES_BY_ID[act.id]!.emoji, key: 'tlog.ready', params: { name: INITIATIVES_BY_ID[act.id]!.nameKey, ward: act.wardId ? WARDS_BY_ID[act.wardId]!.nameKey : 'town.wide' }, tone: 'good' })
  }
  // Savings circles grow buffers gradually.
  for (const w of s.wards) if (w.mods.savingsActive) w.mods.savingsBoost = Math.min(6_000, w.mods.savingsBoost + 500)

  // 4. Seeded weekly event.
  const drains: Record<string, number> = {}
  const delays = new Set<string>()
  if (rng() < 0.4) {
    const ev = TOWN_EVENTS[Math.floor(rng() * TOWN_EVENTS.length)]!
    log({ emoji: ev.emoji, key: ev.titleKey, tone: 'warn' })
    for (const fx of ev.effects) {
      switch (fx.type) {
        case 'scam':
          for (const w of s.wards) if (!fx.wardId || w.id === fx.wardId) w.scamLevel = clamp(w.scamLevel + fx.delta, 0, 100)
          break
        case 'drain':
          for (const w of s.wards) if (!fx.wardId || w.id === fx.wardId) drains[w.id] = (drains[w.id] ?? 0) + fx.amount
          break
        case 'rentExtra': {
          const w = s.wards.find((x) => x.id === fx.wardId)
          if (w) w.mods.rentExtra += fx.amount
          break
        }
        case 'delayIncome':
          delays.add(fx.wardId)
          break
      }
    }
  }

  // 5. Households: shortfall rate and buffer from the household engine.
  for (const w of s.wards) {
    const hh = wardHouseholds(WARDS_BY_ID[w.id]!, w.mods, w.scamLevel, s.seed, week, drains[w.id] ?? 0, delays.has(w.id))
    w.shortfallRate = hh.shortfallRate
    w.buffer = hh.buffer
  }

  // 6. Scam growth, then spread between neighbours.
  const reportFactor = s.reportedApps === 'strong' ? 0.5 : s.reportedApps === 'weak' ? 0.8 : 1
  for (const w of s.wards) {
    const theatre = week <= w.mods.theatreUntil ? w.mods.theatreStrength : 0
    w.defense = clamp(theatre + (s.hotline ? 0.2 : 0) + (w.mods.microFund ? 0.2 : 0), 0, 0.9)
    const growth = scamGrowth(w.shortfallRate, w.defense) * reportFactor
    const decay = 1.5 + 2 * w.defense
    w.scamLevel = clamp(w.scamLevel + growth - decay, 0, 100)
  }
  const spreadLevels = spreadScams(Object.fromEntries(s.wards.map((w) => [w.id, w.scamLevel])), WARDS)
  for (const w of s.wards) {
    const after = spreadLevels[w.id] ?? w.scamLevel
    if (after > w.scamLevel + 2) log({ emoji: '🦠', key: 'tlog.spread', params: { ward: WARDS_BY_ID[w.id]!.nameKey }, tone: 'bad' })
    w.scamLevel = after
  }

  // 7. Trust in the cooperative.
  for (const w of s.wards) {
    let delta = deployedThisWeek.has(w.id) ? 4 : 0
    delta += w.shortfallRate > 0.5 ? -2 : 0.5
    delta += w.scamLevel > 60 ? -2 : 0
    w.trust = clamp(w.trust + delta, 0, 100)
  }

  // 8. Running costs and debt dependency.
  if (s.hotline) s.budget -= INITIATIVES_BY_ID['hotline']!.weeklyCost ?? 0
  const microWards = s.wards.filter((w) => w.mods.microFund)
  for (const w of microWards) {
    const defaulted = Math.round(1_000 + rng() * 2_500)
    s.budget -= defaulted
    s.debtDependency = clamp(s.debtDependency + 3, 0, 100)
    if (defaulted > 3_000) log({ emoji: '📉', key: 'tlog.defaults', params: { ward: WARDS_BY_ID[w.id]!.nameKey, amount: defaulted }, tone: 'warn' })
  }
  if (microWards.length === 0) s.debtDependency = clamp(s.debtDependency - 1, 0, 100)

  // 9. Advance and judge.
  s.week = week + 1
  const m = townMeters(s)
  if (m.trust < 20) {
    s.outcome = 'lost'
    s.lostReasonKey = 'town.lost.trust'
  } else if (s.wards.every((w) => w.scamLevel > 60)) {
    s.outcome = 'lost'
    s.lostReasonKey = 'town.lost.scams'
  } else if (s.week > TOWN_WEEKS) {
    const won = m.stability >= 80 && s.wards.every((w) => w.scamLevel <= 20)
    s.outcome = won ? 'won' : 'lost'
    if (!won) s.lostReasonKey = 'town.lost.time'
  }
  return s
}

export function simulateTown(seed: number, turns: TownAction[][], opts: { demoOutbreak?: boolean } = {}): TownState {
  let s = createTown(seed, opts)
  for (const actions of turns) s = stepTown(s, actions)
  return s
}

/* ---------- meters, grade, outlook ---------- */

export interface TownMeters {
  /** % of households with no shortfall this week (household-weighted). */
  stability: number
  /** % of wards above scam level 40. */
  scamSpread: number
  trust: number
  budget: number
  debtDependency: number
}

export function townMeters(s: TownState): TownMeters {
  let hh = 0
  let safe = 0
  for (const w of s.wards) {
    const n = WARDS_BY_ID[w.id]!.households
    hh += n
    safe += n * (1 - w.shortfallRate)
  }
  return {
    stability: Math.round((safe / hh) * 100),
    scamSpread: Math.round((s.wards.filter((w) => w.scamLevel > 40).length / s.wards.length) * 100),
    trust: Math.round(s.wards.reduce((a, w) => a + w.trust, 0) / s.wards.length),
    budget: s.budget,
    debtDependency: Math.round(s.debtDependency),
  }
}

export type TownGrade = 'S' | 'A' | 'B' | 'C' | 'D'

export function townGrade(s: TownState): TownGrade {
  const m = townMeters(s)
  const score = m.stability + Math.max(0, Math.min(1, m.budget / START_BUDGET)) * 20 - m.debtDependency * 0.3
  if (s.outcome === 'won' && score >= 95) return 'S'
  if (s.outcome === 'won' || score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  return 'D'
}

/** Monte Carlo outlook: projected stability in `weeks` weeks with no further actions, over seeded runs. */
export function townOutlook(s: TownState, weeks = 4, runs = 200): { p10: number; p50: number; p90: number } {
  const results: number[] = []
  const rng = subRng(s.seed, `outlook-${s.week}`)
  for (let i = 0; i < runs; i++) {
    let t: TownState = { ...s, seed: Math.floor(rng() * 4294967296) >>> 0 }
    for (let k = 0; k < weeks && t.outcome === 'playing'; k++) t = stepTown(t, [])
    results.push(townMeters(t).stability)
  }
  results.sort((a, b) => a - b)
  const pct = (p: number) => results[Math.min(results.length - 1, Math.round((p / 100) * (results.length - 1)))] ?? 0
  return { p10: pct(10), p50: pct(50), p90: pct(90) }
}
