import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '@/state/gameStore'

export function Toasts() {
  const toasts = useGame((s) => s.toasts)
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[max(12px,env(safe-area-inset-top))] z-50 flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((tst) => (
          <motion.div
            key={tst.id}
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className={`rounded-full px-4 py-2 text-sm font-bold pixel-frame ${tst.tone === 'bad' ? 'bg-danger text-white' : tst.tone === 'good' ? 'bg-shield text-ink' : 'bg-ink text-paper'}`}
          >
            {tst.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
