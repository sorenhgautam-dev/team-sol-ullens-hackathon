import { motion, type HTMLMotionProps } from 'framer-motion'
import { play, unlockAudio, haptic } from '@/audio/sfx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'shield'

const styles: Record<Variant, string> = {
  primary: 'pixel-btn pixel-btn-primary text-white',
  secondary: 'pixel-btn text-ink',
  ghost: 'bg-transparent text-ink/80 font-pixel uppercase tracking-wide',
  danger: 'pixel-btn pixel-btn-danger text-white',
  shield: 'pixel-btn text-teal',
}

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: Variant
  size?: 'md' | 'lg' | 'sm'
  silent?: boolean
}

export function Button({ variant = 'secondary', size = 'md', silent, className = '', onClick, children, ...rest }: ButtonProps) {
  const sizes = size === 'lg' ? 'min-h-[56px] px-3 text-base' : size === 'sm' ? 'min-h-[44px] px-1 text-[11px]' : 'min-h-[48px] px-2 text-[13px]'
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`inline-flex items-center justify-center gap-2 font-bold disabled:opacity-40 ${styles[variant]} ${sizes} ${className}`}
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
