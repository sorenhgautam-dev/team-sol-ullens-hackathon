/**
 * One building's encounter: a thought, then the message as a realistic call, text or chat
 * (no villain shown), a countdown, three shuffled choices, the money outcome from the
 * ledger, the reveal, and the rule card. "Try again" replays it as practice: the first
 * answer is the one that counts.
 */
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ChoiceDef, EncounterDef } from '@/engine/scamTown'
import { firstAnswers, shuffledChoices, timerFactor, townLedger } from '@/engine/scamTown'
import { useEncounters } from './useEncounters'
import { useGame } from '@/state/gameStore'
import { useScam } from '@/state/scamStore'
import { SCAMMER_COLOUR } from '@/content/scamTown'
import { Sheet } from '@/ui/Sheet'
import { Button } from '@/ui/Button'
import { Balance } from '@/ui/Balance'
import { PxIcon } from '@/ui/PxIcon'
import { RevealStage } from '@/ui/pixel/RevealStage'
import { PixelPortrait } from '@/ui/pixel/PixelPortrait'
import { useCash } from '@/ui/useMoney'
import { useReducedMotion } from '@/state/hooks'
import { usePersonaParams } from './persona'
import { t } from '@/i18n'
import { haptic, play } from '@/audio/sfx'

type Step = 'thought' | 'message' | 'outcome' | 'reveal' | 'rule'

interface Props {
  encounter: EncounterDef | null
  onClose: () => void
}

