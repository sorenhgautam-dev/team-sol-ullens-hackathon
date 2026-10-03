import { useState } from 'react'
import { motion } from 'framer-motion'
import { useDrag } from '@use-gesture/react'
import { useGame } from '@/state/gameStore'
import { useScenario } from '@/state/hooks'
import { Sheet } from '@/ui/Sheet'
import { Button } from '@/ui/Button'
import { choiceCost } from '@/ui/describe'
import { t } from '@/i18n'
import { play, haptic } from '@/audio/sfx'

interface Props {
  open: boolean
  eventId: string | null
}

/** Modal event card: emoji illustration, 2–4 choices with visible immediate cost. Swipe left/right or tap. */
export function EventCard({ open, eventId }: Props) {
  const scenario = useScenario()
  const decideEvent = useGame((s) => s.decideEvent)
  const ev = scenario.events.find((e) => e.id === eventId)
  const [dx, setDx] = useState(0)

  const choose = (choiceId: string) => {
    const c = ev?.choices.find((x) => x.id === choiceId)
    const spends = c?.effects.some((fx) => fx.kind === 'spend' || fx.kind === 'recurring')
    play(spends ? 'thud' : 'coin')
    haptic(spends ? [30, 20, 30] : 20)
    setDx(0)
    if (ev) decideEvent(ev.id, choiceId)
  }

  const bind = useDrag(
    ({ down, movement: [mx], last }) => {
      if (!ev || ev.choices.length < 2) return
      setDx(down ? mx : 0)
      if (last && Math.abs(mx) > 90) {
        const target = mx < 0 ? ev.choices[0] : ev.choices[1]
        if (target) choose(target.id)
      }
    },
    { axis: 'x', filterTaps: true },
  )

  return (
    <Sheet open={open && !!ev} height="tall" hideClose>
      {ev && (
        <div className="pb-2">
          <motion.div
            {...(bind() as object)}
            style={{ x: dx, rotate: dx / 30, touchAction: 'pan-y' }}
            className="relative mx-auto mt-1 w-full rounded-card bg-card p-5 text-center shadow-lg"
          >
            {ev.choices.length >= 2 && (
              <>
                <span className={`absolute left-3 top-3 rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-bold text-ink/60 transition-opacity ${dx < -30 ? 'opacity-100' : 'opacity-40'}`}>← {t(ev.choices[0]!.labelKey)}</span>
                <span className={`absolute right-3 top-3 rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-bold text-ink/60 transition-opacity ${dx > 30 ? 'opacity-100' : 'opacity-40'}`}>{t(ev.choices[1]!.labelKey)} →</span>
              </>
            )}
            <div className="mt-4 text-6xl leading-none" aria-hidden>
              {ev.emoji}
            </div>
            <h2 className="mt-3 text-xl font-extrabold">{t(ev.titleKey)}</h2>
            <p className="mt-2 text-sm text-ink/70">{t(ev.textKey)}</p>
          </motion.div>
          <div className="mt-4 space-y-2">
            {ev.choices.map((c) => (
              <Button key={c.id} variant="secondary" className="w-full justify-between text-left" onClick={() => choose(c.id)}>
                <span>{t(c.labelKey)}</span>
                <span className="shrink-0 text-xs font-bold text-ink/60">{choiceCost(c)}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  )
}
