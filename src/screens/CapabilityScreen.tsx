import { useMemo } from 'react'
import { useGameShallow } from '@/state/gameStore'
import { useFullMonth, useScenario } from '@/state/hooks'
import { capabilityReport } from '@/engine/capability'
import { Button } from '@/ui/Button'
import { t } from '@/i18n'

const EMOJI: Record<string, string> = { forecasting: '🔭', fullCost: '🧮', timing: '📆', verification: '🛡️', buffering: '🪴', fairness: '🤝' }

export function CapabilityScreen() {
  const scenario = useScenario()
  const ledger = useFullMonth()
  const { decisions, go } = useGameShallow((s) => ({ decisions: s.decisions, go: s.go }))
  const report = useMemo(() => capabilityReport(decisions, ledger, scenario), [decisions, ledger, scenario])
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-paper px-4 pb-6 pt-[max(16px,env(safe-area-inset-top))] text-ink">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">🧭 {t('cap.title')}</h1>
        <Button size="sm" variant="ghost" onClick={() => go('results')}>
          {t('common.back')}
        </Button>
      </div>
      <p className="mt-1 text-sm text-ink/70">{t('cap.subtitle')}</p>
      <ul className="mt-4 space-y-2">
        {report.map((r) => (
          <li key={r.id} className="flex items-start gap-3 rounded-card bg-card p-3 shadow-sm">
            <span className="text-2xl">{EMOJI[r.id]}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold">{t(`cap.${r.id}`)}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.status === 'shown' ? 'bg-shield/30 text-green-800' : r.status === 'missed' ? 'bg-marigold/30' : 'bg-ink/10 text-ink/60'}`}>
                  {r.status === 'shown' ? '✓ ' : r.status === 'missed' ? '→ ' : '○ '}
                  {t(`cap.${r.status}`)}
                </span>
              </div>
              <p className="text-sm text-ink/70">{t(r.evidenceKey, r.evidenceParams)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