export function EncounterSheet({ encounter: e, onClose }: Props) {
  const { characterId, seed, answers, answer, shown } = useScam()
  const cash = useCash()
  const { encounters, payday, round } = useEncounters()
  const currency = useGame((s) => s.settings.currency)
  const persona = usePersonaParams()
  const [step, setStep] = useState<Step>('thought')
  const [attempt, setAttempt] = useState(0)
  const [practice, setPractice] = useState(false)
  const [picked, setPicked] = useState<ChoiceDef | null>(null)
  const [linesShown, setLinesShown] = useState(0)
  const [left, setLeft] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [shownBalance, setShownBalance] = useState(0)

  const params = useMemo(() => {
    if (!e) return persona
    const p: Record<string, string | number> = { ...persona }
    for (const [k, v] of Object.entries(e.amounts)) p[k] = cash(v)
    return p
  }, [e, persona, cash])

  // Fresh start each time a building is entered.
  useEffect(() => {
    if (!e) return
    setStep('thought')
    setPractice(firstAnswers(answers, round).some((a) => a.encounterId === e.id))
    setPicked(null)
    setAttempt(shown(e.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e?.id])

  // Message lines arrive one by one; the countdown runs while the player decides.
  useEffect(() => {
    if (!e || step !== 'message') return
    setLinesShown(0)
    setLeft(Math.round(e.timerSeconds * timerFactor(round)))
    setAnswered(false)
    play(e.channel === 'call' ? 'buzz' : 'mailbox')
    haptic([40, 60, 40])
    let n = 0
    const lines = window.setInterval(() => {
      n++
      setLinesShown(n)
      play('tap')
      if (n >= e.lineKeys.length) window.clearInterval(lines)
    }, 900)
    const timer = window.setInterval(() => setLeft((x) => (x > 0 ? x - 1 : 0)), 1000)
    return () => {
      window.clearInterval(lines)
      window.clearInterval(timer)
    }
  }, [e, step, attempt])
  useEffect(() => {
    if (step === 'message' && left > 0 && left <= 5) play('tick')
  }, [left, step])

  if (!e) return null
  const choices = shuffledChoices(e, seed, attempt)
  const ready = linesShown >= e.lineKeys.length

  const choose = (c: ChoiceDef) => {
    if (answered) return
    setAnswered(true)
    setPicked(c)
    const before = townLedger(payday, answers, encounters, round).balance
    setShownBalance(before)
    if (!practice) answer({ encounterId: e.id, choiceId: c.id, round })
    const after = practice ? before : townLedger(payday, [...answers, { encounterId: e.id, choiceId: c.id, round }], encounters, round).balance
    setStep('outcome')
    window.setTimeout(() => setShownBalance(after), 450)
    play(c.loss > 0 ? 'thud' : 'coin')
  }

  const tryAgain = () => {
    setPractice(true)
    setPicked(null)
    setAttempt(shown(e.id))
    setStep('message')
  }

  const lossText = picked && picked.loss > 0 ? cash(Math.min(picked.loss, Math.max(0, shownBalance))) : ''

  return (
    <Sheet open={!!e} height="full" hideClose>
      <div className="flex h-full flex-col overflow-y-auto px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-[max(12px,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between text-[12px] text-ink/70">
          <span className="font-pixel uppercase">{t(`town.building.${e.building}`)}</span>
          {practice && <span className="bg-marigold/30 px-2 py-0.5 font-bold text-ink">{t('town.practice')}</span>}
        </div>

        <AnimatePresence mode="wait">
          {step === 'thought' && (
            <motion.div key="thought" className="flex flex-1 flex-col items-center justify-center gap-4 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div initial={{ y: 6 }} animate={{ y: 0 }} className="bg-card p-1" style={{ boxShadow: '0 0 0 3px var(--frame-dark), 5px 5px 0 3px var(--frame-dark)' }}>
                <PixelPortrait id={characterId} size={96} />
              </motion.div>
              <p className="pixel-frame max-w-[300px] px-2 py-2 text-[19px] leading-snug">“{t(e.thoughtKey, { ...params, payday: cash(payday) })}”</p>
              <Button variant="primary" size="lg" className="w-full" onClick={() => setStep('message')}>
                {t('town.continue')}
              </Button>
            </motion.div>
          )}

          {step === 'message' && (
            <motion.div key={`msg-${attempt}`} className="flex flex-1 flex-col" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <PhoneFrame channel={e.channel} sender={t(e.senderKey, params)} left={left} total={Math.max(1, Math.round(e.timerSeconds * timerFactor(round)))} typing={!ready}>
                {e.lineKeys.slice(0, linesShown).map((k) => (
                  <Bubble key={k} call={e.channel === 'call'}>
                    {linkify(t(k, { ...params, payday: cash(payday) }))}
                  </Bubble>
                ))}
                {ready && e.payKey && <PayScreen kind={e.payStyle ?? 'request'} text={t(e.payKey, params)} />}
              </PhoneFrame>
              <p className="mt-2 text-center text-[14px] font-bold">{left > 0 ? t('town.hurry', { s: left }) : t('town.lastChance')}</p>
              <div className="mt-2 space-y-2">
                {ready &&
                  choices.map((c, i) => (
                    <motion.div key={c.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                      <Button className="w-full !justify-start text-left" style={{ textTransform: 'none', letterSpacing: 0, fontFamily: 'Nunito, system-ui, sans-serif', fontSize: 16 }} onClick={() => choose(c)}>
                        {t(c.labelKey, params)}
                      </Button>
                    </motion.div>
                  ))}
                {!ready && <p className="text-center text-[13px] text-ink/60">{t('town.whatDo')}</p>}
              </div>
            </motion.div>
          )}

          {step === 'outcome' && picked && (
            <motion.div key="outcome" className="flex flex-1 flex-col justify-center gap-3 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div initial={{ scale: 0.92, y: 10 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }} className="bg-card" style={{ boxShadow: '0 0 0 3px var(--frame-dark), 6px 6px 0 3px var(--frame-dark)' }}>
                <div className={`py-1.5 font-pixel text-[14px] uppercase text-white ${picked.loss > 0 ? 'bg-danger' : 'bg-teal'}`}>{picked.loss > 0 ? t('town.lost', { amount: cash(picked.loss) }) : t('town.kept')}</div>
                <div className="flex flex-col items-center gap-2 px-3 pb-4 pt-3">
                  <OutcomeArt lost={picked.loss > 0} />
                  <Balance amountNpr={shownBalance} base={currency} state={picked.loss > 0 ? 'danger' : 'safe'} size="lg" className="!text-5xl" />
              <p className="text-[17px] leading-snug">{practice ? t('town.practiceOut', { outcome: t(picked.outcomeKey, { ...params, loss: cash(picked.loss) }) }) : t(picked.outcomeKey, { ...params, loss: lossText || cash(picked.loss) })}</p>
                </div>
              </motion.div>
              <Button variant="primary" size="lg" className="mt-2 w-full" onClick={() => setStep('reveal')}>
                {t('town.whoWasIt')}
              </Button>
            </motion.div>
          )}

          {step === 'reveal' && picked && (
            <motion.div key="reveal" className="flex flex-1 flex-col items-center justify-center gap-3 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RevealStage color={SCAMMER_COLOUR[e.scammer] ?? '#b23a30'} verdict={picked.verdict} lost={picked.loss > 0} />
              <p className="font-pixel text-lg">{t(`town.verdict.${picked.verdict}`)}</p>
              <Button variant="primary" size="lg" className="w-full" onClick={() => setStep('rule')}>
                {t('town.ruleTitle')}
              </Button>
            </motion.div>
          )}

          {step === 'rule' && (
            <motion.div key="rule" className="flex flex-1 flex-col justify-center gap-3" initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} exit={{ opacity: 0 }}>
              <RuleCard encounter={e} params={params} />
              <div className="grid grid-cols-[1fr_2fr] gap-2">
                <Button onClick={tryAgain}>{t('town.tryAgain')}</Button>
                <Button variant="primary" size="lg" onClick={onClose}>
                  {t('town.continue')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Sheet>
  )
}

/** The rule card: why it was a trap, the rule (big), and one money tip. Also used on the results screen. */
export function RuleCard({ encounter: e, params, compact }: { encounter: EncounterDef; params: Record<string, string | number>; compact?: boolean }) {
  return (
    <div className="pixel-frame p-2 text-ink">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-teal text-white">
          <PxIcon name="shield" />
        </span>
        <span className="font-pixel text-[12px] uppercase">{t(`town.building.${e.building}`)}</span>
      </div>
      <p className="mt-2 text-[19px] font-extrabold leading-snug">{t(e.rule.ruleKey, params)}</p>
      {!compact && (
        <>
          <p className="mt-2 text-[15px] leading-snug">
            <span className="font-bold">{t('town.why')}: </span>
            {t(e.rule.whyKey, params)}
          </p>
          <p className="mt-1 bg-paper p-1 text-[15px] leading-snug">
            <span className="font-bold">{t('town.lesson')}: </span>
            {t(e.rule.lessonKey, params)}
          </p>
        </>
      )}
    </div>
  )
}

/** Coins fly out of the wallet when money is lost; a shield pops in when it is safe. */
function OutcomeArt({ lost }: { lost: boolean }) {
  const reduced = useReducedMotion()
  if (!lost)
    return (
      <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 14 }} className="relative flex h-16 w-16 items-center justify-center bg-teal text-white" style={{ boxShadow: '0 0 0 3px var(--frame-dark)' }} aria-hidden>
        <PxIcon name="shield" size={36} />
        {!reduced && <motion.span className="absolute inset-0" style={{ boxShadow: '0 0 0 3px #18665f' }} animate={{ scale: [1, 1.7], opacity: [0.8, 0] }} transition={{ repeat: 2, duration: 0.9 }} />}
      </motion.div>
    )
  return (
    <div className="relative flex h-16 w-24 items-end justify-center" aria-hidden>
      {!reduced &&
        [0, 1, 2, 3, 4].map((i) => (
          <motion.span key={i} className="absolute bottom-6 text-[#e0a93b]" initial={{ x: 0, y: 0, opacity: 0 }} animate={{ x: (i - 2) * 26, y: -30 - (i % 2) * 12, opacity: [0, 1, 1, 0], rotate: (i - 2) * 25 }} transition={{ duration: 0.9, delay: 0.15 + i * 0.09, ease: 'easeOut' }}>
            <PxIcon name="coin" size={24} />
          </motion.span>
        ))}
      <motion.span className="relative bg-danger p-2 text-white" style={{ boxShadow: '0 0 0 3px var(--frame-dark)' }} animate={reduced ? undefined : { x: [0, -3, 3, -2, 0] }} transition={{ duration: 0.4, delay: 0.1 }}>
        <PxIcon name="wallet" size={36} />
      </motion.span>
    </div>
  )
}

const CHANNEL_TINT: Record<EncounterDef['channel'], string> = { call: '#18665f', text: '#3f7fa6', chat: '#8a5300', payment: '#7e2620' }

/**
 * A pixel phone for calls, texts, chats and payment pages: a status bar, the sender
 * (an initial, never villain art), the countdown, and the messages on a chat wallpaper.
 */
function PhoneFrame({ channel, sender, left, total, typing, children }: { channel: EncounterDef['channel']; sender: string; left: number; total: number; typing: boolean; children: React.ReactNode }) {
  const label = channel === 'call' ? t('town.incomingCall') : channel === 'text' ? t('town.text') : channel === 'payment' ? t('town.paymentPage') : t('town.chat')
  const tint = CHANNEL_TINT[channel]
  const initial = (sender.trim()[0] ?? '?').toUpperCase()
  const callTime = `0:${String(Math.max(0, total - left)).padStart(2, '0')}`
  return (
    <div className="mt-2 flex flex-1 flex-col bg-[#1b130b] px-1.5 pb-2 pt-1" style={{ boxShadow: '0 0 0 3px var(--frame-dark), inset 0 0 0 2px #3a2a1c' }}>
      <div className="flex items-center justify-between px-2 pb-1 font-pixel text-[9px] text-[#e4d2ac]" aria-hidden>
        <span>12:30</span>
        <span className="h-1.5 w-12 bg-[#3a2a1c]" />
        <span className="flex items-end gap-[2px]">
          {[3, 5, 7, 9].map((h) => (
            <span key={h} className="w-[3px] bg-[#e4d2ac]" style={{ height: h }} />
          ))}
          <span className="ml-1 flex h-[9px] w-[15px] border border-[#e4d2ac] p-[1px]">
            <span className="block h-full w-2/3 bg-[#e4d2ac]" />
          </span>
        </span>
      </div>
      <div className="flex flex-1 flex-col" style={{ background: 'radial-gradient(rgba(251,244,226,0.08) 1px, transparent 1.5px) 0 0 / 10px 10px, #2b1d10' }}>
        <div className="flex items-center gap-2 bg-[#3a2a1c] px-2 py-1.5 text-[#fbf4e2]">
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center font-pixel text-[15px] text-white" style={{ background: tint, boxShadow: '0 0 0 2px #1b130b' }} aria-hidden>
            {initial}
            {channel === 'call' && <motion.span className="absolute inset-0" style={{ boxShadow: `0 0 0 2px ${tint}` }} animate={{ scale: [1, 1.6], opacity: [0.9, 0] }} transition={{ repeat: Infinity, duration: 1.2 }} />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] opacity-70">{channel === 'call' ? `${label} · ${callTime}` : label}</div>
            <div className="truncate text-[15px] font-bold">{sender}</div>
          </div>
          <PxIcon name={channel === 'call' ? 'phone' : channel === 'payment' ? 'card' : 'message'} />
        </div>
        <div className="h-1.5 bg-[#3a2a1c]">
          <div className={`h-full ${left <= 5 ? 'bg-danger' : 'bg-marigold'}`} style={{ width: `${(left / total) * 100}%`, transition: 'width 1s linear' }} />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-2">
          {children}
          {typing && <TypingDots />}
        </div>
      </div>
    </div>
  )
}

/** A message bubble with a pixel tail. On a call, the words are captions of what the caller says. */
function Bubble({ call, children }: { call: boolean; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="relative ml-2 max-w-[86%] self-start bg-card px-3 py-2 text-[16px] leading-snug text-ink" style={{ boxShadow: '0 0 0 2px var(--frame-dark)' }}>
      <span aria-hidden className="absolute -left-[8px] bottom-[6px] h-[6px] w-[8px] bg-card" style={{ boxShadow: '-2px 0 0 0 var(--frame-dark), 0 -2px 0 0 var(--frame-dark), 0 2px 0 0 var(--frame-dark)' }} />
      {call && (
        <span className="mr-1 font-pixel text-[11px] text-teal" aria-hidden>
          ))
        </span>
      )}
      {children}
    </motion.div>
  )
}

function TypingDots() {
  return (
    <div className="relative ml-2 flex gap-1 self-start bg-card px-3 py-3" style={{ boxShadow: '0 0 0 2px var(--frame-dark)' }} role="status" aria-label={t('town.typing')}>
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="h-1.5 w-1.5 bg-ink/60" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.12 }} />
      ))}
    </div>
  )
}

