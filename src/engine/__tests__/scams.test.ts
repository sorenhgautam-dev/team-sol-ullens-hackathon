import { describe, it, expect } from 'vitest'
import { simulate } from '../simulate'
import { forecast } from '../forecast'
import { shieldGrade } from '../score'
import { SCAM_SCENARIO, DEMO_SCENARIO, BASELINE_SCENARIO, DEMO_SEED } from '@/content/scenario'
import { SCAMS } from '@/content/enemies'
import { SITA, AARAV } from '@/content/profiles'
import type { DecisionLog, ScamResponse } from '../types'

const respond = (scamId: string, response: ScamResponse, day: number, tells = 0): DecisionLog => [
  { id: `s-${scamId}`, type: 'scamResponse', day, scamId, response, tellsSpotted: tells },
]
const fireDay = (scamId: string, decisions: DecisionLog = [], scenario = SCAM_SCENARIO) =>
  simulate(scenario, SITA, decisions, DEMO_SEED).days.find((d) => d.scams.some((s) => s.scamId === scamId))?.day

describe('Scam Squad triggers (Sita, demo seed)', () => {
  it('the Phisher appears the day the balance first goes negative (day 5)', () => expect(fireDay('phisher')).toBe(5))
  it('the Loan Shark App appears as soon as the forecast shows a gap (day 2)', () => expect(fireDay('loan_shark')).toBe(2))
  it('the Loan Shark App never appears once rent is moved after payday', () => {
    const moved: DecisionLog = [{ id: 'm', type: 'moveBill', day: 1, billId: 'rent', fromDay: 5, toDay: 21 }]
    expect(fireDay('loan_shark', moved)).toBeUndefined()
    expect(fireDay('phisher', moved)).toBeUndefined()
  })
  it('the Impersonator appears on a seeded day between 17 and 19', () => {
    const d = fireDay('impersonator')!
    expect(d).toBeGreaterThanOrEqual(17)
    expect(d).toBeLessThanOrEqual(19)
  })
  it('the OTP Snatcher calls on payday (remittance, day 20)', () => expect(fireDay('otp_snatcher')).toBe(20))
  it('the Fine Print follows a loan app bridge the next day, otherwise day 6', () => {
    expect(fireDay('fine_print')).toBe(6)
    const loan: DecisionLog = [{ id: 'b', type: 'bridge', day: 2, optionId: 'loan_app', amount: 11_700 }]
    expect(fireDay('fine_print', loan)).toBe(3)
  })
  it('the Prize Ghost haunts the festival (day 25) only when the festival exists', () => {
    expect(fireDay('prize_ghost')).toBeUndefined()
    expect(fireDay('prize_ghost', [], DEMO_SCENARIO)).toBe(25)
  })
  it('the Job Recruiter writes on day 14 and the Investment Guru two days after the remittance', () => {
    expect(fireDay('job_recruiter')).toBe(14)
    expect(fireDay('investment_guru')).toBe(22)
  })
  it('decoys arrive on their days', () => {
    expect(fireDay('bank_notice')).toBe(7)
    expect(fireDay('partner_real')).toBe(18)
  })
  it('every scammer fires at most once and the forecast never shows scammers', () => {
    const l = simulate(DEMO_SCENARIO, SITA, [], DEMO_SEED)
    const ids = l.days.flatMap((d) => d.scams.map((s) => s.scamId))
    expect(new Set(ids).size).toBe(ids.length)
    expect(forecast(DEMO_SCENARIO, SITA, [], DEMO_SEED).days.every((d) => d.scams.length === 0)).toBe(true)
  })
})

