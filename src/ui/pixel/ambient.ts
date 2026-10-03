/**
 * Life in the town, just for show: townsfolk walking their rounds on the roads, cloud
 * shadows drifting over the map, birds crossing now and then, and sparkles on the fountain.
 * Townsfolk follow real paths (findPath), so they never walk through fences or walls.
 * Nothing here touches the game: no collision, no scams. Their clothes are muted so the
 * player's own character (orange, blue or green) always stands out. Placeholder art drawn in code.
 */
import { findPath, type Point } from '@/walk/path'
import { WORLD_W } from '@/walk/map'
import { PALETTE as P } from '@/ui/palette'
import { drawPerson, type PersonLook } from './people'

type Ctx = CanvasRenderingContext2D
type Facing = 'down' | 'up' | 'left' | 'right'
type Look = PersonLook

/** Each townsperson walks a loop through these spots, in world pixels. */
const ROUNDS: { stops: Point[]; look: Look; speed: number; start: number }[] = [
  { stops: [{ x: 130, y: 330 }, { x: 172, y: 330 }, { x: 172, y: 362 }, { x: 130, y: 362 }], look: { shirt: P.stone, trim: P.stoneLight, style: 'bun', hair: '#9a9aa8', skin: '#c98a5a', pants: '#4a3a2a' }, speed: 0.3, start: 0 },
  { stops: [{ x: 150, y: 400 }, { x: 150, y: 640 }], look: { shirt: P.wood, trim: P.sand, style: 'long', top: 'kurta', hair: '#2a1d1a', skin: '#a8714a', pants: '#3a2a20' }, speed: 0.45, start: 120 },
  { stops: [{ x: 110, y: 196 }, { x: 250, y: 196 }], look: { shirt: P.blueDark, trim: P.stoneLight, style: 'short', hair: '#3a2418', skin: '#d8a07a', pants: '#3a2a20' }, speed: 0.4, start: 40 },
  { stops: [{ x: 70, y: 250 }, { x: 70, y: 400 }], look: { shirt: P.amberDark, trim: P.sand, style: 'cap', hair: '#1e1a1f', skin: '#b07850', pants: '#2b4566' }, speed: 0.4, start: 80 },
  { stops: [{ x: 40, y: 600 }, { x: 264, y: 600 }, { x: 264, y: 816 }, { x: 40, y: 816 }], look: { shirt: P.woodDark, trim: P.sand, style: 'short', hair: '#6e6a80', skin: '#c98a5a', pants: '#2b1d10' }, speed: 0.5, start: 300 },
  { stops: [{ x: 30, y: 930 }, { x: 280, y: 930 }], look: { shirt: P.sage, trim: P.stone, style: 'bun', hair: '#2a1d1a', skin: '#d8a07a', pants: '#5b4b6b' }, speed: 0.4, start: 10 },
]

interface Walker {
  points: Point[]
  /** Distance along the loop at each point. */
  at: number[]
  total: number
  look: Look
  speed: number
  start: number
}

let walkers: Walker[] | null = null

function build(): Walker[] {
  const out: Walker[] = []
  for (const r of ROUNDS) {
    const points: Point[] = [r.stops[0]!]
    let ok = true
    for (let i = 0; i < r.stops.length; i++) {
      const leg = findPath(points[points.length - 1]!, r.stops[(i + 1) % r.stops.length]!)
      if (!leg) {
        ok = false
        break
      }
      points.push(...leg)
    }
    if (!ok || points.length < 2) continue
    const at = [0]
    for (let i = 1; i < points.length; i++) at.push(at[i - 1]! + Math.hypot(points[i]!.x - points[i - 1]!.x, points[i]!.y - points[i - 1]!.y))
    out.push({ points, at, total: at[at.length - 1]!, look: r.look, speed: r.speed, start: r.start })
  }
  return out
}

export interface Townsperson {
  x: number
  y: number
  facing: Facing
  step: number
  moving: boolean
  look: Look
}

