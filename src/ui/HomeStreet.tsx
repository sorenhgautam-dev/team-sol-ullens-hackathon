import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SPROUT_EMOJI, type SproutStage } from '@/engine/cozy'
import { t } from '@/i18n'
import { play, haptic, unlockAudio } from '@/audio/sfx'

export type Spot = 'home' | 'landlord' | 'shop' | 'coop' | 'mailbox'

interface Props {
  /** 0 morning … 3 night */
  time: 0 | 1 | 2 | 3
  sprout: SproutStage
  mailBadge: number
  onTap: (spot: Spot) => void
}

const SKY: Record<0 | 1 | 2 | 3, [string, string]> = {
  0: ['#FFF4E0', '#FFE3B8'],
  1: ['#FFEFD6', '#F5C26B'],
  2: ['#F2B990', '#8E6B8F'],
  3: ['#5B4B6B', '#2E2740'],
}

/** A single static illustrated lane with five tappable spots. Flat SVG, gentle idle motion only. */
export function HomeStreet({ time, sprout, mailBadge, onTap }: Props) {
  const [sparkle, setSparkle] = useState<{ x: number; y: number; id: number } | null>(null)
  const night = time >= 2
  const [skyTop, skyBottom] = SKY[time]
  const tap = (spot: Spot, x: number, y: number) => {
    unlockAudio()
    play('pop')
    haptic(10)
    setSparkle({ x, y, id: Date.now() })
    onTap(spot)
  }
  const windowFill = night ? '#F5C26B' : '#DCEBF7'
  const spotCls = 'spot cursor-pointer'
  return (
    <div className="relative mx-4 overflow-hidden rounded-card shadow-sm">
      <svg viewBox="0 0 390 190" className="block w-full" role="group" aria-label="Home street">
        <defs>
          <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={skyTop} />
            <stop offset="1" stopColor={skyBottom} />
          </linearGradient>
        </defs>
        <rect width="390" height="190" fill="url(#sky)" />
        {night && (
          <g fill="#FFF4E0">
            <circle cx="330" cy="30" r="12" />
            <circle cx="60" cy="22" r="1.2" />
            <circle cx="120" cy="40" r="1" />
            <circle cx="250" cy="18" r="1.2" />
            <circle cx="290" cy="50" r="1" />
          </g>
        )}
        {!night && <circle cx="330" cy="34" r="16" fill="#F5C26B" opacity={time === 0 ? 0.9 : 0.75} />}
        {/* hills */}
        <path d="M0 120 Q 80 80 160 118 T 390 110 L390 190 L0 190 Z" fill={night ? '#4A5B52' : '#8FB08A'} />
        <path d="M0 140 Q 120 110 240 142 T 390 135 L390 190 L0 190 Z" fill={night ? '#3E4F47' : '#7FA07A'} />
        {/* lane */}
        <path d="M0 165 Q 195 150 390 165 L390 190 L0 190 Z" fill={night ? '#6E6657' : '#E8D9B5'} />
        <path d="M0 176 Q 195 162 390 176" stroke={night ? '#8A8171' : '#D9CBA6'} strokeWidth="2" fill="none" strokeDasharray="8 10" />

        {/* prayer flags */}
        <g className="sway">
          <path d="M20 46 Q 195 74 370 46" stroke="#5B4B6B" strokeWidth="1" fill="none" />
          {[40, 80, 120, 160, 200, 240, 280, 320, 350].map((fx, i) => {
            const fy = 46 + 28 * Math.sin((Math.PI * (fx - 20)) / 350)
            const colors = ['#6EC6FF', '#FFF4E0', '#FF4D6D', '#8FB08A', '#F5C26B']
            return <path key={fx} d={`M${fx} ${fy} l 12 1 l -6 11 z`} fill={colors[i % colors.length]} />
          })}
        </g>

        {/* Sita's home */}
        <g className={spotCls} onClick={() => tap('home', 60, 120)} role="button" aria-label={t('hub.home')} tabIndex={0}>
          <rect x="22" y="104" width="78" height="62" rx="4" fill="#FFF4E0" stroke="#5B4B6B" strokeWidth="1.5" />
          <path d="M16 106 L61 76 L106 106 Z" fill="#D9734E" stroke="#5B4B6B" strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="84" y="78" width="8" height="18" fill="#5B4B6B" />
          <g className="smoke" fill="#FFF4E0" opacity="0.8">
            <circle cx="88" cy="70" r="3" />
            <circle cx="92" cy="62" r="4" />
          </g>
          <rect x="34" y="118" width="22" height="20" rx="2" fill={windowFill} stroke="#5B4B6B" strokeWidth="1.2" />
          <text x="45" y="134" fontSize="13" textAnchor="middle">
            {SPROUT_EMOJI[sprout]}
          </text>
          <rect x="68" y="130" width="18" height="36" rx="2" fill="#8B5A3C" stroke="#5B4B6B" strokeWidth="1.2" />
          <circle cx="82" cy="149" r="1.5" fill="#F5C26B" />
          <text x="28" y="164" fontSize="12">🪴</text>
          <g className="tail">
            <text x="100" y="166" fontSize="13">🐕</text>
          </g>
          <text x="61" y="186" fontSize="9" fontWeight="800" textAnchor="middle" fill={night ? '#FFF4E0' : '#1E2A44'}>
            {t('hub.home')}
          </text>
        </g>

        {/* Mailbox */}
        <g className={spotCls} onClick={() => tap('mailbox', 116, 150)} role="button" aria-label={t('hub.mailbox')} tabIndex={0}>
          <rect x="112" y="146" width="12" height="20" fill="#5B4B6B" />
          <rect x="106" y="134" width="24" height="16" rx="5" fill="#6EC6FF" stroke="#5B4B6B" strokeWidth="1.2" />
          <rect x="110" y="139" width="12" height="2" fill="#1E2A44" />
          {mailBadge > 0 && (
            <g>
              <circle cx="130" cy="134" r="6.5" fill="#FF4D6D" />
              <text x="130" y="137" fontSize="8" fontWeight="800" textAnchor="middle" fill="white">
                {mailBadge}
              </text>
            </g>
          )}
        </g>

        {/* Landlord's house */}
        <g className={spotCls} onClick={() => tap('landlord', 180, 110)} role="button" aria-label={t('hub.landlord')} tabIndex={0}>
          <rect x="142" y="86" width="82" height="80" rx="4" fill="#F5C26B" stroke="#5B4B6B" strokeWidth="1.5" />
          <path d="M136 88 L183 58 L230 88 Z" fill="#5B4B6B" />
          {[0, 1].map((r) =>
            [0, 1].map((c) => (
              <rect key={`${r}${c}`} x={152 + c * 40} y={98 + r * 32} width="18" height="18" rx="2" fill={windowFill} stroke="#5B4B6B" strokeWidth="1.2" />
            )),
          )}
          <rect x="176" y="136" width="16" height="30" rx="2" fill="#8B5A3C" stroke="#5B4B6B" strokeWidth="1.2" />
          <g stroke="#F5C26B" strokeWidth="1">
            <path d="M142 92 Q 183 104 224 92" fill="none" stroke="#5B4B6B" />
            {[150, 162, 174, 186, 198, 210].map((lx, i) => (
              <circle key={lx} cx={lx} cy={94 + 5 * Math.sin((i / 5) * Math.PI)} r="2" fill={night ? '#FFF4E0' : '#F5A524'} className="twinkle" />
            ))}
          </g>
          <text x="183" y="186" fontSize="9" fontWeight="800" textAnchor="middle" fill={night ? '#FFF4E0' : '#1E2A44'}>
            {t('hub.landlord')}
          </text>
        </g>

        {/* Corner shop */}
        <g className={spotCls} onClick={() => tap('shop', 265, 125)} role="button" aria-label={t('hub.shop')} tabIndex={0}>
          <rect x="238" y="112" width="60" height="54" rx="3" fill="#FFF4E0" stroke="#5B4B6B" strokeWidth="1.5" />
          <path d="M232 112 L268 92 L304 112 Z" fill="#8FB08A" stroke="#5B4B6B" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M234 114 h68 v8 q-8.5 6 -17 0 q-8.5 6 -17 0 q-8.5 6 -17 0 q-8.5 6 -17 0 z" fill="#D9734E" />
          <rect x="246" y="130" width="44" height="22" rx="2" fill={windowFill} stroke="#5B4B6B" strokeWidth="1.2" />
          <text x="268" y="146" fontSize="11" textAnchor="middle">🧺🫙</text>
          <text x="268" y="186" fontSize="9" fontWeight="800" textAnchor="middle" fill={night ? '#FFF4E0' : '#1E2A44'}>
            {t('hub.shop')}
          </text>
        </g>

        {/* Cooperative office */}
        <g className={spotCls} onClick={() => tap('coop', 345, 120)} role="button" aria-label={t('hub.coop')} tabIndex={0}>
          <rect x="314" y="98" width="68" height="68" rx="3" fill="#DCEBF7" stroke="#5B4B6B" strokeWidth="1.5" />
          <rect x="310" y="92" width="76" height="10" rx="2" fill="#1E2A44" />
          <text x="348" y="100" fontSize="7" fontWeight="800" textAnchor="middle" fill="#FFF4E0">
            NAYA TOLE CO-OP
          </text>
          {[0, 1, 2].map((c) => (
            <rect key={c} x={320 + c * 20} y="110" width="14" height="16" rx="2" fill={windowFill} stroke="#5B4B6B" strokeWidth="1.2" />
          ))}
          <rect x="340" y="136" width="16" height="30" rx="2" fill="#5B4B6B" />
          <text x="318" y="164" fontSize="12">🪴</text>
          <text x="348" y="186" fontSize="9" fontWeight="800" textAnchor="middle" fill={night ? '#FFF4E0' : '#1E2A44'}>
            {t('hub.coop')}
          </text>
        </g>
      </svg>
      <AnimatePresence>
        {sparkle && (
          <motion.span
            key={sparkle.id}
            className="pointer-events-none absolute text-xl"
            style={{ left: `${(sparkle.x / 390) * 100}%`, top: `${(sparkle.y / 190) * 100}%` }}
            initial={{ opacity: 1, scale: 0.6, y: 0 }}
            animate={{ opacity: 0, scale: 1.4, y: -24 }}
            transition={{ duration: 0.6 }}
            onAnimationComplete={() => setSparkle(null)}
          >
            ✨
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
