import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useGameShallow } from '@/state/gameStore'
import { useInstall, useUpdate } from '@/state/pwa'
import { useTown } from '@/state/townStore'
import { Button } from '@/ui/Button'
import { dailySeed } from '@/engine/badges'
import { t } from '@/i18n'
import { FEATURES } from '@/config/features'
import { startRun } from '@/screens/paytown/PickScreen'
import { haptic, play } from '@/audio/sfx'

export function TitleScreen() {
  const { go, seenIntro, day, monthOver, decisions, settings, setSettings, toast, startDaily } = useGameShallow((s) => ({
    go: s.go,
    startDaily: s.startDaily,
    seenIntro: s.seenIntro,
    day: s.day,
    monthOver: s.monthOver,
    decisions: s.decisions,
    settings: s.settings,
    setSettings: s.setSettings,
    toast: s.toast,
  }))
  const install = useInstall()
  const update = useUpdate()
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
    <div className="relative flex h-full flex-col overflow-hidden bg-paper pb-[max(24px,env(safe-area-inset-bottom))] text-ink">
      {/* The team's town map as the backdrop: the same world the game is played in. */}
      <div className="absolute inset-x-0 top-0 h-[58%] overflow-hidden" aria-hidden>
        <motion.img
          src={`${import.meta.env.BASE_URL}sprites/town-map.png`}
          alt=""
          className="pixelated absolute left-0 top-0 w-full"
          initial={{ y: 0 }}
          animate={{ y: [0, -120, 0] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          draggable={false}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(239,226,196,0) 40%, var(--paper) 100%)' }} />
      </div>
      <div className="relative flex flex-1 flex-col items-center justify-end px-6 pb-4 text-center" style={{ minHeight: 300 }}>
        <motion.button
          className="pixel-frame flex h-20 w-20 select-none items-center justify-center bg-marigold text-5xl"
          whileTap={{ scale: 0.9 }}
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          aria-label={t('app.name')}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          🪙
        </motion.button>
        <h1 className="mt-5 flex gap-[0.08em] text-[34px] leading-none text-ink" style={{ textShadow: '3px 3px 0 #07080f' }}>
          {'NEXT PAYDAY'.split('').map((ch, i) => (
            <motion.span key={i} initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 * i, type: 'spring', stiffness: 400, damping: 18 }}>
              {ch === ' ' ? '\u00a0' : ch}
            </motion.span>
          ))}
        </h1>
        <p className="mt-3 font-pixel-soft text-lg text-honey">{t('app.tagline')}</p>
        <p className="mt-1 text-sm text-ink/70">{t('app.pitch')}</p>
        {settings.demoMode && <span className="mt-3 bg-ink px-3 py-1 font-pixel text-xs text-card">DEMO</span>}
      </div>
      <div className="relative mx-auto w-full max-w-sm space-y-2 px-6">
        {FEATURES.budgeting && canContinue && (
          <Button variant="primary" size="lg" className="w-full" onClick={() => go('walk')}>
            ▶️ {t('title.continue', { day })}
          </Button>
        )}
        <Button variant={FEATURES.budgeting && canContinue ? 'secondary' : 'primary'} size="lg" className="w-full" onClick={() => (FEATURES.budgeting ? go(seenIntro ? 'profile' : 'twin') : settings.demoMode ? startRun('sita') : go('pick'))}>
          🎮 {t('title.play')}
        </Button>
        {FEATURES.budgeting && (
          <Button variant="secondary" className="w-full" onClick={startDaily}>
            📅 {t('title.daily')} · {dailySeed().code}
          </Button>
        )}
        {install.deferred && !install.installed && (
          <Button variant="shield" className="w-full" onClick={() => void install.install()}>
            ⬇️ {t('title.install')}
          </Button>
        )}
        {update.ready && (
          <Button variant="secondary" className="w-full" onClick={update.apply}>
            🔄 {t('title.update')}
          </Button>
        )}
        {update.offlineReady && !update.ready && <p className="text-center text-xs text-teal">{t('title.offlineReady')}</p>}
        {install.isIos && !install.isStandalone && <p className="text-center text-xs text-ink/60">{t('title.iosHint')}</p>}
        {FEATURES.budgeting ? (
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
        ) : (
          <Button variant="ghost" className="w-full" onClick={() => go('settings')}>
            ⚙️ {t('title.settings')}
          </Button>
        )}
        <p className="pt-2 text-center text-[11px] text-ink/50">{t('app.disclaimer')}</p>
      </div>
    </div>
  )
}
