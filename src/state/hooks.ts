/** Derived game data. Every number comes from the engine; hooks only memoise. */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame, useGameShallow } from './gameStore'
import { lived, forecast, describeGap } from '@/engine/forecast'
import { simulate } from '@/engine/simulate'
import type { Ledger, Profile, Scenario } from '@/engine/types'
import type { MonteCarloResult } from '@/engine/monteCarlo'
import type { MonteCarloRequest } from '@/engine/monteCarlo.worker'
import { DEMO_SCENARIO } from '@/content/scenario'
import { PROFILES, SITA } from '@/content/profiles'
import { t } from '@/i18n'

export function useScenario(): Scenario {
  return DEMO_SCENARIO
}

export function useProfile(): Profile {
  const id = useGame((s) => s.profileId)
  return PROFILES[id] ?? SITA
}

/** The month as lived so far, through the current day. */
export function useLived(): Ledger {
  const { profileId, decisions, seed, day } = useGameShallow((s) => ({ profileId: s.profileId, decisions: s.decisions, seed: s.seed, day: s.day }))
  const profile = PROFILES[profileId] ?? SITA
  return useMemo(() => lived(DEMO_SCENARIO, profile, decisions, seed, day), [profile, decisions, seed, day])
}

/** The whole month as the forecast sees it (decided + foreseeable events, no scams). */
export function useForecast(): Ledger {
  const { profileId, decisions, seed } = useGameShallow((s) => ({ profileId: s.profileId, decisions: s.decisions, seed: s.seed }))
  const profile = PROFILES[profileId] ?? SITA
  return useMemo(() => forecast(DEMO_SCENARIO, profile, decisions, seed), [profile, decisions, seed])
}

/** The finished month (all 30 days as lived). */
export function useFullMonth(): Ledger {
  const { profileId, decisions, seed } = useGameShallow((s) => ({ profileId: s.profileId, decisions: s.decisions, seed: s.seed }))
  const profile = PROFILES[profileId] ?? SITA
  return useMemo(() => lived(DEMO_SCENARIO, profile, decisions, seed, DEMO_SCENARIO.days), [profile, decisions, seed])
}

/** Auto-played month with default choices (Twin Wallets uses the bills-only baseline so the comparison is clean). */
export function useAutoMonth(profile: Profile, seed: number, scenario: Scenario = DEMO_SCENARIO): Ledger {
  return useMemo(() => simulate(scenario, profile, [], seed, { autoScamResponse: 'wait' }), [scenario, profile, seed])
}

export function useGap() {
  const fc = useForecast()
  const day = useGame((s) => s.day)
  return useMemo(() => describeGap(fc, day), [fc, day])
}

/** Personalisation params for scam copy. */
export function usePersona() {
  const profile = useProfile()
  const remit = profile.incomes.find((i) => i.kind === 'remittance' || i.kind === 'salary')
  return {
    name: t(profile.nameKey),
    partner: profile.partnerNameKey ? t(profile.partnerNameKey) : t('persona.yourFamily'),
    remitDay: remit && remit.kind !== 'gig' ? remit.day : 20,
  }
}

/* ---- Monte Carlo in a Web Worker ---- */

let worker: Worker | null = null
let reqId = 0
const listeners = new Map<number, (r: MonteCarloResult) => void>()

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null
  if (!worker) {
    worker = new Worker(new URL('../engine/monteCarlo.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<{ id: number; result: MonteCarloResult }>) => {
      listeners.get(e.data.id)?.(e.data.result)
      listeners.delete(e.data.id)
    }
  }
  return worker
}

export function useMonteCarlo(runs = 500): MonteCarloResult | null {
  const { profileId, decisions, seed } = useGameShallow((s) => ({ profileId: s.profileId, decisions: s.decisions, seed: s.seed }))
  const profile = PROFILES[profileId] ?? SITA
  const [result, setResult] = useState<MonteCarloResult | null>(null)
  const latest = useRef(0)
  useEffect(() => {
    const w = getWorker()
    if (!w) return
    const id = ++reqId
    latest.current = id
    const timer = setTimeout(() => {
      listeners.set(id, (r) => {
        if (latest.current === id) setResult(r)
      })
      const req: MonteCarloRequest = { id, scenario: DEMO_SCENARIO, profile, decisions, masterSeed: seed, runs }
      w.postMessage(req)
    }, 120)
    return () => {
      clearTimeout(timer)
      listeners.delete(id)
    }
  }, [profile, decisions, seed, runs])
  return result
}

export function useReducedMotion(): boolean {
  const setting = useGame((s) => s.settings.reducedMotion)
  const [system, setSystem] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setSystem(mq.matches)
    const on = (e: MediaQueryListEvent) => setSystem(e.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return setting || system
}
