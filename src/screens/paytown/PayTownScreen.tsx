/**
 * Payday Town: the character starts in town on payday. Five buildings glow; walk to them
 * in any order and face the trap inside. The HUD shows only who you are, your balance,
 * how many scams you have faced, and the phone. The balance comes from the ledger.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '@/state/gameStore'
import { useScam } from '@/state/scamStore'
import { useReducedMotion } from '@/state/hooks'
import { firstAnswers, townLedger, type EncounterDef } from '@/engine/scamTown'
import { REAL_MESSAGES } from '@/content/scamTown'
import { useEncounters } from './useEncounters'
import { CHARACTERS_BY_ID } from '@/content/characters'
import { MAP_H, PLACES, WORLD_H, WORLD_W, startWalker, stepWalker, type Rect, type WalkerState } from '@/walk/map'
import { DISTRICT_COLS, DISTRICT_DOORS, DISTRICT_GROUND, DISTRICT_OBJECTS, DISTRICT_ROWS, DISTRICT_TOP, TILE } from '@/walk/district'
import tilesUrl from '@/assets/pixel/tiles.png'
import { drawOutlined } from '@/ui/pixel/sprites'
import { drawSitaTop, drawText } from '@/ui/pixel/topdown'
import { PIXEL_SCALE } from '@/ui/palette'
import { Balance } from '@/ui/Balance'
import { Button } from '@/ui/Button'
import { PxIcon } from '@/ui/PxIcon'
import { Toasts } from '@/ui/Toasts'
import { Joystick } from '@/screens/walk/Joystick'
import { EncounterSheet } from './EncounterSheet'
import { RealMessageSheet } from './RealMessageSheet'
import { CheckerSheet } from './CheckerSheet'
import { t } from '@/i18n'
import { haptic, play, unlockAudio } from '@/audio/sfx'

const SCALE = PIXEL_SCALE.world
const STEP_MS = 1000 / 60
const DOOR_RADIUS = 16

/** Which map building houses each encounter: the team's town, or the south district. */
const TOWN_PLACE: Partial<Record<EncounterDef['building'], string>> = { bank: 'bank', market: 'market', post: 'school', job: 'workshop', invest: 'plaza', home: 'home' }
function doorOf(b: EncounterDef['building']): { door: { x: number; y: number }; body: Rect | null } {
  const town = TOWN_PLACE[b]
  if (town) return PLACES.find((p) => p.id === town)!
  const d = DISTRICT_DOORS[b as keyof typeof DISTRICT_DOORS]
  // District houses are three tiles tall, directly above the door spot.
  return { door: d, body: { x: d.x - 24, y: d.y - TILE / 2 - 3 * TILE, w: 48, h: 3 * TILE } }
}

/** The south district, drawn once from the recoloured Kenney tiles. */
function buildDistrict(tiles: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = DISTRICT_COLS * TILE
  c.height = DISTRICT_ROWS * TILE
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  const draw = (i: number, col: number, row: number) => ctx.drawImage(tiles, (i % 12) * TILE, Math.floor(i / 12) * TILE, TILE, TILE, col * TILE, row * TILE, TILE, TILE)
  for (let r = 0; r < DISTRICT_ROWS; r++)
    for (let col = 0; col < DISTRICT_COLS; col++) {
      draw(DISTRICT_GROUND[r]![col]!, col, r)
      const o = DISTRICT_OBJECTS[r]![col]!
      if (o >= 0) draw(o, col, r)
    }
  return c
}

