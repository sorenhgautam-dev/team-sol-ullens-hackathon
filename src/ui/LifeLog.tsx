import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Ledger, LogLine } from '@/engine/types'
import { t } from '@/i18n'

interface Props {
  ledger: Ledger
  onWhy: (line: LogLine) => void
  compact?: boolean
}

export function toneClass(tone: LogLine['tone']): string {
  switch (tone) {
    case 'bad':
      return 'text-danger'
    case 'good':
      return 'text-green-700 dark:text-green-400'
    case 'warn':
      return 'text-amber-700 dark:text-amber-400'
    case 'lesson':
      return 'italic text-ink/60'
    default:
      return 'text-ink'
  }
}

/** The heart of the screen: a scrolling feed of short lines per day, newest at the bottom. */
export function LifeLog({ ledger, onWhy, compact }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const count = ledger.days.reduce((n, d) => n + d.log.length, 0)
  useEffect(() => {
    const el = ref.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [count])
  return (
    <div ref={ref} className="h-full overflow-y-auto px-4 pb-3" aria-label={t('life.lifeLog')}>
      {count === 0 && <p className="py-6 text-center text-sm text-ink/50">{t('life.emptyLog')}</p>}
      <AnimatePresence initial={false}>
        {ledger.days.map((d) => (
          <div key={d.day} className="mb-2">
            {d.log.length > 0 && (
              <div className={`sticky top-0 z-[1] -mx-4 mb-1 bg-paper/90 px-4 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-ink/50 backdrop-blur ${compact ? 'hidden' : ''}`}>
                {t('common.day', { day: d.day })}
              </div>
            )}
            <ul className="space-y-1">
              {d.log.map((l, i) => (
                <motion.li
                  key={`${d.day}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25, delay: Math.min(i * 0.05, 0.3) }}
                  className={`flex items-start gap-2 rounded-2xl bg-card px-3 py-2 text-[15px] leading-snug shadow-sm ${toneClass(l.tone)}`}
                  onClick={() => onWhy(l)}
                  role="button"
                >
                  <span className="text-lg leading-none">{l.emoji}</span>
                  <span className="min-w-0 flex-1">
                    {compact && <span className="mr-1 text-[11px] font-extrabold text-ink/40">D{d.day}</span>}
                    {t(l.key, l.params)}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
