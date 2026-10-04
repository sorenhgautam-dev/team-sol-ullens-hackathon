/**
 * Results: what payday left you with, the Scam Immunity Score, the five rule cards,
 * and a Family Warning Card to share. Balance and score come from the engine.
 */
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameShallow } from '@/state/gameStore'
import { useScam } from '@/state/scamStore'
import { firstAnswers, immunity, paydayRecord, paydayTips, rentCheck, townLedger } from '@/engine/scamTown'
import { useEncounters } from './useEncounters'
import type { EncounterDef } from '@/engine/scamTown'
import { Button } from '@/ui/Button'
import { PxIcon } from '@/ui/PxIcon'
import { Toasts } from '@/ui/Toasts'
import { useCash } from '@/ui/useMoney'
import { RuleCard } from './EncounterSheet'
import { usePersonaParams } from './persona'
import { t } from '@/i18n'
import { play } from '@/audio/sfx'
import confetti from 'canvas-confetti'

export function familyWarningText(encounters: EncounterDef[], lessons: string[] = []): string {
  return [t('results2.familyTitle'), ...encounters.map((e, i) => `${i + 1}. ${t(e.rule.ruleKey)}`), ...(lessons.length ? [t('results2.moneyTips') + ':', ...lessons.map((l) => `- ${l}`)] : []), t('results2.familyFooter')].join('\n')
}

