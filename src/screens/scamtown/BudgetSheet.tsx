/**
 * A simple budget helper from the HUD: money in, needs (rent, food, other bills), wants
 * and savings, then "Left over" or "Short by". It starts from the game's numbers and the
 * player can type their own. Nothing is saved or sent anywhere.
 */
import { useState } from 'react'
import { Sheet } from '@/ui/Sheet'
import { Button } from '@/ui/Button'
import { useCash } from '@/ui/useMoney'
import { t } from '@/i18n'

interface Props {
  open: boolean
  onClose: () => void
  money: number
  rent: number
  food: number
}

export function BudgetSheet({ open, onClose, money, rent, food }: Props) {
  const cash = useCash()
  const [typed, setTyped] = useState<Record<string, string>>({})
  const num = (key: string, fallback: number) => {
    const v = typed[key]
    if (v === undefined || v.trim() === '') return fallback
    const n = Number(v.replace(/[^0-9.]/g, ''))
    return Number.isFinite(n) ? n : 0
  }
  const moneyIn = num('in', money)
  const needs = num('rent', rent) + num('food', food) + num('bills', 0)
  const wants = num('wants', 0)
  const savings = num('save', 0)
  const left = moneyIn - needs - wants - savings
  const field = (key: string, label: string, fallback: number) => (
    <label key={key} className="flex items-center justify-between gap-3 py-1">
      <span className="text-[17px] font-bold">{label}</span>
      <input inputMode="decimal" className="input !w-32 text-right text-[18px] tabular-nums" value={typed[key] ?? String(fallback)} onChange={(e) => setTyped({ ...typed, [key]: e.target.value })} aria-label={label} />
    </label>
  )
  return (
    <Sheet open={open} onClose={onClose} title={t('budget.title')}>
      <div className="space-y-1 px-1 pb-4 text-ink">
        {field('in', t('budget.in'), money)}
        <p className="pt-2 font-pixel text-[11px] uppercase text-ink/60">{t('budget.needs')}</p>
        {field('rent', t('budget.rent'), rent)}
        {field('food', t('budget.food'), food)}
        {field('bills', t('budget.bills'), 0)}
        <p className="pt-2 font-pixel text-[11px] uppercase text-ink/60">{t('budget.other')}</p>
        {field('wants', t('budget.wants'), 0)}
        {field('save', t('budget.savings'), 0)}
        <div className={`mt-3 p-3 text-center font-pixel text-[22px] ${left >= 0 ? 'bg-teal text-white' : 'bg-danger text-white'}`}>{left >= 0 ? t('budget.left', { amount: cash(left) }) : t('budget.short', { amount: cash(-left) })}</div>
        <div className="mt-3 bg-card2 p-2 text-[15px] leading-snug">
          <p className="font-bold">{t('budget.guide')}</p>
          <p className="mt-1">{t('budget.guideFor', { needs: cash(moneyIn * 0.5), wants: cash(moneyIn * 0.3), save: cash(moneyIn * 0.2) })}</p>
        </div>
        <Button variant="ghost" className="mt-2 w-full" onClick={() => setTyped({})}>
          {t('budget.reset')}
        </Button>
        <p className="text-center text-[12px] text-ink/60">{t('budget.note')}</p>
      </div>
    </Sheet>
  )
}
