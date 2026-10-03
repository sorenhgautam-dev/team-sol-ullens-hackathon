import { useEffect } from 'react'
import { useGameShallow } from '@/state/gameStore'
import { useForecast, useGap, useLived, useMonteCarlo, useProfile, useScenario } from '@/state/hooks'
import { ForecastChart } from '@/ui/ForecastChart'
import { Button } from '@/ui/Button'
import { useMoney } from '@/ui/useMoney'
import { t } from '@/i18n'

export function MoneyTab() {
  const scenario = useScenario()
  const profile = useProfile()
  const lived = useLived()
  const forecast = useForecast()
  const gap = useGap()
  const mc = useMonteCarlo(500)
  const money = useMoney()
  const { day, decisions, logAction, openSheet } = useGameShallow((s) => ({ day: s.day, decisions: s.decisions, logAction: s.logAction, openSheet: s.openSheet }))

  // Viewing the forecast is a logged (free) action, once per day.
  useEffect(() => {
    if (!decisions.some((a) => a.type === 'forecastViewed' && a.day === day)) logAction({ type: 'forecastViewed' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day])

  const today = lived.days[day - 1]
  const dangerDay = forecast.days.find((d) => d.day >= day && d.balance < 0)?.day
  const movedBills = new Set(decisions.filter((a) => (a.type === 'moveBill' || a.type === 'splitBill') && a.day <= day).map((a) => (a.type === 'moveBill' || a.type === 'splitBill' ? a.billId : '')))
  const last = mc?.bands[mc.bands.length - 1]

  return (
    <div className="h-full space-y-3 overflow-y-auto px-4 pb-4">
      <section className="rounded-card bg-card p-3 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-extrabold">{t('money.forecast')}</h3>
          <span className="text-xs text-ink/60">{t('stat.bufferDays', { n: today?.stats.bufferDays ?? 0 })}</span>
        </div>
        <ForecastChart lived={lived} forecast={forecast} day={day} bands={mc?.bands ?? null} />
        <p className={`mt-1 text-sm font-bold ${dangerDay ? 'text-danger' : 'text-green-700'}`}>{dangerDay ? t('money.dangerZone', { day: dangerDay }) : t('money.safe')}</p>
        {last && <p className="mt-1 text-xs text-ink/60">{last.p10 === last.p90 ? t('money.mcLineSame', { low: money(last.p10) }) : t('money.mcLine', { low: money(last.p10), high: money(last.p90) })}</p>}
        <p className="mt-1 text-[11px] text-ink/50">{t('money.forecastHint')}</p>
        {gap.shortfallDays > 0 && (
          <Button variant="primary" className="mt-3 w-full" onClick={() => openSheet('gapBridge')}>
            🏦 {t('money.openBridge')}
          </Button>
        )}
      </section>

      <section className="rounded-card bg-card p-3 shadow-sm">
        <h3 className="mb-2 font-extrabold">{t('money.bills')}</h3>
        <ul className="divide-y divide-ink/5">
          {scenario.bills.map((b) => {
            const upcoming = forecast.days.filter((d) => d.day >= day && d.entries.some((e) => e.kind === 'bill' && e.ref?.id === b.id)).map((d) => d.day)
            return (
              <li key={b.id} className="flex items-center gap-3 py-2">
                <span className="text-2xl">{b.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{t(b.nameKey)}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${b.flexible === 'no' ? 'bg-ink/10' : b.flexible === 'yes' ? 'bg-shield/30' : 'bg-marigold/30'}`}>{t(`flex.${b.flexible}`)}</span>
                    {movedBills.has(b.id) && <span className="rounded-full bg-sky/30 px-1.5 py-0.5 text-[10px] font-bold">{t('money.moved')}</span>}
                  </div>
                  <div className="text-xs text-ink/60">{upcoming.length ? upcoming.map((d) => t('money.dueDay', { day: d })).join(', ') : t('common.applied')}</div>
                </div>
                <span className="font-bold tabular-nums">{money(b.amount)}</span>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="grid grid-cols-2 gap-2">
        <Button onClick={() => openSheet('moneyTrail')}>🧾 {t('money.trail')}</Button>
        <Button onClick={() => openSheet('calendar')}>📅 {t('money.calendar')}</Button>
      </section>
      <div className="rounded-card bg-card p-3 text-sm shadow-sm">
        <span className="font-bold">🪴 {t('money.jar')}:</span> {money(today?.jar ?? 0)} · <span className="text-ink/60">{t(profile.blurbKey)}</span>
      </div>
    </div>
  )
}
