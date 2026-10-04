/**
 * Scam Town: the character starts in town on payday. Scams start one at a time, in a
 * fixed order: only the current building shows its cue (a ringing phone, a shout, a
 * notification...) and an arrow. Walk there and face the trap inside; about two seconds
 * after the rule card, the next building's cue pops up. The HUD shows only who you are, your balance,
 * how many scams you have faced, and the phone. The balance comes from the ledger.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '@/state/gameStore'
import { useScam } from '@/state/scamStore'
import { useReducedMotion } from '@/state/hooks'
import { currentEncounter, firstAnswers, townLedger, type EncounterDef } from '@/engine/scamTown'
import { CUES, REAL_MESSAGES } from '@/content/scamTown'
import { useEncounters } from './useEncounters'
import { CHARACTERS_BY_ID } from '@/content/characters'
import { PLACES, WALK_SPEED, WORLD_H, WORLD_W, startWalker, stepWalker, type Rect, type WalkerState } from '@/walk/map'
import { findPath, type Point } from '@/walk/path'
import { DISTRICT_COLS, DISTRICT_DOORS, DISTRICT_GROUND, DISTRICT_OBJECTS, DISTRICT_ROWS, DISTRICT_SIGNS, DISTRICT_TOP, TILE } from '@/walk/district'
import tilesUrl from '@/assets/pixel/tiles.png'
import { drawText } from '@/ui/pixel/text'
import { drawCue, drawDoorArrow } from '@/ui/pixel/cues'
import { drawPerson, PERSON_TOP, type PersonLook } from '@/ui/pixel/people'
import { drawBirds, drawCloudShadows, drawFountainSparkle, drawTownsperson, townsfolk } from '@/ui/pixel/ambient'
import { PIXEL_SCALE } from '@/ui/palette'
import { Balance } from '@/ui/Balance'
import { useCash } from '@/ui/useMoney'
import { Button } from '@/ui/Button'
import { PxIcon } from '@/ui/PxIcon'
import { PixelPortrait } from '@/ui/pixel/PixelPortrait'
import { Toasts } from '@/ui/Toasts'
import { Joystick } from '@/screens/walk/Joystick'
import { EncounterSheet } from './EncounterSheet'
import { RealMessageSheet } from './RealMessageSheet'
import { useCharacterName } from './persona'
import { CheckerSheet } from './CheckerSheet'
import { t } from '@/i18n'
import { haptic, play, unlockAudio } from '@/audio/sfx'

/** The town is drawn at 2x (not 3x) so the player sees more of the map around them. */
const SCALE = PIXEL_SCALE.town
const STEP_MS = 1000 / 60
const DOOR_RADIUS = 16
/** How quickly the camera catches up with the walker each step (1 = locked on). */
const CAM_EASE = 0.16
/** The pause after a rule card before the next scam's cue pops up, and before the first one. */
const NEXT_CUE_MS = 2000
const FIRST_CUE_MS = 600

/** Where a cue's speech-bubble tail points: just above the building's name, so it stays in view. */
function cueAnchor(place: { door: { x: number; y: number } }) {
  return { x: place.door.x, y: place.door.y - 46 }
}

/** The cue on screen: which scam, the frame it popped up on, and its text. */
interface ShownCue {
  id: string
  building: EncounterDef['building']
  at: number
  label: string
}

/** A tap-to-walk route: waypoints left, and the scam to open on arrival (if the tap was on its building). */
interface Route {
  points: Point[]
  enter: string | null
  stuck: number
}