export function PayTownScreen() {
  const go = useGame((s) => s.go)
  const demo = useGame((s) => s.settings.demoMode)
  const { characterId, answers, real } = useScam()
  const ch = CHARACTERS_BY_ID[characterId]
  const reduced = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const holderRef = useRef<HTMLDivElement>(null)
  const mapImg = useRef<HTMLImageElement | null>(null)
  const district = useRef<HTMLCanvasElement | null>(null)
  const walker = useRef<WalkerState>(startWalker())
  const input = useRef({ dx: 0, dy: 0 })
  const frame = useRef(0)
  const [vw, setVw] = useState(130)
  const [vh, setVh] = useState(150)
  const [near, setNear] = useState<EncounterDef | null>(null)
  const [open, setOpen] = useState<EncounterDef | null>(null)
  const [phone, setPhone] = useState<'real' | 'checker' | null>(null)
  const [walked, setWalked] = useState(false)
  // The opened real message stays on screen until closed, even once it counts as handled.
  const [realOpen, setRealOpen] = useState<(typeof REAL_MESSAGES)[number] | null>(null)

  const { encounters, thisRound, round, payday } = useEncounters()
  const currency = useGame((s) => s.settings.currency)
  const encountersRef = useRef(thisRound)
  encountersRef.current = thisRound
  const ledger = useMemo(() => townLedger(payday, answers, encounters, round), [payday, answers, encounters, round])
  const done = useMemo(() => new Set(firstAnswers(answers, round).map((a) => a.encounterId)), [answers, round])
  const doneRef = useRef(done)
  doneRef.current = done
  const pendingReal = REAL_MESSAGES.find((m) => m.round === Math.min(round, 2) && done.size >= m.after && !real[`${round}:${m.id}`]) ?? null
  const allDone = done.size === thisRound.length

  // Start at home on payday; in demo mode (first payday), start at the bank door so the first scam is seconds away.
  useEffect(() => {
    const w = startWalker()
    if (demo && round === 1) {
      const bank = doorOf('bank').door
      w.x = bank.x
      w.y = bank.y + 2
    }
    walker.current = w
  }, [demo, round])

  // The phone buzzes when a real message arrives.
  useEffect(() => {
    if (!pendingReal) return
    play('mailbox')
    haptic([30, 40, 30])
  }, [pendingReal?.id])

  useEffect(() => {
    const img = new Image()
    img.src = `${import.meta.env.BASE_URL}sprites/town-map.png`
    img.onload = () => (mapImg.current = img)
    const tiles = new Image()
    tiles.src = tilesUrl
    tiles.onload = () => (district.current = buildDistrict(tiles))
  }, [])

  useEffect(() => {
    const el = holderRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setVh(Math.max(80, Math.floor(el.clientHeight / SCALE)))
      setVw(Math.max(80, Math.ceil(el.clientWidth / SCALE)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const busy = !!open || !!phone
  const walkedRef = useRef(false)

  // Development only: jump to a spot, for testing far-off buildings. Not in the production build.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ;(window as unknown as { __teleport?: (x: number, y: number) => void }).__teleport = (x, y) => {
      walker.current.x = x
      walker.current.y = y
    }
  }, [])

  // Main loop: walk, find the nearest unvisited building, draw.
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.imageSmoothingEnabled = false
    let raf = 0
    let last = performance.now()
    let acc = 0
    let nearId: string | null = null
    const step = () => {
      frame.current++
      const w = walker.current
      if (!busy) stepWalker(w, input.current.dx, input.current.dy)
      else w.moving = false
      if (w.odometer > 40 && !walkedRef.current) {
        walkedRef.current = true
        setWalked(true)
      }
      let found: EncounterDef | null = null
      for (const e of encountersRef.current) {
        const d = doorOf(e.building).door
        if (Math.hypot(d.x - w.x, d.y - w.y) <= DOOR_RADIUS) found = e
      }
      if ((found?.id ?? null) !== nearId) {
        nearId = found?.id ?? null
        setNear(found)
        if (found) play('tap')
      }
    }
    const loop = (now: number) => {
      acc += Math.min(250, now - last)
      last = now
      let n = 0
      while (acc >= STEP_MS && n < 6) {
        acc -= STEP_MS
        step()
        n++
      }
      render(ctx, canvas.width, canvas.height, walker.current, frame.current, mapImg.current, district.current, doneRef.current, ch.look, reduced, encountersRef.current)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [busy, ch.look, reduced])

  // Keyboard for desktop demos.
  useEffect(() => {
    const held = new Set<string>()
    const apply = () => {
      input.current = {
        dx: (held.has('ArrowRight') || held.has('d') ? 1 : 0) - (held.has('ArrowLeft') || held.has('a') ? 1 : 0),
        dy: (held.has('ArrowDown') || held.has('s') ? 1 : 0) - (held.has('ArrowUp') || held.has('w') ? 1 : 0),
      }
    }
    const down = (e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'a', 'd', 'w', 's'].includes(e.key)) {
        e.preventDefault()
        held.add(e.key)
        apply()
      } else if (!e.repeat && (e.code === 'Space' || e.key === 'Enter')) {
        e.preventDefault()
        act()
      }
    }
    const up = (e: KeyboardEvent) => {
      held.delete(e.key)
      apply()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  })

  const act = useCallback(() => {
    unlockAudio()
    if (busy) return
    if (allDone) return go('payresults')
    if (near) {
      play('pop')
      setOpen(near)
    }
  }, [busy, allDone, near, go])

  const onStick = useCallback((dx: number, dy: number) => {
    input.current = { dx, dy }
  }, [])

  const nearDone = near ? done.has(near.id) : false
  const mainLabel = allDone ? t('town.seeResults') : near ? `${t('town.enter')}: ${t(`town.building.${near.building}`)}${nearDone ? ` (${t('town.done')})` : ''}` : t('town.enter')

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#2b1d10] text-ink">
      {/* HUD: who, balance, scams faced, phone. Nothing else. */}
      <header className="flex items-center gap-2 bg-paper px-3 pb-2 pt-[max(8px,env(safe-area-inset-top))]">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-card text-3xl pixel-frame-soft" aria-hidden>
          {ch.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-pixel text-[12px]">
            {t(ch.nameKey)} · {t('town.payday', { n: round })}
          </div>
          <Balance amountNpr={ledger.balance} base={currency} state={ledger.balance < payday * round ? 'warn' : 'safe'} size="md" />
          <div className="truncate text-[12px] font-bold text-ink/70">{t('town.scamsFaced', { n: done.size, total: thisRound.length })}</div>
        </div>
        <button className="relative flex h-12 w-12 shrink-0 items-center justify-center bg-card pixel-frame-soft" onClick={() => {
            setRealOpen(pendingReal)
            setPhone(pendingReal ? 'real' : 'checker')
          }} aria-label={pendingReal ? t('town.newMessage') : t('town.phone')}>
          <PxIcon name="message" />
          {pendingReal && <span className="absolute -right-1 -top-1 h-4 w-4 bg-danger blink" aria-hidden />}
        </button>
      </header>

      <div ref={holderRef} className="relative min-h-0 flex-1" onPointerDown={unlockAudio}>
        <canvas ref={canvasRef} width={vw} height={vh} className="pixelated block" style={{ width: vw * SCALE, height: vh * SCALE }} role="img" aria-label={t('paytown.title')} />
        {pendingReal && !busy && (
          <button
            className="absolute right-2 top-2 bg-card px-2 py-1 text-[13px] font-bold pixel-frame-soft"
            onClick={() => {
              setRealOpen(pendingReal)
              setPhone('real')
            }}
          >
            <PxIcon name="message" size={12} /> {t('town.newMessage')}
          </button>
        )}
        {done.size === 0 && !near && !walked && <p className="pointer-events-none absolute inset-x-3 bottom-2 pixel-frame-soft px-1 text-center text-[14px] font-bold">{t('town.goHint')}</p>}
        {allDone && <p className="pointer-events-none absolute inset-x-3 bottom-2 pixel-frame-soft px-1 text-center text-[14px] font-bold">{t('town.allDone')}</p>}
      </div>

      <div className="flex items-end gap-3 bg-paper px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
        <Joystick onChange={onStick} />
        <Button variant="primary" size="lg" className="min-h-[72px] flex-1" disabled={!allDone && !near} onClick={act}>
          {mainLabel}
        </Button>
      </div>

      <EncounterSheet encounter={open} onClose={() => setOpen(null)} />
      <RealMessageSheet
        message={phone === 'real' ? realOpen : null}
        onClose={() => {
          setPhone(null)
          setRealOpen(null)
        }}
      />
      <CheckerSheet open={phone === 'checker'} onClose={() => setPhone(null)} />
      <Toasts />
    </div>
  )
}

