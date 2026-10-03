/**
 * Scam Town engine (pure, deterministic). Payday lands, then each building's
 * encounter is answered once. Losses are booked as double-entry postings into the
 * ScamLoss account, so the balance on screen always comes from this ledger.
 * Practice replays ("Try again") never touch the ledger: the first answer counts.
 */
import { subRng } from './rng'
import type { Posting } from './types'

export type Verdict = 'fall' | 'tempted' | 'safe'

export interface ChoiceDef {
  id: string
  verdict: Verdict
  labelKey: string
  outcomeKey: string
  /** US dollars lost if chosen. */
  loss: number
}

export interface EncounterDef {
  id: string
  /** Building on the town map. */
  building: 'bank' | 'market' | 'post' | 'job' | 'invest'
  /** Existing scammer art revealed after the decision. */
  scammer: string
  channel: 'call' | 'text' | 'chat' | 'payment'
  thoughtKey: string
  senderKey: string
  /** Message lines, shown one after another (persona params allowed). */
  lineKeys: string[]
  /** Optional payment card (chat/payment channels). */
  payKey?: string
  timerSeconds: number
  /** Money mentioned in the messages, in US dollars (shown through the currency helper). */
  amounts: Record<string, number>
  choices: [ChoiceDef, ChoiceDef, ChoiceDef]
  rule: { whyKey: string; ruleKey: string; lessonKey: string }
}

export interface Answer {
  encounterId: string
  choiceId: string
}

export interface TownEntry {
  kind: 'payday' | 'scam_loss'
  amount: number
  encounterId?: string
  postings: Posting[]
}

export interface TownLedger {
  start: number
  balance: number
  entries: TownEntry[]
  accounts: { Wallet: number; Income: number; ScamLoss: number }
}

export const POINTS: Record<Verdict, number> = { safe: 20, tempted: 10, fall: 0 }

export function choiceOf(encounters: EncounterDef[], a: Answer): ChoiceDef | undefined {
  return encounters.find((e) => e.id === a.encounterId)?.choices.find((c) => c.id === a.choiceId)
}

/** First answer per encounter only, in the order they were given. */
export function firstAnswers(answers: Answer[]): Answer[] {
  const seen = new Set<string>()
  return answers.filter((a) => (seen.has(a.encounterId) ? false : (seen.add(a.encounterId), true)))
}

export function townLedger(payday: number, answers: Answer[], encounters: EncounterDef[]): TownLedger {
  const accounts = { Wallet: 0, Income: 0, ScamLoss: 0 }
  const entries: TownEntry[] = []
  const book = (e: TownEntry) => {
    for (const p of e.postings) accounts[p.account as keyof typeof accounts] += p.delta
    entries.push(e)
  }
  book({ kind: 'payday', amount: payday, postings: [{ account: 'Wallet', delta: payday }, { account: 'Income', delta: -payday }] })
  for (const a of firstAnswers(answers)) {
    const c = choiceOf(encounters, a)
    if (!c || c.loss <= 0) continue
    // Never take more than is left: a scam empties the wallet, it does not create debt here.
    const loss = Math.min(c.loss, accounts.Wallet)
    if (loss <= 0) continue
    book({ kind: 'scam_loss', amount: -loss, encounterId: a.encounterId, postings: [{ account: 'Wallet', delta: -loss }, { account: 'ScamLoss', delta: loss }] })
  }
  return { start: payday, balance: accounts.Wallet, entries, accounts }
}

export type Tier = 'proof' | 'wiser' | 'easy'

export function immunity(answers: Answer[], encounters: EncounterDef[]): { score: number; tier: Tier; verdicts: Record<string, Verdict> } {
  const verdicts: Record<string, Verdict> = {}
  let score = 0
  for (const a of firstAnswers(answers)) {
    const c = choiceOf(encounters, a)
    if (!c) continue
    verdicts[a.encounterId] = c.verdict
    score += POINTS[c.verdict]
  }
  const tier: Tier = score >= 80 ? 'proof' : score >= 50 ? 'wiser' : 'easy'
  return { score, tier, verdicts }
}

/** Shuffle the three choices for one showing. Same seed and attempt: same order. */
export function shuffledChoices(e: EncounterDef, seed: number, attempt: number): ChoiceDef[] {
  const rng = subRng(seed, `${e.id}:${attempt}`)
  const out = [...e.choices]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}
