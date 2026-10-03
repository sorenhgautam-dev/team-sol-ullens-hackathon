import { describe, it, expect } from 'vitest'
import { simulate, quoteBridge } from '../simulate'
import { describeGap, forecast } from '../forecast'
import { BASELINE_SCENARIO, DEMO_SEED } from '@/content/scenario'
import { BRIDGES_BY_ID } from '@/content/bridges'
import { SITA, AARAV } from '@/content/profiles'
import type { DecisionLog } from '../types'

const GAP = 11_700

describe('Gap Bridge quotes (Section 4.4, NPR 11,700 over 15 days)', () => {
  const q = (id: string) => quoteBridge(BRIDGES_BY_ID[id]!, GAP, 5, 20).fee
  it('pay rent late costs 1,000', () => expect(q('late_rent')).toBe(1_000))
  it('instant loan app costs 1,170 (10% flat)', () => expect(quoteBridge(BRIDGES_BY_ID['loan_app']!, GAP, 5, 19).fee).toBe(1_170))
  it('card cash advance costs ~470 (3% + 2%/month)', () => expect(q('card_advance')).toBeGreaterThanOrEqual(460))
  it('informal moneylender costs ~290 (5%/month)', () => expect(Math.abs(q('moneylender') - 290)).toBeLessThanOrEqual(5))
  it('delaying the school fee costs 400', () => expect(q('delay_school')).toBe(400))
  it('family costs nothing in money', () => expect(q('family')).toBe(0))
})

describe('Gap Bridge in the ledger', () => {
  it('describes Sita\'s gap from the forecast', () => {
    const g = describeGap(forecast(BASELINE_SCENARIO, SITA, [], DEMO_SEED))
    expect(g).toEqual({ deepest: -11_700, firstDay: 5, lastDay: 19, shortfallDays: 15, amountNeeded: 11_700 })
  })

  it('a loan app bridge covers the bills, but the 14-day term matures before payday and the shortfall days still count', () => {
    const log: DecisionLog = [{ id: 'b1', type: 'bridge', day: 4, optionId: 'loan_app', amount: GAP }]
    const l = simulate(BASELINE_SCENARIO, SITA, log, DEMO_SEED)
    expect(l.days.slice(0, 17).every((d) => d.balance >= 0)).toBe(true)
    expect(l.days[17]?.balance).toBe(-12_870) // repayment lands two days before the remittance
    expect(l.summary.shortfallDays).toBe(15)
    expect(l.summary.gapCost).toBe(1_170)
    expect(l.summary.endBalance).toBe(9_300 - 1_170)
    expect(l.summary.finalPrivacy).toBe(70)
    expect(l.summary.flags).toContain('loanApp')
    // repaid on day 18 (4 + 14)
    expect(l.days[17]?.entries.some((e) => e.kind === 'bridge_repay' && e.amount === -GAP)).toBe(true)
  })

  it('paying rent late defers the bill to payday, charges 1,000 and costs a landlord heart', () => {
    const log: DecisionLog = [{ id: 'b1', type: 'bridge', day: 1, optionId: 'late_rent', amount: 0 + 12_000 }]
    const l = simulate(BASELINE_SCENARIO, SITA, log, DEMO_SEED)
    expect(l.days[4]?.entries.filter((e) => e.kind === 'bill')).toEqual([])
    expect(l.days[4]?.shortfall).toBe(true) // the gap existed even though rent was paid later
    expect(l.days[19]?.entries.filter((e) => e.kind === 'bill').map((e) => e.amount)).toEqual([-12_000])
    expect(l.summary.gapCost).toBe(1_000)
    expect(l.summary.endBalance).toBe(8_300)
    expect(l.summary.finalTrust.landlord).toBe(2)
  })

  it('borrowing from family costs no money but one family heart, repaid on payday', () => {
    const log: DecisionLog = [{ id: 'b1', type: 'bridge', day: 4, optionId: 'family', amount: GAP }]
    const l = simulate(BASELINE_SCENARIO, SITA, log, DEMO_SEED)
    expect(l.summary.gapCost).toBe(0)
    expect(l.summary.endBalance).toBe(9_300)
    expect(l.summary.finalTrust.family).toBe(3)
    expect(l.days[19]?.entries.some((e) => e.kind === 'bridge_repay')).toBe(true)
  })

  it('card cash advance is blocked without formal credit, allowed for Aarav', () => {
    const log: DecisionLog = [{ id: 'b1', type: 'bridge', day: 4, optionId: 'card_advance', amount: 1_000 }]
    expect(simulate(BASELINE_SCENARIO, SITA, log, DEMO_SEED).actionOutcomes[0]).toMatchObject({ status: 'blocked', reasonKey: 'blocked.noFormalCredit' })
    expect(simulate(BASELINE_SCENARIO, AARAV, log, DEMO_SEED).actionOutcomes[0]).toMatchObject({ status: 'applied' })
  })

  it('emergency jar: deposits and withdrawals never change total money, buffer days include the jar', () => {
    const log: DecisionLog = [
      { id: 'j1', type: 'jarDeposit', day: 1, amount: 2_000 },
      { id: 'j2', type: 'jarWithdraw', day: 3, amount: 500 },
      { id: 'j3', type: 'jarWithdraw', day: 4, amount: 5_000 },
    ]
    const l = simulate(BASELINE_SCENARIO, AARAV, log, DEMO_SEED)
    expect(l.days[0]?.jar).toBe(2_000)
    expect(l.days[2]?.jar).toBe(1_500)
    expect(l.actionOutcomes[2]).toMatchObject({ status: 'blocked', reasonKey: 'blocked.insufficientJar' })
    expect(l.summary.endBalance + 1_500).toBe(9_300)
  })
})
