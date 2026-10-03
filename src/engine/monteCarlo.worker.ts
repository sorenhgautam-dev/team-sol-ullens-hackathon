/// <reference lib="webworker" />
import { monteCarlo } from './monteCarlo'
import type { DecisionLog, Profile, Scenario } from './types'

export interface MonteCarloRequest {
  id: number
  scenario: Scenario
  profile: Profile
  decisions: DecisionLog
  masterSeed: number
  runs: number
}

self.onmessage = (e: MessageEvent<MonteCarloRequest>) => {
  const { id, scenario, profile, decisions, masterSeed, runs } = e.data
  const result = monteCarlo(scenario, profile, decisions, masterSeed, runs)
  self.postMessage({ id, result })
}
