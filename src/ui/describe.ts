import type { EventChoice, PlayerAction, Scenario } from '@/engine/types'
import { t } from '@/i18n'
import { formatMoney } from '@/i18n/currency'

/** Visible immediate cost of an event choice, from its effects. */
export function choiceCost(choice: EventChoice): string {
  const parts: string[] = []
  for (const fx of choice.effects) {
    if (fx.kind === 'spend') parts.push(`−${formatMoney(fx.amount)}`)
    if (fx.kind === 'receive') parts.push(`+${formatMoney(fx.amount)}`)
    if (fx.kind === 'recurring') parts.push(`${formatMoney(fx.amount)}/month × ${fx.months}`)
    if (fx.kind === 'trust') parts.push(`${fx.delta > 0 ? '+' : ''}${fx.delta} ❤️ ${t(`people.${fx.who}`)}`)
  }
  return parts.join(' · ') || t('moves.free')
}

/** Human label for a logged action (Rewind timeline). */
export function describeAction(a: PlayerAction, scenario: Scenario): string {
  switch (a.type) {
    case 'eventChoice': {
      const ev = scenario.events.find((e) => e.id === a.eventId)
      const c = ev?.choices.find((x) => x.id === a.choiceId)
      return t('rewind.action.eventChoice', { title: ev?.titleKey ?? a.eventId, choice: c?.labelKey ?? a.choiceId })
    }
    case 'bridge':
      return t('rewind.action.bridge', { name: scenario.bridges.find((b) => b.id === a.optionId)?.nameKey ?? a.optionId })
    case 'scamResponse':
      return t('rewind.action.scamResponse', { name: scenario.scams.find((s) => s.id === a.scamId)?.nameKey ?? a.scamId, response: `response.${a.response}` })
    case 'moveBill':
      return t('rewind.action.moveBill', { name: scenario.bills.find((b) => b.id === a.billId)?.nameKey ?? a.billId, to: a.toDay })
    case 'splitBill':
      return t('rewind.action.splitBill', { name: scenario.bills.find((b) => b.id === a.billId)?.nameKey ?? a.billId })
    case 'payEarly':
      return t('rewind.action.payEarly', { name: scenario.bills.find((b) => b.id === a.billId)?.nameKey ?? a.billId })
    case 'jarDeposit':
      return t('rewind.action.jarDeposit', { amount: a.amount })
    case 'jarWithdraw':
      return t('rewind.action.jarWithdraw', { amount: a.amount })
    case 'sellItem':
      return t('rewind.action.sellItem', { item: `item.${a.itemId}` })
    case 'extraShift':
      return t('rewind.action.extraShift')
    case 'treat':
      return t('rewind.action.treat', { name: a.labelKey })
    case 'askHelp':
      return t('rewind.action.askHelp', { who: `people.${a.who}` })
    default:
      return t('rewind.action.other')
  }
}

/** Only decisions worth showing on a timeline. */
export function isMeaningful(a: PlayerAction): boolean {
  return !['forecastViewed', 'bridgeOptionsViewed', 'askCopied', 'rewind'].includes(a.type)
}
