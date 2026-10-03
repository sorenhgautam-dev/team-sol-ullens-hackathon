/**
 * Procedural pixel placeholders (placeholder_sita, placeholder_scammer) and sprite-sheet drawing.
 * Team PNG sheets in public/sprites/ take over automatically when present (see useSpriteSheet).
 */
export type Ctx = CanvasRenderingContext2D

export function px(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), w, h)
}

export type SitaMood = 'idle' | 'worried' | 'happy' | 'phone'

/** 14×26 px character, feet at (x, y). frame 0..3 at ~8 fps. */
export function drawSita(ctx: Ctx, x: number, y: number, frame: number, mood: SitaMood = 'idle') {
  const bob = frame % 2 === 0 ? 0 : -1
  const top = y - 26 + bob
  // hair + head
  px(ctx, x + 3, top, 8, 3, '#1e1a1f')
  px(ctx, x + 2, top + 2, 10, 2, '#1e1a1f')
  px(ctx, x + 3, top + 3, 8, 6, '#c98a5a')
  px(ctx, x + 5, top + 5, 1, 1, '#1e1a1f')
  px(ctx, x + 8, top + 5, 1, 1, '#1e1a1f')
  if (mood === 'happy') px(ctx, x + 5, top + 7, 4, 1, '#7a2e2e')
  if (mood === 'worried') px(ctx, x + 6, top + 8, 2, 1, '#7a2e2e')
  // earring + braid
  px(ctx, x + 11, top + 4, 1, 5, '#1e1a1f')
  px(ctx, x + 2, top + 6, 1, 1, '#f5c26b')
  // kurta
  px(ctx, x + 2, top + 9, 10, 9, '#d9734e')
  px(ctx, x + 1, top + 10, 1, 5, '#d9734e')
  px(ctx, x + 12, top + 10, 1, 5, '#d9734e')
  px(ctx, x + 4, top + 10, 6, 1, '#f5c26b')
  // arms
  if (mood === 'phone') {
    px(ctx, x + 10, top + 10, 3, 2, '#c98a5a')
    px(ctx, x + 11, top + 6, 3, 5, '#1e2a44')
    px(ctx, x + 12, top + 7, 1, 3, '#6ec6ff')
  } else if (mood === 'worried') {
    px(ctx, x, top + 9, 2, 3, '#c98a5a')
    px(ctx, x + 12, top + 9, 2, 3, '#c98a5a')
  } else {
    px(ctx, x, top + 11, 1, 5, '#c98a5a')
    px(ctx, x + 13, top + 11, 1, 5, '#c98a5a')
  }
  // trousers + feet
  px(ctx, x + 3, top + 18, 8, 6, '#5b4b6b')
  px(ctx, x + 3, top + 24, 3, 2, '#1e1a1f')
  px(ctx, x + 8, top + 24, 3, 2, '#1e1a1f')
}

export type ScammerState = 'idle' | 'taunt' | 'lunge' | 'hit' | 'flee' | 'dissolve'

/** 16×28 px comic villain in the scammer's colour, feet at (x, y). alpha for dissolve. */
export function drawScammer(ctx: Ctx, x: number, y: number, frame: number, color: string, state: ScammerState, alpha = 1) {
  ctx.save()
  ctx.globalAlpha = alpha
  const fidget = state === 'idle' ? (frame % 4 === 1 ? 1 : 0) : 0
  const lean = state === 'taunt' ? -2 : state === 'lunge' ? -4 : state === 'hit' ? 3 : 0
  const top = y - 28
  const bx = x + fidget + lean
  const flash = state === 'hit' && frame % 2 === 0
  const body = flash ? '#ffffff' : color
  const dark = flash ? '#ffffff' : '#07080f'
  // hat
  px(ctx, bx + 2, top, 12, 3, dark)
  px(ctx, bx, top + 3, 16, 2, dark)
  // mask / face
  px(ctx, bx + 3, top + 5, 10, 7, flash ? '#ffffff' : '#2b2340')
  px(ctx, bx + 5, top + 7, 2, 2, flash ? '#ffffff' : '#ff4d6d')
  px(ctx, bx + 9, top + 7, 2, 2, flash ? '#ffffff' : '#ff4d6d')
  if (state === 'taunt') px(ctx, bx + 5, top + 10, 6, 1, '#ffffff')
  // coat
  px(ctx, bx + 1, top + 12, 14, 10, body)
  px(ctx, bx + 6, top + 12, 4, 10, dark)
  // arms (lunge reaches forward)
  if (state === 'lunge') {
    px(ctx, bx - 5, top + 13, 6, 2, body)
    px(ctx, bx - 6, top + 12, 2, 3, '#f5c26b')
  } else {
    px(ctx, bx - 1, top + 13, 2, 6, body)
    px(ctx, bx + 15, top + 13, 2, 6, body)
  }
  // legs
  const step = state === 'flee' ? (frame % 2 === 0 ? 2 : -2) : 0
  px(ctx, bx + 3 + step, top + 22, 4, 6, dark)
  px(ctx, bx + 9 - step, top + 22, 4, 6, dark)
  ctx.restore()
}

/** Night street backdrop for the battle and life scenes (placeholder_street). */
export function drawStreet(ctx: Ctx, w: number, h: number, frame: number) {
  px(ctx, 0, 0, w, h, '#1d1b3f')
  px(ctx, 0, 0, w, Math.floor(h * 0.55), '#2b2340')
  // buildings
  const cols = ['#141633', '#1b1d3a', '#0f1020']
  for (let i = 0; i < 9; i++) {
    const bw = 18 + ((i * 7) % 12)
    const bh = 30 + ((i * 13) % 28)
    const bx = i * 20 - 4
    px(ctx, bx, h - 16 - bh, bw, bh, cols[i % 3]!)
    for (let r = 0; r < Math.floor(bh / 8); r++) for (let c = 0; c < Math.floor(bw / 6); c++) {
      const lit = (r * 5 + c * 3 + i) % 4 === 0 && ((frame >> 3) + r + c) % 7 !== 0
      px(ctx, bx + 2 + c * 6, h - 14 - bh + r * 8, 2, 3, lit ? '#f5c26b' : '#2a2d5c')
    }
  }
  // string lights
  for (let x = 0; x < w; x += 6) px(ctx, x, 12 + Math.round(Math.sin(x / 9) * 2), 1, 1, (x / 6 + (frame >> 2)) % 3 === 0 ? '#ff4d6d' : '#f5c26b')
  // ground
  px(ctx, 0, h - 16, w, 16, '#3a3550')
  px(ctx, 0, h - 16, w, 2, '#5b4b6b')
  for (let x = 0; x < w; x += 12) px(ctx, x + ((frame >> 2) % 12), h - 8, 6, 1, '#4a4463')
}

/** Chunky pixel stamp text ("VERIFY", "BLOCKED") drawn with the pixel font. */
export function drawStamp(ctx: Ctx, text: string, x: number, y: number, color: string, scale = 1) {
  ctx.save()
  ctx.translate(Math.round(x), Math.round(y))
  ctx.rotate(-0.12)
  ctx.scale(scale, scale)
  ctx.font = '8px Silkscreen, monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const w = ctx.measureText(text).width + 8
  px(ctx, -w / 2, -7, w, 14, '#07080f')
  px(ctx, -w / 2 + 1, -6, w - 2, 12, color)
  ctx.fillStyle = '#07080f'
  ctx.fillText(text, 0, 1)
  ctx.restore()
}
