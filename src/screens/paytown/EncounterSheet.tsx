/**
 * One building's encounter: a thought, then the message as a realistic call, text or chat
 * (no villain shown), a countdown, three shuffled choices, the money outcome from the
 * ledger, the reveal, and the rule card. "Try again" replays it as practice: the first
 * answer is the one that counts.
 */
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ChoiceDef, EncounterDef } from '@/engine/scamTown'
import { shuffledChoices, townLedger } from '@/engine/scamTown'
import { useEncounters } from './useEncounters'
import { useGame } from '@/state/gameStore'
import { CHARACTERS_BY_ID } from '@/content/characters'
import { SCAMS_BY_ID } from '@/content/enemies'
import { useScam } from '@/state/scamStore'
import { Sheet } from '@/ui/Sheet'
import { Button } from '@/ui/Button'
import { Balance } from '@/ui/Balance'
import { PxIcon } from '@/ui/PxIcon'
import { RevealStage } from '@/ui/pixel/RevealStage'
import { useCash } from '@/ui/useMoney'
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
  const ch = CHARACTERS_BY_ID[characterId]
  const cash = useCash()
  const { encounters, payday } = useEncounters()
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
    setPractice(answers.some((a) => a.encounterId === e.id))
    setPicked(null)
    setAttempt(shown(e.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e?.id])

  // Message lines arrive one by one; the countdown runs while the player decides.
  useEffect(() => {
    if (!e || step !== 'message') return
    setLinesShown(0)
    setLeft(e.timerSeconds)
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
  const scam = SCAMS_BY_ID[e.scammer]

  const choose = (c: ChoiceDef) => {
    if (answered) return
    setAnswered(true)
    setPicked(c)
    const before = townLedger(payday, answers, encounters).balance
    setShownBalance(before)
    if (!practice) answer({ encounterId: e.id, choiceId: c.id })
    const after = practice ? before : townLedger(payday, [...answers, { encounterId: e.id, choiceId: c.id }], encounters).balance
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
              <span className="text-6xl" aria-hidden>
                {ch.emoji}
              </span>
              <p className="pixel-frame max-w-[300px] px-2 py-2 text-[19px] leading-snug">“{t(e.thoughtKey, { ...params, payday: cash(payday) })}”</p>
              <Button variant="primary" size="lg" className="w-full" onClick={() => setStep('message')}>
                {t('town.continue')}
              </Button>
            </motion.div>
          )}

          {step === 'message' && (
            <motion.div key={`msg-${attempt}`} className="flex flex-1 flex-col" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <PhoneFrame channel={e.channel} sender={t(e.senderKey, params)} left={left} total={e.timerSeconds}>
                {e.lineKeys.slice(0, linesShown).map((k) => (
                  <motion.p key={k} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-[88%] self-start bg-card px-3 py-2 text-[16px] leading-snug text-ink" style={{ boxShadow: '0 0 0 2px var(--frame-dark)' }}>
                    {linkify(t(k, { ...params, payday: cash(payday) }))}
                  </motion.p>
                ))}
                {ready && e.payKey && (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="self-stretch bg-paper p-2 text-center text-[15px] font-bold text-ink" style={{ boxShadow: '0 0 0 2px var(--frame-dark)' }}>
                    <PxIcon name="card" /> {t(e.payKey, params)}
                    <div className="mt-1 grid grid-cols-2 gap-1 text-[13px]">
                      <span className="bg-teal py-1 text-white">APPROVE</span>
                      <span className="bg-card2 py-1">DECLINE</span>
                    </div>
                  </motion.div>
                )}
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
            <motion.div key="outcome" className="flex flex-1 flex-col items-center justify-center gap-3 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Balance amountNpr={shownBalance} base={currency} state={picked.loss > 0 ? 'danger' : 'safe'} size="lg" className="!text-5xl" />
              <p className={`font-pixel text-lg ${picked.loss > 0 ? 'text-danger' : 'text-teal'}`}>{picked.loss > 0 ? t('town.lost', { amount: cash(picked.loss) }) : t('town.kept')}</p>
              <p className="text-[17px] leading-snug">{practice ? t('town.practiceOut', { outcome: t(picked.outcomeKey, { ...params, loss: cash(picked.loss) }) }) : t(picked.outcomeKey, { ...params, loss: lossText || cash(picked.loss) })}</p>
              <Button variant="primary" size="lg" className="mt-2 w-full" onClick={() => setStep('reveal')}>
                {t('town.whoWasIt')}
              </Button>
            </motion.div>
          )}

          {step === 'reveal' && picked && (
            <motion.div key="reveal" className="flex flex-1 flex-col items-center justify-center gap-3 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RevealStage color={scam?.color ?? '#b23a30'} verdict={picked.verdict} lost={picked.loss > 0} />
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

/** A plain phone screen for calls, texts and chats. No villain art: only what a real phone would show. */
function PhoneFrame({ channel, sender, left, total, children }: { channel: EncounterDef['channel']; sender: string; left: number; total: number; children: React.ReactNode }) {
  const label = channel === 'call' ? t('town.incomingCall') : channel === 'text' ? t('town.text') : t('town.chat')
  return (
    <div className="mt-2 flex flex-1 flex-col bg-[#2b1d10] p-2" style={{ boxShadow: '0 0 0 3px var(--frame-dark)' }}>
      <div className="flex items-center gap-2 bg-[#3a2a1c] px-2 py-1 text-[#fbf4e2]">
        <PxIcon name={channel === 'call' ? 'user' : 'message'} />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] opacity-70">{label}</div>
          <div className="truncate text-[15px] font-bold">{sender}</div>
        </div>
      </div>
      <div className="mt-1 h-1.5 bg-[#3a2a1c]">
        <div className={`h-full ${left <= 5 ? 'bg-danger' : 'bg-marigold'}`} style={{ width: `${(left / total) * 100}%`, transition: 'width 1s linear' }} />
      </div>
      <div className="mt-2 flex flex-1 flex-col gap-2">{children}</div>
    </div>
  )
}

/** Show anything that looks like a web address as a link-looking (but inert) span. */
function linkify(text: string) {
  const parts = text.split(/(\S+\.example\/\S*)/g)
  return parts.map((p, i) =>
    /\.example\//.test(p) ? (
      <span key={i} className="break-all text-[#3f7fa6] underline">
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  )
}
