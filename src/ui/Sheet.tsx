import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { t } from '@/i18n'

interface SheetProps {
  open: boolean
  onClose?: () => void
  title?: string
  children: ReactNode
  /** full: covers the whole phone; tall: 85%; auto: content height. */
  height?: 'full' | 'tall' | 'auto'
  hideClose?: boolean
}

/** Bottom sheet used for tabs' sub-views, Gap Bridge, mailbox, goodnight, events and scams. */
export function Sheet({ open, onClose, title, children, height = 'tall', hideClose }: SheetProps) {
  const h = height === 'full' ? 'h-full rounded-none' : height === 'tall' ? 'max-h-[88%]' : 'max-h-[88%]'
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-40 flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`relative flex w-full flex-col overflow-hidden rounded-t-[28px] bg-paper text-ink shadow-2xl ${h}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag={height === 'full' ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 && onClose) onClose()
            }}
          >
            {height !== 'full' && <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-ink/15" />}
            {(title || !hideClose) && (
              <header className="flex items-center justify-between px-5 pb-2 pt-3">
                <h2 className="text-lg font-extrabold">{title}</h2>
                {!hideClose && onClose && (
                  <button className="min-h-[44px] min-w-[44px] rounded-full text-sm font-bold text-ink/60" onClick={onClose} aria-label={t('common.close')}>
                    ✕
                  </button>
                )}
              </header>
            )}
            <div className={height === 'full' ? 'min-h-0 flex-1 overflow-y-auto' : 'min-h-0 flex-1 overflow-y-auto px-5 pb-[max(20px,env(safe-area-inset-bottom))]'}>{children}</div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
