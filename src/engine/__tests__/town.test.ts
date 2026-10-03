import { describe, it, expect } from 'vitest'
import { createTown, simulateTown, stepTown, wardLedger, DEFAULT_MODS, townMeters, townOutlook, type TownAction } from '../town'
import { scamGrowth, spreadScams } from '../spread'
import { simulate } from '../simulate'
import { WARDS, WARDS_BY_ID } from '@/content/wards'
import { BASELINE_SCENARIO, DEMO_SEED } from '@/content/scenario'
import { SITA } from '@/content/profiles'

const turns: TownAction[][] = [[{ type: 'deploy', initiativeId: 'theatre', wardId: 'buspark' }], [], [{ type: 'deploy', initiativeId: 'hotline' }], [], [], []]

describe('Town engine', () => {
  it('same seed + same initiatives → identical town state', () => {
    const a = simulateTown(7, turns, { demoOutbreak: true })
    const b = simulateTown(7, turns, { demoOutbreak: true })
    expect(a).toEqual(b)
    expect(a.week).toBe(7)
  })
  it('spread only reaches adjacent wards', () => {
    const levels = Object.fromEntries(WARDS.map((w) => [w.id, 0]))
    levels['riverside'] = 80
    const after = spreadScams(levels, WARDS)
    const neighbours = new Set(WARDS_BY_ID['riverside']!.neighbors)
    for (const w of WARDS) {
      if (w.id === 'riverside') expect(after[w.id]).toBe(80)
      else if (neighbours.has(w.id)) expect(after[w.id]).toBeCloseTo(6)
      else expect(after[w.id]).toBe(0)
    }
    expect(neighbours.size).toBeGreaterThan(0)
    expect(neighbours.size).toBeLessThan(WARDS.length - 1)
  })
  it('scam growth increases with shortfall rate and falls with defense', () => {
    expect(scamGrowth(0.8, 0)).toBeGreaterThan(scamGrowth(0.2, 0))
    expect(scamGrowth(0.5, 0.3)).toBeLessThan(scamGrowth(0.5, 0))
  })
  it("Riverside's archetype matches Sita's ledger", () => {
    const l = wardLedger(WARDS_BY_ID['riverside']!, DEFAULT_MODS, 0, DEMO_SEED)
    expect(l.summary).toEqual(simulate(BASELINE_SCENARIO, SITA, [], DEMO_SEED).summary)
  })
  it('initiatives cost budget, take time, and the hotline raises defense town-wide', () => {
    let s = createTown(3)
    s = stepTown(s, [{ type: 'deploy', initiativeId: 'hotline' }])
    expect(s.budget).toBe(500_000 - 80_000)
    expect(s.hotline).toBe(false)
    s = stepTown(s, [])
    expect(s.hotline).toBe(false) // week 2: still deploying
    s = stepTown(s, [])
    expect(s.hotline).toBe(true) // ready during week 3
    expect(s.wards.every((w) => w.defense >= 0.2)).toBe(true)
  })
  it('payday alignment only works in the three employer wards', () => {
    let s = createTown(3)
    s = stepTown(s, [{ type: 'deploy', initiativeId: 'payday', wardId: 'riverside' }])
    expect(s.budget).toBe(500_000)
    expect(s.log.some((l) => l.key === 'tlog.notAllowed')).toBe(true)
  })
  it('meters and outlook are well-formed', () => {
    const s = simulateTown(11, [[], [], []], { demoOutbreak: true })
    const m = townMeters(s)
    expect(m.stability).toBeGreaterThanOrEqual(0)
    expect(m.stability).toBeLessThanOrEqual(100)
    const o = townOutlook(s, 4, 40)
    expect(o.p10).toBeLessThanOrEqual(o.p50)
    expect(o.p50).toBeLessThanOrEqual(o.p90)
  })
})
