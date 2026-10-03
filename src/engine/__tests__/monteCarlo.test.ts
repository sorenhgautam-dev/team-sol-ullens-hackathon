import { describe, it, expect } from 'vitest'
import { monteCarlo } from '../monteCarlo'
import { BASELINE_SCENARIO, DEMO_SEED } from '@/content/scenario'
import { SITA, BIKASH, AARAV } from '@/content/profiles'

describe('Monte Carlo forecast', () => {
  it('a fixed master seed gives identical bands', () => {
    const a = monteCarlo(BASELINE_SCENARIO, SITA, [], DEMO_SEED, 200)
    const b = monteCarlo(BASELINE_SCENARIO, SITA, [], DEMO_SEED, 200)
    expect(a).toEqual(b)
  })
  it('only uncertain events vary: Aarav\'s band is flat, Sita\'s splits around the remittance', () => {
    const aarav = monteCarlo(BASELINE_SCENARIO, AARAV, [], DEMO_SEED, 100)
    expect(aarav.bands.every((b) => b.p10 === b.p90)).toBe(true)
    const sita = monteCarlo(BASELINE_SCENARIO, SITA, [], DEMO_SEED, 300)
    expect(sita.bands[19]!.p10).toBe(-11_700)
    expect(sita.bands[19]!.p90).toBe(13_300)
    expect(sita.bands[29]!.p10).toBe(9_300)
    expect(sita.shortfallDays.p10).toBe(15)
    expect(sita.shortfallDays.p90).toBe(18)
  })
  it('runs 500 gig-income simulations quickly', () => {
    const t0 = performance.now()
    const r = monteCarlo(BASELINE_SCENARIO, BIKASH, [], DEMO_SEED, 500)
    expect(performance.now() - t0).toBeLessThan(1_500)
    expect(r.runs).toBe(500)
    expect(r.bands[29]!.p10).toBeLessThan(r.bands[29]!.p90)
  })
})
