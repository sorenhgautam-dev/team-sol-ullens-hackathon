/**
 * The one pure household engine.
 *
 *   simulate(scenario, profile, decisions, seed) → Ledger
 *
 * Deterministic: same inputs → identical ledger. No Math.random, no Date, no I/O.
 * Daily ordering: income → bills → events and scam encounters → player decisions.
 */
import type {
  ActionOutcome,
  Bill,
  BridgeOption,
  BridgeQuote,
  DayRecord,
  DecisionLog,
  Effect,
  Entry,
  EntryKind,
  EventChoice,
  Ledger,
  LedgerSummary,
  LogLine,
  Obligation,
  Person,
  PlayerAction,
  Profile,
  ResolvedEvent,
  ScamDef,
  ScamEncounterRecord,
  ScamResponse,
  Scenario,
  SimulateOptions,
  Trust,
} from './types'
import { subRng } from './rng'

interface ScheduledPayment {
  billId: string
  day: number
  amount: number
  originalDay: number
  /** Set when the payment was deferred by a Gap Bridge (counts as a pre-bridge shortfall). */
  deferredFrom?: number
  /** Fee charged when this payment is made (split fee, late fee). Counted in Gap Cost. */
  fee: number
  feeLabelKey?: string
}

export interface ScheduledIncome {
  incomeId: string
  day: number
  amount: number
  labelKey: string
  emoji: string
  delayedBy: number
}

interface Repayment {
  day: number
  principal: number
  fee: number
  optionId: string
  labelKey: string
  emoji: string
}

interface RecurringObligation {
  labelKey: string
  emoji: string
  amount: number
  monthsLeft: number
}

/** Anything scheduled to hit the balance on a later day (instalments, delayed sales, hidden fees). */
interface PendingItem {
  day: number
  amount: number
  kind: EntryKind
  labelKey: string
  emoji: string
  ref?: Entry['ref']
}

interface ScamDebt {
  labelKey: string
  principal: number
}

/** Shield points per response on a real scam (plus 1 per tell spotted). */
export const SHIELD_POINTS: Record<ScamResponse, number> = { verify: 3, wait: 3, block: 2, ask: 2, comply: 0 }

/** Privacy at or below this level means the player's data has leaked. */
export const PRIVACY_LEAK_THRESHOLD = 60

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const round = (n: number) => Math.round(n)

export function resolveBills(scenario: Scenario, profile: Profile): Bill[] {
  const out: Bill[] = []
  for (const bill of scenario.bills) {
    const override = profile.billOverrides?.[bill.id]
    if (override === null) continue
    out.push(override ? { ...bill, ...override } : bill)
  }
  return out
}

/** Build the (seeded) income schedule for the month. Exported for the forecast/MC worker. */
export function scheduleIncomes(profile: Profile, seed: number, days: number): ScheduledIncome[] {
  const list: ScheduledIncome[] = []
  for (const inc of profile.incomes) {
    if (inc.kind === 'gig') {
      const rng = subRng(seed, `gig:${inc.id}`)
      for (let d = 1; d <= days; d++) {
        const zero = rng() < inc.zeroDayProbability
        const mult = inc.spread[0] + rng() * (inc.spread[1] - inc.spread[0])
        const off = inc.offDays?.includes(d) ?? false
        const amount = zero || off ? 0 : Math.round((inc.base * mult) / 10) * 10
        list.push({ incomeId: inc.id, day: d, amount, labelKey: inc.nameKey, emoji: inc.emoji, delayedBy: 0 })
      }
    } else {
      let day = inc.day
      let delayedBy = 0
      if (inc.uncertain) {
        const rng = subRng(seed, `income:${inc.id}`)
        if (rng() < inc.uncertain.probability) {
          delayedBy = inc.uncertain.delayDays
          day += delayedBy
        }
      }
      list.push({ incomeId: inc.id, day, amount: inc.amount, labelKey: inc.nameKey, emoji: inc.emoji, delayedBy })
    }
  }
  return list
}

/** Pure cost quote for a Gap Bridge option. The UI must call this, never compute fees itself. */
export function quoteBridge(option: BridgeOption, amount: number, fromDay: number, repayDay: number): BridgeQuote {
  const days = Math.max(1, repayDay - fromDay)
  let fee = 0
  switch (option.fee.type) {
    case 'none':
      fee = 0
      break
    case 'flat':
      fee = option.fee.amount
      break
    case 'flatPercent':
      fee = (amount * option.fee.percent) / 100
      break
    case 'monthlyPercent':
      fee = (amount * option.fee.monthlyPercent * (days / 30)) / 100
      break
    case 'percentPlusMonthly':
      fee = (amount * (option.fee.percent + option.fee.monthlyPercent * (days / 30))) / 100
      break
  }
  fee = round(fee)
  return { optionId: option.id, amount, fee, repayDay, repayTotal: amount + fee, days }
}

