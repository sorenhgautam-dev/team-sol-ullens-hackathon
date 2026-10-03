import NumberFlow from '@number-flow/react'
import { useGame } from '@/state/gameStore'
import { convert } from '@/i18n/currency'

interface Props {
  amountNpr: number
  /** 'safe' green, 'warn' amber (forecast dips), 'danger' red (negative now). */
  state: 'safe' | 'warn' | 'danger'
  size?: 'lg' | 'md' | 'sm'
  className?: string
}

/** Animated money counter. Conversion is display only; the engine is NPR. */
export function Balance({ amountNpr, state, size = 'lg', className = '' }: Props) {
  const currency = useGame((s) => s.settings.currency)
  const digits = currency === 'NPR' || currency === 'INR' ? 0 : 2
  const color = state === 'danger' ? 'text-danger' : state === 'warn' ? 'text-honey' : 'text-shield'
  const sizeCls = size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-xl' : 'text-base'
  return (
    <div className={`font-pixel tabular-nums ${color} ${sizeCls} ${className}`} aria-live="polite">
      <NumberFlow
        value={Math.round(convert(amountNpr, currency) * 10 ** digits) / 10 ** digits}
        format={{ style: 'currency', currency, maximumFractionDigits: digits, minimumFractionDigits: digits, currencyDisplay: 'code' }}
        locales="en-IN"
        transformTiming={{ duration: 600, easing: 'ease-out' }}
        spinTiming={{ duration: 600, easing: 'ease-out' }}
      />
    </div>
  )
}
