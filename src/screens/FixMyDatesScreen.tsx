import { useState } from 'react'
import { useGameShallow } from '@/state/gameStore'
import { useFix } from '@/state/fixStore'
import { useShiftFinder } from '@/state/useShiftFinder'
import { useImpact } from '@/state/impactStore'
import type { Change, RealInputs, Suggestion } from '@/engine/shiftFinder'
import type { Band } from '@/engine/monteCarlo'
import type { Flexibility } from '@/engine/types'
import { ASK_RECIPIENTS, ASK_TEMPLATES, type AskRecipient } from '@/content/askTemplates'
import { Button } from '@/ui/Button'
import { Sheet } from '@/ui/Sheet'
import { formatMoney } from '@/i18n/currency'
import { t } from '@/i18n'
import { play } from '@/audio/sfx'
import { ordinal } from '@/ui/format'

export function FixMyDatesScreen() {
  const { go, monthOver, toast, logAction, screenBefore } = useGameShallow((s) => ({ go: s.go, monthOver: s.monthOver, toast: s.toast, logAction: s.logAction, screenBefore: s.day }))
  const fix = useFix()
  const impact = useImpact()
  const { inputs, step } = fix
  const ready = inputs.incomes.some((i) => i.amount > 0) && inputs.bills.some((b) => b.amount > 0)
  const { response, loading } = useShiftFinder(inputs, fix.excluded, step === 3 && ready)
  const [ask, setAsk] = useState<{ suggestion: Suggestion; change: Change } | null>(null)
  void screenBefore

  const back = () => go(monthOver ? 'results' : 'title')
  const steps: Array<1 | 2 | 3> = [1, 2, 3]

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-paper px-4 pb-6 pt-[max(16px,env(safe-area-inset-top))] text-ink">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">📅 {t('fix.title')}</h1>
        <Button size="sm" variant="ghost" onClick={back}>
          {t('common.back')}
        </Button>
      </div>
      <ol className="mt-2 flex gap-2">
        {steps.map((n) => (
          <li key={n} className="flex-1">
            <button className={`w-full rounded-full py-1 text-xs font-bold ${step === n ? 'bg-marigold text-ink' : step > n ? 'bg-shield/40' : 'bg-ink/10 text-ink/60'}`} onClick={() => fix.setStep(n)}>
              {n}. {t(`fix.step${n}`)}
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-ink/60">{t('app.disclaimer')}</p>

      {step === 1 && (
        <section className="mt-3 space-y-3">
          <div className="rounded-card bg-card p-3 shadow-sm">
            <label className="text-xs font-bold text-ink/60">{t('fix.startingCash')}</label>
            <input className="input mt-1 text-lg font-extrabold" type="number" inputMode="numeric" value={inputs.startingCash || ''} placeholder="0" onChange={(e) => fix.setCash(Number(e.target.value) || 0)} />
          </div>
          <div className="rounded-card bg-card p-3 shadow-sm">
            <h3 className="font-extrabold">{t('fix.incomes')}</h3>
            <ul className="mt-2 space-y-2">
              {inputs.incomes.map((inc) => (
                <li key={inc.id} className="rounded-2xl bg-paper p-2">
                  <div className="flex gap-2">
                    <input className="input flex-1" value={inc.label} onChange={(e) => fix.updateIncome(inc.id, { label: e.target.value })} aria-label={t('fix.label')} />
                    <button className="min-w-[44px] rounded-xl text-ink/50" onClick={() => fix.removeIncome(inc.id)} aria-label={t('fix.remove')}>
                      ✕
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Field label={t('fix.day')}>
                      <input className="input" type="number" min={1} max={28} inputMode="numeric" value={inc.day} onChange={(e) => fix.updateIncome(inc.id, { day: clampDay(e.target.value) })} />
                    </Field>
                    <Field label={t('fix.amount')}>
                      <input className="input" type="number" inputMode="numeric" value={inc.amount || ''} placeholder="0" onChange={(e) => fix.updateIncome(inc.id, { amount: Number(e.target.value) || 0 })} />
                    </Field>
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-xs font-bold text-ink/70">
                    <input type="checkbox" checked={!!inc.irregular} onChange={(e) => fix.updateIncome(inc.id, { irregular: e.target.checked })} /> {t('fix.irregular')}
                  </label>
                </li>
              ))}
            </ul>
            <Button size="sm" className="mt-2 w-full" onClick={fix.addIncome}>
              + {t('fix.addIncome')}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={fix.useExample}>
              👩🏽 {t('fix.useExample')}
            </Button>
            <Button variant="primary" onClick={() => fix.setStep(2)}>
              {t('fix.next')} →
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="mt-3 space-y-3">
          <div className="rounded-card bg-card p-3 shadow-sm">
            <h3 className="font-extrabold">{t('fix.bills')}</h3>
            <p className="text-xs text-ink/60">{t('fix.billsHint')}</p>
            <ul className="mt-2 space-y-2">
              {inputs.bills.map((b) => (
                <li key={b.id} className="rounded-2xl bg-paper p-2">
                  <div className="flex gap-2">
                    <input className="input flex-1" value={b.label} onChange={(e) => fix.updateBill(b.id, { label: e.target.value })} aria-label={t('fix.label')} />
                    <button className="min-w-[44px] rounded-xl text-ink/50" onClick={() => fix.removeBill(b.id)} aria-label={t('fix.remove')}>
                      ✕
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Field label={t('fix.amount')}>
                      <input className="input" type="number" inputMode="numeric" value={b.amount || ''} placeholder="0" onChange={(e) => fix.updateBill(b.id, { amount: Number(e.target.value) || 0 })} />
                    </Field>
                    <Field label={t('fix.dueDay')}>
                      <input className="input" type="number" min={1} max={28} inputMode="numeric" value={b.dueDay} onChange={(e) => fix.updateBill(b.id, { dueDay: clampDay(e.target.value) })} />
                    </Field>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-ink/5 p-1">
                    {(['yes', 'maybe', 'no'] as Flexibility[]).map((f) => (
                      <button key={f} className={`rounded-lg py-1 text-xs font-bold ${b.flexible === f ? 'bg-card shadow-sm' : 'text-ink/60'}`} onClick={() => fix.updateBill(b.id, { flexible: f })}>
                        {t(`flex.${f}`)}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <Button size="sm" className="mt-2 w-full" onClick={fix.addBill}>
              + {t('fix.addBill')}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={() => fix.setStep(1)}>
              ← {t('common.back')}
            </Button>
            <Button variant="primary" disabled={!ready} onClick={() => fix.setStep(3)}>
              {t('fix.find')} →
            </Button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mt-3 space-y-3">
          {!ready && <p className="text-sm text-ink/60">{t('fix.needInputs')}</p>}
          {loading && <p className="animate-pulse text-sm font-bold text-ink/60">{t('fix.searching')}</p>}
          {response && (
            <>
              <div className="rounded-card bg-card p-3 shadow-sm">
                <h3 className="font-extrabold">{t('fix.today')}</h3>
                <p className={`text-sm font-bold ${response.result.baseline.shortfallDays ? 'text-danger' : 'text-green-700'}`}>
                  {t('fix.baselineLine', { days: response.result.baseline.shortfallDays, deepest: formatMoney(Math.max(0, -response.result.baseline.deepest)) })}
                </p>
                <MiniChart before={response.result.baseline.balances} band={response.band} />
                <p className="mt-1 text-[11px] text-ink/50">{t('fix.sixtyDays')}</p>
              </div>
              {response.result.suggestions.length === 0 && <p className="rounded-card bg-card p-3 text-sm shadow-sm">{response.result.baseline.shortfallDays ? t('fix.noFix') : t('fix.nothingToFix')}</p>}
              {response.result.suggestions.map((s, i) => (
                <article key={s.id} className="rounded-card bg-card p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-extrabold">
                      {i + 1}. {s.changes.map((c) => describeChange(c, inputs)).join(' · ')}
                    </h3>
                  </div>
                  <p className="mt-1 text-sm">
                    {t('fix.resultLine', { before: response.result.baseline.shortfallDays, after: s.shortfallDays })}
                    {s.deepest < 0 ? ` ${t('fix.stillDips', { amount: formatMoney(-s.deepest) })}` : ` ${t('fix.staysAbove')}`}
                  </p>
                  {s.delayed && (
                    <p className={`text-xs font-bold ${s.delayed.shortfallDays === 0 ? 'text-green-700' : 'text-amber-700'}`}>
                      {s.delayed.shortfallDays === 0 ? t('fix.lateOk') : t('fix.lateDays', { n: s.delayed.shortfallDays })}
                    </p>
                  )}
                  <MiniChart before={response.result.baseline.balances} after={s.balances} band={response.band} />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const c = s.changes[0]
                        if (c) setAsk({ suggestion: s, change: c })
                      }}
                    >
                      ✉️ {t('fix.writeAsk')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        for (const c of s.changes) fix.saidNo(c.billId)
                        toast(t('fix.reranked'))
                      }}
                    >
                      🙅 {t('fix.saidNo')}
                    </Button>
                  </div>
                </article>
              ))}
              {fix.excluded.length > 0 && (
                <Button variant="ghost" size="sm" className="w-full" onClick={fix.resetExcluded}>
                  ↺ {t('fix.resetNo', { n: fix.excluded.length })}
                </Button>
              )}
              <p className="text-center text-[11px] text-ink/50">{t('fix.tried', { n: response.result.candidatesTried, ms: Math.round(response.elapsedMs) })}</p>
            </>
          )}
          <Button variant="ghost" onClick={() => fix.setStep(2)}>
            ← {t('fix.editBills')}
          </Button>
        </section>
      )}

      <AskBuilderSheet
        open={ask !== null}
        onClose={() => setAsk(null)}
        inputs={inputs}
        change={ask?.change ?? null}
        onCopied={(recipient) => {
          fix.countAsk()
          impact.noteAskCopied()
          if (monthOver) logAction({ type: 'askCopied', target: recipient })
          play('chime')
          toast(t('people.copied'), 'good')
        }}
      />
    </div>
  )
}

function clampDay(v: string): number {
  return Math.min(28, Math.max(1, Number(v) || 1))
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-bold text-ink/60">
      {label}
      {children}
    </label>
  )
}

export function describeChange(c: Change, inputs: RealInputs): string {
  const bill = inputs.bills.find((b) => b.id === c.billId)
  const name = bill?.label ?? c.billId
  if (c.type === 'move') return t('fix.change.move', { name, from: ordinal(c.fromDay), to: ordinal(c.toDay) })
  return t('fix.change.split', { name, first: ordinal(c.days[0]), second: ordinal(c.days[1]) })
}

/** Two-line mini chart: before (grey) vs after (green), optional Monte Carlo band. */
function MiniChart({ before, after, band }: { before: number[]; after?: number[]; band?: Band[] | null }) {
  const W = 340
  const H = 90
  const all = [...before, ...(after ?? []), 0, ...(band ? band.flatMap((b) => [b.p10, b.p90]) : [])]
  const min = Math.min(...all)
  const max = Math.max(...all)
  const n = Math.max(1, before.length - 1)
  const x = (i: number) => (i / n) * W
  const y = (v: number) => (max === min ? H / 2 : 6 + ((max - v) / (max - min)) * (H - 12))
  const path = (vals: number[]) => vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const bandPath = band && band.length ? `${band.map((b, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(b.p90).toFixed(1)}`).join(' ')} ${[...band].reverse().map((b, i) => `L${x(band.length - 1 - i).toFixed(1)},${y(b.p10).toFixed(1)}`).join(' ')} Z` : null
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 h-24 w-full" role="img" aria-label="Before and after balance">
      {bandPath && <path d={bandPath} fill="#6EC6FF" fillOpacity="0.15" />}
      <rect x="0" y={y(0)} width={W} height={Math.max(0, H - y(0))} fill="#FF4D6D" fillOpacity="0.08" />
      <line x1="0" x2={W} y1={y(0)} y2={y(0)} stroke="currentColor" strokeOpacity="0.3" strokeDasharray="3 3" />
      <path d={path(before)} fill="none" stroke="currentColor" strokeOpacity={after ? 0.35 : 0.9} strokeWidth="2" />
      {after && <path d={path(after)} fill="none" stroke="#22a35a" strokeWidth="2.5" />}
    </svg>
  )
}

function AskBuilderSheet({ open, onClose, inputs, change, onCopied }: { open: boolean; onClose: () => void; inputs: RealInputs; change: Change | null; onCopied: (recipient: AskRecipient) => void }) {
  const [recipient, setRecipient] = useState<AskRecipient>('landlord')
  const [edited, setEdited] = useState<string | null>(null)
  const bill = change ? inputs.bills.find((b) => b.id === change.billId) : undefined
  const payday = inputs.incomes.slice().sort((a, b) => b.amount - a.amount)[0]?.day ?? 1
  const toDay = change ? (change.type === 'move' ? change.toDay : change.days[1]) : payday + 1
  const base = ASK_TEMPLATES[recipient]
    .replace('{bill}', bill?.label ?? 'bill')
    .replace('{amount}', formatMoney(bill?.amount ?? 0))
    .replace('{fromDay}', ordinal(bill?.dueDay ?? 1))
    .replace('{toDay}', ordinal(toDay))
    .replace('{payday}', ordinal(payday))
  const text = edited ?? base
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* clipboard may be unavailable */
    }
    onCopied(recipient)
  }
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ text })
      else await navigator.clipboard.writeText(text)
      onCopied(recipient)
    } catch {
      /* user cancelled */
    }
  }
  return (
    <Sheet open={open} onClose={onClose} title={`✉️ ${t('ask.title')}`}>
      <p className="text-xs text-ink/60">{t('ask.hint')}</p>
      <div className="mt-2 grid grid-cols-4 gap-1 rounded-xl bg-ink/5 p-1">
        {ASK_RECIPIENTS.map((r) => (
          <button
            key={r.id}
            className={`rounded-lg py-1.5 text-[11px] font-bold ${recipient === r.id ? 'bg-card shadow-sm' : 'text-ink/60'}`}
            onClick={() => {
              setRecipient(r.id)
              setEdited(null)
            }}
          >
            {r.emoji} {t(r.labelKey)}
          </button>
        ))}
      </div>
      <textarea className="input mt-3 min-h-[180px] text-sm leading-relaxed" value={text} onChange={(e) => setEdited(e.target.value)} aria-label={t('ask.title')} />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="primary" onClick={() => void copy()}>
          📋 {t('ask.copy')}
        </Button>
        <Button onClick={() => void share()}>↗️ {t('ask.share')}</Button>
      </div>
    </Sheet>
  )
}

