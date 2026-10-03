/**
 * The village map (pure). Coordinates are pixels on the team's map artwork
 * (public/sprites/town-map.png, 305×537). Buildings and water block movement;
 * each building has a door where Sita can press the action button. Nothing here
 * touches money: a door only names which existing sheet or action it opens.
 */

export const MAP_W = 305
export const MAP_H = 537

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export type PlaceId = 'home' | 'landlord' | 'family' | 'school' | 'bank' | 'market' | 'shop' | 'workshop' | 'plaza' | 'mailbox'

export interface Place {
  id: PlaceId
  /** Footprint that blocks walking (empty for open-air spots). */
  body: Rect | null
  /** Where Sita stands to interact. */
  door: { x: number; y: number }
  emoji: string
  nameKey: string
  promptKey: string
}

export const PLACES: Place[] = [
  { id: 'home', body: { x: 10, y: 395, w: 52, h: 56 }, door: { x: 36, y: 463 }, emoji: '🏡', nameKey: 'walk.place.home', promptKey: 'walk.prompt.home' },
  { id: 'landlord', body: { x: 8, y: 105, w: 66, h: 66 }, door: { x: 42, y: 178 }, emoji: '🏘️', nameKey: 'walk.place.landlord', promptKey: 'walk.prompt.landlord' },
  { id: 'family', body: { x: 92, y: 118, w: 74, h: 48 }, door: { x: 129, y: 173 }, emoji: '👨‍👩‍👧', nameKey: 'walk.place.family', promptKey: 'walk.prompt.family' },
  { id: 'school', body: { x: 181, y: 95, w: 30, h: 74 }, door: { x: 196, y: 176 }, emoji: '🎒', nameKey: 'walk.place.school', promptKey: 'walk.prompt.school' },
  { id: 'shop', body: { x: 225, y: 112, w: 66, h: 64 }, door: { x: 258, y: 183 }, emoji: '🏪', nameKey: 'walk.place.shop', promptKey: 'walk.prompt.shop' },
  { id: 'bank', body: { x: 8, y: 218, w: 52, h: 62 }, door: { x: 34, y: 287 }, emoji: '🏦', nameKey: 'walk.place.bank', promptKey: 'walk.prompt.bank' },
  { id: 'market', body: null, door: { x: 150, y: 338 }, emoji: '🥬', nameKey: 'walk.place.market', promptKey: 'walk.prompt.market' },
  { id: 'plaza', body: { x: 184, y: 255, w: 26, h: 50 }, door: { x: 197, y: 312 }, emoji: '📜', nameKey: 'walk.place.plaza', promptKey: 'walk.prompt.plaza' },
  { id: 'workshop', body: { x: 232, y: 215, w: 60, h: 56 }, door: { x: 262, y: 278 }, emoji: '🧵', nameKey: 'walk.place.workshop', promptKey: 'walk.prompt.workshop' },
  { id: 'mailbox', body: null, door: { x: 178, y: 430 }, emoji: '📬', nameKey: 'walk.place.mailbox', promptKey: 'walk.prompt.mailbox' },
]

/** Water, fences, stalls, the fountain and the big shed: solid but not interactive. */
export const SOLIDS: Rect[] = [
  { x: 0, y: 0, w: MAP_W, h: 100 }, // river and far bank
  { x: 66, y: 400, w: 50, h: 52 }, // home garden fence
  { x: 100, y: 238, w: 26, h: 24 }, // market stalls
  { x: 160, y: 238, w: 42, h: 26 },
  { x: 100, y: 333, w: 26, h: 24 },
  { x: 190, y: 333, w: 26, h: 24 },
  { x: 130, y: 280, w: 40, h: 40 }, // fountain
  { x: 250, y: 300, w: 46, h: 52 }, // farmhouse on the right
  { x: 200, y: 395, w: 66, h: 56 }, // big shed
  { x: 118, y: 275, w: 10, h: 44 }, // flower beds beside the fountain
  { x: 174, y: 275, w: 8, h: 30 },
]

