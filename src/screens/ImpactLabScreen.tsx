import { useState } from 'react'
import { useGameShallow } from '@/state/gameStore'
import { useImpact, summarise } from '@/state/impactStore'
import { IMPACT_STATEMENTS } from '@/content/impactQuestions'
import { Button } from '@/ui/Button'
import { t } from '@/i18n'

function Likert({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="mt-2 grid grid-cols-5 gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} className={`min-h-[44px] rounded-xl text-sm font-extrabold ${value === n ? 'bg-marigold text-ink' : 'bg-ink/5 text-ink/70'}`} onClick={() => onChange(n)} aria-pressed={value === n}>
          {n}
        </button>
      ))}
    </div>
  )
}

function Statements({ answers, setAnswers }: { answers: number[]; setAnswers: (a: number[]) => void }) {
  return (
    <ol className="mt-3 space-y-3">
      {IMPACT_STATEMENTS.map((q, i) => (
        <li key={q.id} className="rounded-card bg-card p-3 shadow-sm">
          <p className="text-sm font-bold">{t(q.key)}</p>
          <div className="mt-1 flex justify-between text-[10px] text-ink/50">
            <span>{t('impact.disagree')}</span>
            <span>{t('impact.agree')}</span>
          </div>
          <Likert value={answers[i] ?? 0} onChange={(v) => setAnswers(answers.map((a, j) => (j === i ? v : a)))} />
        </li>
      ))}
    </ol>
  )
}

/** Impact Lab home: summary of local tester sessions + start a new one. */
export function ImpactLabScreen() {
  const { go, toast } = useGameShallow((s) => ({ go: s.go, toast: s.toast }))
  const impact = useImpact()
  const sum = summarise(impact.sessions)
  const copy = async () => {
    const text = [
      `Next Payday · Impact Lab summary`,
      `Testers: ${sum.testers} (finished: ${sum.finished})`,
      `Average pre-check score: ${sum.avgPre} / 15`,
      `Average post-check score: ${sum.avgPost} / 15`,
      `Found a shortfall they did not know about: ${sum.hiddenFound} of ${sum.finished}`,
      `Would send the request: ${sum.wouldSend} of ${sum.finished}`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      toast(t('people.copied'), 'good')
    } catch {
      toast(text)
    }
  }
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-paper px-4 pb-6 pt-[max(16px,env(safe-area-inset-top))] text-ink">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">🧪 {t('impact.title')}</h1>
        <Button size="sm" variant="ghost" onClick={() => go('settings')}>
          {t('common.back')}
        </Button>
      </div>
      <p className="mt-1 text-sm text-ink/70">{t('impact.intro')}</p>
      <section className="mt-3 grid grid-cols-2 gap-2">
        <Stat label={t('impact.testers')} value={`${sum.testers}`} />
        <Stat label={t('impact.prePost')} value={`${sum.avgPre} → ${sum.avgPost}`} />
        <Stat label={t('impact.hidden')} value={sum.finished ? `${sum.hiddenFound} / ${sum.finished}` : '–'} />
        <Stat label={t('impact.wouldSend')} value={sum.finished ? `${sum.wouldSend} / ${sum.finished}` : '–'} />
      </section>
      <div className="mt-4 space-y-2">
        <Button variant="primary" size="lg" className="w-full" onClick={() => go('impactPre')}>
          ▶️ {t('impact.start')}
        </Button>
        {impact.activeId && (
          <Button className="w-full" onClick={() => go('impactPost')}>
            ✅ {t('impact.finishActive')}
          </Button>
        )}
        <Button className="w-full" onClick={() => void copy()}>
          📋 {t('impact.copy')}
        </Button>
        <Button variant="ghost" size="sm" className="w-full" onClick={() => window.confirm(t('impact.clearConfirm')) && impact.clear()}>
          {t('impact.clear')}
        </Button>
      </div>
      <p className="mt-auto text-center text-xs text-ink/50">{t('impact.local')}</p>
    </div>
  )
}

export function ImpactPreScreen() {
  const { go, startMonth } = useGameShallow((s) => ({ go: s.go, startMonth: s.startMonth }))
  const impact = useImpact()
  const [answers, setAnswers] = useState<number[]>([0, 0, 0])
  const complete = answers.every((a) => a > 0)
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-paper px-4 pb-6 pt-[max(16px,env(safe-area-inset-top))] text-ink">
      <h1 className="text-2xl font-extrabold">{t('impact.preTitle')}</h1>
      <p className="mt-1 text-sm text-ink/70">{t('impact.preHint')}</p>
      <Statements answers={answers} setAnswers={setAnswers} />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="ghost" onClick={() => go('impact')}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="primary"
          disabled={!complete}
          onClick={() => {
            impact.start(answers)
            startMonth('sita')
          }}
        >
          🎮 {t('impact.play')}
        </Button>
      </div>
    </div>
  )
}

export function ImpactPostScreen() {
  const { go } = useGameShallow((s) => ({ go: s.go }))
  const impact = useImpact()
  const [answers, setAnswers] = useState<number[]>([0, 0, 0])
  const [hidden, setHidden] = useState<boolean | null>(null)
  const [send, setSend] = useState<boolean | null>(null)
  const complete = answers.every((a) => a > 0) && hidden !== null && send !== null
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-paper px-4 pb-6 pt-[max(16px,env(safe-area-inset-top))] text-ink">
      <h1 className="text-2xl font-extrabold">{t('impact.postTitle')}</h1>
      <Statements answers={answers} setAnswers={setAnswers} />
      <YesNo label={t('impact.foundHidden')} value={hidden} onChange={setHidden} />
      <YesNo label={t('impact.wouldSendQ')} value={send} onChange={setSend} />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="ghost" onClick={() => go('impact')}>
          {t('common.back')}
        </Button>
        <Button
          variant="primary"
          disabled={!complete}
          onClick={() => {
            impact.finish(answers, hidden === true, send === true)
            go('impact')
          }}
        >
          {t('impact.save')}
        </Button>
      </div>
    </div>
  )
}

function YesNo({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="mt-3 rounded-card bg-card p-3 shadow-sm">
      <p className="text-sm font-bold">{label}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button size="sm" variant={value === true ? 'primary' : 'secondary'} onClick={() => onChange(true)}>
          {t('impact.yes')}
        </Button>
        <Button size="sm" variant={value === false ? 'primary' : 'secondary'} onClick={() => onChange(false)}>
          {t('impact.no')}
        </Button>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card bg-card p-3 shadow-sm">
      <div className="text-[11px] font-bold text-ink/60">{label}</div>
      <div className="text-xl font-extrabold tabular-nums">{value}</div>
    </div>
  )
}
