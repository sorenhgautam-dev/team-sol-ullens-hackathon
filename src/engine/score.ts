import type { LedgerSummary } from './types'
import { DEMO_MONTHLY_BILLS } from '@/content/bills'

export interface StabilityBreakdown {
  /** 0–40: fewer shortfall days. */
  shortfall: number
  /** 0–30: end balance relative to a quarter of monthly bills. */
  balance: number
  /** 0–30: lower Gap Cost (fees, interest, scam losses). */
  gap: number
  total: number
}

/**
 * Stability Score = 40 × (1 − shortfallDays / 30)
 *                 + 30 × min(1, endBalance / (monthlyBills / 4))
 *                 + 30 × (1 − min(1, gapCost / 1500))
 */
export function stabilityScore(summary: LedgerSummary, monthlyBills = DEMO_MONTHLY_BILLS, days = 30): StabilityBreakdown {
  const shortfall = 40 * (1 - Math.min(days, summary.shortfallDays) / days)
  const balance = 30 * Math.max(0, Math.min(1, summary.endBalance / (monthlyBills / 4)))
  const gap = 30 * (1 - Math.min(1, summary.gapCost / 1500))
  const r = (n: number) => Math.round(n * 10) / 10
  return { shortfall: r(shortfall), balance: r(balance), gap: r(gap), total: Math.round(shortfall + balance + gap) }
}

export type ShieldGrade = 'S' | 'A' | 'B' | 'C' | 'D'

/** S: every scam defended and at least half the tells spotted · A: all defended · B ≥ 75% · C ≥ 50% · D otherwise. */
export function shieldGrade(summary: LedgerSummary): ShieldGrade {
  if (summary.scamsFaced === 0) return 'A'
  const ratio = summary.scamsDefended / summary.scamsFaced
  const tells = summary.tellsSpotted / (summary.scamsFaced * 3)
  if (ratio === 1 && tells >= 0.5) return 'S'
  if (ratio === 1) return 'A'
  if (ratio >= 0.75) return 'B'
  if (ratio >= 0.5) return 'C'
  return 'D'
}
