import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useGameShallow } from '@/state/gameStore'
import { useFullMonth, useProfile } from '@/state/hooks'
import { stabilityScore, shieldGrade } from '@/engine/score'
import { Button } from '@/ui/Button'
import { useMoney } from '@/ui/useMoney'
import { t } from '@/i18n'
import { play } from '@/audio/sfx'
import { useImpact } from '@/state/impactStore'
import { useTown } from '@/state/townStore'

export function ResultsScreen() {
  const ledger = useFullMonth()
  const profile = useProfile()
  const money = useMoney()
  const { go, nextMonth, reduced } = useGameShallow((s) => ({ go: s.go, nextMonth: s.nextMonth, reduced: s.settings.reducedMotion }))
  const impactActive = useImpact((x) => x.activeId)
  const startTown = useTown((x) => x.start)
  const demo = useGameShallow((x) => ({ d: x.settings.demoMode })).d
  const seed = useGameShallow((x) => ({ s: x.seed })).s
  const s = ledger.summary
  const score = useMemo(() => stabilityScore(s), [s])
  const grade = shieldGrade(s)

  useEffect(() => {
    play(score.total >= 80 ? 'wardSaved' : 'chime')
    if (score.total >= 80 && !reduced) confetti({ particleCount: 90, spread: 70, origin: { y: 0.3 }, colors: ['#F5A524', '#4ADE80', '#6EC6FF', '#FF4D6D'] })
  }, [score.total, reduced])

  const summary =
    s.scamLoss > 0
      ? t('results.summary.scammed', { name: profile.nameKey, loss: s.scamLoss })
      : s.flags.includes('loanApp')
        ? t('results.summary.scam', { name: profile.nameKey, cost: s.gapCost })
        : s.gapCost > 0
          ? t('results.summary.cost', { name: profile.nameKey, cost: s.gapCost, days: s.shortfallDays })
          : t('results.summary.calm', { name: profile.nameKey, days: s.shortfallDays })

  const R = 52
  const C = 2 * Math.PI * R
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-paper px-4 pb-6 pt-[max(16px,env(safe-area-inset-top))] text-ink">
      <h1 className="text-center text-2xl font-extrabold">{t('results.title')}</h1>
      <section className="mt-4 rounded-card bg-card p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <svg width="128" height="128" viewBox="0 0 128 128" role="img" aria-label={`${t('results.stability')} ${score.total}`}>
            <circle cx="64" cy="64" r={R} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="12" />
            <motion.circle
              cx="64"
              cy="64"
              r={R}
              fill="none"
              stroke={score.total >= 80 ? '#4ADE80' : score.total >= 50 ? '#F5A524' : '#FF4D6D'}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C * (1 - score.total / 100) }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              transform="rotate(-90 64 64)"
            />
            <text x="64" y="70" textAnchor="middle" fontSize="30" fontWeight="900" fill="currentColor">
              {score.total}
            </text>
          </svg>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="text-xs font-extrabold uppercase tracking-wide text-ink/50">{t('results.stability')}</div>
            <Bar label={t('results.breakdown.shortfall')} value={score.shortfall} max={40} color="#6EC6FF" hint={t('results.shortfallDays', { n: s.shortfallDays })} />
            <Bar label={t('results.breakdown.balance')} value={score.balance} max={30} color="#4ADE80" hint={money(s.endBalance)} />
            <Bar label={t('results.breakdown.gap')} value={score.gap} max={30} color="#F5A524" hint={money(s.gapCost)} />
          </div>
        </div>
        <p className="mt-4 rounded-2xl bg-paper px-3 py-2 text-sm italic">“{summary}”</p>
      </section>

      <section className="mt-3 grid grid-cols-3 gap-2">
        <Stat label={t('results.gapCost')} value={money(s.gapCost)} tone={s.gapCost > 0 ? 'bad' : 'good'} />
        <Stat label={t('results.scamLoss')} value={money(s.scamLoss)} tone={s.scamLoss > 0 ? 'bad' : 'good'} />
        <Stat label={t('results.shield')} value={grade} tone={grade === 'S' || grade === 'A' ? 'good' : grade === 'D' ? 'bad' : 'neutral'} big />
      </section>

      {s.obligationsAfterMonth.length > 0 && (
        <section className="mt-3 rounded-card bg-card p-3 text-sm shadow-sm">
          <h3 className="mb-1 text-xs font-extrabold uppercase tracking-wide text-ink/50">{t('results.obligations')}</h3>
          <ul>
            {s.obligationsAfterMonth.map((o, i) => (
              <li key={i} className="flex justify-between py-0.5">
                <span>{t(o.labelKey)}</span>
                <span className="font-bold tabular-nums">{money(o.remaining)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="primary" onClick={() => go('rewind')}>
          ⏪ {t('results.rewind')}
        </Button>
        <Button onClick={nextMonth}>▶️ {t('results.nextMonth')}</Button>
        <Button onClick={() => go('capability')}>🧭 {t('results.capability')}</Button>
        <Button onClick={() => go('codex')}>📖 {t('results.codex')}</Button>
        <Button
          onClick={() => {
            startTown(seed, { fromLife: true, demoOutbreak: demo })
            go('town')
          }}
        >
          🗺️ {t('results.town')}
        </Button>
        <Button onClick={() => go('fixDates')}>📅 {t('results.fixDates')}</Button>
      </div>
      {impactActive && (
        <Button variant="shield" className="mt-2 w-full" onClick={() => go('impactPost')}>
          🧪 {t('results.finishSession')}
        </Button>
      )}
    </div>
  )
}

function Bar({ label, value, max, color, hint }: { label: string; value: number; max: number; color: string; hint: string }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] font-bold">
        <span>{label}</span>
        <span className="text-ink/60">{hint}</span>
      </div>
      <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-ink/10">
        <motion.div className="h-full rounded-full" style={{ background: color, originX: 0 }} initial={{ scaleX: 0 }} animate={{ scaleX: Math.max(0.02, value / max) }} transition={{ duration: 0.9, ease: 'easeOut' }} />
      </div>
    </div>
  )
}

function Stat({ label, value, tone, big }: { label: string; value: string; tone: 'good' | 'bad' | 'neutral'; big?: boolean }) {
  const color = tone === 'bad' ? 'text-danger' : tone === 'good' ? 'text-green-700' : ''
  return (
    <div className="rounded-card bg-card p-3 text-center shadow-sm">
      <div className="text-[11px] font-bold text-ink/60">{label}</div>
      <div className={`${big ? 'text-3xl' : 'text-lg'} font-extrabold tabular-nums ${color}`}>{value}</div>
    </div>
  )
}
