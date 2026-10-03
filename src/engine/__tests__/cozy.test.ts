import { describe, it, expect } from 'vitest'
import { sproutStage, dayFace, timeOfDay } from '../cozy'
import { ENERGY_PER_DAY, energyCost, refillEnergy, spendEnergy } from '@/state/energy'
import { simulate } from '../simulate'
import { BASELINE_SCENARIO, DEMO_SEED } from '@/content/scenario'
import { SITA } from '@/content/profiles'

describe('Savings Sprout', () => {
  it('stage matches Buffer Days thresholds', () => {
    expect(sproutStage(0)).toBe(0)
    expect(sproutStage(1)).toBe(1)
    expect(sproutStage(3)).toBe(1)
    expect(sproutStage(4)).toBe(2)
    expect(sproutStage(6)).toBe(2)
    expect(sproutStage(7)).toBe(3)
    expect(sproutStage(30)).toBe(3)
  })
  it('calendar faces follow the balance', () => {
    expect(dayFace(-1)).toBe('😟')
    expect(dayFace(500)).toBe('😐')
    expect(dayFace(5_000)).toBe('😊')
  })
  it('time of day follows energy', () => {
    expect(timeOfDay(3)).toBe(0)
    expect(timeOfDay(0)).toBe(3)
  })
})

describe('Energy', () => {
  it('never goes below 0 and refuses instead', () => {
    expect(spendEnergy(1, 2)).toEqual({ ok: false, energy: 1 })
    expect(spendEnergy(0, 1)).toEqual({ ok: false, energy: 0 })
    expect(spendEnergy(3, 2)).toEqual({ ok: true, energy: 1 })
  })
  it('refills to 3 each day', () => {
    expect(ENERGY_PER_DAY).toBe(3)
    expect(refillEnergy()).toBe(3)
  })
  it('verify, wait and block cost 0 energy; levers and shifts cost energy', () => {
    expect(energyCost('verify')).toBe(0)
    expect(energyCost('wait')).toBe(0)
    expect(energyCost('block')).toBe(0)
    expect(energyCost('moveBill')).toBe(1)
    expect(energyCost('extraShift')).toBe(2)
    expect(energyCost('sellItem')).toBe(1)
  })
  it('never changes the ledger (the engine has no energy input)', () => {
    const a = simulate(BASELINE_SCENARIO, SITA, [], DEMO_SEED)
    spendEnergy(3, 3)
    const b = simulate(BASELINE_SCENARIO, SITA, [], DEMO_SEED)
    expect(a).toEqual(b)
    expect(simulate.length).toBeLessThanOrEqual(5)
  })
})
