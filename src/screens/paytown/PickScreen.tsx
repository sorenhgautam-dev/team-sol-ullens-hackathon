/** Character select: one card per character, with their short story and payday. */
import { useGame } from '@/state/gameStore'
import { useScam } from '@/state/scamStore'
import { CHARACTERS, type CharacterId } from '@/content/characters'
import { Button } from '@/ui/Button'
import { useCash } from '@/ui/useMoney'
import { t } from '@/i18n'
import { play } from '@/audio/sfx'

/** Start a fresh payday run for a character. */
export function startRun(id: CharacterId) {
  const demo = useGame.getState().settings.demoMode
  useScam.getState().start(id, demo ? 1 : Date.now() % 100_000)
  useGame.getState().go('paytown')
}

export function PickScreen() {
  const go = useGame((s) => s.go)
  const cash = useCash()
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-paper px-4 pb-6 pt-[max(16px,env(safe-area-inset-top))] text-ink">
      <div className="flex items-center justify-between">
        <h1 className="text-xl">{t('char.pick')}</h1>
        <Button size="sm" variant="ghost" onClick={() => go('title')}>
          {t('common.back')}
        </Button>
      </div>
      <div className="mt-3 space-y-3">
        {CHARACTERS.map((c) => (
          <button
            key={c.id}
            className="pixel-frame flex w-full items-start gap-3 p-2 text-left"
            onClick={() => {
              play('pop')
              startRun(c.id)
            }}
          >
            <span className="flex h-16 w-16 shrink-0 items-center justify-center bg-card2 text-5xl" aria-hidden>
              {c.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-pixel text-[16px]">{t(c.nameKey)}</span>
              <span className="mt-1 block text-[15px] leading-snug">{t(c.storyKey)}</span>
              <span className="mt-1 block text-[14px] font-bold text-teal">{t('char.paydayLine', { amount: cash(c.payday) })}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
