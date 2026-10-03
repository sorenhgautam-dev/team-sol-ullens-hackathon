import { describe, expect, it } from 'vitest'
import { BATTLE_RANGE, MAP_H, PLACES, WORLD_H, isWalkable, placeAt, startApproach, startWalker, stepApproach, stepWalker } from '../map'
import { DISTRICT_DOORS } from '../district'

describe('village map', () => {
  it('every door is standable and resolves to its own place', () => {
    for (const p of PLACES) {
      expect(isWalkable(p.door.x, p.door.y), p.id).toBe(true)
      expect(placeAt(p.door.x, p.door.y)?.id).toBe(p.id)
    }
  })

  it('buildings and the river are solid', () => {
    expect(isWalkable(40, 140)).toBe(false) // inside the landlord house
    expect(isWalkable(150, 50)).toBe(false) // river
    expect(isWalkable(150, 300)).toBe(false) // fountain
    expect(isWalkable(150, 400)).toBe(true) // road south of the square
    expect(isWalkable(-3, 300)).toBe(false)
  })

  it('Sita starts at her own door and walking into a wall slides instead of sticking', () => {
    const s = startWalker()
    expect(placeAt(s.x, s.y)?.id).toBe('home')
    for (let i = 0; i < 12; i++) stepWalker(s, 0, -1)
    const blockedY = s.y
    stepWalker(s, 0, -1)
    expect(s.y).toBe(blockedY)
    expect(s.moving).toBe(false)
    const x0 = s.x
    stepWalker(s, 1, -1)
    expect(s.x).toBeGreaterThan(x0)
    expect(s.facing).toBe('up')
    expect(s.moving).toBe(true)
  })

  it('every door is reachable on foot from home', () => {
    const home = PLACES[0]!.door
    const step = 2
    const key = (x: number, y: number) => `${Math.round(x / step)},${Math.round(y / step)}`
    const seen = new Set<string>([key(home.x, home.y)])
    const queue = [{ x: home.x, y: home.y }]
    while (queue.length) {
      const c = queue.shift()!
      for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]] as const) {
        const n = { x: c.x + dx, y: c.y + dy }
        if (!isWalkable(n.x, n.y) || seen.has(key(n.x, n.y))) continue
        seen.add(key(n.x, n.y))
        queue.push(n)
      }
    }
    for (const p of PLACES) {
      const near = [...seen].some((k) => {
        const [kx, ky] = k.split(',').map(Number) as [number, number]
        return Math.hypot(kx * step - p.door.x, ky * step - p.door.y) <= step
      })
      expect(near, `${p.id} door reachable`).toBe(true)
    }
  })

  it('a scammer approaches until battle range and then stops', () => {
    const sita = { x: 150, y: 400 }
    const a = startApproach(0)
    let steps = 0
    while (!a.arrived && steps < 2000) {
      stepApproach(a, sita)
      steps++
    }
    expect(a.arrived).toBe(true)
    expect(Math.hypot(a.x - sita.x, a.y - sita.y)).toBeLessThanOrEqual(BATTLE_RANGE + 1)
    expect(steps).toBeGreaterThan(100)
    const b = startApproach(0)
    for (let i = 0; i < steps; i++) stepApproach(b, sita)
    expect(b).toEqual(a)
  })
})

describe('collision from the map: fences, trees and the district', () => {
  it('fences, the river and the fountain block; roads and the plaza do not', () => {
    expect(isWalkable(30, 482)).toBe(false) // home garden fence (the gate is further right)
    expect(isWalkable(54, 482)).toBe(true) // the garden gate
    expect(isWalkable(60, 440)).toBe(false) // garden fence
    expect(isWalkable(150, 50)).toBe(false) // river
    expect(isWalkable(150, 296)).toBe(false) // fountain
    expect(isWalkable(150, 400)).toBe(true) // main road
    expect(isWalkable(150, 338)).toBe(true) // market plaza
  })

  it('the world now runs past the bottom of the town into the south district', () => {
    expect(WORLD_H).toBeGreaterThan(MAP_H)
    expect(isWalkable(146, MAP_H + 8)).toBe(true) // the town road continues into the district
    expect(isWalkable(146, MAP_H + 8, MAP_H)).toBe(false) // the old village still stops at the edge
  })

  it('every district door can be reached on foot from home, through the town', () => {
    const home = PLACES[0]!.door
    const step = 2
    const key = (x: number, y: number) => `${Math.round(x / step)},${Math.round(y / step)}`
    const seen = new Set<string>([key(home.x, home.y)])
    const queue = [{ x: home.x, y: home.y }]
    while (queue.length) {
      const c = queue.shift()!
      for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]] as const) {
        const n = { x: c.x + dx, y: c.y + dy }
        if (!isWalkable(n.x, n.y) || seen.has(key(n.x, n.y))) continue
        seen.add(key(n.x, n.y))
        queue.push(n)
      }
    }
    for (const [id, d] of Object.entries(DISTRICT_DOORS)) {
      expect(isWalkable(d.x, d.y), `${id} door standable`).toBe(true)
      const near = [...seen].some((k) => {
        const [kx, ky] = k.split(',').map(Number) as [number, number]
        return Math.hypot(kx * step - d.x, ky * step - d.y) <= step
      })
      expect(near, `${id} door reachable`).toBe(true)
    }
  })
})