function render(
  ctx: CanvasRenderingContext2D,
  vw: number,
  vh: number,
  w: WalkerState,
  frame: number,
  map: HTMLImageElement | null,
  district: HTMLCanvasElement | null,
  done: Set<string>,
  look: { shirt: string; trim: string; braid: boolean },
  reduced: boolean,
  encounters: EncounterDef[],
) {
  const camX = Math.round(Math.min(WORLD_W - vw, Math.max(0, w.x - vw / 2)))
  const camY = Math.round(Math.min(WORLD_H - vh, Math.max(0, w.y - vh * 0.55)))
  ctx.fillStyle = '#5f8f4e'
  ctx.fillRect(0, 0, vw, vh)
  // The team's town on top, the south district below it.
  if (map && camY < MAP_H) ctx.drawImage(map, camX, camY, vw, Math.min(vh, MAP_H - camY), 0, 0, vw, Math.min(vh, MAP_H - camY))
  if (district && camY + vh > DISTRICT_TOP) {
    const sy = Math.max(0, camY - DISTRICT_TOP)
    const dy = Math.max(0, DISTRICT_TOP - camY)
    ctx.drawImage(district, camX, sy, vw, vh - dy, 0, dy, vw, vh - dy)
  }

  for (const e of encounters) {
    const place = doorOf(e.building)
    const dx = place.door.x - camX
    const dy = place.door.y - camY
    if (done.has(e.id)) {
      // Done: the building dims and shows a tick.
      if (place.body) {
        ctx.fillStyle = 'rgba(43,29,16,0.38)'
        ctx.fillRect(place.body.x - camX, place.body.y - camY, place.body.w, place.body.h)
      }
      ctx.fillStyle = '#2b1d10'
      ctx.fillRect(dx - 6, dy - 30, 12, 12)
      ctx.fillStyle = '#18665f'
      ctx.fillRect(dx - 5, dy - 29, 10, 10)
      ctx.fillStyle = '#fbf4e2'
      for (const [px_, py_] of [[-3, -24], [-2, -23], [-1, -22], [0, -23], [1, -24], [2, -25], [3, -26]]) ctx.fillRect(dx + px_!, dy + py_!, 1, 2)
    } else {
      // To do: a glowing beacon above the door.
      const pulse = reduced ? 0.5 : 0.35 + 0.35 * Math.sin(frame / 10)
      const g = ctx.createRadialGradient(dx, dy - 10, 2, dx, dy - 10, 22)
      g.addColorStop(0, `rgba(245,194,107,${pulse + 0.25})`)
      g.addColorStop(1, 'rgba(245,194,107,0)')
      ctx.fillStyle = g
      ctx.fillRect(dx - 22, dy - 32, 44, 44)
      const bob = reduced ? 0 : Math.round(Math.sin(frame / 12) * 2)
      ctx.fillStyle = '#2b1d10'
      ctx.fillRect(dx - 4, dy - 34 + bob, 8, 10)
      ctx.fillStyle = '#e0a93b'
      ctx.fillRect(dx - 3, dy - 33 + bob, 6, 8)
      ctx.fillStyle = '#2b1d10'
      ctx.fillRect(dx - 0.5, dy - 32 + bob, 1, 4)
      ctx.fillRect(dx - 0.5, dy - 27 + bob, 1, 1)
    }
    drawText(ctx, t(`town.building.${e.building}`), dx, dy - 40, done.has(e.id) ? '#c9ac7a' : '#fbf4e2', 7)
  }

  const sx = Math.round(w.x - camX)
  const sy = Math.round(w.y - camY)
  drawOutlined(ctx, sx - 7, sy - 18, 14, 20, (c) => drawSitaTop(c, 7, 18, w.facing, Math.floor(w.odometer / 5), w.moving, false, look))

  // Off-screen buildings still to visit: an arrow at the edge points the way.
  for (const e of encounters) {
    if (done.has(e.id)) continue
    const d = doorOf(e.building).door
    const x = d.x - camX
    const y = d.y - camY - 10
    if (x >= 6 && x <= vw - 6 && y >= 6 && y <= vh - 6) continue
    const ang = Math.atan2(y - sy, x - sx)
    const ex = Math.min(vw - 8, Math.max(8, sx + Math.cos(ang) * vw))
    const ey = Math.min(vh - 8, Math.max(8, sy + Math.sin(ang) * vh))
    ctx.save()
    ctx.translate(Math.round(ex), Math.round(ey))
    ctx.rotate(ang)
    ctx.fillStyle = '#2b1d10'
    ctx.beginPath()
    ctx.moveTo(6, 0)
    ctx.lineTo(-5, -5)
    ctx.lineTo(-5, 5)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = frame % 40 < 20 ? '#f5c26b' : '#e0a93b'
    ctx.beginPath()
    ctx.moveTo(4, 0)
    ctx.lineTo(-4, -3)
    ctx.lineTo(-4, 3)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
}
