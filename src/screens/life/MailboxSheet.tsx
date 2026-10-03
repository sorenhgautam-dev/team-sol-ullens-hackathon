import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameShallow } from '@/state/gameStore'
import { usePersona } from '@/state/hooks'
import { LETTERS } from '@/content/mail'
import { Sheet } from '@/ui/Sheet'
import { t } from '@/i18n'
import { play } from '@/audio/sfx'

export function MailboxSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { day, readMail, markMailRead } = useGameShallow((s) => ({ day: s.day, readMail: s.readMail, markMailRead: s.markMailRead }))
  const persona = usePersona()
  const [openId, setOpenId] = useState<string | null>(null)
  const letters = LETTERS.filter((l) => l.day <= day).sort((a, b) => b.day - a.day)
  return (
    <Sheet open={open} onClose={onClose} title={`📬 ${t('mail.title')}`}>
      {letters.length === 0 && <p className="py-6 text-center text-sm text-ink/50">{t('mail.empty')}</p>}
      <ul className="space-y-2">
        {letters.map((l) => {
          const unread = !readMail.includes(l.id)
          const isOpen = openId === l.id
          return (
            <li key={l.id}>
              <motion.button
                layout
                className={`w-full rounded-card p-3 text-left shadow-sm ${unread ? 'bg-cream ring-2 ring-marigold/60' : 'bg-card'}`}
                onClick={() => {
                  setOpenId(isOpen ? null : l.id)
                  if (unread) {
                    play('mailbox')
                    markMailRead(l.id)
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <motion.span className="text-2xl" animate={isOpen ? { rotateX: 180 } : { rotateX: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                    {isOpen ? '📭' : unread ? '✉️' : '📨'}
                  </motion.span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`truncate text-sm ${unread ? 'font-extrabold' : 'font-bold'}`}>{t(l.fromKey, persona)}</span>
                      <span className="text-[10px] text-ink/50">{t('common.day', { day: l.day })}</span>
                    </div>
                    <div className="truncate text-xs text-ink/70">
                      {l.emoji} {t(l.subjectKey)}
                    </div>
                  </div>
                </div>
                {isOpen && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 border-t border-ink/10 pt-3 text-sm leading-relaxed">
                    {t(l.bodyKey)}
                  </motion.p>
                )}
              </motion.button>
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}
