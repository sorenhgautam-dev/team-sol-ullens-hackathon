import NumberFlow from '@number-flow/react'
import { useGame } from '@/state/gameStore'
import { digitsFor } from '@/i18n/currency'

interface Props {
  /** In the player's currency (Scam Town's amounts are local, never converted). */
  amount: number
  /** 'safe' green, 'warn' amber (some of this payday lost), 'danger' red (just lost money). */
  state: 'safe' | 'warn' | 'danger'
  size?: 'lg' | 'md' | 'sm'
  className?: string
}

/** Animated money counter. */
export function Balance({ amount, state, size = 'lg', className = '' }: Props) {
  const currency = useGame((s) => s.settings.currency)
  const value = amount
  const digits = digitsFor(value, currency)
  const color = state === 'danger' ? 'text-danger' : state === 'warn' ? 'text-honey' : 'text-shield'
  const sizeCls = size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-xl' : 'text-base'
  return (
    <div className={`font-pixel tabular-nums ${color} ${sizeCls} ${className}`} aria-live="polite">
      <NumberFlow
        value={Math.round(value * 10 ** digits) / 10 ** digits}
        // Rupees read "Rs. 30,000", as everywhere else in the game.
        format={currency === 'NPR' ? { maximumFractionDigits: digits, minimumFractionDigits: digits } : { style: 'currency', currency, maximumFractionDigits: digits, minimumFractionDigits: digits, currencyDisplay: 'narrowSymbol' }}
        prefix={currency === 'NPR' ? 'Rs. ' : undefined}
        locales={currency === 'NPR' || currency === 'INR' ? 'en-IN' : 'en-US'}
        transformTiming={{ duration: 600, easing: 'ease-out' }}
        spinTiming={{ duration: 600, easing: 'ease-out' }}
      />
    </div>
  )
}
