import { useGameShallow } from '@/state/gameStore'
import { useForecast, useGap, useLived } from '@/state/hooks'
import { Hearts } from '@/ui/Hearts'
import { Button } from '@/ui/Button'
import { useMoney } from '@/ui/useMoney'
import { energyCost } from '@/state/energy'
import { t } from '@/i18n'
import { play } from '@/audio/sfx'

export function PeopleTab() {
  const lived = useLived()
  const forecast = useForecast()
  const gap = useGap()
  const money = useMoney()
  const { day, decisions, logAction, toast } = useGameShallow((s) => ({ day: s.day, decisions: s.decisions, logAction: s.logAction, toast: s.toast }))
  const today = lived.days[day - 1]
  const trust = today?.stats.trust ?? { landlord: 0, family: 0, friends: 0 }

  const nextDue = (billId: string) => forecast.days.find((d) => d.day > day && d.entries.some((e) => e.kind === 'bill' && e.ref?.id === billId))?.day
  const rentDay = nextDue('rent')
  const schoolDay = nextDue('school')
  const rentMoved = decisions.some((a) => a.type === 'moveBill' && a.billId === 'rent')
  const rentSplit = decisions.some((a) => a.type === 'splitBill' && a.billId === 'rent')
  const schoolMoved = decisions.some((a) => a.type === 'moveBill' && a.billId === 'school')
  const askAmount = gap.amountNeeded > 0 ? Math.min(gap.amountNeeded, 15_000) : 2_000

  const run = (label: string, fn: () => { ok: boolean; reasonKey?: string }) => {
    const r = fn()
    if (r.ok) {
      play('chime')
      toast(`${label}: ${t('common.applied')}`, 'good')
    } else toast(r.reasonKey ? t(r.reasonKey) : t('common.blocked'), 'bad')
  }

  const copyAsk = (who: 'landlord' | 'school') => {
    const text = t(`people.askText.${who}`)
    void navigator.clipboard?.writeText(text).catch(() => undefined)
    logAction({ type: 'askCopied', target: who })
    toast(t('people.copied'), 'good')
  }

  const cost = (k: Parameters<typeof energyCost>[0]) => (energyCost(k) ? t('moves.energyCost', { n: energyCost(k) }) : t('moves.free'))

  return (
    <div className="h-full space-y-3 overflow-y-auto px-4 pb-4">
      <Card emoji="🏘️" title={t('people.landlord')} desc={t('people.landlord.desc')} hearts={trust.landlord}>
        <Button
          className="w-full justify-between"
          disabled={!rentDay || rentMoved || rentDay >= 21}
          onClick={() => run(t('people.moveRent'), () => logAction({ type: 'moveBill', billId: 'rent', fromDay: rentDay ?? 5, toDay: 21 }, 'moveBill'))}
        >
          <span>{t('people.moveRent')}</span>
          <span className="text-xs text-ink/60">{trust.landlord < 3 ? t('people.needsHearts', { n: 3 }) : cost('moveBill')}</span>
        </Button>
        <Button
          className="w-full justify-between"
          disabled={!rentDay || rentSplit || rentMoved || rentDay >= 21}
          onClick={() => run(t('people.splitRent'), () => logAction({ type: 'splitBill', billId: 'rent', fromDay: rentDay ?? 5, days: [rentDay ?? 5, 21], fee: 200 }, 'splitBill'))}
        >
          <span className="text-left text-sm">{t('people.splitRent')}</span>
          <span className="text-xs text-ink/60">{cost('splitBill')}</span>
        </Button>
        <Button variant="ghost" size="sm" className="w-full" onClick={() => copyAsk('landlord')}>
          📋 {t('people.copyAsk')}
        </Button>
      </Card>

      <Card emoji="🎒" title={t('people.school')} desc={t('people.school.desc')}>
        <Button
          className="w-full justify-between"
          disabled={!schoolDay || schoolMoved || schoolDay >= 21}
          onClick={() => run(t('people.moveSchool'), () => logAction({ type: 'moveBill', billId: 'school', fromDay: schoolDay ?? 10, toDay: 21 }, 'moveBill'))}
        >
          <span>{t('people.moveSchool')}</span>
          <span className="text-xs text-ink/60">{cost('moveBill')}</span>
        </Button>
        <Button variant="ghost" size="sm" className="w-full" onClick={() => copyAsk('school')}>
          📋 {t('people.copyAsk')}
        </Button>
      </Card>

      <Card emoji="👪" title={t('people.family')} desc={t('people.family.desc')} hearts={trust.family}>
        <Button className="w-full justify-between" disabled={trust.family <= 0} onClick={() => run(t('people.family'), () => logAction({ type: 'askHelp', who: 'family', amount: askAmount }, 'askHelp'))}>
          <span>{t('people.askFamily', { amount: money(askAmount) })}</span>
          <span className="text-xs text-ink/60">{cost('askHelp')} · −1 ❤️</span>
        </Button>
      </Card>

      <Card emoji="🧑‍🤝‍🧑" title={t('people.friends')} desc={t('people.friends.desc')} hearts={trust.friends}>
        <Button className="w-full justify-between" disabled={trust.friends <= 0} onClick={() => run(t('people.friends'), () => logAction({ type: 'askHelp', who: 'friends', amount: Math.min(askAmount, 3_000) }, 'askHelp'))}>
          <span>{t('people.askFriend', { amount: money(Math.min(askAmount, 3_000)) })}</span>
          <span className="text-xs text-ink/60">{cost('askHelp')} · −1 ❤️</span>
        </Button>
      </Card>
    </div>
  )
}

function Card({ emoji, title, desc, hearts, children }: { emoji: string; title: string; desc: string; hearts?: number; children: React.ReactNode }) {
  return (
    <section className="rounded-card bg-card p-3 shadow-sm">
      <div className="mb-2 flex items-start gap-3">
        <span className="text-3xl">{emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold">{title}</h3>
            {hearts !== undefined && <Hearts value={hearts} size="sm" />}
          </div>
          <p className="text-xs text-ink/60">{desc}</p>
        </div>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
