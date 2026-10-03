/** A character's pixel portrait (the same art as character select), at any size. */
import { useEffect, useRef } from 'react'
import type { CharacterId } from '@/content/characters'
import { drawOutlined } from './sprites'
import { drawPortrait } from './portraits'

export function PixelPortrait({ id, size = 48, className = '' }: { id: CharacterId; size?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, 32, 32)
    drawOutlined(ctx, 1, 1, 30, 30, (c) => drawPortrait(c, id))
  }, [id])
  return <canvas ref={ref} width={32} height={32} className={`pixelated block ${className}`} style={{ width: size, height: size }} aria-hidden />
}
