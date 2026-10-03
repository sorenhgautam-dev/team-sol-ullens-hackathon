import { describe, it, expect } from 'vitest'
import { findShifts, evaluate, type RealInputs } from '../shiftFinder'

const SITA_REAL: RealInputs = {
  startingCash: 3_000,
  incomes: [
    { id: 'work', label: 'Tailoring', day: 1, amount: 10_000 },
    { id: 'remit', label: 'Remittance', day: 20, amount: 25_000 },
  ],
  bills: [
    { id: 'rent', label: 'Rent', amount: 12_000, dueDay: 5, flexible: 'maybe' },
    { id: 'school', label: 'School fee', amount: 4_000, dueDay: 10, flexible: 'maybe' },
    { id: 'electricity', label: 'Electricity', amount: 1_500, dueDay: 12, flexible: 'yes' },
    { id: 'internet', label: 'Internet', amount: 1_200, dueDay: 15, flexible: 'yes' },
    { id: 'groceries', label: 'Groceries', amount: 2_000, dueDay: 1, flexible: 'no' },
    { id: 'groceries2', label: 'Groceries', amount: 2_000, dueDay: 8, flexible: 'no' },
    { id: 'groceries3', label: 'Groceries', amount: 2_000, dueDay: 15, flexible: 'no' },
    { id: 'groceries4', label: 'Groceries', amount: 2_000, dueDay: 22, flexible: 'no' },
  ],
}

describe('Shift Finder', () => {
  it('reproduces Sita\'s baseline over 60 days', () => {
    const base = evaluate(SITA_REAL)
    expect(base.balances).toHaveLength(60)
    expect(base.shortfallDays).toBeGreaterThan(0)
    expect(base.deepest).toBe(-11_700)
  })
  it('never moves "No" bills and finds rent → day 21 for Sita', () => {
    const t0 = performance.now()
    const r = findShifts(SITA_REAL)
    expect(performance.now() - t0).toBeLessThan(1_000)
    expect(r.suggestions.length).toBeGreaterThan(0)
    for (const s of r.suggestions) for (const c of s.changes) expect(c.billId.startsWith('groceries')).toBe(false)
    const top = r.suggestions[0]!
    expect(top.changes).toEqual([{ type: 'move', billId: 'rent', fromDay: 5, toDay: 21 }])
    expect(top.shortfallDays).toBe(0)
  })
  it('"They said no" re-ranks without that bill', () => {
    const r = findShifts(SITA_REAL, { excludeBillIds: ['rent'] })
    for (const s of r.suggestions) for (const c of s.changes) expect(c.billId).not.toBe('rent')
    expect(r.suggestions[0]!.shortfallDays).toBeLessThan(evaluate(SITA_REAL).shortfallDays)
  })
  it('with an irregular remittance, picks a date that also survives a 3-day delay', () => {
    const inputs: RealInputs = { ...SITA_REAL, incomes: SITA_REAL.incomes.map((i) => (i.id === 'remit' ? { ...i, irregular: true } : i)) }
    const r = findShifts(inputs)
    const top = r.suggestions[0]!
    // Groceries on the 22nd land before a late (day 23) remittance, so rent alone cannot be fully safe:
    // the best plan moves rent past the late date and shifts one more flexible bill.
    const rentMove = top.changes.find((c) => c.billId === 'rent')
    expect(rentMove?.type).toBe('move')
    expect(rentMove && rentMove.type === 'move' ? rentMove.toDay : 0).toBeGreaterThanOrEqual(23) // on or after the late remittance day
    expect(top.shortfallDays).toBe(0)
    expect(top.delayed?.shortfallDays).toBe(0)
    // A plain rent move still works when income is on time, and is offered when it is the best single change.
    expect(findShifts(SITA_REAL).suggestions[0]!.changes).toEqual([{ type: 'move', billId: 'rent', fromDay: 5, toDay: 21 }])
  })
  it('returns no suggestions when there is nothing to fix', () => {
    const r = findShifts({ ...SITA_REAL, startingCash: 50_000 })
    expect(r.baseline.shortfallDays).toBe(0)
    expect(r.suggestions).toEqual([])
  })
})