describe('Scam outcomes', () => {
  it('each scammer\'s loss is subtracted from the balance and added to Gap Cost', () => {
    for (const scam of SCAMS.filter((s) => !s.decoy && s.comply.loss > 0)) {
      const scenario = scam.id === 'prize_ghost' ? DEMO_SCENARIO : SCAM_SCENARIO
      const day = fireDay(scam.id, [], scenario)!
      const base = simulate(scenario, SITA, [], DEMO_SEED)
      const fooled = simulate(scenario, SITA, respond(scam.id, 'comply', day), DEMO_SEED)
      expect(fooled.summary.scamLoss, scam.id).toBeGreaterThanOrEqual(scam.comply.loss)
      expect(fooled.summary.gapCost - base.summary.gapCost, scam.id).toBe(fooled.summary.scamLoss)
      expect(fooled.days[day - 1]!.balance, scam.id).toBe(base.days[day - 1]!.balance - scam.comply.loss)
      expect(fooled.days[day - 1]!.scams[0]).toMatchObject({ outcome: 'scammed', loss: scam.comply.loss })
    }
  })

  it('the Loan Shark App pays out 15,000, then charges 1,500 every week and leaves a debt', () => {
    const l = simulate(SCAM_SCENARIO, SITA, respond('loan_shark', 'comply', 2), DEMO_SEED)
    expect(l.days[1]!.entries.some((e) => e.kind === 'scam_cash' && e.amount === 15_000)).toBe(true)
    expect(l.summary.scamLoss).toBe(1_500 * 4) // days 9, 16, 23, 30
    expect(l.summary.obligationsAfterMonth.some((o) => o.remaining === 15_000)).toBe(true)
    expect(l.summary.shortfallDays).toBe(15) // judged pre-bridge: the gap was real
    expect(l.summary.flags).toContain('loanSharkDebt')
  })

  it('the Fine Print\'s hidden fee appears a week later', () => {
    const l = simulate(SCAM_SCENARIO, SITA, respond('fine_print', 'comply', 6), DEMO_SEED)
    expect(l.days[5]!.entries.filter((e) => e.kind === 'scam_loss')).toEqual([])
    expect(l.days[12]!.entries.some((e) => e.kind === 'scam_loss' && e.amount === -1_200)).toBe(true)
    expect(l.summary.scamLoss).toBe(1_200)
  })

  it('verify / wait / block / ask defend, earn Shield points, and tells add bonus points', () => {
    const points: Record<string, number> = {}
    for (const r of ['verify', 'wait', 'block', 'ask'] as const) {
      const l = simulate(SCAM_SCENARIO, SITA, respond('phisher', r, 5, 2), DEMO_SEED)
      const rec = l.days[4]!.scams[0]!
      expect(rec.outcome).toBe('defended')
      expect(l.summary.scamLoss).toBe(0)
      points[r] = rec.shieldPoints
    }
    expect(points).toEqual({ verify: 5, wait: 5, block: 4, ask: 4 })
  })

  it('decoys cost nothing whatever the player does, and never count as scams faced', () => {
    for (const r of ['comply', 'block', 'verify'] as const) {
      const l = simulate(SCAM_SCENARIO, SITA, respond('bank_notice', r, 7), DEMO_SEED)
      expect(l.days[6]!.scams[0]).toMatchObject({ outcome: 'real', loss: 0 })
      expect(l.summary.scamsFaced).toBe(0)
      expect(l.summary.endBalance).toBe(9_300)
    }
  })

  it('a Privacy leak personalises the next scam (Data Leak combo)', () => {
    const calm = simulate(SCAM_SCENARIO, SITA, [], DEMO_SEED)
    expect(calm.days.flatMap((d) => d.scams).every((s) => !s.personalized)).toBe(true)
    const leaked = simulate(SCAM_SCENARIO, SITA, respond('phisher', 'comply', 5), DEMO_SEED)
    expect(leaked.summary.privacyLeaked).toBe(true)
    const impersonator = leaked.days.flatMap((d) => d.scams).find((s) => s.scamId === 'impersonator')!
    expect(impersonator.personalized).toBe(true)
  })

  it('undecided scams stay pending in the live ledger and resolve with autoScamResponse in auto-play', () => {
    const live = simulate(SCAM_SCENARIO, SITA, [], DEMO_SEED)
    expect(live.days[4]!.scams[0]!.outcome).toBe('pending')
    expect(live.summary.scamsFaced).toBe(0)
    const auto = simulate(SCAM_SCENARIO, SITA, [], DEMO_SEED, { autoScamResponse: 'wait' })
    expect(auto.days[4]!.scams[0]!.outcome).toBe('defended')
    expect(auto.summary.scamsFaced).toBeGreaterThan(0)
  })

  it('a response to a scam that never appeared is blocked', () => {
    const l = simulate(BASELINE_SCENARIO, SITA, respond('phisher', 'block', 5), DEMO_SEED)
    expect(l.actionOutcomes[0]).toMatchObject({ status: 'blocked', reasonKey: 'blocked.scamDidNotHappen' })
  })

  it('Shield grade: S for all defended with tells, A all defended, D when mostly fooled; A when none faced', () => {
    const allDefended: DecisionLog = SCAMS.filter((s) => !s.decoy).flatMap((s) => {
      const d = fireDay(s.id, [], DEMO_SCENARIO)
      return d ? respond(s.id, 'verify', d, 3) : []
    })
    const s1 = simulate(DEMO_SCENARIO, SITA, allDefended, DEMO_SEED).summary
    expect(shieldGrade(s1)).toBe('S')
    const noTells = allDefended.map((a) => (a.type === 'scamResponse' ? { ...a, tellsSpotted: 0 } : a))
    expect(shieldGrade(simulate(DEMO_SCENARIO, SITA, noTells, DEMO_SEED).summary)).toBe('A')
    const fooled = allDefended.map((a) => (a.type === 'scamResponse' ? { ...a, response: 'comply' as const } : a))
    expect(shieldGrade(simulate(DEMO_SCENARIO, SITA, fooled, DEMO_SEED).summary)).toBe('D')
    expect(shieldGrade(simulate(BASELINE_SCENARIO, AARAV, [], DEMO_SEED).summary)).toBe('A')
  })
})
