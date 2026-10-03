import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameShallow } from '@/state/gameStore'
import { useForecast, useLived, useProfile } from '@/state/hooks'
import { Sheet } from '@/ui/Sheet'
import { useMoney } from '@/ui/useMoney'
import { t } from '@/i18n'
import { play } from '@/audio/sfx'

export function GoodnightSheet({ open }: { open: boolean }) {
  const profile = useProfile()
  const lived = useLived()
  const forecast = useForecast()
  const money = useMoney()
  const { day, nextDay } = useGameShallow((s) => ({ day: s.day, nextDay: s.nextDay }))
  useEffect(() => {
    if (open) play('goodnight')
  }, [open])
  const today = lived.days[day - 1]
  const entries = (today?.entries ?? []).filter((e) => e.kind !== 'jar_in' && e.kind !== 'jar_out')
  const moneyIn = entries.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0)
  const moneyOut = -entries.filter((e) => e.amount < 0).reduce((s, e) => s + e.amount, 0)
  const tomorrow = forecast.days[day]
  const dues = (tomorrow?.entries ?? []).filter((e) => e.amount < 0)
  return (
    <Sheet open={open} height="full" hideClose>
      <button className="flex h-full w-full flex-col items-center justify-center bg-[#2E2740] text-[#FFF4E0]" onClick={nextDay} aria-label={t('night.tap')}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-xs px-6 text-center">
          <div className="text-5xl">🌙</div>
          <h2 className="mt-3 text-2xl font-extrabold">{t('night.title', { name: profile.nameKey })}</h2>
          <dl className="mt-6 space-y-2 rounded-card bg-white/10 p-4 text-left text-sm">
            <Row label={t('night.in')} value={`+${money(moneyIn)}`} good />
            <Row label={t('night.out')} value={`−${money(moneyOut)}`} />
            <Row label={t('night.net')} value={`${moneyIn - moneyOut >= 0 ? '+' : '−'}${money(Math.abs(moneyIn - moneyOut))}`} good={moneyIn - moneyOut >= 0} />
            <div className="border-t border-white/15 pt-2">
              <dt className="text-xs uppercase tracking-wide opacity-70">{t('night.tomorrow')}</dt>
              <dd className="mt-1 space-y-0.5">
                {dues.length === 0 && <span className="opacity-80">{t('night.nothing')}</span>}
                {dues.map((e, i) => (
                  <div key={i} className="flex justify-between">
                    <span>
                      {e.emoji} {t(e.labelKey)}
                    </span>
                    <span className="tabular-nums">{money(-e.amount)}</span>
                  </div>
                ))}
              </dd>
            </div>
          </dl>
          <p className="mt-8 animate-pulse text-xs opacity-70">{t('night.tap')}</p>
        </motion.div>
      </button>
    </Sheet>
  )
}

function Row({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="opacity-80">{label}</dt>
      <dd className={`font-extrabold tabular-nums ${good ? 'text-shield' : ''}`}>{value}</dd>
    </div>
  )
}
