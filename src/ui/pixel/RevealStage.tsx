/**
 * The reveal: after the player has decided, the sender is unmasked in a side-view pixel
 * scene. Safe: a shield and a VERIFY stamp, the scammer dissolves. Close call: the scammer
 * runs off (with coins if any were lost). Fell for it: the scammer grabs the coins and runs.
 * Restored and adapted from the earlier battle stage (hit-stop, shake, coin debris).
 */
import { useEffect, useRef } from 'react'
import type { Verdict } from '@/engine/scamTown'
import { drawOutlined, drawScammer, drawSita, drawStamp, drawStreet, type ScammerState, type SitaMood } from './sprites'
import { burst, drawParticles, stepParticles, type Particle } from './particles'
import { useReducedMotion } from '@/state/hooks'
import { haptic, play } from '@/audio/sfx'

const W = 180
const H = 100
const GROUND = H - 16
const SCALE = 2
const TICK_MS = 100

interface Stage {
  frame: number
  f: number
  scammerX: number
  scammerState: ScammerState
  alpha: number
  mood: SitaMood
  shake: number
  freeze: number
  flash: number
  stamp: { text: string; color: string; scale: number } | null
  shield: number
  particles: Particle[]
}

const STAMPS: Record<Verdict, { text: string; color: string }> = {
  safe: { text: 'VERIFY', color: '#18665f' },
  tempted: { text: 'CLOSE CALL', color: '#e0a93b' },
  fall: { text: 'SCAMMED', color: '#b23a30' },
}

export function RevealStage({ color, verdict, lost, className = '' }: { color: string; verdict: Verdict; lost: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false
    const s: Stage = { frame: 0, f: 0, scammerX: 132, scammerState: 'idle', alpha: 1, mood: 'worried', shake: 0, freeze: 0, flash: 0, stamp: null, shield: 0, particles: [] }
    const robbed = verdict === 'fall' || (verdict === 'tempted' && lost)
    let raf = 0
    let last = performance.now()
    let acc = 0
    const tick = () => {
      s.frame++
      if (s.freeze > 0) {
        s.freeze--
        return
      }
      stepParticles(s.particles, GROUND - 1)
      if (s.shake > 0) s.shake--
      if (s.flash > 0) s.flash--
      if (s.shield > 0) s.shield--
      if (s.stamp) s.stamp.scale = Math.max(1, s.stamp.scale - 0.5)
      const f = s.f++
      if (robbed) {
        if (f < 8) {
          s.scammerState = 'lunge'
          s.scammerX = Math.max(60, s.scammerX - 9)
        } else if (f === 8) {
          burst(s.particles, 52, GROUND - 14, reduced ? 4 : 12, { color: ['#f5c26b', '#e0a93b', '#fbf4e2'], speed: 2.2, up: 3 })
          s.shake = reduced ? 0 : 8
          s.flash = reduced ? 0 : 2
          s.stamp = { ...STAMPS[verdict], scale: 2.5 }
          play('bad')
          haptic([80, 40, 80])
        } else if (f < 30) {
          s.scammerState = 'flee'
          s.scammerX += 7
          if (f % 3 === 0) burst(s.particles, s.scammerX, GROUND - 10, 1, { color: '#f5c26b', speed: 1, up: 2 })
        }
        return
      }
      if (verdict === 'tempted') {
        if (f === 3) {
          s.stamp = { ...STAMPS.tempted, scale: 2.5 }
          s.scammerState = 'hit'
          play('tap')
        } else if (f > 6 && f < 26) {
          s.scammerState = 'flee'
          s.scammerX += 6
          s.mood = 'idle'
        }
        return
      }
      // safe
      if (f === 2) {
        s.shield = 10
        s.scammerState = 'hit'
        s.freeze = reduced ? 0 : 3
        s.shake = reduced ? 0 : 5
        burst(s.particles, s.scammerX - 2, GROUND - 16, reduced ? 4 : 8, { color: ['#fbf4e2', '#7fb8d6'], speed: 2.5, up: 1, gravity: false, life: 10, size: 1 })
        s.stamp = { ...STAMPS.safe, scale: 2.5 }
        play('shield')
        haptic(30)
      } else if (f > 2 && f < 8) s.scammerX += 4
      else if (f === 8) s.scammerState = 'dissolve'
      else if (f > 8 && f < 24) s.alpha = Math.max(0, s.alpha - 0.07)
      else if (f === 24) s.mood = 'happy'
    }
    const render = () => {
      ctx.save()
      if (s.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 6), Math.round((Math.random() - 0.5) * 4))
      drawStreet(ctx, W, H, s.frame)
      drawOutlined(ctx, 39, GROUND - 28, 16, 30, (c) => drawSita(c, 1, 28, s.frame >> 1, s.mood))
      if (s.shield > 0) {
        ctx.fillStyle = s.shield > 6 ? '#fbf4e2' : '#5fae5f'
        ctx.fillRect(58, GROUND - 26, 2, 22)
      }
      if (s.alpha > 0) drawOutlined(ctx, Math.round(s.scammerX) - 8, GROUND - 30, 34, 32, (c) => drawScammer(c, 8, 30, s.frame >> 1, color, s.scammerState, s.alpha))
      drawParticles(ctx, s.particles)
      if (s.stamp) drawStamp(ctx, s.stamp.text, 100, GROUND - 46, s.stamp.color, s.stamp.scale)
      if (s.flash > 0) {
        ctx.fillStyle = 'rgba(178,58,48,0.5)'
        ctx.fillRect(0, 0, W, H)
      }
      ctx.restore()
    }
    const loop = (now: number) => {
      acc += Math.min(400, now - last)
      last = now
      while (acc >= TICK_MS) {
        acc -= TICK_MS
        tick()
      }
      render()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [color, verdict, lost, reduced])
  return (
    <div className={`relative mx-auto overflow-hidden ${className}`} style={{ width: W * SCALE, height: H * SCALE, boxShadow: '0 0 0 3px var(--frame-dark)' }}>
      <canvas ref={ref} width={W} height={H} className="pixelated block" style={{ width: W * SCALE, height: H * SCALE }} role="img" aria-label="The sender revealed" />
    </div>
  )
}
