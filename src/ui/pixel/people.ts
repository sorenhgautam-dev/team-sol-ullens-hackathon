/**
 * The people of Scam Town (the player and the townsfolk), drawn from the hand-made pixel
 * templates in peopleArt.ts (scripts/build-people.py). Each person's look paints the
 * template: hair, skin, clothes and shoes get a light and a shadow tone, lit from the
 * top-left like the team's map, with soft brown outlines. Painted frames are cached.
 */
import { BODIES, HEADS, KURTA, LEGS, NECK, PERSON_H, PERSON_W } from './peopleArt'

export type Facing = 'down' | 'up' | 'left' | 'right'

export interface PersonLook {
  shirt: string
  trim: string
  /** Older looks only had this: long hair and a kurta. */
  braid?: boolean
  style?: 'short' | 'long' | 'cap' | 'bun'
  top?: 'shirt' | 'kurta'
  hair?: string
  skin?: string
  pants?: string
  shoes?: string
}

const OUTLINE = '#3b261c'

function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16)
  let r = (n >> 16) & 255
  let g = (n >> 8) & 255
  let b = n & 255
  if (f >= 0) {
    r += (255 - r) * f
    g += (255 - g) * f
    b += (255 - b) * f
  } else {
    r *= 1 + f
    g *= 1 + f
    b *= 1 + f
  }
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`
}

function paints(look: PersonLook): Record<string, string> {
  const hair = look.hair ?? '#2a1d1a'
  const skin = look.skin ?? '#c98a5a'
  const pants = look.pants ?? '#5b4b6b'
  const shoes = look.shoes ?? '#3a2a20'
  return {
    o: OUTLINE,
    h: hair,
    H: shade(hair, 0.28),
    d: shade(hair, -0.35),
    s: skin,
    S: shade(skin, -0.18),
    e: '#261a16',
    m: shade(skin, -0.38),
    c: look.shirt,
    C: shade(look.shirt, 0.22),
    k: shade(look.shirt, -0.25),
    t: look.trim,
    p: pants,
    P: shade(pants, -0.25),
    f: shoes,
    F: shade(shoes, 0.25),
  }
}

const cache = new Map<string, HTMLCanvasElement>()

function painted(look: PersonLook, key: string, mirror: boolean): HTMLCanvasElement | null {
  const id = `${key}|${mirror ? 1 : 0}|${look.shirt}|${look.trim}|${look.hair}|${look.skin}|${look.pants}|${look.shoes}`
  const hit = cache.get(id)
  if (hit) return hit
  const rows = personRows(key)
  if (!rows || typeof document === 'undefined') return null
  const c = document.createElement('canvas')
  c.width = PERSON_W
  c.height = PERSON_H
  const ctx = c.getContext('2d')
  if (!ctx) return null
  const pal = paints(look)
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const colour = pal[row[x]!]
      if (!colour) continue
      ctx.fillStyle = colour
      ctx.fillRect(mirror ? PERSON_W - 1 - x : x, y, 1, 1)
    }
  })
  cache.set(id, c)
  return c
}

const WALK = ['stand', 'stepA', 'stand', 'stepB'] as const

/** Put a frame together from its parts: head, neck, body (arm swings on a step), legs. */
export function personRows(key: string): readonly string[] | null {
  const m = /^([a-z]+)_(shirt|kurta)_(down|up|right)(\d)$/.exec(key)
  if (!m) return null
  const [, style, top, face, n] = m as unknown as [string, string, string, string, string]
  const leg = WALK[Number(n) % 4]!
  const head = HEADS[style]?.[face]
  const body = BODIES[face === 'right' && leg === 'stepA' ? 'right_swing' : face]
  const legs = LEGS[face === 'right' ? 'right' : 'down']?.[leg]
  if (!head || !body || !legs) return null
  return [...head, NECK[face]!, ...body, ...(top === 'kurta' ? [KURTA[face]!, ...legs.slice(1)] : legs)]
}

/** The frame name for a look, facing and walk step (0..3). */
export function personFrame(look: PersonLook, facing: Facing, step: number): string {
  const style = look.style ?? (look.braid ? 'long' : 'short')
  const top = look.top ?? (look.braid ? 'kurta' : 'shirt')
  const face = facing === 'left' ? 'right' : facing
  return `${style}_${top}_${face}${((step % 4) + 4) % 4}`
}

/** Draw a person with their feet at (x, y). `frame` drives the walk cycle while `moving`. */
export function drawPerson(ctx: CanvasRenderingContext2D, x: number, y: number, facing: Facing, frame: number, moving: boolean, look: PersonLook) {
  const img = painted(look, personFrame(look, facing, moving ? frame : 0), facing === 'left')
  if (img) ctx.drawImage(img, Math.round(x) - PERSON_W / 2, Math.round(y) - PERSON_H + 1)
}

/** How tall a person is above their feet, for markers drawn over the head. */
export const PERSON_TOP = PERSON_H - 1
