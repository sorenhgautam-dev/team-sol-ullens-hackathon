import { useGameShallow } from '@/state/gameStore'
import { useLived, usePersona } from '@/state/hooks'
import { SCAMS, SCAMS_BY_ID } from '@/content/enemies'
import { Button } from '@/ui/Button'
import { t } from '@/i18n'

export function CodexEntry({ scamId }: { scamId: string }) {
  const scam = SCAMS_BY_ID[scamId]
  const persona = usePersona()
  if (!scam) return null
  return (
    <article className="pb-2">
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-full text-3xl" style={{ background: `${scam.color}33`, border: `2px solid ${scam.color}` }}>
          {scam.emoji}
        </span>
        <div>
          <h3 className="text-lg font-extrabold">{t(scam.nameKey)}</h3>
          <p className="text-xs text-ink/60">{t(scam.senderKey, persona)}</p>
        </div>
      </div>
      <Section title={t('scam.how')} body={t(scam.codex.howKey)} />
      {scam.tellKeys.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wide text-ink/50">{t('scam.tells')}</h4>
          <ul className="mt-1 space-y-1 text-sm">
            {scam.tellKeys.map((k) => (
              <li key={k} className="rounded-xl bg-card px-3 py-2 shadow-sm">
                <span className="font-bold">“{t(k)}”</span> <span className="text-ink/70">— {t(`${k}.why`)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Section title={t('scam.do')} body={t(scam.codex.whatToDoKey)} />
      {!scam.decoy && <p className="mt-3 rounded-xl bg-shield/20 px-3 py-2 text-sm font-bold">🛡️ {t('scam.report')}</p>}
    </article>
  )
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-3">
      <h4 className="text-xs font-extrabold uppercase tracking-wide text-ink/50">{title}</h4>
      <p className="mt-1 text-sm">{body}</p>
    </div>
  )
}

export function CodexScreen() {
  const lived = useLived()
  const { go, openSheet, monthOver } = useGameShallow((s) => ({ go: s.go, openSheet: s.openSheet, monthOver: s.monthOver }))
  const met = new Set(lived.days.flatMap((d) => d.scams.map((s) => s.scamId)))
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-paper px-4 pb-6 pt-[max(16px,env(safe-area-inset-top))] text-ink">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">📖 {t('scam.codexTitle')}</h1>
        <Button size="sm" variant="ghost" onClick={() => go(monthOver ? 'results' : 'life')}>
          {t('common.back')}
        </Button>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-2">
        {SCAMS.map((s) => {
          const unlocked = met.has(s.id)
          return (
            <li key={s.id}>
              <button
                className={`flex w-full flex-col items-center rounded-card p-3 text-center shadow-sm ${unlocked ? 'bg-card' : 'bg-ink/5 opacity-70'}`}
                disabled={!unlocked}
                onClick={() => {
                  if (monthOver) go('life')
                  openSheet('codexEntry', s.id)
                }}
              >
                <span className={`flex h-14 w-14 items-center justify-center rounded-full text-3xl ${unlocked ? '' : 'grayscale'}`} style={{ background: `${s.color}33`, border: `2px solid ${unlocked ? s.color : '#99999955'}` }}>
                  {unlocked ? s.emoji : '❔'}
                </span>
                <span className="mt-2 text-sm font-extrabold">{unlocked ? t(s.nameKey) : t('scam.locked')}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-4 text-center text-xs text-ink/60">{t('scam.report')}</p>
    </div>
  )
}
