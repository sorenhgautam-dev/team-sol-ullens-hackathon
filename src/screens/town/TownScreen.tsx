import { useMemo } from 'react'
import { useGameShallow } from '@/state/gameStore'
import { useTown } from '@/state/townStore'
import { simulateTown, townMeters, townOutlook, townGrade, TOWN_WEEKS, type TownAction } from '@/engine/town'
import { INITIATIVES } from '@/content/initiatives'
import { WARDS_BY_ID } from '@/content/wards'
import { TownMap } from './TownMap'
import { Button } from '@/ui/Button'
import { Sheet } from '@/ui/Sheet'
import { Toasts } from '@/ui/Toasts'
import { useMoney } from '@/ui/useMoney'
import { t } from '@/i18n'
import { play } from '@/audio/sfx'

export function TownScreen() {
  const { go, toast, demo } = useGameShallow((s) => ({ go: s.go, toast: s.toast, demo: s.settings.demoMode }))
  const town = useTown()
  const money = useMoney()
  const state = useMemo(() => simulateTown(town.seed, town.turns, { demoOutbreak: town.demoOutbreak || demo }), [town.seed, town.turns, town.demoOutbreak, demo])
  const meters = townMeters(state)
  const outlook = useMemo(() => (state.outcome === 'playing' ? townOutlook(state, 4, 120) : null), [state])
  const pendingCost = town.pending.reduce((s, a) => s + (INITIATIVES.find((i) => i.id === a.initiativeId)?.cost ?? 0), 0)
  const budgetLeft = state.budget - pendingCost
  const selected = town.selectedWard ? state.wards.find((w) => w.id === town.selectedWard) : undefined
  const selectedDef = town.selectedWard ? WARDS_BY_ID[town.selectedWard] : undefined
  const lastWeekLog = state.log.filter((l) => l.week === state.week - 1)

  const deploy = (a: TownAction) => {
    const def = INITIATIVES.find((i) => i.id === a.initiativeId)
    if (!def) return
    if (def.cost > budgetLeft) {
      toast(t('town.noBudget'), 'bad')
      return
    }
    play('pop')
    town.queue(a)
    toast(t('town.queued', { name: def.nameKey }), 'good')
  }

  if (state.outcome !== 'playing') {
    const grade = townGrade(state)
    return (
      <div className="flex h-full flex-col items-center justify-center bg-paper px-6 text-center text-ink">
        <div className="text-6xl">{state.outcome === 'won' ? '🏆' : '🌧️'}</div>
        <h1 className="mt-3 text-2xl font-extrabold">{state.outcome === 'won' ? t('town.won') : t('town.lostTitle')}</h1>
        {state.lostReasonKey && <p className="mt-1 text-sm text-ink/70">{t(state.lostReasonKey)}</p>}
        <div className="mt-4 grid w-full grid-cols-2 gap-2">
          <Meter label={t('town.stability')} value={`${meters.stability}%`} />
          <Meter label={t('town.scamSpread')} value={`${meters.scamSpread}%`} />
          <Meter label={t('town.trust')} value={`${meters.trust}`} />
          <Meter label={t('town.grade')} value={grade} />
        </div>
        <p className="mt-3 text-xs text-ink/60">{t('town.debt', { n: meters.debtDependency })}</p>
        <div className="mt-6 grid w-full grid-cols-2 gap-2">
          <Button variant="primary" onClick={() => town.start(town.seed + 1, { demoOutbreak: demo })}>
            ↻ {t('town.again')}
          </Button>
          <Button onClick={() => go('title')}>{t('common.back')}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-col bg-paper text-ink">
      <header className="px-4 pt-[max(10px,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold">🗺️ {t('town.title')}</h1>
            <p className="text-xs text-ink/60">{t('town.week', { week: state.week, total: TOWN_WEEKS })}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => go('title')}>
            {t('common.back')}
          </Button>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          <Meter label={t('town.stability')} value={`${meters.stability}%`} tone={meters.stability >= 80 ? 'good' : meters.stability < 50 ? 'bad' : undefined} />
          <Meter label={t('town.scamSpread')} value={`${meters.scamSpread}%`} tone={meters.scamSpread > 40 ? 'bad' : meters.scamSpread === 0 ? 'good' : undefined} />
          <Meter label={t('town.trust')} value={`${meters.trust}`} tone={meters.trust < 30 ? 'bad' : undefined} />
          <Meter label={t('town.budget')} value={money(budgetLeft)} tone={budgetLeft < 50_000 ? 'bad' : undefined} />
        </div>
      </header>
      {town.fromLife && state.week === 1 && <p className="mx-4 mt-2 rounded-2xl bg-sky/20 px-3 py-2 text-xs font-bold">{t('town.sitaLine')}</p>}
      <div className="mt-2 px-3">
        <TownMap state={state} selected={town.selectedWard} onSelect={(id) => town.select(id)} highlightSita={town.fromLife} pendingWardIds={town.pending.map((a) => a.wardId ?? '')} />
      </div>
      <div className="mt-auto px-4 pb-[max(12px,env(safe-area-inset-bottom))]">
        {town.pending.length > 0 && (
          <ul className="mb-2 flex flex-wrap gap-1">
            {town.pending.map((a, i) => (
              <li key={i}>
                <button className="rounded-full bg-marigold/30 px-2 py-1 text-[11px] font-bold" onClick={() => town.unqueue(i)}>
                  {INITIATIVES.find((x) => x.id === a.initiativeId)?.emoji} {t(INITIATIVES.find((x) => x.id === a.initiativeId)?.nameKey ?? '')}
                  {a.wardId ? ` · ${t(WARDS_BY_ID[a.wardId]?.nameKey ?? '')}` : ''} ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        {outlook && <p className="mb-2 text-center text-xs text-ink/60">{t('town.outlook', { low: outlook.p10, high: outlook.p90 })}</p>}
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => town.select(town.selectedWard ?? 'riverside')}>🏘️ {t('town.wards')}</Button>
          <Button
            variant="primary"
            onClick={() => {
              play('whoosh')
              town.endWeek()
            }}
          >
            ⏭️ {t('town.endWeek')}
          </Button>
        </div>
        <p className="mt-2 text-center text-[11px] text-ink/50">{t('town.cycle')}</p>
      </div>

      <Sheet open={!!selected && !!selectedDef} onClose={() => town.select(null)} title={selectedDef ? `${selectedDef.emoji} ${t(selectedDef.nameKey)}` : ''}>
        {selected && selectedDef && (
          <div className="space-y-3 pb-2">
            <p className="text-xs text-ink/60">{t('town.wardBlurb', { n: selectedDef.households, archetype: `archetype.${selectedDef.archetype}` })}</p>
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <Meter label={t('town.shortfallRate')} value={`${Math.round(selected.shortfallRate * 100)}%`} tone={selected.shortfallRate > 0.5 ? 'bad' : undefined} />
              <Meter label={t('town.scamLevel')} value={`${Math.round(selected.scamLevel)}`} tone={selected.scamLevel > 40 ? 'bad' : selected.scamLevel <= 20 ? 'good' : undefined} />
              <Meter label={t('town.buffer')} value={`${selected.buffer.toFixed(1)}d`} />
              <Meter label={t('town.trust')} value={`${Math.round(selected.trust)}`} />
            </div>
            <div className="flex flex-wrap gap-1 text-[11px]">
              {state.active.filter((a) => a.wardId === selected.id || (!a.wardId && INITIATIVES.find((i) => i.id === a.id)?.scope === 'town')).map((a, i) => (
                <span key={i} className={`rounded-full px-2 py-0.5 font-bold ${a.readyWeek <= state.week ? 'bg-shield/30' : 'bg-marigold/30'}`}>
                  {INITIATIVES.find((x) => x.id === a.id)?.emoji} {t(INITIATIVES.find((x) => x.id === a.id)?.nameKey ?? '')} {a.readyWeek > state.week ? t('town.readyIn', { n: a.readyWeek - state.week }) : ''}
                </span>
              ))}
            </div>
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-ink/50">{t('town.initiatives')}</h3>
            <ul className="space-y-2">
              {INITIATIVES.map((def) => {
                const wardScoped = def.scope === 'ward'
                const allowed = !def.allowedWardIds || def.allowedWardIds.includes(selected.id)
                const already = !def.repeatable && state.active.some((a) => a.id === def.id && (wardScoped ? a.wardId === selected.id : true))
                const queued = town.pending.some((a) => a.initiativeId === def.id && (wardScoped ? a.wardId === selected.id : true))
                const disabled = !allowed || already || queued || def.cost > budgetLeft
                return (
                  <li key={def.id} className={`rounded-card bg-card p-3 shadow-sm ${disabled ? 'opacity-60' : ''}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{def.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-extrabold">{t(def.nameKey)}</h4>
                          <span className="text-xs font-bold tabular-nums">{money(def.cost)}{def.weeklyCost ? ` + ${money(def.weeklyCost)}/wk` : ''}</span>
                        </div>
                        <p className="text-xs">{t(def.effectKey)}</p>
                        <p className="text-[11px] text-ink/60">⚖️ {t(def.tradeoffKey)}</p>
                        <p className="text-[11px] text-ink/60">⏱️ {t('town.deployTime', { n: def.deployWeeks })} · {wardScoped ? t('town.scopeWard') : t('town.scopeTown')}</p>
                      </div>
                    </div>
                    <Button size="sm" className="mt-2 w-full" disabled={disabled} onClick={() => deploy({ type: 'deploy', initiativeId: def.id, wardId: wardScoped ? selected.id : undefined })}>
                      {!allowed ? t('town.notHere') : already ? t('town.active') : queued ? t('town.queuedShort') : t('town.deploy')}
                    </Button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </Sheet>

      <Sheet open={town.showReport && lastWeekLog.length > 0} onClose={() => town.setShowReport(false)} title={t('town.report', { week: state.week - 1 })} height="auto">
        <ul className="space-y-1 pb-2">
          {lastWeekLog.map((l, i) => (
            <li key={i} className={`rounded-xl bg-card px-3 py-2 text-sm shadow-sm ${l.tone === 'bad' ? 'text-danger' : l.tone === 'good' ? 'text-green-700' : l.tone === 'warn' ? 'text-amber-700' : ''}`}>
              {l.emoji} {t(l.key, l.params)}
            </li>
          ))}
        </ul>
        <Button variant="primary" className="w-full" onClick={() => town.setShowReport(false)}>
          {t('common.ok')}
        </Button>
      </Sheet>
      <Toasts />
    </div>
  )
}

function Meter({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="rounded-xl bg-card px-2 py-1.5 text-center shadow-sm">
      <div className="text-[10px] font-bold text-ink/60">{label}</div>
      <div className={`text-sm font-extrabold tabular-nums ${tone === 'bad' ? 'text-danger' : tone === 'good' ? 'text-green-700' : ''}`}>{value}</div>
    </div>
  )
}
