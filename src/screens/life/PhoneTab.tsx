import { useGameShallow } from '@/state/gameStore'
import { useLived, usePersona } from '@/state/hooks'
import { SCAMS_BY_ID } from '@/content/enemies'
import { Button } from '@/ui/Button'
import { useMoney } from '@/ui/useMoney'
import { t } from '@/i18n'

export function PhoneTab() {
  const lived = useLived()
  const persona = usePersona()
  const money = useMoney()
  const { openSheet, go, readPhone } = useGameShallow((s) => ({ openSheet: s.openSheet, go: s.go, readPhone: s.readPhone }))
  const records = lived.days.flatMap((d) => d.scams).reverse()
  return (
    <div className="h-full space-y-3 overflow-y-auto px-4 pb-4">
      {records.length === 0 && <p className="py-8 text-center text-sm text-ink/50">{t('phone.empty')}</p>}
      <ul className="space-y-2">
        {records.map((r) => {
          const scam = SCAMS_BY_ID[r.scamId]
          if (!scam) return null
          const hook = t(r.personalized && scam.personalHookKey ? scam.personalHookKey : scam.hookKey, persona)
          const unread = r.outcome === 'pending' && !readPhone.includes(r.scamId)
          const status =
            r.outcome === 'pending' ? t('phone.pending') : r.outcome === 'scammed' ? t('phone.scammed', { amount: money(r.loss || scam.comply.cashIn || 0) }) : r.outcome === 'defended' ? t('phone.defended') : t('phone.real')
          const statusCls = r.outcome === 'pending' ? 'bg-marigold/30' : r.outcome === 'scammed' ? 'bg-danger/20 text-danger' : r.outcome === 'defended' ? 'bg-shield/30' : 'bg-ink/10'
          return (
            <li key={`${r.scamId}-${r.day}`}>
              <button className="flex w-full items-start gap-3 rounded-card bg-card p-3 text-left shadow-sm" onClick={() => openSheet(r.outcome === 'pending' ? 'scam' : 'codexEntry', r.scamId)}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl" style={{ background: `${scam.color}22` }}>
                  {scam.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${unread ? 'font-extrabold' : 'font-bold'}`}>{t(scam.senderKey, persona)}</span>
                    <span className="text-[10px] text-ink/50">{t('common.day', { day: r.day })}</span>
                  </span>
                  <span className="line-clamp-2 text-xs text-ink/70">{hook}</span>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${statusCls}`}>{status}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <Button className="w-full" onClick={() => go('codex')}>
        📖 {t('phone.codex')}
      </Button>
    </div>
  )
}
