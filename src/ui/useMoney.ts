import { useGame } from '@/state/gameStore'
import { formatMoney } from '@/i18n/currency'

/** Display-currency formatter. Engine amounts are always NPR. */
export function useMoney() {
  const currency = useGame((s) => s.settings.currency)
  return (amountNpr: number) => formatMoney(amountNpr, currency)
}

/** Display-currency formatter for amounts written in US dollars (the scam game). */
export function useCash() {
  const currency = useGame((s) => s.settings.currency)
  return (amountUsd: number) => formatMoney(amountUsd, currency, 'USD')
}