/** Where everyone is on this frame. With reduced motion they stand still. */
export function townsfolk(frame: number, reduced: boolean): Townsperson[] {
  walkers ??= build()
  return walkers.map((w) => {
    // Walk the loop, with a short pause at each end of the round.
    const cycle = w.total + 120 * w.speed
    const d0 = ((reduced ? 0 : frame) * w.speed + w.start) % cycle
    const d = Math.min(d0, w.total - 0.01)
    const moving = !reduced && d0 < w.total
    let i = 1
    while (i < w.at.length - 1 && w.at[i]! < d) i++
    const a = w.points[i - 1]!
    const b = w.points[i]!
    const seg = Math.max(0.01, w.at[i]! - w.at[i - 1]!)
    const t = Math.min(1, Math.max(0, (d - w.at[i - 1]!) / seg))
    const dx = b.x - a.x
    const dy = b.y - a.y
    const facing: Facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
    return { x: a.x + dx * t, y: a.y + dy * t, facing, step: Math.floor(d / 5), moving, look: w.look }
  })
}

/** Draw one townsperson with feet at (x, y), relative to the camera. */
export function drawTownsperson(ctx: Ctx, p: Townsperson, x: number, y: number) {
  const sx = Math.round(x)
  const sy = Math.round(y)
  ctx.fillStyle = 'rgba(43,29,16,0.22)'
  ctx.fillRect(sx - 3, sy - 1, 7, 1)
  ctx.fillRect(sx - 5, sy, 11, 2)
  drawPerson(ctx, sx, sy, p.facing, p.step, p.moving, p.look)
}

/** Soft cloud shadows drifting east over the whole map (world pixels, relative to the camera). */
export function drawCloudShadows(ctx: Ctx, frame: number, camX: number, camY: number, vw: number, vh: number) {
  const span = WORLD_W + 160
  ctx.fillStyle = 'rgba(43,29,16,0.07)'
  for (const [y0, speed, phase] of [[140, 0.05, 0], [470, 0.04, 120], [800, 0.06, 260], [1010, 0.05, 60]] as const) {
    const x = ((frame * speed + phase) % span) - 80 - camX
    const y = y0 - camY
    if (y < -40 || y > vh + 40 || x < -90 || x > vw + 10) continue
    // A blocky oval, so it matches the pixel art.
    ctx.fillRect(x + 10, y - 14, 50, 4)
    ctx.fillRect(x + 2, y - 10, 70, 8)
    ctx.fillRect(x, y - 2, 78, 10)
    ctx.fillRect(x + 6, y + 8, 60, 6)
    ctx.fillRect(x + 18, y + 14, 34, 3)
  }
}

/** Two birds cross the sky every so often. */
export function drawBirds(ctx: Ctx, frame: number, camX: number, camY: number) {
  const period = 1500
  const t = frame % period
  if (t > 520) return
  const x = t * 0.75 - 60 - camX
  const y = 160 + Math.sin(t / 30) * 6 - camY + Math.floor(frame / period) % 3 * 260
  const flap = Math.floor(frame / 8) % 2
  ctx.fillStyle = P.ink
  for (const [ox, oy] of [[0, 0], [12, 7]] as const) {
    const bx = Math.round(x + ox)
    const by = Math.round(y + oy)
    ctx.fillRect(bx, by, 1, 1)
    ctx.fillRect(bx - 2, by - 1 + flap, 2, 1)
    ctx.fillRect(bx + 1, by - 1 + flap, 2, 1)
    ctx.fillRect(bx - 3, by - flap, 1, 1)
    ctx.fillRect(bx + 3, by - flap, 1, 1)
  }
}

/** Light glinting on the plaza fountain. */
export function drawFountainSparkle(ctx: Ctx, frame: number, camX: number, camY: number) {
  const cx = 150 - camX
  const cy = 298 - camY
  const k = Math.floor(frame / 9)
  ctx.fillStyle = P.light
  for (let i = 0; i < 3; i++) {
    const h = (k * 31 + i * 57) % 97
    ctx.fillRect(Math.round(cx - 9 + (h % 18)), Math.round(cy - 6 + ((h >> 2) % 12)), 1, 1)
  }
}
