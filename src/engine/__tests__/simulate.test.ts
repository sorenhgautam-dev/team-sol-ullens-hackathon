import { describe, it, expect } from 'vitest'
import { simulate } from '../simulate'
import { forecast } from '../forecast'
import { BASELINE_SCENARIO, REPAIR_SCENARIO, DEMO_SCENARIO, DEMO_SEED } from '@/content/scenario'
import { SITA, AARAV, BIKASH } from '@/content/profiles'
import type { DecisionLog } from '../types'

const moveRent: DecisionLog = [{ id: 'a1', type: 'moveBill', day: 1, billId: 'rent', fromDay: 5, toDay: 21 }]
const moveRentAndSchool: DecisionLog = [
  ...moveRent,
  { id: 'a2', type: 'moveBill', day: 1, billId: 'school', fromDay: 10, toDay: 21 },
]
const repair: DecisionLog = [{ id: 'e1', type: 'eventChoice', day: 9, eventId: 'bike-repair', choiceId: 'repair' }]

describe('Section 3 table', () => {
  it('Aarav, no events → 0 shortfall days, lowest 9,300, end 9,300', () => {
    const s = simulate(BASELINE_SCENARIO, AARAV, [], DEMO_SEED).summary
    expect(s.shortfallDays).toBe(0)
    expect(s.lowestBalance).toBe(9_300)
    expect(s.endBalance).toBe(9_300)
  })

  it('Sita, no events → 15 shortfall days (5–19), lowest −11,700, end 9,300', () => {
    const l = simulate(BASELINE_SCENARIO, SITA, [], DEMO_SEED)
    expect(l.summary.shortfallDays).toBe(15)
    expect(l.summary.lowestBalance).toBe(-11_700)
    expect(l.summary.endBalance).toBe(9_300)
    const shortfallDayNumbers = l.days.filter((d) => d.shortfall).map((d) => d.day)
    expect(shortfallDayNumbers).toEqual(Array.from({ length: 15 }, (_, i) => i + 5))
  })

  it('Sita, rent moved to day 21 → 0 shortfall, lowest 300, end 9,300', () => {
    const l = simulate(BASELINE_SCENARIO, SITA, moveRent, DEMO_SEED)
    expect(l.summary.shortfallDays).toBe(0)
    expect(l.summary.lowestBalance).toBe(300)
    expect(l.summary.endBalance).toBe(9_300)
    expect(l.actionOutcomes[0]?.status).toBe('applied')
  })

  it('Sita + bike repair 3,500 day 9, rent moved → 5 shortfall, lowest −3,200, end 5,800', () => {
    const l = simulate(REPAIR_SCENARIO, SITA, [...moveRent, ...repair], DEMO_SEED)
    expect(l.summary.shortfallDays).toBe(5)
    expect(l.summary.lowestBalance).toBe(-3_200)
    expect(l.summary.endBalance).toBe(5_800)
  })

  it('Sita + repair, rent and school fee moved to day 21 → 0 shortfall, lowest 800, end 5,800', () => {
    const l = simulate(REPAIR_SCENARIO, SITA, [...moveRentAndSchool, ...repair], DEMO_SEED)
    expect(l.summary.shortfallDays).toBe(0)
    expect(l.summary.lowestBalance).toBe(800)
    expect(l.summary.endBalance).toBe(5_800)
  })
})

