import { motion } from 'framer-motion'
import type { TownState } from '@/engine/town'
import { MAP_H, MAP_W, RIVER_PATH, LANDMARKS, WARDS, wardPolygons } from '@/content/wards'
import { t } from '@/i18n'

const POLYS = wardPolygons()

const SEASONS = [
  { name: 'spring', tint: '#9BB58A' },
  { name: 'monsoon', tint: '#7FB8D6' },
  { name: 'autumn', tint: '#E0B45A' },
  { name: 'winter', tint: '#B8BCC4' },
]

interface Props {
  state: TownState
  selected: string | null
  onSelect: (id: string) => void
  highlightSita: boolean
  pendingWardIds: string[]
}

/** Voronoi ward map: tinted by state, scam overlay in red, safe wards glow green, river and landmarks. */
export function TownMap({ state, selected, onSelect, highlightSita, pendingWardIds }: Props) {
  const season = SEASONS[Math.floor(((state.week - 1) / 4) % 4)] ?? SEASONS[0]!
  return (
    <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="w-full" role="group" aria-label="Town map">
      <defs>
        <clipPath id="townClip">
          <rect x="4" y="4" width={MAP_W - 8} height={MAP_H - 8} rx="36" />
        </clipPath>
      </defs>
      <rect x="4" y="4" width={MAP_W - 8} height={MAP_H - 8} rx="36" fill={season.tint} opacity="0.35" />
      <g clipPath="url(#townClip)">
        {WARDS.map((w) => {
          const ws = state.wards.find((x) => x.id === w.id)!
          const pts = POLYS[w.id] ?? []
          const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ' Z'
          const safe = ws.scamLevel <= 20 && ws.shortfallRate < 0.25
          const stress = ws.shortfallRate
          const fill = stress > 0.5 ? '#E8D9B5' : '#9BB58A'
          return (
            <g key={w.id} onClick={() => onSelect(w.id)} role="button" aria-label={t(w.nameKey)} className="cursor-pointer">
              <path d={d} fill={fill} fillOpacity={0.75 - stress * 0.3} stroke="#1E2A44" strokeWidth={selected === w.id ? 3 : 1.5} />
              {safe && <path d={d} fill="#4ADE80" fillOpacity="0.25" />}
              <motion.path d={d} fill="#FF4D6D" initial={false} animate={{ fillOpacity: ws.scamLevel / 100 * 0.75 }} transition={{ duration: 0.8 }} />
              {pendingWardIds.includes(w.id) && <path d={d} fill="none" stroke="#F5A524" strokeWidth="3" strokeDasharray="6 4" />}
            </g>
          )
        })}
        <path d={RIVER_PATH} fill="none" stroke="#7FB8D6" strokeWidth="9" strokeLinecap="round" opacity="0.9" />
        <path d={RIVER_PATH} fill="none" stroke="#DCEBF7" strokeWidth="2" strokeLinecap="round" opacity="0.8" strokeDasharray="10 14" />
        {LANDMARKS.map((l, i) => (
          <text key={i} x={l.point[0]} y={l.point[1]} fontSize="14" textAnchor="middle" opacity="0.8">
            {l.emoji}
          </text>
        ))}
        {WARDS.map((w) => {
          const ws = state.wards.find((x) => x.id === w.id)!
          const [x, y] = w.point
          return (
            <g key={`${w.id}-label`} className="pointer-events-none">
              <text x={x} y={y - 6} fontSize="20" textAnchor="middle">
                {w.emoji}
              </text>
              <text x={x} y={y + 12} fontSize="10" fontWeight="800" textAnchor="middle" fill="#1E2A44">
                {t(w.nameKey)}
              </text>
              <text x={x} y={y + 24} fontSize="9" textAnchor="middle" fill="#1E2A44" opacity="0.8">
                {Math.round(ws.shortfallRate * 100)}% short · scam {Math.round(ws.scamLevel)}
              </text>
              {ws.scamLevel > 40 && (
                <motion.g animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.6, repeat: Infinity }} style={{ originX: `${x + 26}px`, originY: `${y - 14}px` }}>
                  <circle cx={x + 26} cy={y - 14} r="9" fill="#FF4D6D" />
                  <text x={x + 26} y={y - 10} fontSize="10" textAnchor="middle">
                    🦈
                  </text>
                </motion.g>
              )}
              {highlightSita && w.id === 'riverside' && (
                <motion.text x={x - 30} y={y + 2} fontSize="16" textAnchor="middle" animate={{ y: [y + 2, y - 2, y + 2] }} transition={{ duration: 2, repeat: Infinity }}>
                  🏠
                </motion.text>
              )}
            </g>
          )
        })}
      </g>
      <text x={MAP_W - 14} y={MAP_H - 12} fontSize="10" textAnchor="end" fill="#1E2A44" opacity="0.6">
        {t(`season.${season.name}`)}
      </text>
    </svg>
  )
}
