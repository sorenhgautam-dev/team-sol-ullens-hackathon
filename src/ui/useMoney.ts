import { useGame } from '@/state/gameStore'
import { formatMoney } from '@/i18n/currency'

/** Display-currency formatter. Engine amounts are always NPR. */
export function useMoney() {
  const currency = useGame((s) => s.settings.currency)
  return (amountNpr: number) => formatMoney(amountNpr, currency)
}

/** Formatter for the scam game's local amounts: already in the display currency, never converted. */
export function useCash() {
  const currency = useGame((s) => s.settings.currency)
  return (amount: number) => formatMoney(amount, currency, currency)
}
