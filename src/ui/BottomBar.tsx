import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useGame, type Tab } from '@/state/gameStore'
import { t } from '@/i18n'
import { play, haptic, unlockAudio } from '@/audio/sfx'

interface Props {
  phoneBadge: number
}

const TABS: { id: Tab; emoji: string; labelKey: string }[] = [
  { id: 'home', emoji: '🏡', labelKey: 'life.tab.home' },
  { id: 'money', emoji: '💰', labelKey: 'life.tab.money' },
  { id: 'people', emoji: '🤝', labelKey: 'life.tab.people' },
  { id: 'phone', emoji: '📱', labelKey: 'life.tab.phone' },
  { id: 'moves', emoji: '🎯', labelKey: 'life.tab.moves' },
]

function TabButton({ id, emoji, labelKey, badge }: { id: Tab; emoji: string; labelKey: string; badge?: number }) {
  const tab = useGame((s) => s.tab)
  const setTab = useGame((s) => s.setTab)
  const active = tab === id
  return (
    <button
      className={`relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-bold ${active ? 'text-ink' : 'text-ink/50'}`}
      onClick={() => {
        unlockAudio()
        play('tap')
        setTab(id)
      }}
      aria-current={active ? 'page' : undefined}
    >
      <span className={`text-xl leading-none ${active ? '' : 'grayscale-[40%]'}`}>{emoji}</span>
      {t(labelKey)}
      {badge !== undefined && badge > 0 && (
        <span className="absolute right-2 top-1 min-w-[18px] rounded-full bg-danger px-1 text-[10px] font-extrabold text-white">{badge}</span>
      )}
      {active && <motion.span layoutId="tab-dot" className="absolute bottom-1 h-1 w-6 rounded-full bg-marigold" />}
    </button>
  )
}

export function BottomBar({ phoneBadge }: Props) {
  const requestNextDay = useGame((s) => s.requestNextDay)
  const skipToNextEvent = useGame((s) => s.skipToNextEvent)
  const energy = useGame((s) => s.energy)
  const holdTimer = useRef<number | null>(null)
  const held = useRef(false)

  const startHold = () => {
    held.current = false
    holdTimer.current = window.setTimeout(() => {
      held.current = true
      haptic([20, 30, 20])
      play('whoosh')
      skipToNextEvent()
    }, 650)
  }
  const endHold = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current)
    holdTimer.current = null
  }

  return (
    <nav className="relative z-30 flex items-end gap-1 border-t border-ink/10 bg-paper px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-1" aria-label="Main">
      {TABS.slice(0, 2).map((tb) => (
        <TabButton key={tb.id} {...tb} />
      ))}
      <div className="flex w-[104px] flex-col items-center">
        <motion.button
          whileTap={{ scale: 0.95, y: 4 }}
          className="-mt-7 flex h-[72px] w-[72px] flex-col items-center justify-center rounded-full bg-marigold text-ink shadow-[0_8px_0_#c7801a,0_12px_24px_rgba(0,0,0,.18)]"
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onPointerCancel={endHold}
          onClick={() => {
            if (held.current) return
            unlockAudio()
            play('pop')
            haptic(15)
            requestNextDay()
          }}
          aria-label={t('life.nextDay')}
          title={t('life.holdToSkip')}
        >
          <span className="text-2xl font-black leading-none">+</span>
          <span className="text-[10px] font-extrabold leading-none">{t('life.nextDay')}</span>
        </motion.button>
        <span className="mt-1 text-[11px] font-bold text-ink/60" aria-label={`${t('life.energy')} ${energy}`}>
          {'⚡'.repeat(energy)}
          <span className="opacity-30">{'⚡'.repeat(Math.max(0, 3 - energy))}</span>
        </span>
      </div>
      {TABS.slice(2).map((tb) => (
        <TabButton key={tb.id} {...tb} badge={tb.id === 'phone' ? phoneBadge : undefined} />
      ))}
    </nav>
  )
}