export function PayResultsScreen() {
  const { go, toast, reduced } = useGameShallow((s) => ({ go: s.go, toast: s.toast, reduced: s.settings.reducedMotion }))
  const { answers, nextRound } = useScam()
  const cash = useCash()
  const { encounters, thisRound, round, payday, bills } = useEncounters()
  // Rule cards collected over every payday so far, in the order they were played.
  const seen = useMemo(() => {
    const ids = [...new Set(firstAnswers(answers).map((a) => a.encounterId))]
    return ids.map((id) => encounters.find((e) => e.id === id)).filter((e): e is EncounterDef => !!e)
  }, [encounters, answers])
  // The Family Warning Card keeps the rules from the scams (real ones taught a money tip instead).
  const scamsSeen = seen.filter((e) => !e.real)
  // Money tips from everything met this payday (the rule cards show the same tip).
  const lessons = [...new Set(seen.map((e) => t(e.rule.lessonKey)))].slice(0, 4)
  const params = usePersonaParams()
  const ledger = useMemo(() => townLedger(payday, answers, encounters, round, bills.total), [payday, answers, encounters, round, bills.total])
  const check = rentCheck(ledger.balance, bills.total)
  const rows = useMemo(() => paydayRecord(answers, encounters, round), [answers, encounters, round])
  const tips = useMemo(() => paydayTips(rows), [rows])
  const [verdict, setVerdict] = useState(true)
  const imm = useMemo(() => immunity(answers, thisRound, round), [answers, thisRound, round])
  const lostThisRound = ledger.entries.filter((e) => e.kind === 'scam_loss' && e.round === round).reduce((n, e) => n - e.amount, 0)
  const [shown, setShown] = useState(0)

  // The score counts up; a celebration only for "Scam-proof".
  useEffect(() => {
    if (reduced) return setShown(imm.score)
    let v = 0
    const id = window.setInterval(() => {
      v = Math.min(imm.score, v + 5)
      setShown(v)
      if (v % 20 === 0) play('tick')
      if (v >= imm.score) {
        window.clearInterval(id)
        if (imm.tier === 'proof') {
          play('win')
          void confetti({ particleCount: 60, spread: 70, origin: { y: 0.3 }, colors: ['#18665f', '#e0a93b', '#fbf4e2'] })
        }
      }
    }, 40)
    return () => window.clearInterval(id)
  }, [imm.score, imm.tier, reduced])

  const share = async () => {
    const text = familyWarningText(scamsSeen, lessons)
    try {
      if (navigator.share) await navigator.share({ title: t('results2.familyTitle'), text })
      else {
        await navigator.clipboard.writeText(text)
        toast(t('results2.copied'), 'good')
      }
    } catch {
      /* the user closed the share sheet */
    }
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(familyWarningText(scamsSeen, lessons))
      toast(t('results2.copied'), 'good')
    } catch {
      toast(t('results2.copyFailed'), 'bad')
    }
  }

  // First, the end of the payday: did the money cover rent and food?
  if (verdict)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-paper px-6 text-center text-ink">
        <motion.div initial={{ scale: 0.6, rotate: -6, opacity: 0 }} animate={{ scale: 1, rotate: -2, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 16 }} className={`px-4 py-3 font-pixel text-[22px] uppercase text-white ${check.win ? 'bg-teal' : 'bg-danger'}`} style={{ boxShadow: '0 0 0 3px var(--frame-dark), 6px 6px 0 3px var(--frame-dark)' }}>
          {check.win ? t('results2.win') : t('results2.lose')}
        </motion.div>
        <p className="text-[17px]">{t('results2.billsLine', { balance: cash(ledger.balance), bills: cash(bills.total) })}</p>
        <p className={`font-pixel text-[20px] ${check.win ? 'text-teal' : 'text-danger'}`}>{check.win ? t('results2.leftOver', { amount: cash(check.leftOver) }) : t('results2.shortBy', { amount: cash(check.shortBy) })}</p>
        <p className="text-[14px] text-ink/70">{check.win ? t('results2.winNote') : t('results2.loseNote')}</p>
        <Button variant="primary" size="lg" className="w-full" onClick={() => setVerdict(false)}>
          {t('results2.seeResults')}
        </Button>
      </div>
    )

  const tierColor = imm.tier === 'proof' ? 'text-teal' : imm.tier === 'wiser' ? 'text-honey' : 'text-danger'
  return (
    <div className="h-full overflow-y-auto bg-paper px-4 pb-8 pt-[max(16px,env(safe-area-inset-top))] text-ink">
      <h1 className="text-center text-xl">{t('results2.title', { n: round })}</h1>

      {/* The one main thing: your score. */}
      <section className="pixel-frame mt-3 p-3 text-center">
        <div className="font-pixel text-[12px] uppercase text-ink/60">{t('results2.score')}</div>
        <div className={`font-pixel text-[64px] leading-none tabular-nums ${tierColor}`}>{shown}</div>
        <motion.div initial={{ scale: 2, opacity: 0, rotate: -8 }} animate={{ scale: 1, opacity: 1, rotate: -3 }} transition={{ delay: 0.9, type: 'spring', stiffness: 300, damping: 18 }} className={`mx-auto mt-2 inline-block bg-ink px-3 py-1 font-pixel text-[16px] text-card`}>
          {t(`results2.tier.${imm.tier}`)}
        </motion.div>
        <p className="mt-3 text-[16px]">
          {round === 1 ? t('results2.money', { end: cash(ledger.balance), start: cash(ledger.start) }) : t('results2.moneyRounds', { end: cash(ledger.balance), start: cash(ledger.start), n: round })}
        </p>
        <p className={`text-[15px] font-bold ${lostThisRound > 0 ? 'text-danger' : 'text-teal'}`}>{lostThisRound > 0 ? t('results2.lost', { amount: cash(lostThisRound) }) : t('results2.keptAll')}</p>
        <ul className={`mt-3 grid gap-1 text-[11px] ${thisRound.length > 5 ? 'grid-cols-3' : 'grid-cols-5'}`}>
          {thisRound.map((e) => {
            const v = imm.verdicts[e.id]
            return (
              <li key={e.id} className={`p-1 ${v === 'safe' ? 'bg-teal text-white' : v === 'tempted' ? 'bg-marigold' : 'bg-danger text-white'}`}>
                <div className="font-bold">{t(`town.building.${e.building}`)}</div>
                <div>{v ? (e.real && v === 'tempted' ? t('town.verdict.missed') : t(`town.verdict.${v}`)) : '-'}</div>
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-[12px] text-ink/60">{t('results2.scoring')}</p>
      </section>

      {/* The record of this payday's decisions, then tips from the actual mistakes. */}
      <section className="pixel-frame mt-3 p-3">
        <h2 className="text-[14px]">{t('results2.record')}</h2>
        <ul className="mt-2 space-y-1 text-[14px]">
          {rows.map((r) => (
            <li key={r.encounterId} className="flex items-center gap-2">
              <span className={`w-12 shrink-0 px-1 text-center font-pixel text-[10px] uppercase text-white ${r.real ? 'bg-teal' : 'bg-danger'}`}>{r.real ? t('record.real') : t('record.scam')}</span>
              <span className="min-w-0 flex-1">
                <b>{t(`town.building.${r.building}`)}</b>: {t(`record.${r.choiceId}`)}
              </span>
              <span className="shrink-0 font-bold tabular-nums">
                {r.moneyIn ? <span className="text-teal">{t('record.in', { amount: cash(r.moneyIn) })}</span> : r.moneyOut ? <span className="text-danger">{t('record.out', { amount: cash(r.moneyOut) })}</span> : r.missed ? <span className="text-ink/60">{t('record.missed', { amount: cash(r.missed) })}</span> : '·'}
              </span>
            </li>
          ))}
        </ul>
        <h2 className="mt-3 text-[14px]">{t('results2.tips')}</h2>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-[14px] leading-snug">
          {tips.map((tip) => (
            <li key={tip.key}>{t(tip.key, { n: tip.n ?? 0, amount: tip.amount ? cash(tip.amount) : '' })}</li>
          ))}
        </ul>
      </section>

      {/* The gauntlet loop: the next payday brings new traps and faster timers. */}
      <Button
        variant="primary"
        size="lg"
        className="mt-3 w-full"
        onClick={() => {
          nextRound()
          play('coin')
          go('paytown')
        }}
      >
        {t('results2.next', { n: round + 1 })}
      </Button>
      <p className="mt-1 text-center text-[12px] text-ink/60">{t('results2.nextHint')}</p>
      <Button variant="ghost" className="mt-1 w-full" onClick={() => go('pick')}>
        {t('results2.again')}
      </Button>

      <h2 className="mt-5 text-[14px]">{t('results2.rules', { n: seen.length })}</h2>
      <div className="mt-2 space-y-2">
        {seen.map((e) => (
          <RuleCard key={e.id} encounter={e} params={params} compact />
        ))}
      </div>

      {/* Family Warning Card: the five rules, ready to share. */}
      <section className="mt-5 p-3" style={{ background: '#fbf4e2', boxShadow: '0 0 0 3px #2b1d10, 6px 6px 0 3px #2b1d10' }}>
        <div className="flex items-center gap-2">
          <PxIcon name="shield" />
          <h2 className="text-[15px]">{t('results2.familyTitle')}</h2>
        </div>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[15px] leading-snug">
          {scamsSeen.map((e) => (
            <li key={e.id}>{t(e.rule.ruleKey)}</li>
          ))}
        </ol>
        {lessons.length > 0 && (
          <>
            <p className="mt-2 font-bold">{t('results2.moneyTips')}</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-[15px] leading-snug">
              {lessons.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </>
        )}
        <p className="mt-2 text-[13px] text-ink/70">{t('results2.familyFooter')}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="primary" onClick={() => void share()}>
            {t('results2.share')}
          </Button>
          <Button onClick={() => void copy()}>{t('results2.copy')}</Button>
        </div>
      </section>

      <Button variant="ghost" className="mt-4 w-full" onClick={() => go('title')}>
        {t('common.back')}
      </Button>
      <Toasts />
    </div>
  )
}
