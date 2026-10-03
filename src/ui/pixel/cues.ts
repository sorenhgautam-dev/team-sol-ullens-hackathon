/**
 * The cue that starts each scam, drawn in pixels above the building whose turn it is:
 * a ringing phone, a shout, a notification, a letter, a waving stranger, an alert,
 * a price tag or a QR sticker. It pops in with a small spring when it appears.
 * Placeholder art (placeholder_cues), drawn in code in the game palette.
 */
import type { CueKind } from '@/content/scamTown'
import { PALETTE as P } from '@/ui/palette'
import { drawPerson, type PersonLook } from './people'
import { drawText } from './topdown'

type Ctx = CanvasRenderingContext2D
const FONT = '7px Silkscreen, monospace'

function px(ctx: Ctx, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c
  ctx.fillRect(Math.round(x), Math.round(y), w, h)
}

/** Spring-like pop: 0 → a little over 1 → 1. */
export function popScale(t: number): number {
  if (t >= 1) return 1
  const c1 = 1.70158
  const c3 = c1 + 1
  return Math.max(0, 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2))
}

/** A speech bubble whose tail tip is at (0, 0). Returns its left edge and top. */
function bubble(ctx: Ctx, w: number, h: number, border: string = P.ink, fill: string = P.card) {
  const x = -Math.ceil(w / 2)
  const y = -h - 4
  px(ctx, x, y, w, h, border)
  px(ctx, x + 1, y + 1, w - 2, h - 2, fill)
  px(ctx, -2, -5, 5, 1, fill)
  px(ctx, -3, -4, 7, 1, border)
  px(ctx, -2, -4, 5, 1, fill)
  px(ctx, -2, -3, 5, 1, border)
  px(ctx, -1, -3, 3, 1, fill)
  px(ctx, -1, -2, 3, 1, border)
  px(ctx, 0, -2, 1, 1, fill)
  px(ctx, 0, -1, 1, 1, border)
  return { x, y }
}

function text(ctx: Ctx, s: string, x: number, y: number, color: string = P.ink) {
  ctx.font = FONT
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  ctx.fillText(s, Math.round(x), Math.round(y))
}

function textWidth(ctx: Ctx, s: string): number {
  ctx.font = FONT
  return Math.ceil(ctx.measureText(s).width)
}

// Small icons, each drawn from its top-left corner.
const ICONS: Record<string, { w: number; h: number; draw: (ctx: Ctx, x: number, y: number) => void }> = {
  deskPhone: {
    w: 12,
    h: 9,
    draw: (ctx, x, y) => {
      px(ctx, x, y, 12, 2, P.ink)
      px(ctx, x, y + 2, 3, 2, P.ink)
      px(ctx, x + 9, y + 2, 3, 2, P.ink)
      px(ctx, x + 2, y + 3, 8, 6, P.ink)
      px(ctx, x + 3, y + 4, 6, 4, P.red)
      px(ctx, x + 5, y + 5, 2, 2, P.card)
    },
  },
  phone: {
    w: 7,
    h: 11,
    draw: (ctx, x, y) => {
      px(ctx, x, y, 7, 11, P.ink)
      px(ctx, x + 1, y + 1, 5, 8, P.teal)
      px(ctx, x + 2, y + 3, 3, 1, P.card)
      px(ctx, x + 2, y + 5, 2, 1, P.card)
      px(ctx, x + 3, y + 9, 1, 1, P.stoneLight)
    },
  },
  envelope: {
    w: 11,
    h: 8,
    draw: (ctx, x, y) => {
      px(ctx, x, y, 11, 8, P.ink)
      px(ctx, x + 1, y + 1, 9, 6, P.card)
      px(ctx, x + 1, y + 1, 1, 1, P.sand)
      px(ctx, x + 2, y + 2, 2, 1, P.sand)
      px(ctx, x + 4, y + 3, 3, 1, P.sand)
      px(ctx, x + 7, y + 2, 2, 1, P.sand)
      px(ctx, x + 9, y + 1, 1, 1, P.sand)
      px(ctx, x + 4, y + 5, 3, 2, P.red)
    },
  },
  qr: {
    w: 9,
    h: 9,
    draw: (ctx, x, y) => {
      px(ctx, x, y, 9, 9, P.ink)
      px(ctx, x + 1, y + 1, 7, 7, P.light)
      for (const [qx, qy] of [[1, 1], [5, 1], [1, 5]] as const) {
        px(ctx, x + qx, y + qy, 3, 3, P.ink)
        px(ctx, x + qx + 1, y + qy + 1, 1, 1, P.light)
      }
      px(ctx, x + 5, y + 5, 1, 1, P.ink)
      px(ctx, x + 7, y + 6, 1, 1, P.ink)
      px(ctx, x + 6, y + 7, 1, 1, P.ink)
    },
  },
  warning: {
    w: 9,
    h: 8,
    draw: (ctx, x, y) => {
      for (let r = 0; r < 8; r++) {
        const half = Math.floor(r / 2)
        px(ctx, x + 4 - half, y + r, 2 * half + 1, 1, P.ink)
        const inner = Math.floor(r / 2) - 1
        if (r >= 2 && r < 7 && inner >= 0) px(ctx, x + 4 - inner, y + r, 2 * inner + 1, 1, P.amberLight)
      }
      px(ctx, x + 4, y + 3, 1, 2, P.ink)
      px(ctx, x + 4, y + 6, 1, 1, P.ink)
    },
  },
}

