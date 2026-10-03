import { useState } from 'react'
import { useGameShallow } from '@/state/gameStore'
import { useForecast, useLived } from '@/state/hooks'
import { Button } from '@/ui/Button'
import { useMoney } from '@/ui/useMoney'
import { energyCost } from '@/state/energy'
import { SELLABLE_ITEMS, EXTRA_SHIFT_PAY, TREATS } from '@/content/items'
import { t } from '@/i18n'
import { play } from '@/audio/sfx'

export function MovesTab() {
  const lived = useLived()
  const forecast = useForecast()
  const money = useMoney()
  const { day, decisions, logAction, toast } = useGameShallow((s) => ({ day: s.day, decisions: s.decisions, logAction: s.logAction, toast: s.toast }))
  const [internetDay, setInternetDay] = useState(21)
  const today = lived.days[day - 1]
  const balance = today?.balance ?? 0
  const jar = today?.jar ?? 0

  const nextDue = (billId: string) => forecast.days.find((d) => d.day > day && d.entries.some((e) => e.kind === 'bill' && e.ref?.id === billId))?.day
  const electricityDay = nextDue('electricity')
  const internetDue = nextDue('internet')
  const soldIds = new Set(decisions.filter((a) => a.type === 'sellItem').map((a) => (a.type === 'sellItem' ? a.itemId : '')))
  const shiftToday = decisions.some((a) => a.type === 'extraShift' && a.day === day)
  const treatToday = decisions.some((a) => a.type === 'treat' && a.day === day)

  const run = (label: string, sound: 'coin' | 'chime' | 'thud' | 'pop', fn: () => { ok: boolean; reasonKey?: string }) => {
    const r = fn()
    if (r.ok) {
      play(sound)
      toast(`${label}: ${t('common.applied')}`, 'good')
    } else toast(r.reasonKey ? t(r.reasonKey) : t('common.blocked'), 'bad')
  }
  const cost = (k: Parameters<typeof energyCost>[0]) => (energyCost(k) ? t('moves.energyCost', { n: energyCost(k) }) : t('moves.free'))

  return (
    <div className="h-full space-y-3 overflow-y-auto px-4 pb-4">
      <h3 className="px-1 text-xs font-extrabold uppercase tracking-wide text-ink/50">{t('moves.levers')}</h3>
      <Row emoji="💡" title={t('moves.payElectricityEarly')} desc={t('moves.payElectricityEarly.desc')}>
        <Button size="sm" disabled={!electricityDay || balance < 1_500} onClick={() => run(t('moves.payElectricityEarly'), 'thud', () => logAction({ type: 'payEarly', billId: 'electricity', fromDay: electricityDay ?? 12, toDay: day }, 'payEarly'))}>
          {money(1_500)} · {cost('payEarly')}
        </Button>
      </Row>
      <Row emoji="📶" title={t('moves.internetAutopay')} desc={t('moves.internetAutopay.desc')}>
        <div className="flex items-center gap-2">
          <input type="range" min={Math.min(28, day + 1)} max={28} value={internetDay} onChange={(e) => setInternetDay(Number(e.target.value))} className="w-24 accent-marigold" aria-label={t('moves.internetAutopay')} />
          <Button size="sm" disabled={!internetDue || internetDay <= day} onClick={() => run(t('moves.internetAutopay'), 'chime', () => logAction({ type: 'moveBill', billId: 'internet', fromDay: internetDue ?? 15, toDay: internetDay }, 'payEarly'))}>
            {t('moves.setDay', { day: internetDay })}
          </Button>
        </div>
      </Row>

      <h3 className="px-1 pt-2 text-xs font-extrabold uppercase tracking-wide text-ink/50">{t('moves.side')}</h3>
      <Row emoji="🪴" title={`${t('moves.jar')} · ${money(jar)}`} desc={t('moves.jar.desc')}>
        <div className="flex flex-wrap gap-2">
          {[500, 1_000, 2_000].map((amt) => (
            <Button key={`in${amt}`} size="sm" disabled={balance < amt} onClick={() => run(t('moves.jar'), 'pop', () => logAction({ type: 'jarDeposit', amount: amt }, 'jarDeposit'))}>
              {t('moves.jarIn', { amount: money(amt) })}
            </Button>
          ))}
          {[500, 1_000].map((amt) => (
            <Button key={`out${amt}`} size="sm" variant="ghost" disabled={jar < amt} onClick={() => run(t('moves.jar'), 'thud', () => logAction({ type: 'jarWithdraw', amount: amt }, 'jarWithdraw'))}>
              {t('moves.jarOut', { amount: money(amt) })}
            </Button>
          ))}
        </div>
      </Row>
      <Row emoji="🏷️" title={t('moves.sell')} desc={t('moves.sell.desc')}>
        <ul className="space-y-2">
          {SELLABLE_ITEMS.map((item) => (
            <li key={item.id} className="rounded-2xl bg-paper p-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{item.emoji}</span>
                <span className="min-w-0 flex-1 text-sm font-bold capitalize">{t(item.nameKey)}</span>
                {soldIds.has(item.id) && <span className="text-xs font-bold text-ink/50">{t('moves.sold')}</span>}
              </div>
              {!soldIds.has(item.id) && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button size="sm" onClick={() => run(t('moves.sell'), 'coin', () => logAction({ type: 'sellItem', itemId: item.id, amount: item.fairPrice, fair: true }, 'sellItem'))}>
                    {t('moves.sellFair', { amount: money(item.fairPrice) })}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => run(t('moves.sell'), 'coin', () => logAction({ type: 'sellItem', itemId: item.id, amount: item.quickPrice, fair: false }, 'sellItem'))}>
                    {t('moves.sellQuick', { amount: money(item.quickPrice) })}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-1 text-right text-xs text-ink/50">{cost('sellItem')}</p>
      </Row>
      <Row emoji="💪" title={t('moves.shift')} desc={t('moves.shift.desc', { amount: EXTRA_SHIFT_PAY })}>
        <Button size="sm" disabled={shiftToday} onClick={() => run(t('moves.shift'), 'coin', () => logAction({ type: 'extraShift', amount: EXTRA_SHIFT_PAY }, 'extraShift'))}>
          +{money(EXTRA_SHIFT_PAY)} · {cost('extraShift')}
        </Button>
      </Row>
      <Row emoji="🍜" title={t('moves.eatOut', { amount: TREATS[0].amount })} desc={t('moves.cook')}>
        <div className="flex gap-2">
          <Button size="sm" disabled={treatToday || balance < TREATS[0].amount} onClick={() => run(t('treat.eatOut'), 'thud', () => logAction({ type: 'treat', amount: TREATS[0].amount, labelKey: TREATS[0].labelKey, stressDelta: TREATS[0].stressDelta }, 'treat'))}>
            {t('moves.eatOut', { amount: money(TREATS[0].amount) })}
          </Button>
          <Button size="sm" variant="ghost" disabled={treatToday} onClick={() => run(t('treat.cook'), 'pop', () => logAction({ type: 'treat', amount: 0, labelKey: TREATS[1].labelKey, stressDelta: 0 }, 'treat'))}>
            {t('moves.cook')}
          </Button>
        </div>
      </Row>
    </div>
  )
}

function Row({ emoji, title, desc, children }: { emoji: string; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card bg-card p-3 shadow-sm">
      <div className="mb-2 flex items-start gap-3">
        <span className="text-2xl">{emoji}</span>
        <div className="min-w-0 flex-1">
          <h4 className="font-extrabold">{title}</h4>
          <p className="text-xs text-ink/60">{desc}</p>
        </div>
      </div>
      {children}
    </section>
  )
}
