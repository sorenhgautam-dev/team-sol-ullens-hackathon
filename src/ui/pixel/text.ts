/** Outlined pixel text for the town canvas (building names, signs, cue labels). */
export function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, size = 8, align: CanvasTextAlign = 'center') {
  ctx.font = `${size}px Silkscreen, monospace`
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#07080f'
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) ctx.fillText(text, Math.round(x + dx), Math.round(y + dy))
  ctx.fillStyle = color
  ctx.fillText(text, Math.round(x), Math.round(y))
}
