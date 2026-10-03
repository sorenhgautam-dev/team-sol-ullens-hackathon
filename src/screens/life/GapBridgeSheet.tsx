import { useEffect } from 'react'
import { useGameShallow } from '@/state/gameStore'
import { useForecast, useGap, useProfile, useScenario } from '@/state/hooks'
import { quoteBridge, resolveRepayDay, scheduleIncomes } from '@/engine/simulate'
import { Sheet } from '@/ui/Sheet'
import { Button } from '@/ui/Button'
import { useMoney } from '@/ui/useMoney'
import { t } from '@/i18n'
import { play } from '@/audio/sfx'

interface Props {
  open: boolean
  onClose: () => void
}

/** Every option shows money cost, future obligation and non-money cost. All numbers from the engine. */
export function GapBridgeSheet({ open, onClose }: Props) {
  const scenario = useScenario()
  const profile = useProfile()
  const forecast = useForecast()
  const gap = useGap()
  const money = useMoney()
  const { day, seed, decisions, logAction, toast } = useGameShallow((s) => ({ day: s.day, seed: s.seed, decisions: s.decisions, logAction: s.logAction, toast: s.toast }))

  useEffect(() => {
    if (open && !decisions.some((a) => a.type === 'bridgeOptionsViewed' && a.day === day)) logAction({ type: 'bridgeOptionsViewed' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, day])

  const incomes = scheduleIncomes(profile, seed, scenario.days)
  const amount = gap.amountNeeded
  const nextDue = (billId: string) => forecast.days.find((d) => d.day > day && d.entries.some((e) => e.kind === 'bill' && e.ref?.id === billId))

  return (
    <Sheet open={open} onClose={onClose} title={`🏦 ${t('bridge.title')}`}>
      <p className="text-sm text-ink/70">{t('bridge.subtitle')}</p>
      {amount > 0 && gap.firstDay ? (
        <p className="mt-1 text-sm font-bold text-danger">{t('bridge.gapLine', { amount: money(amount), from: gap.firstDay, to: gap.lastDay ?? gap.firstDay })}</p>
      ) : (
        <p className="mt-1 text-sm font-bold text-green-700">{t('bridge.noGap')}</p>
      )}
      <ul className="mt-3 space-y-2">
        {scenario.bridges.map((opt) => {
          const repayDay = resolveRepayDay(opt, incomes, profile, day)
          let quote: ReturnType<typeof quoteBridge> | null = null
          let unavailableKey: string | null = null
          if (opt.requiresFormalCredit && !profile.hasFormalCredit) unavailableKey = 'blocked.noFormalCredit'
          if (opt.mechanism === 'deferBill') {
            const due = opt.billId ? nextDue(opt.billId) : undefined
            const billAmount = due?.entries.find((e) => e.kind === 'bill' && e.ref?.id === opt.billId)?.amount
            if (!due || billAmount === undefined) unavailableKey = 'blocked.alreadyPaid'
            else quote = quoteBridge(opt, -billAmount, due.day, Math.max(repayDay, due.day + 1))
          } else if (amount > 0) {
            quote = quoteBridge(opt, amount, day, repayDay)
          } else unavailableKey = 'bridge.noGap'
          const disabled = !!unavailableKey || !quote
          return (
            <li key={opt.id} className={`rounded-card bg-card p-3 shadow-sm ${disabled ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{opt.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-extrabold">{t(opt.nameKey)}</h4>
                    {opt.aprPercent !== undefined && <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-bold text-ink/60">{t('bridge.apr', { apr: `${opt.aprPercent}%` })}</span>}
                  </div>
                  {quote && (
                    <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs">
                      <dt className="font-bold text-ink/60">{t('bridge.moneyCost')}</dt>
                      <dd className={`font-extrabold tabular-nums ${quote.fee > 0 ? 'text-danger' : 'text-green-700'}`}>{money(quote.fee)}</dd>
                      <dt className="font-bold text-ink/60">{t('bridge.futureCost')}</dt>
                      <dd className="tabular-nums">
                        {opt.mechanism === 'deferBill' ? t('bridge.paidOn', { day: quote.repayDay }) : t('bridge.repayOn', { amount: money(quote.repayTotal), day: quote.repayDay })}
                      </dd>
                      <dt className="font-bold text-ink/60">{t('bridge.hiddenCost')}</dt>
                      <dd className="text-ink/80">{t(opt.hiddenCostKey)}</dd>
                    </dl>
                  )}
                  {unavailableKey && <p className="mt-1 text-xs text-ink/60">{t(unavailableKey)}</p>}
                </div>
              </div>
              <Button
                size="sm"
                variant={quote && quote.fee === 0 ? 'shield' : 'secondary'}
                className="mt-2 w-full"
                disabled={disabled}
                onClick={() => {
                  if (!quote) return
                  const r = logAction({ type: 'bridge', optionId: opt.id, amount: opt.mechanism === 'deferBill' ? quote.amount : amount }, 'bridge')
                  if (r.ok) {
                    play('coin')
                    toast(`${t(opt.nameKey)}: ${t('common.applied')}`, 'good')
                    onClose()
                  } else toast(r.reasonKey ? t(r.reasonKey) : t('common.blocked'), 'bad')
                }}
              >
                {disabled ? t('bridge.unavailable') : t('bridge.choose')}
              </Button>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-center text-xs text-ink/50">{t('bridge.illustrative')}</p>
    </Sheet>
  )
}
