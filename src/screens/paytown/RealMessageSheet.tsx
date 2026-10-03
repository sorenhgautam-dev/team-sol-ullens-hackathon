/** A real message on the phone. Safe to act on: the lesson is to verify calmly, not to fear everything. */
import { useEffect, useState } from 'react'
import type { RealMessage } from '@/content/scamTown'
import { useScam } from '@/state/scamStore'
import { CHARACTERS_BY_ID } from '@/content/characters'
import { Sheet } from '@/ui/Sheet'
import { Button } from '@/ui/Button'
import { PxIcon } from '@/ui/PxIcon'
import { useCash } from '@/ui/useMoney'
import { usePersonaParams } from './persona'
import { t } from '@/i18n'
import { play } from '@/audio/sfx'

export function RealMessageSheet({ message: m, onClose }: { message: RealMessage | null; onClose: () => void }) {
  const handleReal = useScam((s) => s.handleReal)
  const ch = CHARACTERS_BY_ID[useScam((s) => s.characterId)]
  const cash = useCash()
  const params = { ...usePersonaParams(), payday: cash(ch.payday) }
  const [picked, setPicked] = useState<RealMessage['choices'][number] | null>(null)
  useEffect(() => setPicked(null), [m?.id])
  return (
    <Sheet open={!!m} height="auto" hideClose title={t('town.newMessage')}>
      {m && (
        <div className="space-y-3 pb-2">
          <div className="bg-[#2b1d10] p-2" style={{ boxShadow: '0 0 0 3px var(--frame-dark)' }}>
            <div className="flex items-center gap-2 px-1 text-[#fbf4e2]">
              <PxIcon name="user" />
              <span className="text-[15px] font-bold">{t(m.senderKey, params)}</span>
            </div>
            {m.lineKeys.map((k) => (
              <p key={k} className="mt-2 bg-card px-3 py-2 text-[16px] leading-snug" style={{ boxShadow: '0 0 0 2px var(--frame-dark)' }}>
                {t(k, params)}
              </p>
            ))}
          </div>
          {!picked ? (
            <div className="space-y-2">
              {m.choices.map((c) => (
                <Button
                  key={c.id}
                  className="w-full !justify-start text-left"
                  style={{ textTransform: 'none', letterSpacing: 0, fontFamily: 'Nunito, system-ui, sans-serif', fontSize: 16 }}
                  onClick={() => {
                    setPicked(c)
                    handleReal(m.id, c.id)
                    play(c.best ? 'chime' : 'tap')
                  }}
                >
                  {t(c.labelKey, params)}
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-pixel text-[15px] text-teal">{t('town.realTitle')}</p>
              <p className="text-[16px] leading-snug">{t(picked.outcomeKey, params)}</p>
              {picked.best && <p className="text-[14px] font-bold">{t('town.realBest')}</p>}
              <Button variant="primary" size="lg" className="w-full" onClick={onClose}>
                {t('town.continue')}
              </Button>
            </div>
          )}
        </div>
      )}
    </Sheet>
  )
}
