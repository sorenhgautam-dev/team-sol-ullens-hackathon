/**
 * The village map (pure). Coordinates are pixels on the team's map artwork
 * (public/sprites/town-map.png, 305×537). Buildings and water block movement;
 * each building has a door where Sita can press the action button. Nothing here
 * touches money: a door only names which existing sheet or action it opens.
 */

import { CELL, GRID_COLS, GRID_ROWS, TOWN_GRID } from './collision'
import { DISTRICT_BLOCKED, DISTRICT_COLS, DISTRICT_ROWS, DISTRICT_TOP, TILE } from './district'

/** The team's town map. */
export const MAP_W = 305
export const MAP_H = 537
/** The whole walkable world: the town plus the south district below it. */
export const WORLD_W = MAP_W
export const WORLD_H = DISTRICT_TOP + DISTRICT_ROWS * TILE

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
  { id: 'landlord', body: { x: 8, y: 105, w: 66, h: 66 }, door: { x: 25, y: 197 }, emoji: '🏘️', nameKey: 'walk.place.landlord', promptKey: 'walk.prompt.landlord' },
  { id: 'family', body: { x: 92, y: 118, w: 74, h: 48 }, door: { x: 129, y: 173 }, emoji: '👨‍👩‍👧', nameKey: 'walk.place.family', promptKey: 'walk.prompt.family' },
  { id: 'school', body: { x: 181, y: 95, w: 30, h: 74 }, door: { x: 195, y: 177 }, emoji: '🎒', nameKey: 'walk.place.school', promptKey: 'walk.prompt.school' },
  { id: 'shop', body: { x: 225, y: 112, w: 66, h: 64 }, door: { x: 256, y: 185 }, emoji: '🏪', nameKey: 'walk.place.shop', promptKey: 'walk.prompt.shop' },
  { id: 'bank', body: { x: 8, y: 218, w: 52, h: 62 }, door: { x: 34, y: 287 }, emoji: '🏦', nameKey: 'walk.place.bank', promptKey: 'walk.prompt.bank' },
  { id: 'market', body: null, door: { x: 150, y: 338 }, emoji: '🥬', nameKey: 'walk.place.market', promptKey: 'walk.prompt.market' },
  { id: 'plaza', body: { x: 184, y: 255, w: 26, h: 50 }, door: { x: 188, y: 304 }, emoji: '📜', nameKey: 'walk.place.plaza', promptKey: 'walk.prompt.plaza' },
  { id: 'workshop', body: { x: 232, y: 215, w: 60, h: 56 }, door: { x: 256, y: 285 }, emoji: '🧵', nameKey: 'walk.place.workshop', promptKey: 'walk.prompt.workshop' },
  { id: 'mailbox', body: null, door: { x: 178, y: 430 }, emoji: '📬', nameKey: 'walk.place.mailbox', promptKey: 'walk.prompt.mailbox' },
]

/** Sita's collision box (feet-centred). */
export const SITA_HALF_W = 4
export const SITA_FEET_H = 5
export const WALK_SPEED = 1.15
export const INTERACT_RADIUS = 14

/**
 * Collision comes from the map itself (scripts/build-collision.py): fences, trees,
 * buildings, stalls and water are solid; roads, grass and the plaza are open. Below the
 * town, the south district's tiles decide (scripts/build-district.py).
 */
function solidAt(px: number, py: number, maxY: number): boolean {
  if (px < 1 || px >= WORLD_W - 1 || py < 1 || py >= maxY) return true
  if (py < DISTRICT_TOP) {
    const cx = Math.floor(px / CELL)
    const cy = Math.floor(py / CELL)
    if (cy >= GRID_ROWS || cx >= GRID_COLS) return true
    return TOWN_GRID[cy]![cx] !== '.'
  }
  const c = Math.floor(px / TILE)
  const r = Math.floor((py - DISTRICT_TOP) / TILE)
  if (r >= DISTRICT_ROWS || c >= DISTRICT_COLS) return true
  return DISTRICT_BLOCKED[r]![c] !== '.'
}

/** True when Sita's feet can stand at (x, y). `maxY` limits the world (the old village stops at the town edge). */
export function isWalkable(x: number, y: number, maxY: number = WORLD_H): boolean {
  const l = x - SITA_HALF_W
  const r = x + SITA_HALF_W - 0.01
  const t = y - SITA_FEET_H
  const b = y - 0.01
  return !solidAt(l, t, maxY) && !solidAt(r, t, maxY) && !solidAt(l, b, maxY) && !solidAt(r, b, maxY) && !solidAt(x, b, maxY)
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
export function stepWalker(s: WalkerState, dx: number, dy: number, speed = WALK_SPEED, maxY: number = WORLD_H): WalkerState {
  const len = Math.hypot(dx, dy)
  if (len < 0.15) {
    s.moving = false
    return s
  }
  const nx = (dx / len) * speed
  const ny = (dy / len) * speed
  let moved = false
  if (Math.abs(nx) > 0.01 && isWalkable(s.x + nx, s.y, maxY)) {
    s.x += nx
    moved = true
  }
  if (Math.abs(ny) > 0.01 && isWalkable(s.x, s.y + ny, maxY)) {
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
