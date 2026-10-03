import { motion } from 'framer-motion'
import type { DayStats } from '@/engine/types'
import { t } from '@/i18n'

interface Props {
  stats: DayStats
}

/** Four stat bars: Stability (Buffer Days), Stress, Trust (avg hearts), Privacy. */
export function StatBars({ stats }: Props) {
  const trustAvg = (stats.trust.landlord + stats.trust.family + stats.trust.friends) / 3
  const bars = [
    { key: 'stat.stability', value: Math.min(1, stats.bufferDays / 7), color: '#4ADE80', emoji: '🪴', hint: t('stat.bufferDays', { n: stats.bufferDays }) },
    { key: 'stat.stress', value: stats.stress / 100, color: '#FF4D6D', emoji: '😮‍💨', hint: `${Math.round(stats.stress)}` },
    { key: 'stat.trust', value: trustAvg / 5, color: '#F5A524', emoji: '🤝', hint: `${trustAvg.toFixed(1)} / 5` },
    { key: 'stat.privacy', value: stats.privacy / 100, color: '#6EC6FF', emoji: '🔒', hint: `${Math.round(stats.privacy)}` },
  ]
  return (
    <div className="grid grid-cols-4 gap-2 px-4" aria-label="Stats">
      {bars.map((b) => (
        <div key={b.key} className="min-w-0" title={b.hint}>
          <div className="flex items-center justify-between text-[11px] font-bold text-ink/70">
            <span className="truncate">
              {b.emoji} {t(b.key)}
            </span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-ink/10">
            <motion.div
              className="h-full rounded-full"
              style={{ background: b.color, originX: 0 }}
              initial={false}
              animate={{ scaleX: Math.max(0.02, b.value) }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