/** Where each encounter's building is: in the team's town, or in the south district. */
function doorOf(b: EncounterDef['building']): { door: { x: number; y: number }; body: Rect | null } {
  const town = PLACES.find((p) => p.id === b)
  if (town) return town
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
  // The roads get soft edges where they meet the grass, and a few pebbles, so they read as paths.
  const isRoad = (r: number, col: number) => r >= 0 && col >= 0 && r < DISTRICT_ROWS && col < DISTRICT_COLS && DISTRICT_GROUND[r]![col] === ROAD_TILE
  for (let r = 0; r < DISTRICT_ROWS; r++)
    for (let col = 0; col < DISTRICT_COLS; col++) {
      if (!isRoad(r, col) || DISTRICT_OBJECTS[r]![col]! >= 0) continue
      const x = col * TILE
      const y = r * TILE
      ctx.fillStyle = '#a8885a'
      if (!isRoad(r - 1, col)) ctx.fillRect(x, y, TILE, 1)
      if (!isRoad(r + 1, col)) ctx.fillRect(x, y + TILE - 1, TILE, 1)
      if (!isRoad(r, col - 1)) ctx.fillRect(x, y, 1, TILE)
      if (!isRoad(r, col + 1)) ctx.fillRect(x + TILE - 1, y, 1, TILE)
      ctx.fillStyle = '#3e7a3a'
      if (!isRoad(r - 1, col)) for (let i = (r * 7 + col * 3) % 5; i < TILE; i += 5) ctx.fillRect(x + i, y + 1, 2, 1)
      if (!isRoad(r + 1, col)) for (let i = (r * 3 + col * 7) % 5; i < TILE; i += 6) ctx.fillRect(x + i, y + TILE - 2, 2, 1)
      ctx.fillStyle = '#b89a68'
      const h = (r * 73 + col * 151) % 97
      ctx.fillRect(x + 3 + (h % 9), y + 4 + (h % 7), 1, 1)
      ctx.fillRect(x + 9 + (h % 5), y + 10 + (h % 4), 2, 1)
    }
  // Match the team's map: its colours are deeper and warmer than the tiles. The gains come from
  // the map's own grass and dirt (measured), so the district reads as the same painted town.
  const img = ctx.getImageData(0, 0, c.width, c.height)
  const px = img.data
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue
    const r = px[i]!
    const g = px[i + 1]!
    const b = px[i + 2]!
    const [kr, kg, kb] = g > r && g > b ? [0.96, 0.79, 0.64] : [0.88, 0.8, 0.7]
    px[i] = r * kr
    px[i + 1] = g * kg
    px[i + 2] = b * kb
  }
  ctx.putImageData(img, 0, 0)
  return c
}
const ROAD_TILE = 25