describe('engine invariants', () => {
  it('same inputs + seed → identical ledger', () => {
    const a = simulate(DEMO_SCENARIO, SITA, moveRent, 7)
    const b = simulate(DEMO_SCENARIO, SITA, moveRent, 7)
    expect(a).toEqual(b)
  })

  it('different seeds can change uncertain income (remittance delay) but never bills', () => {
    const seeds = Array.from({ length: 40 }, (_, i) => i + 1)
    const ledgers = seeds.map((s) => simulate(BASELINE_SCENARIO, SITA, [], s))
    const remitDays = new Set(
      ledgers.map((l) => l.days.find((d) => d.entries.some((e) => e.ref?.id === 'sita-remit'))?.day),
    )
    expect(remitDays.has(20)).toBe(true)
    expect(remitDays.has(23)).toBe(true)
    for (const l of ledgers) {
      expect(l.days[4]?.entries.filter((e) => e.kind === 'bill').map((e) => e.amount)).toEqual([-12_000])
    }
  })

  it('income is booked before bills on the same day', () => {
    const day1 = simulate(BASELINE_SCENARIO, SITA, [], DEMO_SEED).days[0]!
    expect(day1.entries[0]?.kind).toBe('income')
    expect(day1.entries[1]?.kind).toBe('bill')
    expect(day1.balance).toBe(11_000)
  })

  it('forecast equals actual when there are no decisions and no surprise events', () => {
    const actual = simulate(BASELINE_SCENARIO, SITA, [], DEMO_SEED)
    const fc = forecast(BASELINE_SCENARIO, SITA, [], DEMO_SEED)
    expect(fc.days.map((d) => d.balance)).toEqual(actual.days.map((d) => d.balance))
  })

  it('forecast hides unresolved surprise events but keeps foreseeable ones', () => {
    const fc = forecast(DEMO_SCENARIO, SITA, [], DEMO_SEED)
    const day9 = fc.days[8]!
    expect(day9.events).toEqual([])
    const day13 = fc.days[12]!
    expect(day13.events.map((e) => e.eventId)).toEqual(['wedding-gift'])
  })

  it('events use the default choice when undecided, and the logged choice when decided', () => {
    const undecided = simulate(REPAIR_SCENARIO, SITA, [], DEMO_SEED)
    expect(undecided.days[8]?.events[0]).toEqual({ eventId: 'bike-repair', choiceId: 'repair', decided: false })
    const bus: DecisionLog = [{ id: 'e1', type: 'eventChoice', day: 9, eventId: 'bike-repair', choiceId: 'bus' }]
    const decided = simulate(REPAIR_SCENARIO, SITA, bus, DEMO_SEED)
    expect(decided.days[8]?.events[0]).toEqual({ eventId: 'bike-repair', choiceId: 'bus', decided: true })
    expect(decided.summary.endBalance).toBe(9_300 - 600)
  })

  it('moving a bill is blocked when landlord trust is below 3 hearts', () => {
    const lowTrust = { ...SITA, trust: { ...SITA.trust, landlord: 2 } }
    const l = simulate(BASELINE_SCENARIO, lowTrust, moveRent, DEMO_SEED)
    expect(l.actionOutcomes[0]).toMatchObject({ status: 'blocked', reasonKey: 'blocked.trustTooLow' })
    expect(l.summary.shortfallDays).toBe(15)
  })

  it('moving a bill is blocked after it was already paid', () => {
    const late: DecisionLog = [{ id: 'a1', type: 'moveBill', day: 6, billId: 'rent', fromDay: 5, toDay: 21 }]
    const l = simulate(BASELINE_SCENARIO, SITA, late, DEMO_SEED)
    expect(l.actionOutcomes[0]).toMatchObject({ status: 'blocked', reasonKey: 'blocked.alreadyPaid' })
  })

  it('never moves a "no" bill', () => {
    const l = simulate(BASELINE_SCENARIO, SITA, [{ id: 'x', type: 'moveBill', day: 1, billId: 'groceries', fromDay: 8, toDay: 21 }], DEMO_SEED)
    expect(l.actionOutcomes[0]).toMatchObject({ status: 'blocked', reasonKey: 'blocked.notFlexible' })
  })

  it('splitting rent into day 5 and 21 costs the NPR 200 fee and counts toward Gap Cost', () => {
    const split: DecisionLog = [{ id: 's1', type: 'splitBill', day: 1, billId: 'rent', fromDay: 5, days: [5, 21], fee: 200 }]
    const l = simulate(BASELINE_SCENARIO, SITA, split, DEMO_SEED)
    expect(l.days[4]?.entries.filter((e) => e.kind === 'bill').map((e) => e.amount)).toEqual([-6_000])
    expect(l.days[20]?.entries.filter((e) => e.kind === 'bill').map((e) => e.amount)).toEqual([-6_000])
    expect(l.summary.gapCost).toBe(200)
    expect(l.summary.endBalance).toBe(9_100)
  })

  it('a stray decision for an event that never fires is marked blocked', () => {
    const l = simulate(BASELINE_SCENARIO, SITA, repair, DEMO_SEED)
    expect(l.actionOutcomes[0]).toMatchObject({ status: 'blocked', reasonKey: 'blocked.eventDidNotHappen' })
  })

  it('Bikash gig income is seeded and varies by day but is deterministic', () => {
    const a = simulate(BASELINE_SCENARIO, BIKASH, [], 3)
    const b = simulate(BASELINE_SCENARIO, BIKASH, [], 3)
    expect(a.summary).toEqual(b.summary)
    const incomes = a.days.map((d) => d.entries.find((e) => e.kind === 'income')?.amount ?? 0)
    expect(new Set(incomes).size).toBeGreaterThan(3)
    expect(incomes.some((x) => x === 0)).toBe(true)
  })

  it('throughDay truncates the ledger', () => {
    const l = simulate(BASELINE_SCENARIO, SITA, [], DEMO_SEED, { throughDay: 7 })
    expect(l.days).toHaveLength(7)
  })
})
