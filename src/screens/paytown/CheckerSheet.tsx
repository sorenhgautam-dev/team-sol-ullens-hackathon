/**
 * The phone's Scam Checker: a guided checklist, not a keyword score. Anything pasted
 * stays in this sheet's memory only and is cleared when it closes. It never decides
 * for you: it always ends with "verify through an official number or website".
 */
import { useEffect, useState } from 'react'
import { Sheet } from '@/ui/Sheet'
import { Button } from '@/ui/Button'
import { t } from '@/i18n'

export const CHECK_QUESTIONS = ['code', 'rush', 'first', 'fee', 'guaranteed'] as const
type A = 'yes' | 'no' | 'unsure'

export function flagsResult(answers: Partial<Record<(typeof CHECK_QUESTIONS)[number], A>>): 'none' | 'some' | 'many' {
  const yes = Object.values(answers).filter((a) => a === 'yes').length
  return yes >= 3 ? 'many' : yes >= 1 ? 'some' : 'none'
}

export function CheckerSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [answers, setAnswers] = useState<Partial<Record<(typeof CHECK_QUESTIONS)[number], A>>>({})
  const [pasted, setPasted] = useState('')
  // Nothing is kept: closing the checker clears everything.
  useEffect(() => {
    if (!open) {
      setAnswers({})
      setPasted('')
    }
  }, [open])
  const finished = CHECK_QUESTIONS.every((q) => answers[q])
  const result = flagsResult(answers)
  return (
    <Sheet open={open} onClose={onClose} title={t('checker.title')}>
      <div className="space-y-3 pb-3">
        <p className="text-[15px]">{t('checker.intro')}</p>
        <textarea className="input min-h-[64px] text-[15px]" placeholder={t('checker.paste')} value={pasted} onChange={(e) => setPasted(e.target.value)} aria-label={t('checker.paste')} />
        <p className="text-[12px] text-ink/60">{t('checker.notSaved')}</p>
        <ol className="space-y-2">
          {CHECK_QUESTIONS.map((q, i) => (
            <li key={q} className="pixel-frame-soft p-1">
              <p className="text-[16px] font-bold leading-snug">
                {i + 1}. {t(`checker.q.${q}`)}
              </p>
              <div className="mt-1 grid grid-cols-3 gap-1">
                {(['yes', 'no', 'unsure'] as A[]).map((a) => (
                  <Button key={a} size="sm" variant={answers[q] === a ? 'primary' : 'secondary'} onClick={() => setAnswers((s) => ({ ...s, [q]: a }))} aria-pressed={answers[q] === a}>
                    {t(`checker.a.${a}`)}
                  </Button>
                ))}
              </div>
            </li>
          ))}
        </ol>
        {finished && (
          <div className="pixel-frame p-2" role="status">
            <p className={`text-[18px] font-extrabold ${result === 'none' ? 'text-teal' : 'text-danger'}`}>{t(`checker.result.${result}`)}</p>
            <p className="mt-1 text-[16px] font-bold">{t('checker.verify')}</p>
          </div>
        )}
        <p className="text-[12px] text-ink/60">{t('checker.miss')}</p>
      </div>
    </Sheet>
  )
}