/** Sita's collision box (feet-centred). */
export const SITA_HALF_W = 4
export const SITA_FEET_H = 5
export const WALK_SPEED = 1.15
export const INTERACT_RADIUS = 14

function hitRect(x: number, y: number, r: Rect): boolean {
  return x + SITA_HALF_W > r.x && x - SITA_HALF_W < r.x + r.w && y > r.y && y - SITA_FEET_H < r.y + r.h
}

const BLOCKS: Rect[] = [...SOLIDS, ...PLACES.flatMap((p) => (p.body ? [p.body] : []))]

/** True when Sita's feet can stand at (x, y). */
export function isWalkable(x: number, y: number): boolean {
  if (x - SITA_HALF_W < 2 || x + SITA_HALF_W > MAP_W - 2 || y < 8 || y > MAP_H - 4) return false
  for (const r of BLOCKS) if (hitRect(x, y, r)) return false
  return true
}

export type Facing = 'down' | 'up' | 'left' | 'right'

export interface WalkerState {
  x: number
  y: number
  facing: Facing
  /** True on the last step that moved her. */
  moving: boolean
  /** Distance walked (drives the walk cycle). */
  odometer: number
}

export function startWalker(): WalkerState {
  const home = PLACES[0]!
  return { x: home.door.x, y: home.door.y, facing: 'down', moving: false, odometer: 0 }
}

/** Move by a unit-ish vector, sliding along obstacles. Mutates and returns the state. */
export function stepWalker(s: WalkerState, dx: number, dy: number, speed = WALK_SPEED): WalkerState {
  const len = Math.hypot(dx, dy)
  if (len < 0.15) {
    s.moving = false
    return s
  }
  const nx = (dx / len) * speed
  const ny = (dy / len) * speed
  let moved = false
  if (Math.abs(nx) > 0.01 && isWalkable(s.x + nx, s.y)) {
    s.x += nx
    moved = true
  }
  if (Math.abs(ny) > 0.01 && isWalkable(s.x, s.y + ny)) {
    s.y += ny
    moved = true
  }
  s.moving = moved
  if (moved) s.odometer += speed
  if (Math.abs(dx) > Math.abs(dy)) s.facing = dx > 0 ? 'right' : 'left'
  else s.facing = dy > 0 ? 'down' : 'up'
  return s
}

/** The place whose door Sita is standing at, if any. */
export function placeAt(x: number, y: number): Place | undefined {
  let best: Place | undefined
  let bestD = INTERACT_RADIUS
  for (const p of PLACES) {
    const d = Math.hypot(p.door.x - x, p.door.y - y)
    if (d <= bestD) {
      best = p
      bestD = d
    }
  }
  return best
}

/* ---------- scammers on the map ---------- */

export const APPROACH_SPEED = 0.55
export const BATTLE_RANGE = 26
/** Where scammers walk in from (the road at the top-left and top-right of the map). */
const SPAWNS = [
  { x: 150, y: 215 },
  { x: 150, y: 520 },
  { x: 292, y: 290 },
]

export interface ApproachState {
  x: number
  y: number
  /** Reached Sita. */
  arrived: boolean
}

/** Deterministic spawn: the k-th scam of a month comes from the k-th road. */
export function startApproach(k: number): ApproachState {
  const s = SPAWNS[k % SPAWNS.length]!
  return { x: s.x, y: s.y, arrived: false }
}

/** Walk straight at Sita, ignoring buildings (they cut through the plaza like a rumour). */
export function stepApproach(a: ApproachState, sita: { x: number; y: number }): ApproachState {
  if (a.arrived) return a
  const dx = sita.x - a.x
  const dy = sita.y - a.y
  const d = Math.hypot(dx, dy)
  if (d <= BATTLE_RANGE) {
    a.arrived = true
    return a
  }
  a.x += (dx / d) * APPROACH_SPEED
  a.y += (dy / d) * APPROACH_SPEED
  return a
}
