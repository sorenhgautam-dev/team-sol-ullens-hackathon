/**
 * What-If cards: one-change reruns of the month.
 *  - "Your choice": a decision the player made (or a lever they could have pulled) is changed.
 *  - "Not your fault": an uncontrollable event (breakdown, remittance delay) is removed.
 * Deltas are absolute numbers, never percentages.
 */
import { simulate } from './simulate'
import { diffSummaries, FINAL_MONTH_OPTS, type RewindDelta } from './rewind'
import type { DecisionLog, Ledger, PlayerAction, Profile, Scenario, SimulateOptions } from './types'

export type WhatIfLabel = 'yourChoice' | 'notYourFault'

export interface WhatIfCard {
  id: string
  label: WhatIfLabel
  /** i18n key describing the single change, e.g. 'whatif.moveRent'. */
  changeKey: string
  changeParams?: Record<string, string | number>
  delta: RewindDelta
  ledger: Ledger
}

export function whatIfCards(scenario: Scenario, profile: Profile, decisions: DecisionLog, seed: number, max = 6, opts: SimulateOptions = FINAL_MONTH_OPTS): WhatIfCard[] {
  const run = (sc: Scenario, pr: Profile, d: DecisionLog) => simulate(sc, pr, d, seed, opts)
  const base = run(scenario, profile, decisions)
  const cards: WhatIfCard[] = []
  const push = (id: string, label: WhatIfLabel, changeKey: string, ledger: Ledger, changeParams?: Record<string, string | number>) => {
    const delta = diffSummaries(base, ledger)
    if (delta.shortfallDays === 0 && delta.endBalance === 0 && delta.gapCost === 0) return
    cards.push({ id, label, changeKey, changeParams, delta, ledger })
  }

  // Lever the player did not pull: move rent (and the school fee) to the day after payday.
  const rent = scenario.bills.find((b) => b.id === 'rent')
  const movedRent = decisions.some((a) => a.type === 'moveBill' && a.billId === 'rent')
  const payday = Math.max(...profile.incomes.map((i) => (i.kind === 'gig' ? 0 : i.day)))
  if (rent && !movedRent && payday > (rent.dueDays[0] ?? 0)) {
    const toDay = Math.min(scenario.days, payday + 1)
    const lever: PlayerAction = { id: 'whatif-move-rent', type: 'moveBill', day: 1, billId: 'rent', fromDay: rent.dueDays[0] ?? 5, toDay }
    push('move-rent', 'yourChoice', 'whatif.moveRent', run(scenario, profile, [lever, ...decisions]), { day: toDay })
  }

  // Player decisions, each swapped for its cheapest alternative.
  for (const a of decisions) {
    if (a.type === 'eventChoice') {
      const ev = scenario.events.find((e) => e.id === a.eventId)
      if (!ev) continue
      for (const c of ev.choices) {
        if (c.id === a.choiceId) continue
        const alt = decisions.map((x) => (x.id === a.id ? { ...a, choiceId: c.id } : x))
        push(`${a.id}:${c.id}`, 'yourChoice', 'whatif.eventChoice', run(scenario, profile, alt), { event: ev.titleKey, choice: c.labelKey })
      }
    } else if (a.type === 'bridge') {
      const alt = decisions.filter((x) => x.id !== a.id)
      const opt = scenario.bridges.find((b) => b.id === a.optionId)
      push(`${a.id}:none`, 'yourChoice', 'whatif.noBridge', run(scenario, profile, alt), { name: opt?.nameKey ?? a.optionId })
    } else if (a.type === 'scamResponse' && a.response === 'comply') {
      const alt = decisions.map((x) => (x.id === a.id ? { ...a, response: 'verify' as const } : x))
      const scam = scenario.scams.find((s) => s.id === a.scamId)
      push(`${a.id}:verify`, 'yourChoice', 'whatif.verified', run(scenario, profile, alt), { name: scam?.nameKey ?? a.scamId })
    }
  }

  // Not your fault: remove each uncontrollable event that fired.
  for (const ev of scenario.events) {
    if (ev.type !== 'uncontrollable') continue
    const fired = base.days.some((d) => d.events.some((e) => e.eventId === ev.id))
    if (!fired) continue
    const without: Scenario = { ...scenario, events: scenario.events.filter((e) => e.id !== ev.id) }
    const alt = decisions.filter((a) => !(a.type === 'eventChoice' && a.eventId === ev.id))
    push(`no-${ev.id}`, 'notYourFault', 'whatif.noEvent', run(without, profile, alt), { event: ev.titleKey })
  }
  // Not your fault: the remittance arriving on time.
  const delayed = base.days.some((d) => d.log.some((l) => l.key === 'log.incomeDelayed'))
  if (delayed) {
    const onTime: Profile = { ...profile, incomes: profile.incomes.map((i) => (i.kind === 'gig' ? i : { ...i, uncertain: undefined })) }
    push('on-time', 'notYourFault', 'whatif.onTime', run(scenario, onTime, decisions))
  }

  // Most impactful first: shortfall days removed, then money saved.
  cards.sort((a, b) => a.delta.shortfallDays - b.delta.shortfallDays || b.delta.endBalance - a.delta.endBalance)
  return cards.slice(0, max)
}
