import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useGameShallow } from '@/state/gameStore'
import { useInstall } from '@/state/pwa'
import { useTown } from '@/state/townStore'
import { Button } from '@/ui/Button'
import { t } from '@/i18n'
import { haptic, play } from '@/audio/sfx'

export function TitleScreen() {
  const { go, seenIntro, day, monthOver, decisions, settings, setSettings, toast } = useGameShallow((s) => ({
    go: s.go,
    seenIntro: s.seenIntro,
    day: s.day,
    monthOver: s.monthOver,
    decisions: s.decisions,
    settings: s.settings,
    setSettings: s.setSettings,
    toast: s.toast,
  }))
  const install = useInstall()
  const startTown = useTown((x) => x.start)
  const timer = useRef<number | null>(null)
  const canContinue = seenIntro && !monthOver && (day > 1 || decisions.length > 0)

  const startHold = () => {
    timer.current = window.setTimeout(() => {
      const on = !settings.demoMode
      setSettings({ demoMode: on })
      haptic([30, 30, 30])
      play('chime')
      toast(on ? t('title.demoOn') : t('title.demoOff'))
    }, 700)
  }
  const endHold = () => {
    if (timer.current) window.clearTimeout(timer.current)
  }

  return (
    <div className="relative flex h-full flex-col items-center justify-between overflow-hidden bg-cream px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(40px,env(safe-area-inset-top))] text-ink">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-marigold/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-sky/30 blur-3xl" />
      <div className="relative flex flex-1 flex-col items-center justify-center text-center">
        <motion.button
          className="select-none text-8xl"
          whileTap={{ scale: 0.9 }}
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          aria-label={t('app.name')}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          🪙
        </motion.button>
        <h1 className="mt-4 text-5xl font-black leading-none tracking-tight">{t('app.name')}</h1>
        <p className="mt-3 text-lg font-bold text-ink/70">{t('app.tagline')}</p>
        <p className="mt-1 text-sm text-ink/50">{t('app.pitch')}</p>
        {settings.demoMode && <span className="mt-3 rounded-full bg-ink px-3 py-1 text-xs font-bold text-paper">🎬 demo</span>}
      </div>
      <div className="relative w-full max-w-sm space-y-2">
        {canContinue && (
          <Button variant="primary" size="lg" className="w-full" onClick={() => go('life')}>
            ▶️ {t('title.continue', { day })}
          </Button>
        )}
        <Button variant={canContinue ? 'secondary' : 'primary'} size="lg" className="w-full" onClick={() => go(seenIntro ? 'profile' : 'twin')}>
          🎮 {t('title.play')}
        </Button>
        {install.deferred && !install.installed && (
          <Button variant="shield" className="w-full" onClick={() => void install.install()}>
            ⬇️ {t('title.install')}
          </Button>
        )}
        {install.isIos && !install.isStandalone && <p className="text-center text-xs text-ink/60">{t('title.iosHint')}</p>}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              startTown(settings.demoMode ? 1 : Date.now() % 100000, { demoOutbreak: settings.demoMode })
              go('town')
            }}
          >
            🗺️ {t('title.town')}
          </Button>
          <Button variant="ghost" onClick={() => go('fixDates')}>
            📅 {t('fix.title')}
          </Button>
          <Button variant="ghost" onClick={() => go('settings')}>
            ⚙️ {t('title.settings')}
          </Button>
        </div>
        <p className="pt-2 text-center text-[11px] text-ink/50">{t('app.disclaimer')}</p>
      </div>
    </div>
  )
}
