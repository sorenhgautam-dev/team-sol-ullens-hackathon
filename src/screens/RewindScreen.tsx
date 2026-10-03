import { useMemo, useState } from 'react'
import { useGameShallow } from '@/state/gameStore'
import { useProfile, useScenario } from '@/state/hooks'
import { rewind, alternativesFor } from '@/engine/rewind'
import { whatIfCards, type WhatIfCard } from '@/engine/whatIf'
import type { PlayerAction } from '@/engine/types'
import { ForecastChart } from '@/ui/ForecastChart'
import { Button } from '@/ui/Button'
import { describeAction, isMeaningful } from '@/ui/describe'
import { useMoney } from '@/ui/useMoney'
import { t } from '@/i18n'
import { play } from '@/audio/sfx'

export function RewindScreen() {
  const scenario = useScenario()
  const profile = useProfile()
  const money = useMoney()
  const { decisions, seed, go, logAction } = useGameShallow((s) => ({ decisions: s.decisions, seed: s.seed, go: s.go, logAction: s.logAction }))
  const timeline = decisions.filter(isMeaningful)
  const [selected, setSelected] = useState<string | null>(null)
  const [replacement, setReplacement] = useState<PlayerAction | null | 'remove'>(null)

  const result = useMemo(() => {
    if (!selected || replacement === null) return null
    play('whoosh')
    return rewind(scenario, profile, decisions, seed, selected, replacement === 'remove' ? null : replacement)
  }, [scenario, profile, decisions, seed, selected, replacement])

  const cards = useMemo(() => whatIfCards(scenario, profile, decisions, seed), [scenario, profile, decisions, seed])
  const chosen = timeline.find((a) => a.id === selected)

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-paper px-4 pb-6 pt-[max(16px,env(safe-area-inset-top))] text-ink">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">⏪ {t('rewind.title')}</h1>
        <Button size="sm" variant="ghost" onClick={() => go('results')}>
          {t('rewind.back')}
        </Button>
      </div>
      <p className="mt-1 text-sm text-ink/70">{timeline.length ? t('rewind.pick') : t('rewind.noDecisions')}</p>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
        {timeline.map((a) => (
          <button
            key={a.id}
            className={`shrink-0 rounded-2xl px-3 py-2 text-left text-xs shadow-sm ${selected === a.id ? 'bg-marigold text-ink' : 'bg-card'}`}
            onClick={() => {
              setSelected(a.id)
              setReplacement(null)
              logAction({ type: 'rewind', changedActionId: a.id })
            }}
          >
            <div className="font-extrabold">{t('common.day', { day: a.day })}</div>
            <div className="max-w-[160px] truncate">{describeAction(a, scenario)}</div>
          </button>
        ))}
      </div>

      {chosen && (
        <section className="mt-2 rounded-card bg-card p-3 shadow-sm">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-ink/50">{t('rewind.alternatives')}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {alternativesFor(chosen, scenario).map((alt, i) => (
              <Button key={i} size="sm" variant={replacement !== 'remove' && replacement?.type === alt.type && JSON.stringify(replacement) === JSON.stringify(alt) ? 'primary' : 'secondary'} onClick={() => setReplacement(alt)}>
                {describeAction(alt, scenario)}
              </Button>
            ))}
            {chosen.type !== 'eventChoice' && chosen.type !== 'scamResponse' && (
              <Button size="sm" variant={replacement === 'remove' ? 'primary' : 'secondary'} onClick={() => setReplacement('remove')}>
                {t('rewind.remove')}
              </Button>
            )}
          </div>
        </section>
      )}

      {result && (
        <section className="mt-3 rounded-card bg-card p-3 shadow-sm">
          <div className="mb-1 flex gap-4 text-xs font-bold">
            <span className="flex items-center gap-1">
              <i className="inline-block h-1 w-5 rounded bg-ink" /> {t('rewind.original')}
            </span>
            <span className="flex items-center gap-1">
              <i className="inline-block h-1 w-5 rounded bg-sage" /> {t('rewind.rewound')}
            </span>
          </div>
          <ForecastChart lived={result.original} forecast={result.original} day={scenario.days + 1} compare={result.rewound} height={150} />
          <ul className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            <Delta label={t('rewind.delta.shortfall', { n: signed(result.delta.shortfallDays) })} good={result.delta.shortfallDays <= 0} />
            <Delta label={t('rewind.delta.end', { amount: signedMoney(result.delta.endBalance, money) })} good={result.delta.endBalance >= 0} />
            <Delta label={t('rewind.delta.gap', { amount: signedMoney(result.delta.gapCost, money) })} good={result.delta.gapCost <= 0} />
          </ul>
          {result.blocked.length > 0 && <p className="mt-2 text-xs text-amber-700">⛔ {t('rewind.blocked', { n: result.blocked.length })}</p>}
        </section>
      )}

      <h2 className="mt-5 text-lg font-extrabold">{t('whatif.title')}</h2>
      {cards.length === 0 && <p className="text-sm text-ink/60">{t('whatif.none')}</p>}
      <div className="mt-2 flex snap-x gap-3 overflow-x-auto pb-3">
        {cards.map((c) => (
          <WhatIf key={c.id} card={c} money={money} />
        ))}
      </div>
      <Button variant="primary" className="mt-auto" onClick={() => go('results')}>
        {t('rewind.keep')}
      </Button>
    </div>
  )
}

function signed(n: number): string {
  return `${n > 0 ? '+' : ''}${n}`
}
function signedMoney(n: number, money: (n: number) => string): string {
  return `${n > 0 ? '+' : n < 0 ? '−' : ''}${money(Math.abs(n))}`
}

function Delta({ label, good }: { label: string; good: boolean }) {
  return <li className={`rounded-xl px-2 py-1.5 font-bold ${good ? 'bg-shield/25 text-green-800' : 'bg-danger/15 text-danger'}`}>{label}</li>
}

function WhatIf({ card, money }: { card: WhatIfCard; money: (n: number) => string }) {
  const change = t(card.changeKey, card.changeParams)
  const days = -card.delta.shortfallDays
  const saved = card.delta.endBalance
  let key: string
  if (days > 0 && saved > 0) key = 'whatif.sentence.both'
  else if (days > 0 && saved === 0) key = 'whatif.sentence.days'
  else if (days === 0 && saved > 0) key = 'whatif.sentence.money'
  else if (days < 0 && saved < 0) key = 'whatif.sentence.worseBoth'
  else if (days < 0 && saved === 0) key = 'whatif.sentence.worseDays'
  else if (days === 0 && saved < 0) key = 'whatif.sentence.worseMoney'
  else if (days > 0) key = 'whatif.sentence.mixedDaysBetter'
  else key = 'whatif.sentence.mixedMoneyBetter'
  const sentence = t(key, { change, days: Math.abs(days), amount: money(Math.abs(saved)).replace(/^[^\d]*/, '') })
  const better = days > 0 || saved > 0
  return (
    <article className={`w-[260px] shrink-0 snap-start rounded-card p-3 shadow-sm ${card.label === 'notYourFault' ? 'bg-sky/15' : 'bg-card'}`}>
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${card.label === 'notYourFault' ? 'bg-sky/40' : 'bg-marigold/40'}`}>{t(card.label === 'notYourFault' ? 'whatif.notYourFault' : 'whatif.yourChoice')}</span>
      <p className={`mt-2 text-sm ${better ? '' : 'text-ink/70'}`}>{sentence}</p>
    </article>
  )
}
