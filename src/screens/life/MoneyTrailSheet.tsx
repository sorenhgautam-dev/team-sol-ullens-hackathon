import { useLived } from '@/state/hooks'
import { Sheet } from '@/ui/Sheet'
import { useMoney } from '@/ui/useMoney'
import { t } from '@/i18n'

export function MoneyTrailSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const lived = useLived()
  const money = useMoney()
  const days = [...lived.days].reverse().filter((d) => d.entries.length > 0)
  return (
    <Sheet open={open} onClose={onClose} title={`🧾 ${t('trail.title')}`}>
      <div className="space-y-3">
        {days.map((d) => (
          <section key={d.day}>
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wide text-ink/50">
              <span>{t('common.day', { day: d.day })}</span>
              <span className={`tabular-nums ${d.balance < 0 ? 'text-danger' : ''}`}>{money(d.balance)}</span>
            </div>
            <ul className="mt-1 divide-y divide-ink/5 rounded-card bg-card px-3 shadow-sm">
              {d.entries.map((e, i) => (
                <li key={i} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    {e.emoji} {t(e.labelKey)}
                  </span>
                  <span className={`font-bold tabular-nums ${e.amount >= 0 ? 'text-green-700' : ''}`}>
                    {e.amount >= 0 ? '+' : '−'}
                    {money(Math.abs(e.amount))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Sheet>
  )
}