/** A bubble holding an optional icon and optional text, tail tip at (0, 0). */
function iconBubble(ctx: Ctx, icon: keyof typeof ICONS | null, label: string, border: string = P.ink, fill: string = P.card) {
  const ic = icon ? ICONS[icon]! : null
  const tw = label ? textWidth(ctx, label) : 0
  const w = 6 + (ic ? ic.w : 0) + (ic && label ? 3 : 0) + tw
  const h = Math.max((ic ? ic.h : 0) + 6, 11)
  const { x, y } = bubble(ctx, w, h, border, fill)
  let cx = x + 3
  if (ic) {
    ic.draw(ctx, cx, y + Math.round((h - ic.h) / 2))
    cx += ic.w + 3
  }
  if (label) text(ctx, label, cx, y + h / 2)
  return { x, y, w, h }
}

/** The friendly stranger: a person in a dark suit and hat, waving, feet at (0, 0). */
const STRANGER: PersonLook = { shirt: '#2b4566', trim: '#e0a93b', style: 'cap', hair: '#2a1d1a', skin: '#c98a5a', pants: '#2b1d10' }
function drawStranger(ctx: Ctx, frame: number, reduced: boolean) {
  ctx.fillStyle = 'rgba(43,29,16,0.22)'
  ctx.fillRect(-5, 0, 11, 2)
  drawPerson(ctx, 0, 0, 'down', 0, false, STRANGER)
  // The waving arm, raised over the shoulder.
  const wave = !reduced && frame % 20 < 10 ? 1 : 0
  ctx.fillStyle = '#3b261c'
  ctx.fillRect(5 + wave, -21, 4, 10)
  ctx.fillStyle = '#2b4566'
  ctx.fillRect(6 + wave, -16, 2, 4)
  ctx.fillStyle = '#c98a5a'
  ctx.fillRect(6 + wave, -20, 2, 4)
}

/**
 * Draw the cue for the scam whose turn it is.
 * (ax, ay): the point above the building the bubble's tail points to.
 * (doorX, doorY): the door, where the stranger stands.
 * age: frames since the cue appeared (for the pop).
 */