export function PayTownScreen() {
  const go = useGame((s) => s.go)
  const demo = useGame((s) => s.settings.demoMode)
  const { characterId, answers, real } = useScam()
  const ch = CHARACTERS_BY_ID[characterId]
  const name = useCharacterName(characterId)
  const reduced = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const holderRef = useRef<HTMLDivElement>(null)
  const mapImg = useRef<HTMLImageElement | null>(null)
  const district = useRef<HTMLCanvasElement | null>(null)
  const walker = useRef<WalkerState>(startWalker())
  const input = useRef({ dx: 0, dy: 0 })
  const cam = useRef<Point | null>(null)
  const route = useRef<Route | null>(null)
  const tapMark = useRef<(Point & { at: number }) | null>(null)
  const frame = useRef(0)
  const [vw, setVw] = useState(130)
  const [vh, setVh] = useState(150)
  const view = useRef({ w: vw, h: vh })
  view.current = { w: vw, h: vh }
  const [near, setNear] = useState<EncounterDef | null>(null)
  const [open, setOpen] = useState<EncounterDef | null>(null)
  const [phone, setPhone] = useState<'real' | 'checker' | null>(null)
  const [walked, setWalked] = useState(false)
  // The opened real message stays on screen until closed, even once it counts as handled.
  const [realOpen, setRealOpen] = useState<(typeof REAL_MESSAGES)[number] | null>(null)

  const { encounters, thisRound, extras, round, payday, bills } = useEncounters()
  const extrasRef = useRef(extras)
  extrasRef.current = extras
  const cash = useCash()
  const encountersRef = useRef(thisRound)
  encountersRef.current = thisRound
  const ledger = useMemo(() => townLedger(payday, answers, encounters, round, bills.total), [payday, answers, encounters, round, bills.total])
  const done = useMemo(() => new Set(firstAnswers(answers, round).map((a) => a.encounterId)), [answers, round])
  const doneRef = useRef(done)
  doneRef.current = done
  const doneCount = thisRound.filter((e) => done.has(e.id)).length
  const pendingReal = REAL_MESSAGES.find((m) => m.round === Math.min(round, 2) && doneCount >= m.after && !real[`${round}:${m.id}`]) ?? null
  const allDone = doneCount === thisRound.length
  // One scam at a time, in the payday's fixed order.
  const current = useMemo(() => currentEncounter(thisRound, answers, round), [thisRound, answers, round])
  const [cue, setCue] = useState<ShownCue | null>(null)
  const cueRef = useRef<ShownCue | null>(null)
  cueRef.current = cue && cue.id === current?.id ? cue : null
  // Scams pretending to be the bank or post office ring the phone instead of a building.
  const phoneScam = cue && current && cue.id === current.id && current.via === 'phone' ? current : null
  // True once a scam is finished, so the next cue waits about two seconds after the rule card.
  const finished = useRef(false)

  // Start at home on payday; in demo mode (first payday), start at the bank door so the first scam is seconds away.
  useEffect(() => {
    const w = startWalker()
    if (demo && round === 1) {
      const bank = doorOf('bank').door
      w.x = bank.x
      w.y = bank.y + 2
    }
    walker.current = w
    cam.current = null
    route.current = null
  }, [demo, round])

  // The phone buzzes when a real message arrives.
  useEffect(() => {
    if (!pendingReal) return
    play('notify')
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

  // Pop up the current scam's cue: at the start, and about two seconds after each rule card.
  useEffect(() => {
    if (!current || busy || cue?.id === current.id) return
    const id = window.setTimeout(() => {
      finished.current = false
      const c = CUES[current.building]
      setCue({ id: current.id, building: current.building, at: frame.current, label: c.textKey ? t(c.textKey, { name }) : '' })
      play(c.sound)
      if (c.vibrate) haptic(c.vibrate)
    }, finished.current ? NEXT_CUE_MS : FIRST_CUE_MS)
    return () => window.clearTimeout(id)
  }, [current, busy, cue?.id, name])

  // Development only: jump to a spot, for testing far-off buildings. Not in the production build.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ;(window as unknown as { __teleport?: (x: number, y: number) => void }).__teleport = (x, y) => {
      walker.current.x = x
      walker.current.y = y
      route.current = null
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
    // Undefined until the first step, so the button always matches where the walker is after a restart.
    let nearId: string | null | undefined = undefined
    const step = () => {
      frame.current++
      const w = walker.current
      // The stick or keys always win over a tap-to-walk route.
      const steering = Math.hypot(input.current.dx, input.current.dy) > 0.15
      if (steering) route.current = null
      let arrived: string | null = null
      if (busy) w.moving = false
      else if (route.current) arrived = followRoute(w, route.current)
      else stepWalker(w, input.current.dx, input.current.dy)
      if (arrived !== null || (route.current && route.current.points.length === 0)) {
        route.current = null
        tapMark.current = null
      }
      // The camera eases after the walker instead of snapping to it.
      const v = view.current
      const tx = Math.min(WORLD_W - v.w, Math.max(0, w.x - v.w / 2))
      const ty = Math.min(WORLD_H - v.h, Math.max(0, w.y - v.h * 0.55))
      const c = cam.current
      if (!c || reduced || Math.hypot(tx - c.x, ty - c.y) > 80) cam.current = { x: tx, y: ty }
      else {
        c.x += (tx - c.x) * CAM_EASE
        c.y += (ty - c.y) * CAM_EASE
      }
      if (w.odometer > 40 && !walkedRef.current) {
        walkedRef.current = true
        setWalked(true)
      }
      let found: EncounterDef | null = null
      for (const e of encountersRef.current) {
        // Only the current scam (once its cue is up) and finished ones can be entered; phone ones have no door.
        if (e.via === 'phone' || (!doneRef.current.has(e.id) && e.id !== cueRef.current?.id)) continue
        const d = doorOf(e.building).door
        if (Math.hypot(d.x - w.x, d.y - w.y) <= DOOR_RADIUS) found = e
      }
      // Main Street's pharmacy, bakery and school are always open.
      for (const e of extrasRef.current) {
        const d = DISTRICT_SIGNS[e.building as keyof typeof DISTRICT_SIGNS]
        if (d && Math.hypot(d.x - w.x, d.y - w.y) <= DOOR_RADIUS) found = e
      }
      if ((found?.id ?? null) !== nearId) {
        nearId = found?.id ?? null
        setNear(found)
        if (found) play('tap')
      }
      // Tapped the building whose turn it is: go straight in on arrival.
      if (arrived && found?.id === arrived && !doneRef.current.has(arrived)) {
        play('pop')
        setOpen(found)
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
      if (cam.current) render(ctx, view.current.w, view.current.h, cam.current, walker.current, frame.current, mapImg.current, district.current, doneRef.current, ch.look, reduced, encountersRef.current, cueRef.current, nearId ?? null, route.current ? tapMark.current : null)
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

  // Tap to walk: tap any spot to walk there along the paths; tap the building whose turn it is to walk in.
  const onTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    unlockAudio()
    if (busy) return
    const rect = e.currentTarget.getBoundingClientRect()
    const c = cam.current ?? { x: 0, y: 0 }
    const p = { x: c.x + (e.clientX - rect.left) / SCALE, y: c.y + (e.clientY - rect.top) / SCALE }
    let target: Point = p
    let enter: string | null = null
    for (const enc of encountersRef.current) {
      if (enc.via === 'phone' || doneRef.current.has(enc.id) || enc.id !== cueRef.current?.id) continue
      const place = doorOf(enc.building)
      const a = cueAnchor(place)
      const b = place.body
      const onBody = b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h
      if (onBody || Math.hypot(p.x - place.door.x, p.y - place.door.y) < 20 || Math.hypot(p.x - a.x, p.y - (a.y - 12)) < 22) {
        target = place.door
        enter = enc.id
      }
    }
    const path = findPath(walker.current, target)
    if (!path) return
    route.current = { points: path, enter, stuck: 0 }
    tapMark.current = { ...path[path.length - 1]!, at: frame.current }
    play('tap')
  }

  const onStick = useCallback((dx: number, dy: number) => {
    input.current = { dx, dy }
  }, [])

  const nearDone = near ? done.has(near.id) : false
  const mainLabel = allDone ? t('town.seeResults') : near ? `${t('town.enter')}: ${t(`town.building.${near.building}`)}${nearDone ? ` (${t('town.done')})` : ''}` : t('town.enter')

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#2b1d10] text-ink">
      {/* HUD: who, balance, scams faced, phone. Nothing else. */}
      <header className="flex items-center gap-2 bg-paper px-3 pb-2 pt-[max(8px,env(safe-area-inset-top))]">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden bg-card pixel-frame-soft" aria-hidden>
          <PixelPortrait id={characterId} size={44} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-pixel text-[12px]">
            {name} · {t('town.payday', { n: round })}
          </div>
          <Balance amount={ledger.balance} state={ledger.balance < bills.total ? 'danger' : ledger.balance < bills.total * 1.15 ? 'warn' : 'safe'} size="md" />
          <div className="truncate text-[12px] font-bold text-ink/70">{t('town.scamsFaced', { n: doneCount, total: thisRound.length })}</div>
          <div className={`truncate text-[12px] font-bold ${ledger.balance < bills.total ? 'text-danger' : 'text-ink/70'}`}>{t('town.billsDue', { amount: cash(bills.total) })}</div>
        </div>
        <button className={`relative flex h-12 w-12 shrink-0 items-center justify-center bg-card pixel-frame-soft ${phoneScam ? 'animate-pulse' : ''}`} onClick={() => {
            if (phoneScam) return setOpen(phoneScam)
            setRealOpen(pendingReal)
            setPhone(pendingReal ? 'real' : 'checker')
          }} aria-label={pendingReal ? t('town.newMessage') : t('town.phone')}>
          <PxIcon name="message" />
          {(pendingReal || phoneScam) && <span className="absolute -right-1 -top-1 h-4 w-4 bg-danger blink" aria-hidden />}
        </button>
      </header>

      <div ref={holderRef} className="relative min-h-0 flex-1" onPointerDown={unlockAudio}>
        <canvas ref={canvasRef} width={vw * SCALE} height={vh * SCALE} className="block touch-none" style={{ width: vw * SCALE, height: vh * SCALE }} role="img" aria-label={t('paytown.title')} onPointerDown={onTap} />
        {phoneScam && !busy && (
          <button className="absolute right-2 top-2 bg-marigold px-2 py-1 text-[13px] font-bold pixel-frame-soft" onClick={() => setOpen(phoneScam)}>
            <PxIcon name="phone" size={12} /> {phoneScam.channel === 'call' ? t('town.phoneCall') : t('town.phoneText')}
          </button>
        )}
        {pendingReal && !phoneScam && !busy && (
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

      <EncounterSheet
        encounter={open}
        onClose={() => {
          if (open && doneRef.current.has(open.id)) finished.current = true
          setOpen(null)
        }}
      />
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

/** One step along a tap-to-walk route. Returns the scam to open when the walk ends at its door. */
function followRoute(w: WalkerState, r: Route): string | null {
  const wp = r.points[0]
  if (!wp) return r.enter
  const dx = wp.x - w.x
  const dy = wp.y - w.y
  const dist = Math.hypot(dx, dy)
  if (dist <= 1.2) {
    r.points.shift()
    if (r.points.length === 0) {
      w.moving = false
      return r.enter ?? ''
    }
    return null
  }
  const bx = w.x
  const by = w.y
  stepWalker(w, dx, dy, Math.min(WALK_SPEED, dist))
  // Pushed against something for a while (a closed door, say)? Give up quietly.
  if (Math.hypot(w.x - bx, w.y - by) < 0.05) {
    if (++r.stuck > 20) {
      r.points.length = 0
      return ''
    }
  } else r.stuck = 0
  return null
}

function render(
  ctx: CanvasRenderingContext2D,
  vw: number,
  vh: number,
  camera: Point,
  w: WalkerState,
  frame: number,
  map: HTMLImageElement | null,
  district: HTMLCanvasElement | null,
  done: Set<string>,
  look: PersonLook,
  reduced: boolean,
  encounters: EncounterDef[],
  cue: ShownCue | null,
  nearId: string | null,
  tap: (Point & { at: number }) | null,
) {
  // The canvas is full screen resolution: the pixel art is drawn at 2x, and the camera can
  // sit between art pixels (in screen-pixel steps), so scrolling is smooth, not jumpy.
  const S = SCALE
  const snap = (v: number) => Math.round(v * S) / S
  const fx = snap(camera.x)
  const fy = snap(camera.y)
  const camX = Math.floor(fx)
  const camY = Math.floor(fy)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#5f8f4e'
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.setTransform(S, 0, 0, S, Math.round((camX - fx) * S), Math.round((camY - fy) * S))
  // The team's town on top, the south district below it.
  if (map) ctx.drawImage(map, -camX, -camY)
  if (district) ctx.drawImage(district, -camX, DISTRICT_TOP - camY)
  if (!reduced) {
    drawFountainSparkle(ctx, frame, camX, camY)
    drawCloudShadows(ctx, frame, camX, camY, vw, vh)
  }

  // Where a tap is walking to: a small blinking diamond.
  if (tap && !reduced ? frame % 30 < 22 : !!tap) {
    const tx = Math.round(tap!.x - camX)
    const ty = Math.round(tap!.y - camY)
    ctx.fillStyle = '#2b1d10'
    ctx.fillRect(tx - 1, ty - 3, 3, 7)
    ctx.fillRect(tx - 3, ty - 1, 7, 3)
    ctx.fillStyle = '#f5c26b'
    ctx.fillRect(tx, ty - 2, 1, 5)
    ctx.fillRect(tx - 2, ty, 5, 1)
  }

  // Main Street's buildings are just for show: a name over the door, no way in.
  for (const [key, spot] of Object.entries(DISTRICT_SIGNS)) {
    const sy = spot.y - camY
    if (sy < -20 || sy > vh + 60) continue
    drawText(ctx, t(`town.show.${key}`), spot.x - camX, sy - 40, '#e4d2ac', 7)
  }

  for (const e of encounters) {
    if (e.via === 'phone') continue
    const place = doorOf(e.building)
    const dx = place.door.x - camX
    const dy = place.door.y - camY
    const isCurrent = cue?.id === e.id
    // Scams still to come look like normal buildings until it is their turn.
    if (!done.has(e.id) && !isCurrent) continue
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
      // Its turn: the door glows and an arrow points at it.
      const pulse = reduced ? 0.5 : 0.35 + 0.35 * Math.sin(frame / 10)
      const g = ctx.createRadialGradient(dx, dy - 6, 2, dx, dy - 6, 22)
      g.addColorStop(0, `rgba(245,194,107,${pulse + 0.25})`)
      g.addColorStop(1, 'rgba(245,194,107,0)')
      ctx.fillStyle = g
      ctx.fillRect(dx - 22, dy - 28, 44, 44)
      if (nearId !== e.id) drawDoorArrow(ctx, dx, dy - 22, frame, reduced)
    }
    drawText(ctx, t(`town.building.${e.building}`), dx, dy - 40, done.has(e.id) ? '#c9ac7a' : '#fbf4e2', 7)
  }

  // Townsfolk on their rounds: the ones further up the screen are drawn behind the walker.
  const folk = townsfolk(frame, reduced).filter((p) => p.x - camX > -12 && p.x - camX < vw + 12 && p.y - camY > -4 && p.y - camY < vh + 24)
  for (const p of folk) if (p.y <= w.y) drawTownsperson(ctx, p, p.x - camX, p.y - camY)

  // The walker sits between art pixels too, so it glides with the camera; a soft shadow grounds it.
  const wx = snap(w.x) - camX
  const wy = snap(w.y) - camY
  const sx = Math.round(wx)
  const sy = Math.round(wy)
  ctx.save()
  ctx.translate(wx - sx, wy - sy)
  ctx.fillStyle = 'rgba(43,29,16,0.28)'
  ctx.fillRect(sx - 3, sy - 1, 7, 1)
  ctx.fillRect(sx - 5, sy, 11, 2)
  ctx.fillRect(sx - 3, sy + 2, 7, 1)
  drawPerson(ctx, sx, sy, w.facing, Math.floor(w.odometer / 5), w.moving, look)
  // "This is you": a small teal marker over the head while standing still.
  if (!w.moving && nearId === null) {
    const my = sy - PERSON_TOP - 6 + (reduced ? 0 : Math.round(Math.sin(frame / 10)))
    ctx.fillStyle = '#2b1d10'
    ctx.fillRect(sx - 3, my - 1, 7, 3)
    ctx.fillRect(sx - 2, my + 2, 5, 1)
    ctx.fillRect(sx - 1, my + 3, 3, 1)
    ctx.fillStyle = '#2a8a80'
    ctx.fillRect(sx - 2, my, 5, 1)
    ctx.fillRect(sx - 1, my + 1, 3, 1)
    ctx.fillRect(sx, my + 2, 1, 1)
  }
  ctx.restore()
  for (const p of folk) if (p.y > w.y) drawTownsperson(ctx, p, p.x - camX, p.y - camY)

  // The current scam's cue, drawn over everything so it is never hidden.
  if (cue && !encounters.find((e) => e.id === cue.id)?.via) {
    const place = doorOf(cue.building)
    const a = cueAnchor(place)
    drawCue(ctx, CUES[cue.building].kind, a.x - camX, a.y - camY, place.door.x - camX, place.door.y - camY, frame, frame - cue.at, cue.label, reduced)
  }

  if (!reduced) drawBirds(ctx, frame, camX, camY)

  // A soft vignette, like light falling off at the edges of a photo, ties the map, the tiles and the people together.
  const base = ctx.getTransform()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  const cw = ctx.canvas.width
  const chh = ctx.canvas.height
  const vg = ctx.createRadialGradient(cw / 2, chh * 0.55, Math.min(cw, chh) * 0.38, cw / 2, chh * 0.55, Math.max(cw, chh) * 0.78)
  vg.addColorStop(0, 'rgba(43,29,16,0)')
  vg.addColorStop(1, 'rgba(43,29,16,0.26)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, cw, chh)
  ctx.setTransform(base)

  // The current scam off screen: an arrow at the edge points the way.
  for (const e of encounters) {
    if (done.has(e.id) || cue?.id !== e.id || e.via === 'phone') continue
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
