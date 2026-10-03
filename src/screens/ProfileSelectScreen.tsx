import { useGameShallow } from '@/state/gameStore'
import { PROFILES } from '@/content/profiles'
import { Button } from '@/ui/Button'
import { t } from '@/i18n'

export function ProfileSelectScreen() {
  const { startMonth, go } = useGameShallow((s) => ({ startMonth: s.startMonth, go: s.go }))
  return (
    <div className="flex h-full flex-col bg-paper px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))] text-ink">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">{t('pick.title')}</h1>
        <Button size="sm" variant="ghost" onClick={() => go('title')}>
          {t('common.back')}
        </Button>
      </div>
      <ul className="mt-4 space-y-3">
        {Object.values(PROFILES).map((p) => (
          <li key={p.id}>
            <button className="flex w-full items-center gap-4 rounded-card bg-card p-4 text-left shadow-sm active:scale-[0.99]" onClick={() => startMonth(p.id)}>
              <span className="text-5xl">{p.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-extrabold">{t(p.nameKey)}</span>
                <span className="block text-sm text-ink/70">{t(p.blurbKey)}</span>
              </span>
              <span className="text-xl">›</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-auto text-center text-xs text-ink/50">{t('app.disclaimer')}</p>
    </div>
  )
}
