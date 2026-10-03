import { describe, it, expect } from 'vitest'
import { stabilityScore } from '../score'
import { simulate } from '../simulate'
import { BASELINE_SCENARIO, DEMO_SEED } from '@/content/scenario'
import { AARAV, SITA } from '@/content/profiles'

describe('Stability Score', () => {
  it('is 100 for Aarav with no events', () => {
    const l = simulate(BASELINE_SCENARIO, AARAV, [], DEMO_SEED)
    expect(stabilityScore(l.summary).total).toBe(100)
  })
  it('penalises Sita\'s 15 shortfall days', () => {
    const l = simulate(BASELINE_SCENARIO, SITA, [], DEMO_SEED)
    const s = stabilityScore(l.summary)
    expect(s.shortfall).toBe(20)
    expect(s.balance).toBe(30)
    expect(s.gap).toBe(30)
    expect(s.total).toBe(80)
  })
})
