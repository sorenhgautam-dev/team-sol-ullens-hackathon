/**
 * Monte Carlo forecast: N dry runs with varied seeds. Only uncertain events vary
 * (remittance delay, gig income) because that is the only place the engine draws randomness.
 */
import { subRng } from './rng'
import { simulate } from './simulate'
import type { DecisionLog, Profile, Scenario } from './types'

export interface Band {
  day: number
  p10: number
  p50: number
  p90: number
}

export interface MonteCarloResult {
  runs: number
  bands: Band[]
  shortfallDays: { p10: number; p50: number; p90: number }
  endBalance: { p10: number; p50: number; p90: number }
  /** Share of runs with at least one shortfall day, as a count out of `runs` (never a percentage string). */
  runsWithShortfall: number
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((p / 100) * (sorted.length - 1))))
  return sorted[idx] ?? 0
}

export function monteCarlo(scenario: Scenario, profile: Profile, decisions: DecisionLog, masterSeed: number, runs = 500): MonteCarloResult {
  const rng = subRng(masterSeed, 'monte-carlo')
  const perDay: number[][] = Array.from({ length: scenario.days }, () => [])
  const shortfalls: number[] = []
  const ends: number[] = []
  let runsWithShortfall = 0
  for (let i = 0; i < runs; i++) {
    const seed = Math.floor(rng() * 4294967296) >>> 0
    const l = simulate(scenario, profile, decisions, seed, { includeUnresolvedEvents: false, includeScams: false })
    l.days.forEach((d, idx) => perDay[idx]?.push(d.balance))
    shortfalls.push(l.summary.shortfallDays)
    ends.push(l.summary.endBalance)
    if (l.summary.shortfallDays > 0) runsWithShortfall++
  }
  const asc = (a: number, b: number) => a - b
  shortfalls.sort(asc)
  ends.sort(asc)
  const bands = perDay.map((vals, idx) => {
    vals.sort(asc)
    return { day: idx + 1, p10: percentile(vals, 10), p50: percentile(vals, 50), p90: percentile(vals, 90) }
  })
  return {
    runs,
    bands,
    shortfallDays: { p10: percentile(shortfalls, 10), p50: percentile(shortfalls, 50), p90: percentile(shortfalls, 90) },
    endBalance: { p10: percentile(ends, 10), p50: percentile(ends, 50), p90: percentile(ends, 90) },
    runsWithShortfall,
  }
}
