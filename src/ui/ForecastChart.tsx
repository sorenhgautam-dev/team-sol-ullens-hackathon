import type { Ledger } from '@/engine/types'
import type { Band } from '@/engine/monteCarlo'
import { formatMoney } from '@/i18n/currency'

interface Props {
  lived: Ledger
  forecast: Ledger
  day: number
  bands?: Band[] | null
  height?: number
  /** Optional second full line (Rewind comparison). */
  compare?: Ledger
}

/** Hand-built SVG: lived balance (solid), forecast (dotted), Monte Carlo band (shaded), danger zone (red pulse). */
export function ForecastChart({ lived, forecast, day, bands, height = 170, compare }: Props) {
  const W = 360
  const H = height
  const PAD = { l: 8, r: 8, t: 14, b: 18 }
  const n = forecast.days.length
  const all = [...forecast.days.map((d) => d.balance), ...lived.days.map((d) => d.balance), 0]
  if (bands) for (const b of bands) all.push(b.p10, b.p90)
  if (compare) for (const d of compare.days) all.push(d.balance)
  const min = Math.min(...all)
  const max = Math.max(...all)
  const x = (dayNum: number) => PAD.l + ((dayNum - 1) / Math.max(1, n - 1)) * (W - PAD.l - PAD.r)
  const y = (v: number) => (max === min ? H / 2 : PAD.t + ((max - v) / (max - min)) * (H - PAD.t - PAD.b))
  const line = (pts: { day: number; v: number }[]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.day).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')
  const livedPts = lived.days.map((d) => ({ day: d.day, v: d.balance }))
  const fcPts = forecast.days.filter((d) => d.day >= Math.min(day, n)).map((d) => ({ day: d.day, v: d.balance }))
  const dangerDays = forecast.days.filter((d) => d.day >= day && d.balance < 0).map((d) => d.day)
  const cell = (W - PAD.l - PAD.r) / Math.max(1, n - 1)
  const bandPath = bands && bands.length
    ? `${bands.map((b, i) => `${i === 0 ? 'M' : 'L'}${x(b.day).toFixed(1)},${y(b.p90).toFixed(1)}`).join(' ')} ${[...bands].reverse().map((b) => `L${x(b.day).toFixed(1)},${y(b.p10).toFixed(1)}`).join(' ')} Z`
    : null
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} role="img" aria-label="Balance forecast">
      {dangerDays.map((d) => (
        <rect key={d} x={x(d) - cell / 2} y={PAD.t} width={cell} height={H - PAD.t - PAD.b} fill="#FF4D6D" className="danger-pulse" />
      ))}
      {bandPath && <path d={bandPath} fill="#6EC6FF" fillOpacity="0.18" />}
      <line x1={PAD.l} x2={W - PAD.r} y1={y(0)} y2={y(0)} stroke="currentColor" strokeOpacity="0.25" strokeDasharray="2 3" />
      {compare && <path d={line(compare.days.map((d) => ({ day: d.day, v: d.balance })))} fill="none" stroke="#8FB08A" strokeWidth="2.5" strokeLinejoin="round" />}
      <path d={line(fcPts)} fill="none" stroke="#6EC6FF" strokeWidth="2.5" strokeDasharray="4 4" strokeLinejoin="round" />
      <path d={line(livedPts)} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {livedPts.length > 0 && (
        <circle cx={x(livedPts[livedPts.length - 1]!.day)} cy={y(livedPts[livedPts.length - 1]!.v)} r="4.5" fill="#F5A524" stroke="white" strokeWidth="2" />
      )}
      {[1, 5, 10, 15, 20, 25, 30].filter((d) => d <= n).map((d) => (
        <text key={d} x={x(d)} y={H - 4} fontSize="10" textAnchor="middle" fill="currentColor" fillOpacity="0.55">
          {d}
        </text>
      ))}
      <text x={PAD.l} y={10} fontSize="10" fill="currentColor" fillOpacity="0.55">
        {formatMoney(max)}
      </text>
      <text x={PAD.l} y={H - PAD.b - 2} fontSize="10" fill="currentColor" fillOpacity="0.55">
        {formatMoney(min)}
      </text>
    </svg>
  )
}
