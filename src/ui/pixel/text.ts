const OFFSETS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const
/** Each label is drawn once (text is slow to draw every frame) and reused, at the canvas's pixel scale. */
const cache = new Map<string, HTMLCanvasElement>()

function paint(c: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, font: string, align: CanvasTextAlign) {
  c.font = font
  c.textAlign = align
  c.textBaseline = 'middle'
  c.fillStyle = '#07080f'
  for (const [dx, dy] of OFFSETS) c.fillText(text, x + dx, y + dy)
  c.fillStyle = color
  c.fillText(text, x, y)
}

/** Outlined pixel text for the town canvas (building names, signs, cue labels). */
export function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, size = 8, align: CanvasTextAlign = 'center') {
  const font = `${size}px Silkscreen, monospace`
  // Until the pixel font has loaded, draw directly so the fallback font is never cached.
  if (!document.fonts.check(font)) return paint(ctx, text, Math.round(x), Math.round(y), color, font, align)
  const s = Math.max(1, Math.round(ctx.getTransform().a))
  const key = `${text}|${color}|${size}|${s}`
  let img = cache.get(key)
  if (!img) {
    img = document.createElement('canvas')
    const c = img.getContext('2d')!
    c.font = font
    const w = Math.ceil(c.measureText(text).width) + 4
    const h = size + 4
    img.width = w * s
    img.height = h * s
    c.scale(s, s)
    paint(c, text, w / 2, h / 2, color, font, 'center')
    cache.set(key, img)
  }
  const w = img.width / s
  const h = img.height / s
  const left = align === 'center' ? Math.round(x) - w / 2 : align === 'right' || align === 'end' ? Math.round(x) - w + 2 : Math.round(x) - 2
  ctx.drawImage(img, left, Math.round(y) - h / 2, w, h)
}