/** First salary/remittance day strictly after `day`; falls back to day + 14. */
export function nextIncomeDay(incomes: { day: number; amount: number; incomeId: string }[], profile: Profile, day: number): number {
  const lumpIds = new Set(profile.incomes.filter((i) => i.kind !== 'gig').map((i) => i.id))
  const candidates = incomes.filter((i) => i.day > day && i.amount > 0 && lumpIds.has(i.incomeId)).map((i) => i.day)
  return candidates.length ? Math.min(...candidates) : day + 14
}

export function resolveRepayDay(option: BridgeOption, incomes: ScheduledIncome[], profile: Profile, day: number): number {
  return option.term.type === 'days' ? day + option.term.days : nextIncomeDay(incomes, profile, day)
}

export function simulate(
  scenario: Scenario,
  profile: Profile,
  decisions: DecisionLog,
  seed: number,
  opts: SimulateOptions = {},
): Ledger {
  const includeUnresolved = opts.includeUnresolvedEvents ?? true
  const includeForeseeable = opts.includeForeseeable ?? true
  const includeScams = opts.includeScams ?? true
  const autoScam = opts.autoScamResponse
  const lastDay = clamp(opts.throughDay ?? scenario.days, 1, scenario.days)

  const bills = resolveBills(scenario, profile)
  const billsById = new Map(bills.map((b) => [b.id, b]))
  const payments: ScheduledPayment[] = []
  for (const b of bills) for (const d of b.dueDays) payments.push({ billId: b.id, day: d, amount: b.amount, originalDay: d, fee: 0 })
  const incomes = scheduleIncomes(profile, seed, scenario.days)
  const lumpIds = new Set(profile.incomes.filter((i) => i.kind !== 'gig').map((i) => i.id))
  const lumpPaydays = incomes.filter((i) => lumpIds.has(i.incomeId) && i.amount > 0).map((i) => i.day).sort((a, b) => a - b)
  const eventsById = new Map(scenario.events.map((e) => [e.id, e]))
  const bridgesById = new Map(scenario.bridges.map((b) => [b.id, b]))
  const scamsById = new Map(scenario.scams.map((s) => [s.id, s]))
  const scamRangePick = new Map<string, number>()
  for (const s of scenario.scams) {
    if (s.trigger.type === 'dayRange') {
      const r = subRng(seed, `scam:${s.id}`)
      scamRangePick.set(s.id, s.trigger.from + Math.floor(r() * (s.trigger.to - s.trigger.from + 1)))
    }
  }

  // Mutable month state
  let balance = profile.startingBalance
  let jar = 0
  let preBridgeOffset = 0
  let gapCost = 0
  let scamLoss = 0
  let stress = profile.stress
  let privacy = profile.privacy
  const trust: Trust = { ...profile.trust }
  const flags = new Set<string>()
  const flagSetDay = new Map<string, number>()
  const repayments: Repayment[] = []
  const recurring: RecurringObligation[] = []
  const pending: PendingItem[] = []
  const scamDebts: ScamDebt[] = []
  const outcomes: ActionOutcome[] = []
  const processed = new Set<string>()
  const scamFired = new Map<string, number>()
  let scamsFaced = 0
  let scamsDefended = 0
  let scamsFooled = 0
  let shieldPoints = 0
  let tellsSpottedTotal = 0
  const days: DayRecord[] = []
  let wasNegative = false
  let everNegative = false
  let currentEntries: Entry[] = []
  let currentLog: LogLine[] = []

  const applied = (a: PlayerAction) => outcomes.push({ actionId: a.id, status: 'applied' })
  const blocked = (a: PlayerAction, reasonKey: string) => outcomes.push({ actionId: a.id, status: 'blocked', reasonKey })
  const bumpTrust = (who: Person, delta: number) => {
    trust[who] = clamp(trust[who] + delta, 0, 5)
  }
  const setFlag = (flag: string) => {
    if (!flags.has(flag)) {
      flags.add(flag)
      flagSetDay.set(flag, currentDay())
    }
  }

  for (let d = 1; d <= lastDay; d++) {
    const entries: Entry[] = []
    const log: LogLine[] = []
    const dayEvents: ResolvedEvent[] = []
    const dayScams: ScamEncounterRecord[] = []
    currentEntries = entries
    currentLog = log

    /* 1. Income */
    for (const inc of incomes) {
      if (inc.day !== d || inc.amount <= 0) continue
      book({ kind: 'income', amount: inc.amount, labelKey: inc.labelKey, emoji: inc.emoji, ref: { type: 'income', id: inc.incomeId } })
      log.push({ day: d, emoji: inc.emoji, key: 'log.income', params: { name: inc.labelKey, amount: inc.amount, balance }, tone: 'good' })
    }
    for (const inc of incomes) {
      if (inc.delayedBy > 0 && inc.day - inc.delayedBy === d) {
        log.push({ day: d, emoji: '⏳', key: 'log.incomeDelayed', params: { name: inc.labelKey, days: inc.delayedBy }, tone: 'warn', whyKey: 'why.remittanceDelay' })
      }
    }
    for (const item of pending) {
      if (item.day !== d || item.amount <= 0) continue
      book({ kind: item.kind, amount: item.amount, labelKey: item.labelKey, emoji: item.emoji, ref: item.ref })
      log.push({ day: d, emoji: item.emoji, key: 'log.received', params: { name: item.labelKey, amount: item.amount }, tone: 'good' })
    }

    /* 2. Bills (in scenario order), deferred-bill accounting, repayments, instalments and hidden fees */
    for (const p of payments) {
      if (p.deferredFrom === d) preBridgeOffset -= p.amount // the gap existed even though we pay later
    }
    for (const bill of bills) {
      for (const p of payments) {
        if (p.billId !== bill.id || p.day !== d) continue
        const before = balance
        book({ kind: 'bill', amount: -p.amount, labelKey: bill.nameKey, emoji: bill.emoji, ref: { type: 'bill', id: bill.id } })
        if (p.deferredFrom !== undefined) preBridgeOffset += p.amount
        if (p.fee > 0) {
          book({ kind: 'fee', amount: -p.fee, labelKey: p.feeLabelKey ?? 'fee.generic', emoji: '🧾', ref: { type: 'bill', id: bill.id } })
          gapCost += p.fee
        }
        log.push({
          day: d,
          emoji: bill.emoji,
          key: p.deferredFrom !== undefined ? 'log.billPaidLate' : 'log.billDue',
          params: { name: bill.nameKey, amount: p.amount, before, after: balance, fee: p.fee },
          tone: balance < 0 ? 'bad' : 'neutral',
          whyKey: p.originalDay !== p.day ? 'why.billMoved' : undefined,
        })
      }
    }
    for (const r of repayments) {
      if (r.day !== d) continue
      book({ kind: 'bridge_repay', amount: -r.principal, labelKey: r.labelKey, emoji: r.emoji, ref: { type: 'bridge', id: r.optionId } })
      preBridgeOffset += r.principal
      if (r.fee > 0) {
        book({ kind: 'fee', amount: -r.fee, labelKey: r.labelKey, emoji: '🧾', ref: { type: 'bridge', id: r.optionId } })
        gapCost += r.fee
      }
      log.push({ day: d, emoji: r.emoji, key: 'log.repaid', params: { name: r.labelKey, amount: r.principal, fee: r.fee }, tone: r.fee > 0 ? 'warn' : 'neutral' })
    }
    for (const item of pending) {
      if (item.day !== d || item.amount >= 0) continue
      book({ kind: item.kind, amount: item.amount, labelKey: item.labelKey, emoji: item.emoji, ref: item.ref })
      if (item.kind === 'scam_loss') {
        scamLoss += -item.amount
        log.push({ day: d, emoji: item.emoji, key: 'log.hiddenFee', params: { name: item.labelKey, amount: -item.amount }, tone: 'bad', whyKey: 'why.hiddenFee' })
      } else {
        log.push({ day: d, emoji: item.emoji, key: 'log.instalment', params: { name: item.labelKey, amount: -item.amount }, tone: balance < 0 ? 'bad' : 'neutral' })
      }
    }

    /* 3a. Events */
    for (const ev of scenario.events) {
      if (ev.day !== d) continue
      const decision = decisions.find(
        (a): a is Extract<PlayerAction, { type: 'eventChoice' }> => a.type === 'eventChoice' && a.eventId === ev.id && !processed.has(a.id),
      )
      const fire = decision !== undefined || (ev.foreseeable && includeForeseeable) || includeUnresolved
      if (!fire) continue
      let choice: EventChoice | undefined
      let decided = false
      if (decision) {
        processed.add(decision.id)
        choice = ev.choices.find((c) => c.id === decision.choiceId)
        if (choice) {
          applied(decision)
          decided = true
        } else {
          blocked(decision, 'blocked.invalidChoice')
        }
        for (const dup of decisions) {
          if (dup.type === 'eventChoice' && dup.eventId === ev.id && !processed.has(dup.id)) {
            processed.add(dup.id)
            blocked(dup, 'blocked.duplicate')
          }
        }
      }
      choice ??= ev.choices.find((c) => c.id === ev.defaultChoiceId) ?? ev.choices[0]
      if (!choice) continue
      dayEvents.push({ eventId: ev.id, choiceId: choice.id, decided })
      log.push({ day: d, emoji: ev.emoji, key: 'log.event', params: { title: ev.titleKey, choice: choice.labelKey }, tone: 'neutral', whyKey: ev.textKey })
      applyEffects(ev.emoji, { type: 'event', id: ev.id }, choice.effects)
      if (choice.lessonKey) log.push({ day: d, emoji: '💡', key: 'log.lesson', params: { lesson: choice.lessonKey }, tone: 'lesson' })
    }

    /* 3b. Scam encounters */
    if (includeScams) {
      for (const scam of scenario.scams) {
        if (scamFired.has(scam.id) || !triggers(scam, d)) continue
        scamFired.set(scam.id, d)
        const personalized = privacy <= PRIVACY_LEAK_THRESHOLD && scam.personalHookKey !== undefined
        const record: ScamEncounterRecord = { scamId: scam.id, day: d, personalized, outcome: 'pending', loss: 0, shieldPoints: 0, tellsSpotted: 0 }
        dayScams.push(record)
        log.push({ day: d, emoji: scam.decoy ? '📩' : '📱', key: 'log.scamArrived', params: { sender: scam.senderKey }, tone: scam.decoy ? 'neutral' : 'warn', whyKey: 'why.scamTiming' })
        const decision = decisions.find(
          (a): a is Extract<PlayerAction, { type: 'scamResponse' }> => a.type === 'scamResponse' && a.scamId === scam.id && !processed.has(a.id),
        )
        if (decision) {
          processed.add(decision.id)
          applied(decision)
          resolveScam(scam, record, decision.response, decision.tellsSpotted)
          for (const dup of decisions) {
            if (dup.type === 'scamResponse' && dup.scamId === scam.id && !processed.has(dup.id)) {
              processed.add(dup.id)
              blocked(dup, 'blocked.duplicate')
            }
          }
        } else if (autoScam) {
          resolveScam(scam, record, autoScam, 0)
        }
      }
    }

    /* 4. Player decisions logged for today (or earlier, if never processed) */
    for (const a of decisions) {
      if (processed.has(a.id) || a.type === 'eventChoice' || a.type === 'scamResponse' || a.day > d) continue
      processed.add(a.id)
      handleAction(a)
    }

    /* Stats */
    const preBridgeBalance = balance + preBridgeOffset
    const shortfall = preBridgeBalance < 0
    if (shortfall && !wasNegative) log.push({ day: d, emoji: '🔻', key: 'log.wentNegative', params: { balance: preBridgeBalance }, tone: 'bad', whyKey: 'why.shortfall' })
    if (!shortfall && wasNegative) log.push({ day: d, emoji: '🟢', key: 'log.backAboveZero', params: { balance }, tone: 'good' })
    wasNegative = shortfall
    if (shortfall) everNegative = true
    stress = clamp(stress + (shortfall ? 3 : -1), 0, 100)

    days.push({
      day: d,
      entries,
      balance,
      preBridgeBalance,
      jar,
      shortfall,
      events: dayEvents,
      scams: dayScams,
      stats: { bufferDays: bufferDays(d), stress, trust: { ...trust }, privacy },
      log,
    })
  }

  // Decisions that were never reached
  for (const a of decisions) {
    if (processed.has(a.id)) continue
    if (a.type === 'eventChoice') {
      const ev = eventsById.get(a.eventId)
      if (ev && ev.day > lastDay) continue // not yet reached
      blocked(a, 'blocked.eventDidNotHappen')
    } else if (a.type === 'scamResponse') {
      if (lastDay < scenario.days && scamsById.has(a.scamId)) continue // might still appear
      blocked(a, 'blocked.scamDidNotHappen')
    }
  }

  const summary = summarise()
  return { scenarioId: scenario.id, profileId: profile.id, seed, days, summary, actionOutcomes: outcomes }

  /* ---------------- helpers (closures over month state) ---------------- */

  function currentDay() {
    return days.length + 1
  }

  /** Book an entry into the day currently being simulated. */
  function book(e: Entry) {
    currentEntries.push(e)
    balance += e.amount
  }

  function applyEffects(emoji: string, ref: Entry['ref'], effects: Effect[]) {
    const d = currentDay()
    for (const fx of effects) {
      switch (fx.kind) {
        case 'spend':
          book({ kind: 'event', amount: -fx.amount, labelKey: fx.labelKey, emoji: fx.emoji ?? emoji, ref })
          break
        case 'receive':
          if (fx.dayOffset && fx.dayOffset > 0) pending.push({ day: d + fx.dayOffset, amount: fx.amount, kind: 'sale', labelKey: fx.labelKey, emoji: fx.emoji ?? emoji, ref })
          else book({ kind: 'event', amount: fx.amount, labelKey: fx.labelKey, emoji: fx.emoji ?? emoji, ref })
          break
        case 'recurring': {
          let monthsLeft = fx.months
          if (fx.firstDay !== undefined && fx.firstDay >= d && fx.firstDay <= scenario.days) {
            if (fx.firstDay === d) book({ kind: 'event', amount: -fx.amount, labelKey: fx.labelKey, emoji: fx.emoji ?? emoji, ref })
            else pending.push({ day: fx.firstDay, amount: -fx.amount, kind: 'event', labelKey: fx.labelKey, emoji: fx.emoji ?? emoji, ref })
            monthsLeft -= 1
          }
          recurring.push({ labelKey: fx.labelKey, emoji: fx.emoji ?? emoji, amount: fx.amount, monthsLeft })
          break
        }
        case 'trust':
          bumpTrust(fx.who, fx.delta)
          break
        case 'stress':
          stress = clamp(stress + fx.delta, 0, 100)
          break
        case 'privacy':
          privacy = clamp(privacy + fx.delta, 0, 100)
          break
        case 'delayIncome':
          for (const inc of incomes) {
            if (inc.incomeId === fx.incomeId && inc.day > d) {
              inc.day += fx.days
              inc.delayedBy += fx.days
            }
          }
          break
        case 'flag':
          setFlag(fx.flag)
          break
      }
    }
  }

  /** First future day on which the balance would go negative given everything already scheduled. */
  function lookAheadShortfall(today: number): number | null {
    let running = balance
    for (let k = today + 1; k <= scenario.days; k++) {
      for (const inc of incomes) if (inc.day === k) running += inc.amount
      for (const p of payments) if (p.day === k) running -= p.amount + p.fee
      for (const r of repayments) if (r.day === k) running -= r.principal + r.fee
      for (const item of pending) if (item.day === k) running += item.amount
      if (running < 0) return k
    }
    return null
  }

  function triggers(scam: ScamDef, d: number): boolean {
    const tr = scam.trigger
    switch (tr.type) {
      case 'firstShortfall':
        return !everNegative && balance + preBridgeOffset < 0
      case 'gapForeseen':
        return d >= tr.minDay && balance + preBridgeOffset >= 0 && lookAheadShortfall(d) !== null
      case 'day':
        return d === tr.day
      case 'dayRange':
        return d === scamRangePick.get(scam.id)
      case 'payday':
        return d >= tr.minDay && lumpPaydays.includes(d)
      case 'afterPayday': {
        const p = lumpPaydays.find((x) => x >= tr.minDay)
        return p !== undefined && d === p + tr.daysAfter
      }
      case 'afterOffer': {
        for (const f of tr.flags) {
          const set = flagSetDay.get(f)
          if (set !== undefined && d > set) return true
        }
        return d === tr.fallbackDay
      }
      case 'eventDay':
        return eventsById.get(tr.eventId)?.day === d
    }
  }

  function resolveScam(scam: ScamDef, record: ScamEncounterRecord, response: ScamResponse, tellsSpotted: number) {
    const d = currentDay()
    record.response = response
    record.tellsSpotted = clamp(tellsSpotted, 0, scam.tellKeys.length)
    if (scam.decoy) {
      record.outcome = 'real'
      record.shieldPoints = response === 'verify' || response === 'wait' || response === 'ask' ? 1 : 0
      shieldPoints += record.shieldPoints
      currentLog.push({ day: d, emoji: '✅', key: 'log.decoyReal', params: { sender: scam.senderKey }, tone: 'lesson', whyKey: 'why.decoy' })
      return
    }
    scamsFaced++
    if (response === 'comply') {
      record.outcome = 'scammed'
      scamsFooled++
      const c = scam.comply
      const ref: Entry['ref'] = { type: 'scam', id: scam.id }
      if (c.cashIn) {
        book({ kind: 'scam_cash', amount: c.cashIn, labelKey: scam.nameKey, emoji: scam.emoji, ref })
        preBridgeOffset -= c.cashIn
        scamDebts.push({ labelKey: scam.nameKey, principal: c.cashIn })
        if (c.weeklyFee) {
          for (let k = d + 7; k <= scenario.days; k += 7) pending.push({ day: k, amount: -c.weeklyFee, kind: 'scam_loss', labelKey: 'scam.weeklyFee', emoji: scam.emoji, ref })
        }
      }
      if (c.loss > 0) {
        book({ kind: 'scam_loss', amount: -c.loss, labelKey: scam.nameKey, emoji: scam.emoji, ref })
        scamLoss += c.loss
        record.loss = c.loss
      }
      if (c.laterLoss) pending.push({ day: d + c.laterLoss.daysAfter, amount: -c.laterLoss.amount, kind: 'scam_loss', labelKey: 'scam.hiddenFee', emoji: scam.emoji, ref })
      applyEffects(scam.emoji, ref, c.effects ?? [])
      currentLog.push({ day: d, emoji: scam.emoji, key: c.cashIn ? 'log.scamLoan' : 'log.scammed', params: { name: scam.nameKey, amount: c.loss, cash: c.cashIn ?? 0 }, tone: 'bad', whyKey: scam.codex.howKey })
    } else {
      record.outcome = 'defended'
      scamsDefended++
      record.shieldPoints = SHIELD_POINTS[response] + record.tellsSpotted
      shieldPoints += record.shieldPoints
      tellsSpottedTotal += record.tellsSpotted
      currentLog.push({ day: d, emoji: '🛡️', key: 'log.scamDefended', params: { name: scam.nameKey, response: `response.${response}`, points: record.shieldPoints }, tone: 'good', whyKey: scam.codex.howKey })
    }
  }

  function handleAction(a: PlayerAction) {
    const d = currentDay()
    switch (a.type) {
      case 'moveBill':
      case 'payEarly': {
        const bill = billsById.get(a.billId)
        if (!bill) return blocked(a, 'blocked.unknownBill')
        if (bill.flexible === 'no') return blocked(a, 'blocked.notFlexible')
        if (a.type === 'moveBill' && bill.owner && trust[bill.owner] < 3) return blocked(a, 'blocked.trustTooLow')
        const p = payments.find((x) => x.billId === a.billId && x.day === a.fromDay && x.day > d)
        if (!p) return blocked(a, 'blocked.alreadyPaid')
        if (a.toDay < d || a.toDay > scenario.days) return blocked(a, 'blocked.invalidDay')
        p.day = a.toDay
        applied(a)
        currentLog.push({ day: d, emoji: bill.emoji, key: a.type === 'moveBill' ? 'log.billMoved' : 'log.billPaidEarly', params: { name: bill.nameKey, from: a.fromDay, to: a.toDay }, tone: 'good' })
        if (a.toDay === d) payNow(p, bill)
        return
      }
      case 'splitBill': {
        const bill = billsById.get(a.billId)
        if (!bill) return blocked(a, 'blocked.unknownBill')
        if (bill.flexible === 'no') return blocked(a, 'blocked.notFlexible')
        const idx = payments.findIndex((x) => x.billId === a.billId && x.day === a.fromDay && x.day > d)
        const p = payments[idx]
        if (!p) return blocked(a, 'blocked.alreadyPaid')
        const [d1, d2] = a.days
        if (d1 <= d || d2 <= d || d1 > scenario.days || d2 > scenario.days || d1 >= d2) return blocked(a, 'blocked.invalidDay')
        const first = Math.ceil(p.amount / 2)
        payments.splice(idx, 1, { ...p, day: d1, amount: first, fee: a.fee, feeLabelKey: 'fee.split' }, { ...p, day: d2, amount: p.amount - first, fee: 0 })
        applied(a)
        currentLog.push({ day: d, emoji: bill.emoji, key: 'log.billSplit', params: { name: bill.nameKey, first: d1, second: d2, fee: a.fee }, tone: 'good' })
        return
      }
      case 'bridge':
      case 'askHelp': {
        let option: BridgeOption | undefined
        if (a.type === 'bridge') option = bridgesById.get(a.optionId)
        else {
          const family = bridgesById.get('family')
          if (a.who === 'landlord' || !family) return blocked(a, 'blocked.invalidPerson')
          option = a.who === 'family' ? family : { ...family, id: 'friends', nameKey: 'bridge.friends', hiddenCostKey: 'bridge.friends.hidden', trust: { who: 'friends', delta: -1 } }
        }
        if (!option) return blocked(a, 'blocked.unknownBridge')
        if (option.requiresFormalCredit && !profile.hasFormalCredit) return blocked(a, 'blocked.noFormalCredit')
        if (a.amount <= 0) return blocked(a, 'blocked.invalidAmount')
        if (option.trust && trust[option.trust.who] <= 0) return blocked(a, 'blocked.trustTooLow')
        const repayDay = resolveRepayDay(option, incomes, profile, d)
        if (option.mechanism === 'deferBill') {
          const bill = option.billId ? billsById.get(option.billId) : undefined
          if (!bill) return blocked(a, 'blocked.unknownBill')
          const p = payments.find((x) => x.billId === bill.id && x.day > d && x.deferredFrom === undefined)
          if (!p) return blocked(a, 'blocked.alreadyPaid')
          const q = quoteBridge(option, p.amount, p.day, Math.max(repayDay, p.day + 1))
          p.deferredFrom = p.day
          p.day = Math.min(q.repayDay, scenario.days)
          p.fee += q.fee
          p.feeLabelKey = 'fee.late'
          applyBridgeSideEffects(option)
          applied(a)
          currentLog.push({ day: d, emoji: option.emoji, key: 'log.bridgeDefer', params: { name: option.nameKey, bill: bill.nameKey, to: p.day, fee: q.fee }, tone: 'warn', whyKey: option.hiddenCostKey })
          return
        }
        const q = quoteBridge(option, a.amount, d, repayDay)
        book({ kind: 'bridge_in', amount: q.amount, labelKey: option.nameKey, emoji: option.emoji, ref: { type: 'bridge', id: option.id } })
        preBridgeOffset -= q.amount
        repayments.push({ day: q.repayDay, principal: q.amount, fee: q.fee, optionId: option.id, labelKey: option.nameKey, emoji: option.emoji })
        applyBridgeSideEffects(option)
        applied(a)
        currentLog.push({ day: d, emoji: option.emoji, key: 'log.bridgeCash', params: { name: option.nameKey, amount: q.amount, fee: q.fee, repayDay: q.repayDay }, tone: 'warn', whyKey: option.hiddenCostKey })
        return
      }
      case 'jarDeposit':
        if (a.amount <= 0 || a.amount > balance) return blocked(a, 'blocked.insufficientBalance')
        book({ kind: 'jar_in', amount: -a.amount, labelKey: 'jar.deposit', emoji: '🪴' })
        jar += a.amount
        applied(a)
        currentLog.push({ day: d, emoji: '🪴', key: 'log.jarIn', params: { amount: a.amount, jar }, tone: 'good' })
        return
      case 'jarWithdraw':
        if (a.amount <= 0 || a.amount > jar) return blocked(a, 'blocked.insufficientJar')
        book({ kind: 'jar_out', amount: a.amount, labelKey: 'jar.withdraw', emoji: '🪴' })
        jar -= a.amount
        applied(a)
        currentLog.push({ day: d, emoji: '🥀', key: 'log.jarOut', params: { amount: a.amount, jar }, tone: 'warn' })
        return
      case 'sellItem':
        if (a.amount <= 0) return blocked(a, 'blocked.invalidAmount')
        book({ kind: 'sale', amount: a.amount, labelKey: `item.${a.itemId}`, emoji: '🏷️', ref: { type: 'action', id: a.id } })
        applied(a)
        currentLog.push({ day: d, emoji: '🏷️', key: 'log.sold', params: { item: `item.${a.itemId}`, amount: a.amount }, tone: 'good' })
        return
      case 'extraShift':
        if (a.amount <= 0) return blocked(a, 'blocked.invalidAmount')
        book({ kind: 'shift', amount: a.amount, labelKey: 'income.extraShift', emoji: '💪', ref: { type: 'action', id: a.id } })
        stress = clamp(stress + 5, 0, 100)
        applied(a)
        currentLog.push({ day: d, emoji: '💪', key: 'log.extraShift', params: { amount: a.amount }, tone: 'good' })
        return
      case 'treat':
        if (a.amount < 0) return blocked(a, 'blocked.invalidAmount')
        if (a.amount > 0) book({ kind: 'treat', amount: -a.amount, labelKey: a.labelKey, emoji: '🍜', ref: { type: 'action', id: a.id } })
        stress = clamp(stress + a.stressDelta, 0, 100)
        applied(a)
        currentLog.push({ day: d, emoji: '🍜', key: 'log.treat', params: { name: a.labelKey, amount: a.amount }, tone: 'neutral' })
        return
      case 'forecastViewed':
      case 'bridgeOptionsViewed':
      case 'askCopied':
      case 'rewind':
        applied(a)
        return
      case 'eventChoice':
      case 'scamResponse':
        return // handled in their own phases
    }
  }

  function payNow(p: ScheduledPayment, bill: Bill) {
    const before = balance
    book({ kind: 'bill', amount: -p.amount, labelKey: bill.nameKey, emoji: bill.emoji, ref: { type: 'bill', id: bill.id } })
    p.day = -1 // consumed
    currentLog.push({ day: currentDay(), emoji: bill.emoji, key: 'log.billDue', params: { name: bill.nameKey, amount: p.amount, before, after: balance, fee: 0 }, tone: balance < 0 ? 'bad' : 'neutral' })
  }

  function applyBridgeSideEffects(option: BridgeOption) {
    if (option.trust) bumpTrust(option.trust.who, option.trust.delta)
    if (option.privacy) privacy = clamp(privacy + option.privacy, 0, 100)
    for (const f of option.flags ?? []) setFlag(f)
  }

  /** Days the cash on hand (balance + jar) covers upcoming outgoings with no further income. Capped at 30. */
  function bufferDays(today: number): number {
    let running = balance + jar
    if (running < 0) return 0
    let count = 0
    for (let k = 1; k <= 30; k++) {
      const dayNum = today + k
      let due = 0
      if (dayNum <= scenario.days) {
        for (const p of payments) if (p.day === dayNum) due += p.amount + p.fee
        for (const r of repayments) if (r.day === dayNum) due += r.principal + r.fee
        for (const item of pending) if (item.day === dayNum && item.amount < 0) due += -item.amount
      } else {
        const nextMonthDay = dayNum - scenario.days
        for (const b of bills) if (b.dueDays.includes(nextMonthDay)) due += b.amount
        for (const r of recurring) if (r.monthsLeft > 0 && nextMonthDay === 1) due += r.amount
      }
      running -= due
      if (running < 0) break
      count++
    }
    return count
  }

  function summarise(): LedgerSummary {
    let totalIn = 0
    let totalOut = 0
    for (const day of days) {
      for (const e of day.entries) {
        if (e.kind === 'jar_in' || e.kind === 'jar_out') continue
        if (e.amount > 0) totalIn += e.amount
        else totalOut -= e.amount
      }
    }
    const obligations: Obligation[] = []
    for (const r of recurring) if (r.monthsLeft > 0) obligations.push({ labelKey: r.labelKey, amount: r.amount, remaining: r.amount * r.monthsLeft, perMonth: r.amount })
    for (const r of repayments) if (r.day > scenario.days) obligations.push({ labelKey: r.labelKey, amount: r.principal + r.fee, remaining: r.principal + r.fee })
    for (const s of scamDebts) obligations.push({ labelKey: s.labelKey, amount: s.principal, remaining: s.principal })
    for (const item of pending) if (item.day > scenario.days && item.amount < 0) obligations.push({ labelKey: item.labelKey, amount: -item.amount, remaining: -item.amount })
    const lastRecord = days[days.length - 1]
    return {
      shortfallDays: days.filter((x) => x.shortfall).length,
      lowestBalance: Math.min(...days.map((x) => x.balance)),
      endBalance: lastRecord ? lastRecord.balance : profile.startingBalance,
      gapCost: gapCost + scamLoss,
      scamLoss,
      totalIn,
      totalOut,
      obligationsAfterMonth: obligations,
      finalTrust: { ...trust },
      finalPrivacy: privacy,
      finalStress: stress,
      flags: [...flags],
      scamsFaced,
      scamsDefended,
      scamsFooled,
      shieldPoints,
      tellsSpotted: tellsSpottedTotal,
      privacyLeaked: privacy <= PRIVACY_LEAK_THRESHOLD,
    }
  }
}
