import { describe, expect, it } from 'vitest'
import { clearLine, findPath } from '../path'
import { PLACES, isWalkable, startWalker, stepWalker } from '../map'
import { DISTRICT_DOORS } from '../district'

/** Follow the waypoints the way the game does, with the real walker. */
function walk(path: { x: number; y: number }[]) {
  const s = startWalker()
  for (const wp of path) {
    for (let i = 0; i < 2000 && Math.hypot(wp.x - s.x, wp.y - s.y) > 1.2; i++) {
      const before = { x: s.x, y: s.y }
      stepWalker(s, wp.x - s.x, wp.y - s.y)
      if (!isWalkable(s.x, s.y)) throw new Error(`walked into a wall at ${s.x},${s.y}`)
      if (Math.hypot(s.x - before.x, s.y - before.y) < 0.01) break
    }
  }
  return s
}

describe('tap to walk', () => {
  it('finds a way from home to every door, in town and in the south district', () => {
    const home = startWalker()
    const doors = [...PLACES.map((p) => p.door), ...Object.values(DISTRICT_DOORS)]
    for (const d of doors) {
      const path = findPath(home, d)
      expect(path, `${d.x},${d.y}`).not.toBeNull()
      const end = walk(path!)
      expect(Math.hypot(end.x - d.x, end.y - d.y), `reached ${d.x},${d.y}`).toBeLessThan(4)
    }
  })

  it('every straight leg of a path is clear of fences, trees and walls', () => {
    const home = startWalker()
    const path = findPath(home, DISTRICT_DOORS.cafe)!
    let at = { x: home.x, y: home.y }
    for (const wp of path) {
      expect(clearLine(at, wp)).toBe(true)
      at = wp
    }
  })

  it('a tap on a roof or a tree leads to the nearest spot you can stand on', () => {
    const path = findPath(startWalker(), { x: 30, y: 228 }) // the bank roof
    expect(path).not.toBeNull()
    const end = path![path!.length - 1]!
    expect(isWalkable(end.x, end.y)).toBe(true)
  })

  it('cuts corners across open ground instead of zig-zagging', () => {
    const path = findPath({ x: 150, y: 420 }, { x: 150, y: 470 })!
    expect(path).toHaveLength(1)
  })
})
