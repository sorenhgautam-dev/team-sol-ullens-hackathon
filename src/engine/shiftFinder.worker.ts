/// <reference lib="webworker" />
import { findShifts, buildWorld, type FindOptions, type RealInputs, type ShiftFinderResult } from './shiftFinder'
import { monteCarlo, type Band } from './monteCarlo'

export interface ShiftFinderRequest {
  id: number
  inputs: RealInputs
  options: FindOptions
}

export interface ShiftFinderResponse {
  id: number
  result: ShiftFinderResult
  /** Monte Carlo band for the baseline when income is irregular. */
  band: Band[] | null
  elapsedMs: number
}

self.onmessage = (e: MessageEvent<ShiftFinderRequest>) => {
  const t0 = performance.now()
  const { id, inputs, options } = e.data
  const result = findShifts(inputs, options)
  let band: Band[] | null = null
  if (inputs.incomes.some((i) => i.irregular)) {
    const { scenario, profile } = buildWorld(inputs, [], undefined, 'uncertain')
    band = monteCarlo(scenario, profile, [], 7, 200).bands
  }
  const response: ShiftFinderResponse = { id, result, band, elapsedMs: performance.now() - t0 }
  self.postMessage(response)
}
