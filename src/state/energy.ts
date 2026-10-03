/**
 * Energy (⚡ 3 per day). UI-only pacing: it never touches the ledger.
 * Safe behaviour (verify / wait / block) is always free.
 */
import type { PlayerAction, ScamResponse } from '@/engine/types'

export const ENERGY_PER_DAY = 3

export type EnergyKind = PlayerAction['type'] | ScamResponse | 'visitCooperative'

const COSTS: Partial<Record<EnergyKind, number>> = {
  moveBill: 1,
  splitBill: 1,
  payEarly: 0,
  extraShift: 2,
  sellItem: 1,
  askHelp: 1,
  visitCooperative: 1,
  bridge: 0,
  jarDeposit: 0,
  jarWithdraw: 0,
  treat: 0,
  verify: 0,
  wait: 0,
  block: 0,
  ask: 0,
  comply: 0,
}

export function energyCost(kind: EnergyKind): number {
  return COSTS[kind] ?? 0
}

export interface SpendResult {
  ok: boolean
  energy: number
}

/** Spend energy. Never goes below zero; refuses instead. */
export function spendEnergy(current: number, cost: number): SpendResult {
  if (cost <= 0) return { ok: true, energy: current }
  if (current < cost) return { ok: false, energy: current }
  return { ok: true, energy: current - cost }
}

export function refillEnergy(): number {
  return ENERGY_PER_DAY
}
