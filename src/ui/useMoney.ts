import { useGame } from '@/state/gameStore'
import { formatMoney } from '@/i18n/currency'

/** Formats an amount in the player's currency (amounts are already local, never converted). */
export function useCash() {
  const currency = useGame((s) => s.settings.currency)
  return (amount: number) => formatMoney(amount, currency)
}
