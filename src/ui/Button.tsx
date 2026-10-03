import { motion, type HTMLMotionProps } from 'framer-motion'
import { play, unlockAudio, haptic } from '@/audio/sfx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'shield'

const styles: Record<Variant, string> = {
  primary: 'bg-marigold text-ink shadow-[0_6px_0_#c7801a] active:shadow-[0_2px_0_#c7801a] active:translate-y-1',
  secondary: 'bg-card text-ink border border-ink/10 shadow-sm',
  ghost: 'bg-transparent text-ink/80',
  danger: 'bg-danger text-white shadow-[0_6px_0_#b8233f] active:shadow-[0_2px_0_#b8233f] active:translate-y-1',
  shield: 'bg-shield text-ink shadow-[0_6px_0_#22a35a] active:shadow-[0_2px_0_#22a35a] active:translate-y-1',
}

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: Variant
  size?: 'md' | 'lg' | 'sm'
  silent?: boolean
}

export function Button({ variant = 'secondary', size = 'md', silent, className = '', onClick, children, ...rest }: ButtonProps) {
  const sizes = size === 'lg' ? 'min-h-[56px] px-6 text-lg' : size === 'sm' ? 'min-h-[40px] px-3 text-sm' : 'min-h-[48px] px-4 text-base'
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition-[box-shadow,transform] disabled:opacity-40 disabled:shadow-none disabled:translate-y-0 ${styles[variant]} ${sizes} ${className}`}
      onClick={(e) => {
        unlockAudio()
        if (!silent) {
          play('tap')
          haptic(10)
        }
        onClick?.(e)
      }}
      {...rest}
    >
      {children}
    </motion.button>
  )
}
