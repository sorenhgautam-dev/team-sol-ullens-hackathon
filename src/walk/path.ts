/**
 * Tap to walk: a shortest path over the walk grid, using the same foot-box rule as the
 * joystick (isWalkable), so a path never goes through a fence, a tree or a wall.
 * Breadth-first search on 4-pixel cells, then "string pulling": keep only the corners,
 * so the walker heads straight across open ground instead of zig-zagging.
 */
import { WORLD_H, WORLD_W, isWalkable } from './map'

export interface Point {
  x: number
  y: number
}

const STEP = 4
const COLS = Math.ceil(WORLD_W / STEP)
const ROWS = Math.ceil(WORLD_H / STEP)

const cellOf = (p: Point) => ({ c: Math.min(COLS - 1, Math.max(0, Math.round((p.x - STEP / 2) / STEP))), r: Math.min(ROWS - 1, Math.max(0, Math.round((p.y - STEP / 2) / STEP))) })
const centre = (c: number, r: number): Point => ({ x: c * STEP + STEP / 2, y: r * STEP + STEP / 2 })

/** True when the walker can go in a straight line from a to b (checked every pixel). */
export function clearLine(a: Point, b: Point, walkable: (x: number, y: number) => boolean = isWalkable): boolean {
  const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y))
  for (let i = 1; i <= n; i++) {
    const t = i / n
    if (!walkable(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) return false
  }
  return true
}

/**
 * Waypoints from `from` to `to` (the last one is `to` itself, or the nearest standable
 * spot to it). Null when there is no way there.
 */
export function findPath(from: Point, to: Point, walkable: (x: number, y: number) => boolean = isWalkable): Point[] | null {
  const open = (c: number, r: number) => walkable(centre(c, r).x, centre(c, r).y)
  // The goal: the tapped spot, or the nearest standable cell to it.
  let goal = cellOf(to)
  if (!open(goal.c, goal.r)) {
    let best: { c: number; r: number } | null = null
    for (let rad = 1; rad <= 6 && !best; rad++)
      for (let dr = -rad; dr <= rad && !best; dr++)
        for (let dc = -rad; dc <= rad; dc++) {
          const c = goal.c + dc
          const r = goal.r + dr
          if (c >= 0 && r >= 0 && c < COLS && r < ROWS && open(c, r)) {
            best = { c, r }
            break
          }
        }
    if (!best) return null
    goal = best
  }
  const start = cellOf(from)
  const prev = new Int32Array(COLS * ROWS).fill(-2)
  const startI = start.r * COLS + start.c
  const goalI = goal.r * COLS + goal.c
  prev[startI] = -1
  const queue = new Int32Array(COLS * ROWS)
  let head = 0
  let tail = 0
  queue[tail++] = startI
  while (head < tail) {
    const i = queue[head++]!
    if (i === goalI) break
    const c = i % COLS
    const r = (i - c) / COLS
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nc = c + dc
      const nr = r + dr
      if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue
      const j = nr * COLS + nc
      if (prev[j] !== -2 || !open(nc, nr)) continue
      prev[j] = i
      queue[tail++] = j
    }
  }
  if (prev[goalI] === -2) return null
  const cells: Point[] = []
  for (let i = goalI; i !== -1; i = prev[i]!) cells.push(centre(i % COLS, Math.floor(i / COLS)))
  cells.reverse()
  // The exact tapped spot, when the walker can stand there.
  const last = walkable(to.x, to.y) && clearLine(cells[cells.length - 1]!, to, walkable) ? to : cells[cells.length - 1]!
  cells[cells.length - 1] = last
  // String pulling: from each kept point, jump to the furthest point in a clear straight line.
  const out: Point[] = []
  let at: Point = from
  let k = 0
  while (k < cells.length) {
    let far = k
    for (let j = k + 1; j < cells.length && j <= k + 80; j++) {
      if (clearLine(at, cells[j]!, walkable)) far = j
      else break
    }
    out.push(cells[far]!)
    at = cells[far]!
    k = far + 1
  }
  return out
}
