import { describe, it, expect } from 'vitest'
import { mulberry32, subRng, hashString } from '../rng'

describe('rng', () => {
  it('is deterministic', () => {
    const a = mulberry32(123), b = mulberry32(123)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
  it('stays in [0,1)', () => {
    const r = mulberry32(9)
    for (let i = 0; i < 1000; i++) { const x = r(); expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThan(1) }
  })
  it('sub-streams are independent of each other', () => {
    expect(subRng(1, 'a')()).not.toBe(subRng(1, 'b')())
    expect(hashString('remit')).toBe(hashString('remit'))
  })
})