export function drawCue(ctx: Ctx, kind: CueKind, ax: number, ay: number, doorX: number, doorY: number, frame: number, age: number, label: string, reduced: boolean) {
  const s = reduced ? 1 : popScale(age / 14)
  if (s <= 0) return
  if (kind === 'stranger') {
    const fx = Math.round(doorX + 15)
    const fy = Math.round(doorY + 1)
    ctx.save()
    ctx.translate(fx, fy)
    if (s !== 1) ctx.scale(s, s)
    drawStranger(ctx, frame, reduced)
    const blink = reduced || frame % 30 < 20
    if (blink) drawText(ctx, '$$', 0, -30 - (reduced ? 0 : Math.round(Math.sin(frame / 8))), P.amberLight, 7)
    if (!reduced && frame % 30 < 15) {
      px(ctx, -8, -29, 1, 1, P.light)
      px(ctx, 8, -32, 1, 1, P.light)
    }
    ctx.restore()
    return
  }

  // The ringing phone bounces; the others bob gently.
  const bob = reduced ? 0 : kind === 'ring' ? -Math.round(Math.abs(Math.sin(frame / 7)) * 4) : Math.round(Math.sin(frame / 12))
  ctx.save()
  ctx.translate(Math.round(ax), Math.round(ay + bob))
  if (s !== 1) ctx.scale(s, s)
  switch (kind) {
    case 'ring': {
      const ringing = !reduced && frame % 48 < 26
      const shake = ringing ? (frame % 4 < 2 ? -1 : 1) : 0
      ctx.translate(shake, 0)
      const b = iconBubble(ctx, 'deskPhone', '')
      if (ringing) {
        const midY = b.y + b.h / 2
        for (const side of [-1, 1]) {
          px(ctx, side * (b.w / 2 + 2) - (side < 0 ? 1 : 0), midY - 2, 1, 4, P.ink)
          px(ctx, side * (b.w / 2 + 4) - (side < 0 ? 1 : 0), midY - 3, 1, 6, P.ink)
        }
      }
      break
    }
    case 'shout': {
      const b = iconBubble(ctx, null, label)
      if (!reduced && frame % 24 < 16) {
        px(ctx, b.x - 2, b.y - 2, 1, 2, P.amber)
        px(ctx, b.x - 4, b.y + 2, 2, 1, P.amber)
        px(ctx, b.x + b.w + 1, b.y - 2, 1, 2, P.amber)
        px(ctx, b.x + b.w + 2, b.y + 2, 2, 1, P.amber)
      }
      break
    }
    case 'notify': {
      const buzz = !reduced && frame % 40 < 8 ? (frame % 2 ? -1 : 1) : 0
      ctx.translate(buzz, 0)
      const b = iconBubble(ctx, 'phone', label)
      // The red "1" badge.
      px(ctx, b.x + b.w - 4, b.y - 3, 7, 7, P.ink)
      px(ctx, b.x + b.w - 3, b.y - 2, 5, 5, P.red)
      px(ctx, b.x + b.w - 1, b.y - 1, 1, 3, P.light)
      break
    }
    case 'letter':
      iconBubble(ctx, 'envelope', label)
      break
    case 'alert':
      if (reduced || frame % 30 < 22) iconBubble(ctx, 'warning', label, P.red, P.card)
      else iconBubble(ctx, 'warning', label, P.ink, P.card)
      break
    case 'tag':
      iconBubble(ctx, null, label, P.ink, P.amberLight)
      break
    case 'qr':
      iconBubble(ctx, 'qr', label)
      break
  }
  ctx.restore()
}

/** A small arrow bobbing above the door, pointing down at it. */
export function drawDoorArrow(ctx: Ctx, x: number, y: number, frame: number, reduced: boolean) {
  const b = reduced ? 0 : Math.round(Math.sin(frame / 6) * 2)
  const top = Math.round(y + b)
  const cx = Math.round(x)
  px(ctx, cx - 4, top - 1, 9, 1, P.ink)
  for (let r = 0; r < 5; r++) {
    px(ctx, cx - 4 + r, top + r, 9 - 2 * r, 1, P.ink)
    if (r < 4) px(ctx, cx - 3 + r, top + r, 7 - 2 * r, 1, frame % 40 < 20 ? P.amberLight : P.amber)
  }
}
