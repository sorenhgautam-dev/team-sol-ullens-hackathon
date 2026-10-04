/**
 * Scam Town's map (pure). Coordinates are pixels on the team's map artwork
 * (public/sprites/town-map.png, 305×537), with the south district below it.
 * Buildings, fences, trees and water block movement; each scam building has a
 * door where the player stands to go in.
 */

import { CELL, GRID_COLS, GRID_ROWS, TOWN_GRID } from './collision'
import { DISTRICT_BLOCKED, DISTRICT_COLS, DISTRICT_ROWS, DISTRICT_TOP, TILE } from './district'

/** The team's town map. */
export const MAP_W = 305
export const MAP_H = 537
/** The whole walkable world: the town plus the south district below it. */
export const WORLD_W = Math.min(MAP_W, DISTRICT_COLS * TILE)
export const WORLD_H = DISTRICT_TOP + DISTRICT_ROWS * TILE

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** The town's scam buildings (and home, where every payday starts). Ids match the encounters' buildings. */
export type PlaceId = 'home' | 'bank' | 'market' | 'post' | 'job' | 'invest'

export interface Place {
  id: PlaceId
  /** Footprint of the building (empty for open-air spots). */
  body: Rect | null
  /** Where the player stands to go in. */
  door: { x: number; y: number }
}

export const PLACES: Place[] = [
  { id: 'home', body: { x: 10, y: 395, w: 52, h: 56 }, door: { x: 36, y: 463 } },
  { id: 'bank', body: { x: 8, y: 218, w: 52, h: 62 }, door: { x: 34, y: 287 } },
  { id: 'market', body: null, door: { x: 150, y: 338 } },
  { id: 'post', body: { x: 181, y: 95, w: 30, h: 74 }, door: { x: 195, y: 177 } },
  { id: 'job', body: { x: 232, y: 215, w: 60, h: 56 }, door: { x: 256, y: 285 } },
  { id: 'invest', body: { x: 184, y: 255, w: 26, h: 50 }, door: { x: 188, y: 304 } },
]

/** Sita's collision box (feet-centred). */
export const SITA_HALF_W = 4
export const SITA_FEET_H = 5
export const WALK_SPEED = 1.15

/**
 * Collision comes from the map itself (scripts/build-collision.py): fences, trees,
 * buildings, stalls and water are solid; roads, grass and the plaza are open. Below the
 * town, the south district's tiles decide (scripts/build-district.py).
 */
function solidAt(px: number, py: number): boolean {
  if (px < 1 || px >= WORLD_W - 1 || py < 1 || py >= WORLD_H) return true
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

/** True when the walker's feet can stand at (x, y). */
export function isWalkable(x: number, y: number): boolean {
  const l = x - SITA_HALF_W
  const r = x + SITA_HALF_W - 0.01
  const t = y - SITA_FEET_H
  const b = y - 0.01
  return !solidAt(l, t) && !solidAt(r, t) && !solidAt(l, b) && !solidAt(r, b) && !solidAt(x, b)
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
  // Never outside the world, on any edge (the narrower of the town and the district).
  s.x = Math.min(WORLD_W - SITA_HALF_W - 1, Math.max(SITA_HALF_W + 1, s.x))
  s.y = Math.min(WORLD_H - 1, Math.max(SITA_FEET_H + 1, s.y))
  // Diagonals are normalised, so walking diagonally is no faster than straight.
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
  // Corner sliding: blocked by a fence post or a door frame with a gap just to one side? Slide toward the gap.
  if (!moved) {
    const vertical = Math.abs(ny) > Math.abs(nx)
    for (let d = 1; d <= 6 && !moved; d++) {
      for (const side of [-1, 1]) {
        const ox = vertical ? side * d : 0
        const oy = vertical ? 0 : side * d
        if (isWalkable(s.x + ox + (vertical ? 0 : nx), s.y + oy + (vertical ? ny : 0)) && isWalkable(s.x + Math.sign(ox) * speed * 0.6, s.y + Math.sign(oy) * speed * 0.6)) {
          s.x += Math.sign(ox) * speed * 0.6
          s.y += Math.sign(oy) * speed * 0.6
          moved = true
          break
        }
      }
    }
  }
  s.moving = moved
  if (moved) s.odometer += speed
  if (Math.abs(dx) > Math.abs(dy)) s.facing = dx > 0 ? 'right' : 'left'
  else s.facing = dy > 0 ? 'down' : 'up'
  return s
}
