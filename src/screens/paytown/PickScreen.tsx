/**
 * Character select, after the team's design: a card per citizen with a pixel portrait,
 * name, role, short story, payday and the scams that often target people like them.
 * Tap a card to select it, then start. The NAME is the player's choice (pencil button):
 * the story, job and pay stay the same, and every scam message uses the chosen name.
 */
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '@/state/gameStore'
import { useScam } from '@/state/scamStore'
import { CHARACTERS, CHARACTERS_BY_ID, NAME_MAX, cleanName, type Character, type CharacterId } from '@/content/characters'
import { paydayFor } from '@/content/economy'
import { Button } from '@/ui/Button'
import { PxIcon, type IconName } from '@/ui/PxIcon'
import { drawOutlined } from '@/ui/pixel/sprites'
import { drawPortrait } from '@/ui/pixel/portraits'
import { useCash } from '@/ui/useMoney'
import { useCharacterName } from './persona'
import { t } from '@/i18n'
import { play } from '@/audio/sfx'

/** Start a fresh payday run for a character. */
export function startRun(id: CharacterId) {
  const demo = useGame.getState().settings.demoMode
  useScam.getState().start(id, demo ? 1 : Date.now() % 100_000)
  useGame.getState().go('paytown')
}

const FOCUS_ICON: Record<CharacterId, IconName> = { sita: 'phone', bikash: 'qr', aarav: 'trend' }

export function PickScreen() {
  const go = useGame((s) => s.go)
  const [picked, setPicked] = useState<CharacterId | null>(null)
  const pickedName = useCharacterName(picked ?? 'sita')
  return (
    <div className="relative flex h-full flex-col bg-paper text-ink" style={{ backgroundImage: 'linear-gradient(rgba(43,29,16,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(43,29,16,0.05) 1px, transparent 1px)', backgroundSize: '12px 12px' }}>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-[max(14px,env(safe-area-inset-top))]">
        <header className="flex items-center justify-between gap-2">
          <h1 className="flex items-center gap-2 text-[17px]">
            <span className="inline-block h-3 w-3 bg-ink" aria-hidden />
            {t('char.pick')}
          </h1>
          <Button size="sm" onClick={() => go('title')} aria-label={t('common.back')}>
            <PxIcon name="chevronLeft" size={12} /> {t('common.back')}
          </Button>
        </header>

        <div className="mt-3 flex items-center gap-2 pixel-inset px-1 py-0.5 text-[13px]">
          <PxIcon name="shield" size={12} />
          <span className="min-w-0 flex-1">{t('char.info')}</span>
          <span className="bg-ink px-2 py-0.5 font-pixel text-[10px] uppercase text-card">{t('char.heroes', { n: CHARACTERS.length })}</span>
        </div>

        <div className="mt-3 space-y-3" role="radiogroup" aria-label={t('char.pick')}>
          {CHARACTERS.map((c) => (
            <CitizenCard key={c.id} c={c} selected={picked === c.id} onSelect={() => setPicked(c.id)} />
          ))}
        </div>

        <div className="mt-3 flex items-center justify-center gap-2 pixel-inset px-1 py-1 text-[13px]">
          <PxIcon name="pin" size={12} /> {t('char.destination')}
        </div>
      </div>

      <div className="px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2">
        {picked ? (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => {
              play('coin')
              startRun(picked)
            }}
          >
            {t('char.startAs', { name: pickedName })} <PxIcon name="chevronRight" size={12} />
          </Button>
        ) : (
          <div className="flex min-h-[56px] w-full items-center justify-center gap-2 bg-[#4a3a2a] font-pixel text-[15px] uppercase tracking-wide text-[#e4d2ac]" style={{ boxShadow: '0 0 0 2px var(--frame-dark), 0 4px 0 2px var(--frame-dark)' }} aria-disabled>
            {t('char.select')} <PxIcon name="chevronRight" size={12} />
          </div>
        )}
        <div className="mt-2 flex items-center justify-between text-[11px] text-ink/60">
          <span className="flex items-center gap-1">
            <PxIcon name="lock" size={12} /> {t('char.educational')}
          </span>
          <span>{t('char.version')}</span>
        </div>
      </div>
    </div>
  )
}

