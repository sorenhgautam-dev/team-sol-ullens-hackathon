/** Tiny particle system for coins, sparks and dust. UI-only effects; Math.random is fine here. */
export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  size: number
  color: string
  gravity: boolean
}

export function burst(list: Particle[], x: number, y: number, count: number, opts: { color?: string | string[]; speed?: number; up?: number; size?: number; life?: number; gravity?: boolean } = {}) {
  const colors = Array.isArray(opts.color) ? opts.color : [opts.color ?? '#f5c26b']
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2
    const s = (opts.speed ?? 2) * (0.5 + Math.random())
    list.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - (opts.up ?? 2),
      life: (opts.life ?? 40) * (0.6 + Math.random() * 0.6),
      size: opts.size ?? 2,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      gravity: opts.gravity ?? true,
    })
  }
}

export function stepParticles(list: Particle[], ground: number) {
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i]!
    if (p.gravity) p.vy += 0.25
    p.x += p.vx
    p.y += p.vy
    if (p.gravity && p.y > ground) {
      p.y = ground
      p.vy = -p.vy * 0.5
      p.vx *= 0.7
    }
    p.life -= 1
    if (p.life <= 0) list.splice(i, 1)
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D, list: Particle[]) {
  for (const p of list) {
    ctx.globalAlpha = Math.min(1, p.life / 12)
    ctx.fillStyle = p.color
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size)
  }
  ctx.globalAlpha = 1
}
