import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameShallow } from '@/state/gameStore'
import { useLived, usePersona } from '@/state/hooks'
import { SCAMS_BY_ID } from '@/content/enemies'
import type { ScamResponse } from '@/engine/types'
import { Sheet } from '@/ui/Sheet'
import { Button } from '@/ui/Button'
import { useMoney } from '@/ui/useMoney'
import { t } from '@/i18n'
import { play, haptic } from '@/audio/sfx'

interface Props {
  open: boolean
  scamId: string | null
}

type Phase = 'read' | 'verify' | 'ask' | 'result'

/** Full-screen chat UI with an urgency timer and tappable tells. */
export function ScamEncounter({ open, scamId }: Props) {
  const lived = useLived()
  const persona = usePersona()
  const money = useMoney()
  const { respondScam, closeSheet, openPending, markPhoneRead, demo } = useGameShallow((s) => ({
    respondScam: s.respondScam,
    closeSheet: s.closeSheet,
    openPending: s.openPending,
    markPhoneRead: s.markPhoneRead,
    demo: s.settings.demoMode,
  }))
  const scam = scamId ? SCAMS_BY_ID[scamId] : undefined
  const record = useMemo(() => lived.days.flatMap((d) => d.scams).find((s) => s.scamId === scamId), [lived, scamId])
  const [phase, setPhase] = useState<Phase>('read')
  const [spotted, setSpotted] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [timedOut, setTimedOut] = useState(false)
  const answered = useRef(false)

  // Reset per encounter
  useEffect(() => {
    if (!open || !scam) return
    setPhase('read')
    setSpotted([])
    setTimedOut(false)
    answered.current = false
    setTimeLeft(scam.urgencySeconds ? Math.max(8, Math.round(scam.urgencySeconds / (demo ? 4 : 1))) : 0)
    play('buzz')
    haptic([40, 60, 40])
    if (scamId) markPhoneRead(scamId)
  }, [open, scamId, scam, demo, markPhoneRead])

  // Urgency timer: running out is harmless and rewarded (counts as "wait").
  useEffect(() => {
    if (!open || phase !== 'read' || timeLeft <= 0 || !scam || scam.decoy) return
    const id = window.setInterval(() => {
      setTimeLeft((x) => {
        if (x <= 1) {
          window.clearInterval(id)
          if (!answered.current) {
            setTimedOut(true)
            answer('wait')
          }
          return 0
        }
        if (x <= 10) play('tick')
        return x - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase, scam?.id])

  // Outcome, read back from the engine after answering. (All hooks stay above the early return.)
  const outcome = record?.outcome
  useEffect(() => {
    if (phase !== 'result' || !outcome || outcome === 'pending') return
    if (outcome === 'scammed') {
      play('bad')
      haptic([80, 40, 80, 40, 120])
    } else if (outcome === 'defended') {
      play('shield')
      haptic(30)
    } else play('chime')
  }, [phase, outcome])

  if (!scam) return null

  const hook = t(record?.personalized && scam.personalHookKey ? scam.personalHookKey : scam.hookKey, persona)
  const tells = scam.tellKeys.map((k) => ({ key: k, phrase: t(k) })).filter((x) => hook.includes(x.phrase))

  function answer(response: ScamResponse) {
    if (answered.current || !scam) return
    answered.current = true
    respondScam(scam.id, response, spotted.length)
    setPhase('result')
  }

  const tapTell = (key: string) => {
    if (spotted.includes(key)) return
    play('pop')
    setSpotted((s) => [...s, key])
  }

  const renderHook = () => {
    // Split the message around tell phrases so each can be tapped.
    const parts: { text: string; tell?: string }[] = []
    let rest = hook
    while (rest.length) {
      let best: { idx: number; tell: (typeof tells)[number] } | null = null
      for (const tl of tells) {
        const idx = rest.indexOf(tl.phrase)
        if (idx >= 0 && (!best || idx < best.idx)) best = { idx, tell: tl }
      }
      if (!best) {
        parts.push({ text: rest })
        break
      }
      if (best.idx > 0) parts.push({ text: rest.slice(0, best.idx) })
      parts.push({ text: best.tell.phrase, tell: best.tell.key })
      rest = rest.slice(best.idx + best.tell.phrase.length)
    }
    return parts.map((p, i) =>
      p.tell ? (
        <button
          key={i}
          className={`rounded px-0.5 font-bold underline decoration-dotted underline-offset-2 ${spotted.includes(p.tell) ? 'bg-danger/20 text-danger' : 'text-ink'}`}
          onClick={() => tapTell(p.tell!)}
        >
          {p.text}
        </button>
      ) : (
        <span key={i}>{p.text}</span>
      ),
    )
  }

  const finish = () => {
    closeSheet()
    setTimeout(() => openPending(), 300)
  }

  const urgent = timeLeft > 0 && timeLeft <= 10
  const sender = t(scam.senderKey, persona)

  return (
    <Sheet open={open} height="full" hideClose>
      <div className="relative flex h-full flex-col px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-[max(12px,env(safe-area-inset-top))]">
        <header className="flex items-center gap-3 pb-3">
          <motion.span
            className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
            style={{ background: `${scam.color}33`, border: `2px solid ${scam.color}` }}
            animate={phase === 'result' && outcome === 'defended' ? { scale: [1, 1.15, 0.6], rotate: [0, -8, 12], opacity: [1, 1, 0.15] } : { scale: 1 }}
            transition={{ duration: 0.9 }}
          >
            {scam.emoji}
          </motion.span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wide text-ink/50">{scam.channel === 'call' ? '📞' : scam.channel === 'ad' ? '📢' : '💬'} {t('enc.incoming')}</div>
            <div className="truncate font-extrabold">{sender}</div>
          </div>
          {phase === 'read' && timeLeft > 0 && !scam.decoy && (
            <div className={`rounded-full px-3 py-1 text-sm font-extrabold tabular-nums ${urgent ? 'animate-pulse bg-danger text-white' : 'bg-ink/10'}`} aria-live="polite">
              {timeLeft}s
            </div>
          )}
        </header>

        <div className="rounded-3xl rounded-tl-md bg-card p-4 text-[15px] leading-relaxed shadow-sm">{renderHook()}</div>
        {tells.length > 0 && phase === 'read' && (
          <p className="mt-2 text-xs text-ink/60">
            🔎 {t('enc.tapTells')} · {t('enc.tellsFound', { n: spotted.length, total: tells.length })}
          </p>
        )}
        {spotted.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {spotted.map((k) => (
              <li key={k} className="text-xs text-danger">
                ⚠️ {t(`${k}.why`)}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto space-y-2 pb-2">
          <AnimatePresence mode="wait">
            {phase === 'read' && (
              <motion.div key="read" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                {timeLeft > 0 && !scam.decoy && <p className="text-center text-xs text-ink/50">{t('enc.timer')} {timeLeft}s</p>}
                <Button variant="danger" className="w-full" onClick={() => answer('comply')}>
                  {t('enc.comply')}
                </Button>
                <Button variant="shield" className="w-full" onClick={() => setPhase('verify')}>
                  🔍 {t('enc.verify')}
                </Button>
                <div className="grid grid-cols-3 gap-2">
                  <Button size="sm" onClick={() => setPhase('ask')}>
                    🧑‍🤝‍🧑 {t('enc.ask')}
                  </Button>
                  <Button size="sm" onClick={() => answer('wait')}>
                    ⏳ {t('enc.wait')}
                  </Button>
                  <Button size="sm" onClick={() => answer('block')}>
                    🚫 {t('enc.block')}
                  </Button>
                </div>
              </motion.div>
            )}
            {phase === 'verify' && (
              <motion.div key="verify" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-card border-2 border-sky bg-card p-4 shadow-lg">
                <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-sky">🔒 {t('enc.verifyTitle')}</div>
                <p className="text-sm">{t(`scam.${camel(scam.id)}.truth`, persona)}</p>
                <Button variant="shield" className="mt-3 w-full" onClick={() => answer('verify')}>
                  {scam.decoy ? t('enc.continue') : t('enc.verifyClose')}
                </Button>
              </motion.div>
            )}
            {phase === 'ask' && (
              <motion.div key="ask" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-card bg-card p-4 shadow-lg">
                <p className="text-sm">{scam.decoy ? t('scam.partnerReal.do') : t('enc.askResult')}</p>
                <Button variant="shield" className="mt-3 w-full" onClick={() => answer('ask')}>
                  {t('enc.continue')}
                </Button>
              </motion.div>
            )}
            {phase === 'result' && outcome && outcome !== 'pending' && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-card bg-card p-4 text-center shadow-lg">
                {outcome === 'scammed' && (
                  <>
                    <motion.div className="pointer-events-none absolute inset-0 bg-danger" initial={{ opacity: 0.6 }} animate={{ opacity: 0 }} transition={{ duration: 0.8 }} />
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.span
                        key={i}
                        className="pointer-events-none absolute left-1/2 top-2 text-2xl"
                        initial={{ x: 120 - i * 30, y: 0, opacity: 1 }}
                        animate={{ x: -150, y: -20 + i * 6, opacity: 0 }}
                        transition={{ duration: 0.9, delay: i * 0.08 }}
                      >
                        🪙
                      </motion.span>
                    ))}
                    <h3 className="text-xl font-extrabold text-danger">{t('enc.scammedTitle')}</h3>
                    <p className="mt-1 text-sm">
                      {scam.comply.cashIn
                        ? t('enc.loanLine', { name: t(scam.nameKey), cash: money(scam.comply.cashIn) })
                        : t('enc.scammedLine', { amount: money(record?.loss ?? scam.comply.loss), name: t(scam.nameKey) })}
                    </p>
                  </>
                )}
                {outcome === 'defended' && (
                  <>
                    <h3 className="text-xl font-extrabold text-green-700">🛡️ {t('enc.defendedTitle')}</h3>
                    <p className="mt-1 text-sm">{t('enc.defendedLine', { name: t(scam.nameKey), points: record?.shieldPoints ?? 0 })}</p>
                    {timedOut && <p className="mt-1 text-xs text-ink/60">{t('enc.timerOut')}</p>}
                  </>
                )}
                {outcome === 'real' && (
                  <>
                    <h3 className="text-xl font-extrabold">✅ {t('enc.realTitle')}</h3>
                    <p className="mt-1 text-sm">{t('enc.realLine')}</p>
                  </>
                )}
                <p className="mt-3 text-left text-xs text-ink/70">
                  <span className="font-bold">{t('scam.how')}:</span> {t(scam.codex.howKey)}
                </p>
                <Button variant="primary" className="mt-3 w-full" onClick={finish}>
                  {t('enc.continue')}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Sheet>
  )
}

/** scam ids are snake_case; i18n keys use camelCase names. */
function camel(id: string): string {
  const map: Record<string, string> = {
    phisher: 'phisher',
    loan_shark: 'loanShark',
    impersonator: 'impersonator',
    otp_snatcher: 'otp',
    fine_print: 'finePrint',
    prize_ghost: 'prizeGhost',
    job_recruiter: 'jobRecruiter',
    investment_guru: 'guru',
    bank_notice: 'bankNotice',
    partner_real: 'partnerReal',
  }
  return map[id] ?? id
}
