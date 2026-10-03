import type { Ledger, Profile, Scenario } from '@/engine/types'
import { dayFace } from '@/engine/cozy'
import { t } from '@/i18n'

interface Props {
  scenario: Scenario
  profile: Profile
  lived: Ledger
  forecast: Ledger
  day: number
}

/** Month calendar with icons for paydays, bills, events; faces for lived days. */
export function CalendarView({ scenario, profile, lived, forecast, day }: Props) {
  const icons = (d: number): string[] => {
    const out: string[] = []
    for (const inc of profile.incomes) {
      if (inc.kind === 'gig') continue
      if (inc.day === d) out.push(inc.kind === 'remittance' ? '✈️' : '💰')
    }
    const fcDay = forecast.days[d - 1]
    if (fcDay) for (const e of fcDay.entries) if (e.kind === 'bill') out.push(e.emoji)
    for (const ev of scenario.events) if (ev.day === d && ev.foreseeable) out.push(ev.emoji)
    return [...new Set(out)].slice(0, 3)
  }
  return (
    <div>
      <div className="grid grid-cols-6 gap-1.5">
        {Array.from({ length: scenario.days }, (_, i) => i + 1).map((d) => {
          const past = d < day
          const today = d === day
          const rec = lived.days[d - 1]
          return (
            <div
              key={d}
              className={`flex aspect-square flex-col items-center justify-between rounded-xl border p-1 text-[10px] ${today ? 'border-marigold bg-marigold/15' : 'border-ink/10 bg-card'} ${past ? 'opacity-90' : ''}`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-extrabold">{d}</span>
                {past && rec && <span>{dayFace(rec.balance)}</span>}
              </div>
              <div className="text-sm leading-none">{icons(d).join('')}</div>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-center text-xs text-ink/60">{t('calendar.legend')}</p>
    </div>
  )
}
