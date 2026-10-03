import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameShallow } from '@/state/gameStore'
import { useAutoMonth } from '@/state/hooks'
import { AARAV, SITA } from '@/content/profiles'
import { BASELINE_SCENARIO, DEMO_SEED } from '@/content/scenario'
import type { Ledger, Profile } from '@/engine/types'
import { Balance } from '@/ui/Balance'
import { Button } from '@/ui/Button'
import { toneClass } from '@/ui/LifeLog'
import { t } from '@/i18n'
import { play } from '@/audio/sfx'

/** Two Life Logs side by side auto-play the month at speed. */
export function TwinWalletsScreen() {
  const { startMonth, go, demo } = useGameShallow((s) => ({ startMonth: s.startMonth, go: s.go, demo: s.settings.demoMode }))
  const aarav = useAutoMonth(AARAV, DEMO_SEED, BASELINE_SCENARIO)
  const sita = useAutoMonth(SITA, DEMO_SEED, BASELINE_SCENARIO)
  const [shown, setShown] = useState(0)
  const total = sita.days.length
  useEffect(() => {
    if (shown >= total) return
    const id = window.setTimeout(() => {
      setShown((d) => d + 1)
      const rec = sita.days[shown]
      if (rec?.entries.some((e) => e.kind === 'bill')) play(rec.balance < 0 ? 'thud' : 'tick')
    }, demo ? 110 : 260)
    return () => window.clearTimeout(id)
  }, [shown, total, demo, sita.days])
  const done = shown >= total
  return (
    <div className="flex h-full flex-col bg-paper px-3 pb-[max(16px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))] text-ink">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-xl font-extrabold">{t('twin.title')}</h1>
        {!done && (
          <Button size="sm" variant="ghost" onClick={() => setShown(total)}>
            {t('twin.skip')}
          </Button>
        )}
      </div>
      <p className="px-1 text-xs text-ink/60">{t('twin.sub')}</p>
      <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 gap-2">
        <Column profile={AARAV} ledger={aarav} shown={shown} />
        <Column profile={SITA} ledger={sita} shown={shown} />
      </div>
      <div className="mt-2 min-h-[96px]">
        {done ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <p className="text-center text-sm font-bold">{t('twin.end')}</p>
            <Button variant="primary" size="lg" className="w-full" onClick={() => startMonth('sita')}>
              {t('twin.live')}
            </Button>
            <Button variant="ghost" size="sm" className="w-full" onClick={() => go('profile')}>
              {t('pick.title')}
            </Button>
          </motion.div>
        ) : (
          <p className="pt-3 text-center text-sm font-bold text-ink/60">{t('common.day', { day: Math.min(shown + 1, total) })}</p>
        )}
      </div>
    </div>
  )
}

function Column({ profile, ledger, shown }: { profile: Profile; ledger: Ledger; shown: number }) {
  const idx = Math.max(0, Math.min(shown, ledger.days.length) - 1)
  const rec = ledger.days[idx]
  const balance = shown === 0 ? profile.startingBalance : (rec?.balance ?? 0)
  const shortfalls = ledger.days.slice(0, shown).filter((d) => d.shortfall).length
  const lines = ledger.days
    .slice(0, shown)
    .flatMap((d) => d.log.filter((l) => l.key === 'log.billDue' || l.key === 'log.income' || l.key === 'log.wentNegative').map((l) => ({ ...l, day: d.day })))
    .slice(-6)
  return (
    <section className="flex min-h-0 flex-col rounded-card bg-card p-2 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{profile.emoji}</span>
        <div className="min-w-0">
          <div className="font-extrabold">{t(profile.nameKey)}</div>
          <Balance amountNpr={balance} state={balance < 0 ? 'danger' : 'safe'} size="sm" />
        </div>
      </div>
      <div className={`mt-1 text-[11px] font-bold ${shortfalls ? 'text-danger' : 'text-ink/50'}`}>{t('twin.shortfall', { n: shortfalls })}</div>
      <ul className="mt-1 min-h-0 flex-1 space-y-1 overflow-hidden">
        {lines.map((l, i) => (
          <motion.li key={`${l.day}-${i}-${l.key}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl px-2 py-1 text-[11px] leading-tight ${l.tone === 'bad' ? 'bg-danger/10' : 'bg-paper'} ${toneClass(l.tone)}`}>
            <span className="mr-1 text-[9px] font-extrabold text-ink/40">D{l.day}</span>
            {l.emoji} {t(l.key, l.params)}
          </motion.li>
        ))}
      </ul>
    </section>
  )
}