/** What the scammer shows: a request to approve, a "payment successful" screenshot, or a card form. */
function PayScreen({ kind, text }: { kind: 'request' | 'screenshot' | 'form'; text: string }) {
  const frame = { boxShadow: '0 0 0 2px var(--frame-dark), 4px 4px 0 0 rgba(0,0,0,0.35)' }
  if (kind === 'screenshot')
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0, rotate: 0 }} animate={{ scale: 1, opacity: 1, rotate: -2 }} className="ml-2 w-[74%] self-start bg-[#fffaf0] p-2 text-center text-ink" style={frame}>
        <div className="text-left text-[10px] font-bold uppercase tracking-wide text-ink/50">{t('town.phone.screenshot')}</div>
        <div className="mx-auto mt-1 flex h-9 w-9 items-center justify-center bg-teal text-white">
          <PxIcon name="check" />
        </div>
        <div className="mt-1 font-pixel text-[11px] uppercase text-teal">{t('town.phone.success')}</div>
        <div className="text-[14px] font-bold">{text}</div>
      </motion.div>
    )
  if (kind === 'form')
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="self-stretch bg-[#fffaf0] p-2 text-ink" style={frame}>
        <div className="flex items-center gap-1 text-[15px] font-bold">
          <PxIcon name="card" /> {text}
        </div>
        <div className="mt-1 text-[11px] text-ink/60">{t('town.phone.cardNumber')}</div>
        <div className="bg-card2 px-2 py-1 font-mono text-[14px] tracking-widest">•••• •••• •••• ____</div>
        <div className="mt-1 grid grid-cols-[1fr_1.2fr] gap-1">
          <div>
            <div className="text-[11px] text-ink/60">{t('town.phone.pin')}</div>
            <div className="bg-card2 px-2 py-1 font-mono text-[14px] tracking-widest">____</div>
          </div>
          <div className="flex items-end">
            <span className="w-full bg-teal py-1.5 text-center font-pixel text-[11px] text-white">{t('town.phone.pay')}</span>
          </div>
        </div>
      </motion.div>
    )
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="self-stretch bg-[#fffaf0] p-2 text-center text-[15px] font-bold text-ink" style={frame}>
      <div className="text-left text-[10px] font-bold uppercase tracking-wide text-ink/50">{t('town.phone.request')}</div>
      <PxIcon name="card" /> {text}
      <div className="mt-1 grid grid-cols-2 gap-1 text-[13px]">
        <span className="bg-teal py-1 text-white">{t('town.phone.approve')}</span>
        <span className="bg-card2 py-1">{t('town.phone.decline')}</span>
      </div>
    </motion.div>
  )
}

/** Show anything that looks like a web address as a link-looking (but inert) span. */
function linkify(text: string) {
  const parts = text.split(/(\S+\.example(?:\/\S*)?)/g)
  return parts.map((p, i) =>
    /\.example/.test(p) ? (
      <span key={i} className="break-all text-[#3f7fa6] underline">
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  )
}
