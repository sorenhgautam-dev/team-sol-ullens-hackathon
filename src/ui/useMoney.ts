import { useGame } from '@/state/gameStore'
import { formatMoney } from '@/i18n/currency'

/** Display-currency formatter. Engine amounts are always NPR. */
export function useMoney() {
  const currency = useGame((s) => s.settings.currency)
  return (amountNpr: number) => formatMoney(amountNpr, currency)
}
