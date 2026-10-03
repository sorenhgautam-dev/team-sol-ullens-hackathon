import { Delaunay } from 'd3-delaunay'

export type Archetype = 'remittance' | 'gig' | 'student' | 'salaried' | 'trader' | 'seasonal' | 'mixed'

export interface WardDef {
  id: string
  nameKey: string
  emoji: string
  archetype: Archetype
  households: number
  /** Fixed seed point on a 390 × 420 map. */
  point: [number, number]
  /** Voronoi neighbours (derived from the points). */
  neighbors: string[]
  remittanceWard?: boolean
  employerAlignable?: boolean
}

export const MAP_W = 390
export const MAP_H = 420

const RAW: Omit<WardDef, 'neighbors'>[] = [
  { id: 'riverside', nameKey: 'ward.riverside', emoji: '🏞️', archetype: 'remittance', households: 60, point: [92, 118], remittanceWard: true },
  { id: 'buspark', nameKey: 'ward.buspark', emoji: '🚌', archetype: 'gig', households: 50, point: [205, 72], employerAlignable: true },
  { id: 'collegehill', nameKey: 'ward.collegehill', emoji: '🎓', archetype: 'student', households: 40, point: [318, 118] },
  { id: 'oldtown', nameKey: 'ward.oldtown', emoji: '🏛️', archetype: 'salaried', households: 55, point: [196, 208], employerAlignable: true },
  { id: 'bazaar', nameKey: 'ward.bazaar', emoji: '🧺', archetype: 'trader', households: 45, point: [86, 292], employerAlignable: true },
  { id: 'brickkilns', nameKey: 'ward.brickkilns', emoji: '🧱', archetype: 'seasonal', households: 35, point: [306, 318] },
  { id: 'newcolony', nameKey: 'ward.newcolony', emoji: '🏘️', archetype: 'mixed', households: 50, point: [200, 356], remittanceWard: true },
]

const delaunay = Delaunay.from(RAW.map((w) => w.point))

export const WARDS: WardDef[] = RAW.map((w, i) => ({ ...w, neighbors: [...delaunay.neighbors(i)].map((j) => RAW[j]!.id) }))
export const WARDS_BY_ID: Record<string, WardDef> = Object.fromEntries(WARDS.map((w) => [w.id, w]))

/** Voronoi cell polygons for rendering, clipped to the map box. */
export function wardPolygons(): Record<string, [number, number][]> {
  const voronoi = delaunay.voronoi([0, 0, MAP_W, MAP_H])
  const out: Record<string, [number, number][]> = {}
  RAW.forEach((w, i) => {
    out[w.id] = (voronoi.cellPolygon(i) ?? []) as [number, number][]
  })
  return out
}

/** The river: a gentle curve from the north-west down past Old Town to the south-east. */
export const RIVER_PATH = 'M 20 40 C 120 80, 90 180, 160 230 S 260 300, 370 400'

export const LANDMARKS: { emoji: string; point: [number, number] }[] = [
  { emoji: '🏦', point: [196, 180] },
  { emoji: '🛕', point: [150, 240] },
  { emoji: '🌉', point: [120, 150] },
  { emoji: '🏫', point: [330, 90] },
  { emoji: '🧱', point: [330, 345] },
]
