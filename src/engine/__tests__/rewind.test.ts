import { describe, it, expect } from 'vitest'
import { rewind, alternativesFor } from '../rewind'
import { whatIfCards } from '../whatIf'
import { capabilityReport } from '../capability'
import { simulate } from '../simulate'
import { REPAIR_SCENARIO, DEMO_SCENARIO, BASELINE_SCENARIO, DEMO_SEED, DELAYED_SEED } from '@/content/scenario'
import { SITA } from '@/content/profiles'
import type { DecisionLog } from '../types'

const month: DecisionLog = [
  { id: 'f1', type: 'forecastViewed', day: 1 },
  { id: 'b1', type: 'bridge', day: 2, optionId: 'loan_app', amount: 11_700 },
  { id: 'e1', type: 'eventChoice', day: 9, eventId: 'bike-repair', choiceId: 'repair' },
  { id: 'j1', type: 'jarDeposit', day: 21, amount: 1_000 },
]

describe('Month Rewind', () => {
  it('changing one decision keeps all later decisions identical', () => {
    const r = rewind(REPAIR_SCENARIO, SITA, month, DEMO_SEED, 'b1', { id: 'b1', type: 'bridge', day: 2, optionId: 'family', amount: 11_700 })
    expect(r.decisions.map((a) => a.id)).toEqual(['f1', 'b1', 'e1', 'j1'])
    expect(r.rewound.actionOutcomes.filter((o) => o.status === 'applied').map((o) => o.actionId)).toEqual(['f1', 'b1', 'e1', 'j1'])
    expect(r.blocked).toEqual([])
    expect(r.delta.gapCost).toBe(-1_170)
    expect(r.delta.endBalance).toBe(1_170)
  })

  it('later decisions that become impossible are marked Blocked', () => {
    const log: DecisionLog = [
      { id: 'm1', type: 'moveBill', day: 1, billId: 'rent', fromDay: 5, toDay: 21 },
      { id: 'j1', type: 'jarDeposit', day: 2, amount: 10_000 },
    ]
    const r = rewind(BASELINE_SCENARIO, SITA, log, DEMO_SEED, 'm1', null)
    expect(r.decisions.map((a) => a.id)).toEqual(['j1'])
    // Without the rent move the jar deposit still works on day 2 (balance 11,000), so nothing is blocked…
    expect(r.blocked).toEqual([])
    // …but a deposit on day 6 would be impossible after rent hits.
    const late: DecisionLog = [log[0]!, { id: 'j2', type: 'jarDeposit', day: 6, amount: 5_000 }]
    const r2 = rewind(BASELINE_SCENARIO, SITA, late, DEMO_SEED, 'm1', null)
    expect(r2.blocked.map((o) => o.actionId)).toEqual(['j2'])
    expect(r2.blocked[0]?.reasonKey).toBe('blocked.insufficientBalance')
  })

  it('the world is seed-locked: the rewound month uses the same seed', () => {
    const r = rewind(REPAIR_SCENARIO, SITA, month, DEMO_SEED, 'e1', { id: 'e1', type: 'eventChoice', day: 9, eventId: 'bike-repair', choiceId: 'bus' })
    expect(r.rewound.seed).toBe(DEMO_SEED)
    expect(r.delta.endBalance).toBe(3_500 - 600)
  })

  it('offers alternatives for events, bridges and scam responses', () => {
    expect(alternativesFor(month[2]!, REPAIR_SCENARIO).map((a) => (a.type === 'eventChoice' ? a.choiceId : ''))).toEqual(['replace', 'bus'])
    expect(alternativesFor(month[1]!, REPAIR_SCENARIO)).toHaveLength(5)
    expect(alternativesFor(month[0]!, REPAIR_SCENARIO)).toEqual([])
  })
})

describe('What-If cards', () => {
  it('tells Sita that moving rent to day 21 would have removed 10 shortfall days', () => {
    const cards = whatIfCards(REPAIR_SCENARIO, SITA, month, DEMO_SEED)
    const move = cards.find((c) => c.id === 'move-rent')!
    expect(move.label).toBe('yourChoice')
    expect(move.delta.shortfallDays).toBe(-10)
  })
  it('marks the bike breakdown as not your fault', () => {
    const cards = whatIfCards(REPAIR_SCENARIO, SITA, month, DEMO_SEED)
    const noRepair = cards.find((c) => c.id === 'no-bike-repair')!
    expect(noRepair.label).toBe('notYourFault')
    expect(noRepair.delta.endBalance).toBe(3_500)
  })
  it('offers the on-time remittance card only when the remittance was delayed', () => {
    expect(whatIfCards(BASELINE_SCENARIO, SITA, [], DEMO_SEED).some((c) => c.id === 'on-time')).toBe(false)
    const delayed = simulate(BASELINE_SCENARIO, SITA, [], DELAYED_SEED)
    expect(delayed.summary.shortfallDays).toBe(18)
    const card = whatIfCards(BASELINE_SCENARIO, SITA, [], DELAYED_SEED).find((c) => c.id === 'on-time')!
    expect(card.label).toBe('notYourFault')
    expect(card.delta.shortfallDays).toBe(-3)
  })
})

describe('Capability Report', () => {
  it('shows six attributes with evidence from behaviour', () => {
    const ledger = simulate(DEMO_SCENARIO, SITA, month, DEMO_SEED)
    const report = capabilityReport(month, ledger, DEMO_SCENARIO)
    expect(report.map((r) => r.id)).toEqual(['forecasting', 'fullCost', 'timing', 'verification', 'buffering', 'fairness'])
    const forecasting = report.find((r) => r.id === 'forecasting')!
    expect(forecasting.status).toBe('missed')
    expect(forecasting.evidenceParams).toEqual({ n: 1, total: 2 })
    expect(report.find((r) => r.id === 'buffering')!.status).toBe('shown')
    expect(report.find((r) => r.id === 'timing')!.status).toBe('missed')
    expect(report.find((r) => r.id === 'verification')!.status).toBe('notTested')
  })
})
