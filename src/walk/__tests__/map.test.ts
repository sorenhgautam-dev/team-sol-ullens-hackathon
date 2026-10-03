import { describe, expect, it } from 'vitest'
import { MAP_H, PLACES, WORLD_H, isWalkable, startWalker, stepWalker } from '../map'
import { DISTRICT_DOORS, DISTRICT_SIGNS } from '../district'
import { findPath } from '../path'

describe('town map', () => {
  it('every door is standable', () => {
    for (const p of PLACES) expect(isWalkable(p.door.x, p.door.y), p.id).toBe(true)
  })

  it('buildings and the river are solid', () => {
    expect(isWalkable(40, 140)).toBe(false) // inside the red-brick house
    expect(isWalkable(150, 50)).toBe(false) // river
    expect(isWalkable(150, 300)).toBe(false) // fountain
    expect(isWalkable(150, 400)).toBe(true) // road south of the square
    expect(isWalkable(-3, 300)).toBe(false)
  })

  it('every payday starts at home, and the house wall stops the player going in', () => {
    const s = startWalker()
    expect({ x: s.x, y: s.y }).toEqual(PLACES.find((p) => p.id === 'home')!.door)
    const y0 = s.y
    for (let i = 0; i < 40; i++) stepWalker(s, 0, -1)
    // She may slide along the wall, but never ends up inside the house.
    expect(isWalkable(s.x, s.y)).toBe(true)
    expect(s.y).toBeGreaterThan(y0 - 20)
    stepWalker(s, 1, 0)
    expect(s.facing).toBe('right')
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

  it('roofs and tree tops are solid, and the main road has no stray specks', () => {
    expect(isWalkable(30, 228)).toBe(false) // the bank's flat roof
    expect(isWalkable(204, 218)).toBe(false) // tree top by the market
    expect(isWalkable(38, 312)).toBe(false) // tree top west of the plaza
    expect(isWalkable(38, 500)).toBe(false) // tree tops along the south edge
    expect(isWalkable(124, 498)).toBe(false)
    expect(isWalkable(280, 380)).toBe(false) // tree top east of the workshop garden
    expect(isWalkable(148, 428)).toBe(true) // cobbles on the main road, once read as specks
    expect(isWalkable(148, 464)).toBe(true)
    expect(isWalkable(80, 502)).toBe(true) // the garden path between the south trees
    expect(isWalkable(36, 292)).toBe(true) // the bank steps
  })

  it('the world now runs past the bottom of the town into the south district', () => {
    expect(WORLD_H).toBeGreaterThan(MAP_H)
    expect(isWalkable(146, MAP_H + 8)).toBe(true) // the town road continues into the district
    expect(isWalkable(146, MAP_H + 8, MAP_H)).toBe(false) // the old village still stops at the edge
  })

  it('walking straight into a fence next to a gate slides through the gate', () => {
    const s = { x: 58, y: 470, facing: 'down' as const, moving: false, odometer: 0 }
    for (let i = 0; i < 60; i++) stepWalker(s, 0, 1)
    expect(s.y).toBeGreaterThan(485) // out of the garden
    expect(s.x).toBeLessThan(58) // slid toward the gap
  })

  it('Main Street, south of the loop, has solid show buildings you can walk up to', () => {
    for (const [id, spot] of Object.entries(DISTRICT_SIGNS)) {
      expect(isWalkable(spot.x, spot.y), `${id} front`).toBe(true)
      expect(isWalkable(spot.x, spot.y - 24), `${id} wall`).toBe(false)
    }
    const path = findPath(PLACES[0]!.door, DISTRICT_SIGNS.school)
    expect(path, 'walk from home to the school').not.toBeNull()
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
