import { useRef, useState, type PointerEvent } from 'react'

interface Props {
  /** Called on every move with a vector in [-1, 1]²; (0, 0) on release. */
  onChange: (dx: number, dy: number) => void
  size?: number
}

/** Virtual thumbstick: drag anywhere on the pad; the knob follows and reports a direction. */
export function Joystick({ onChange, size = 124 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const active = useRef<number | null>(null)
  const radius = size / 2 - 18

  const update = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    let dx = e.clientX - (r.left + r.width / 2)
    let dy = e.clientY - (r.top + r.height / 2)
    const d = Math.hypot(dx, dy)
    if (d > radius) {
      dx = (dx / d) * radius
      dy = (dy / d) * radius
    }
    setKnob({ x: dx, y: dy })
    const dead = 6
    onChange(Math.abs(dx) < dead && Math.abs(dy) < dead ? 0 : dx / radius, Math.abs(dx) < dead && Math.abs(dy) < dead ? 0 : dy / radius)
  }
  const release = () => {
    active.current = null
    setKnob({ x: 0, y: 0 })
    onChange(0, 0)
  }

  return (
    <div
      ref={ref}
      className="relative select-none touch-none"
      style={{ width: size, height: size }}
      onPointerDown={(e) => {
        active.current = e.pointerId
        e.currentTarget.setPointerCapture(e.pointerId)
        update(e)
      }}
      onPointerMove={(e) => {
        if (active.current === e.pointerId) update(e)
      }}
      onPointerUp={release}
      onPointerCancel={release}
      role="slider"
      aria-label="Move"
      aria-valuenow={0}
    >
      <div className="absolute inset-0 bg-[#07080f]/55" style={{ boxShadow: 'inset 0 0 0 3px #f4f1e8, inset 0 0 0 5px #07080f' }} />
      <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 bg-[#f4f1e8]/50" />
      <div
        className="absolute left-1/2 top-1/2 bg-marigold"
        style={{ width: 36, height: 36, transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))`, boxShadow: '0 0 0 3px #07080f, 0 3px 0 3px #07080f' }}
      />
    </div>
  )
}