function CitizenCard({ c, selected, onSelect }: { c: Character; selected: boolean; onSelect: () => void }) {
  const currency = useGame((s) => s.settings.currency)
  const setName = useScam((s) => s.setName)
  const cash = useCash()
  const name = useCharacterName(c.id)
  const custom = useScam((s) => s.names[c.id])
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (editing) input.current?.focus()
  }, [editing])
  const save = () => {
    setName(c.id, cleanName(draft))
    setEditing(false)
    play('pop')
  }
  return (
    <motion.div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={() => {
        if (!editing) {
          onSelect()
          play('tap')
        }
      }}
      onKeyDown={(e) => {
        if (!editing && (e.key === 'Enter' || e.key === ' ')) onSelect()
      }}
      animate={{ y: selected ? -2 : 0 }}
      className="relative cursor-pointer pixel-frame p-1"
      style={{ boxShadow: selected ? '0 0 0 3px var(--frame-dark), 5px 5px 0 3px var(--frame-dark)' : '3px 3px 0 0 rgba(43,29,16,0.35)' }}
    >
      <span className="absolute right-1 top-1 bg-sky/40 px-2 py-0.5 text-[12px] font-bold tabular-nums">{cash(paydayFor(currency, c.id))}</span>
      <div className="flex gap-3">
        <Portrait id={c.id} badge={t(c.badgeKey)} />
        <div className="min-w-0 flex-1 pr-1">
          {editing ? (
            <form
              className="flex items-center gap-1 pr-16"
              onClick={(e) => e.stopPropagation()}
              onSubmit={(e) => {
                e.preventDefault()
                save()
              }}
            >
              <input
                ref={input}
                className="input !w-auto min-w-0 flex-1 text-[15px]"
                value={draft}
                maxLength={NAME_MAX}
                placeholder={t('char.namePlaceholder')}
                aria-label={t('char.rename')}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
              />
              <Button size="sm" variant="primary" type="submit">
                {t('char.nameSave')}
              </Button>
            </form>
          ) : (
            <div className="flex items-center gap-1 pr-20">
              <span className="truncate font-pixel text-[22px] leading-none">{name}</span>
              <button
                className="flex h-8 w-8 shrink-0 items-center justify-center text-ink/70"
                onClick={(e) => {
                  e.stopPropagation()
                  setDraft(custom ?? '')
                  setEditing(true)
                }}
                aria-label={t('char.rename')}
              >
                <PxIcon name="pencil" size={12} />
              </button>
            </div>
          )}
          {editing && (
            <p className="mt-1 text-[11px] text-ink/60" onClick={(e) => e.stopPropagation()}>
              {t('char.nameHint')}{' '}
              {custom && (
                <button
                  className="font-bold text-teal underline"
                  onClick={() => {
                    setName(c.id, '')
                    setEditing(false)
                  }}
                >
                  {t('char.nameReset', { name: t(CHARACTERS_BY_ID[c.id].nameKey) })}
                </button>
              )}
            </p>
          )}
          <div className="mt-1 text-[11px] font-extrabold uppercase tracking-wide text-teal">{t(c.roleKey)}</div>
          <p className="mt-1 text-[14px] leading-snug">{t(c.storyKey, { name, relative: t(c.persona.relative) })}</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 border-t-2 border-ink/10 pt-2">
        <span className="flex items-center gap-1 bg-teal px-2 py-1 font-pixel text-[11px] uppercase text-white">
          <PxIcon name="coins" size={12} /> {t('char.paydayFreq', { freq: t(c.freqKey) })}
        </span>
        <span className="flex items-center gap-1 bg-card2 px-2 py-1 text-[12px] font-bold">
          <PxIcon name={FOCUS_ICON[c.id]} size={12} /> {t(c.focusKey)}
        </span>
      </div>
    </motion.div>
  )
}

function Portrait({ id, badge }: { id: CharacterId; badge: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, 32, 32)
    drawOutlined(ctx, 1, 1, 30, 30, (c) => drawPortrait(c, id))
  }, [id])
  return (
    <div className="relative h-[72px] w-[72px] shrink-0" style={{ boxShadow: '0 0 0 3px var(--frame-dark)' }}>
      <canvas ref={ref} width={32} height={32} className="pixelated block h-full w-full" aria-hidden />
      <span className="absolute -bottom-2 right-[-6px] bg-ink px-1 font-pixel text-[9px] text-[#f5c26b]">{badge}</span>
    </div>
  )
}
