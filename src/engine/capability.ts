/**
 * Capability Report: six learning attributes shown through behaviour, with evidence.
 * Reads the decision log and the ledger; never judges "right or wrong", only what the player did.
 */
import type { DecisionLog, Ledger, Scenario } from './types'

export type CapabilityId = 'forecasting' | 'fullCost' | 'timing' | 'verification' | 'buffering' | 'fairness'
export type CapabilityStatus = 'shown' | 'missed' | 'notTested'

export interface CapabilityAttribute {
  id: CapabilityId
  status: CapabilityStatus
  evidenceKey: string
  evidenceParams?: Record<string, string | number>
}

export function capabilityReport(decisions: DecisionLog, ledger: Ledger, scenario: Scenario): CapabilityAttribute[] {
  const appliedIds = new Set(ledger.actionOutcomes.filter((o) => o.status === 'applied').map((o) => o.actionId))
  const applied = decisions.filter((a) => appliedIds.has(a.id))

  // Forecasting: checked the forecast on or the day before a money decision.
  const moneyDecisions = applied.filter((a) => a.type === 'eventChoice' || a.type === 'bridge' || a.type === 'sellItem' || a.type === 'extraShift')
  const forecastDays = new Set(decisions.filter((a) => a.type === 'forecastViewed').map((a) => a.day))
  const checkedBefore = moneyDecisions.filter((a) => forecastDays.has(a.day) || forecastDays.has(a.day - 1)).length
  const forecasting: CapabilityAttribute = moneyDecisions.length === 0
    ? { id: 'forecasting', status: 'notTested', evidenceKey: 'cap.forecasting.none' }
    : { id: 'forecasting', status: checkedBefore * 2 > moneyDecisions.length ? 'shown' : 'missed', evidenceKey: 'cap.forecasting.evidence', evidenceParams: { n: checkedBefore, total: moneyDecisions.length } }

  // Full cost: compared bridge costs before choosing, chose a cheaper option, or asked for the total cost.
  const bridges = applied.filter((a) => a.type === 'bridge')
  const viewedCosts = decisions.some((a) => a.type === 'bridgeOptionsViewed')
  const expensive = new Set(['loan_app', 'moneylender'])
  const cheaperChosen = bridges.filter((a) => a.type === 'bridge' && !expensive.has(a.optionId)).length
  const askedInfo = applied.some((a) => {
    if (a.type !== 'eventChoice') return false
    const ev = scenario.events.find((e) => e.id === a.eventId)
    return ev?.choices.find((c) => c.id === a.choiceId)?.signals?.includes('askedForInfo') ?? false
  })
  const fullCost: CapabilityAttribute = bridges.length === 0 && !askedInfo
    ? { id: 'fullCost', status: 'notTested', evidenceKey: 'cap.fullCost.none' }
    : askedInfo || (viewedCosts && cheaperChosen === bridges.length)
      ? { id: 'fullCost', status: 'shown', evidenceKey: askedInfo ? 'cap.fullCost.asked' : 'cap.fullCost.compared', evidenceParams: { n: cheaperChosen, total: bridges.length } }
      : { id: 'fullCost', status: 'missed', evidenceKey: 'cap.fullCost.missed', evidenceParams: { n: bridges.length - cheaperChosen } }

  // Timing: used a timing lever or sent an ask.
  const levers = applied.filter((a) => a.type === 'moveBill' || a.type === 'splitBill' || a.type === 'payEarly')
  const asks = decisions.filter((a) => a.type === 'askCopied').length
  const timing: CapabilityAttribute = levers.length + asks > 0
    ? { id: 'timing', status: 'shown', evidenceKey: 'cap.timing.evidence', evidenceParams: { levers: levers.length, asks } }
    : { id: 'timing', status: 'missed', evidenceKey: 'cap.timing.missed' }

  // Verification: verify / wait / block on scams.
  const s = ledger.summary
  const verification: CapabilityAttribute = s.scamsFaced === 0
    ? { id: 'verification', status: 'notTested', evidenceKey: 'cap.verification.none' }
    : { id: 'verification', status: s.scamsDefended * 2 >= s.scamsFaced ? 'shown' : 'missed', evidenceKey: 'cap.verification.evidence', evidenceParams: { n: s.scamsDefended, total: s.scamsFaced, tells: s.tellsSpotted } }

  // Buffering: used the emergency jar or built 7+ buffer days.
  const jarDeposits = applied.filter((a) => a.type === 'jarDeposit').length
  const maxBuffer = Math.max(0, ...ledger.days.map((d) => d.stats.bufferDays))
  const buffering: CapabilityAttribute = jarDeposits > 0 || maxBuffer >= 7
    ? { id: 'buffering', status: 'shown', evidenceKey: 'cap.buffering.evidence', evidenceParams: { n: jarDeposits, days: maxBuffer } }
    : { id: 'buffering', status: 'missed', evidenceKey: 'cap.buffering.missed', evidenceParams: { days: maxBuffer } }

  // Fairness: chose the fair price when offered more.
  const fairOffers = applied.filter((a) => {
    if (a.type !== 'eventChoice') return false
    const ev = scenario.events.find((e) => e.id === a.eventId)
    return ev?.type === 'fair'
  })
  const fairChosen = fairOffers.filter((a) => {
    if (a.type !== 'eventChoice') return false
    const ev = scenario.events.find((e) => e.id === a.eventId)
    return ev?.choices.find((c) => c.id === a.choiceId)?.signals?.includes('fairPrice') ?? false
  }).length
  const fairSales = applied.filter((a) => a.type === 'sellItem' && a.fair).length
  const fairness: CapabilityAttribute = fairOffers.length === 0 && fairSales === 0 && !applied.some((a) => a.type === 'sellItem')
    ? { id: 'fairness', status: 'notTested', evidenceKey: 'cap.fairness.none' }
    : { id: 'fairness', status: fairChosen === fairOffers.length ? 'shown' : 'missed', evidenceKey: 'cap.fairness.evidence', evidenceParams: { n: fairChosen + fairSales, total: fairOffers.length + applied.filter((a) => a.type === 'sellItem').length } }

  return [forecasting, fullCost, timing, verification, buffering, fairness]
}
