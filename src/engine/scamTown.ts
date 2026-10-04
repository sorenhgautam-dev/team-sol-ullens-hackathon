/**
 * Scam Town engine (pure, deterministic). Payday lands, then each building's
 * encounter is answered once. Losses are booked as double-entry postings into the
 * ScamLoss account, so the balance on screen always comes from this ledger.
 * Practice replays ("Try again") never touch the ledger: the first answer counts.
 * The gauntlet loop: each payday is a round. Pay lands at the start of every round and
 * the balance carries over, so what you keep adds up.
 */
import { subRng } from './rng'
/** The accounts of a payday's double-entry ledger. */
export type Account = 'Wallet' | 'Income' | 'Expenses' | 'ScamLoss' | 'Bills'

export interface Posting {
  account: Account
  /** Signed amount: money in the wallet grows with +, income is recorded as − so each entry nets to 0. */
  delta: number
}

export type Verdict = 'fall' | 'tempted' | 'safe'

export interface ChoiceDef {
  id: string
  verdict: Verdict
  labelKey: string
  outcomeKey: string
  /** Lost to a scam if chosen (ScamLoss). */
  loss: number
  /** Real money in if chosen (a refund, a sale, pay). */
  gain?: number
  /** Real money out if chosen (a fee, a purchase, a late fee). */
  cost?: number
  /** Real money not received because the player said no (shown in the record, not booked). */
  missed?: number
}

export interface EncounterDef {
  id: string
  /** A real, safe interaction (money moves normally) rather than a scam. */
  real?: boolean
  /** Arrives on the phone while walking, not inside a building (scams pretending to be the bank or post office). */
  via?: 'phone'
  /** Building on the town map. */
  building: 'bank' | 'market' | 'post' | 'job' | 'invest' | 'home' | 'cafe' | 'tech' | 'gov' | 'rental' | 'shop' | 'pharmacy' | 'bakery' | 'school'
  /** Existing scammer art revealed after the decision. */
  scammer: string
  channel: 'call' | 'text' | 'chat' | 'payment'
  thoughtKey: string
  senderKey: string
  /** Message lines, shown one after another (persona params allowed). */
  lineKeys: string[]
  /** Optional payment card (chat/payment channels). */
  payKey?: string
  /** How the payment screen looks: a request to approve, a "payment successful" screenshot, or a card form. */
  payStyle?: 'request' | 'screenshot' | 'form'
  timerSeconds: number
  /** Money mentioned in the messages, in US dollars (shown through the currency helper). */
  amounts: Record<string, number>
  choices: [ChoiceDef, ChoiceDef, ChoiceDef]
  rule: { whyKey: string; ruleKey: string; lessonKey: string }
}

export interface Answer {
  encounterId: string
  choiceId: string
  /** Which payday (round) it was answered in. Defaults to 1. */
  round?: number
}

export interface TownEntry {
  kind: 'payday' | 'scam_loss' | 'bills' | 'income' | 'expense'
  amount: number
  round: number
  encounterId?: string
  postings: Posting[]
}

export interface TownLedger {
  start: number
  balance: number
  entries: TownEntry[]
  accounts: { Wallet: number; Income: number; Expenses: number; ScamLoss: number; Bills: number }
}

export const POINTS: Record<Verdict, number> = { safe: 20, tempted: 10, fall: 0 }

export function choiceOf(encounters: EncounterDef[], a: Answer): ChoiceDef | undefined {
  return encounters.find((e) => e.id === a.encounterId)?.choices.find((c) => c.id === a.choiceId)
}

/** First answer per encounter only, in the order they were given. */
export function firstAnswers(answers: Answer[], round?: number): Answer[] {
  const seen = new Set<string>()
  return answers.filter((a) => {
    if (round !== undefined && (a.round ?? 1) !== round) return false
    const key = `${a.round ?? 1}:${a.encounterId}`
    return seen.has(key) ? false : (seen.add(key), true)
  })
}

/**
 * Book `rounds` paydays, each followed by that payday's losses. When a payday closes (every
 * round before the current one), its rent and food (`bills`) are paid from what is left; if
 * there is not enough, everything left goes to them. The wallet never goes below zero.
 */
export function townLedger(payday: number, answers: Answer[], encounters: EncounterDef[], rounds = 1, bills = 0): TownLedger {
  const accounts = { Wallet: 0, Income: 0, Expenses: 0, ScamLoss: 0, Bills: 0 }
  const entries: TownEntry[] = []
  const book = (e: TownEntry) => {
    for (const p of e.postings) accounts[p.account as keyof typeof accounts] += p.delta
    entries.push(e)
  }
  for (let round = 1; round <= rounds; round++) {
    book({ kind: 'payday', amount: payday, round, postings: [{ account: 'Wallet', delta: payday }, { account: 'Income', delta: -payday }] })
    for (const a of firstAnswers(answers, round)) {
      const c = choiceOf(encounters, a)
      if (!c) continue
      // Real interactions move money normally: money in to Income, money out to Expenses.
      if (c.gain && c.gain > 0) book({ kind: 'income', amount: c.gain, round, encounterId: a.encounterId, postings: [{ account: 'Wallet', delta: c.gain }, { account: 'Income', delta: -c.gain }] })
      const cost = Math.min(c.cost ?? 0, accounts.Wallet)
      if (cost > 0) book({ kind: 'expense', amount: -cost, round, encounterId: a.encounterId, postings: [{ account: 'Wallet', delta: -cost }, { account: 'Expenses', delta: cost }] })
      if (c.loss <= 0) continue
      // Never take more than is left: a scam empties the wallet, it does not create debt here.
      const loss = Math.min(c.loss, accounts.Wallet)
      if (loss <= 0) continue
      book({ kind: 'scam_loss', amount: -loss, round, encounterId: a.encounterId, postings: [{ account: 'Wallet', delta: -loss }, { account: 'ScamLoss', delta: loss }] })
    }
    const paid = round < rounds ? Math.min(bills, accounts.Wallet) : 0
    if (paid > 0) book({ kind: 'bills', amount: -paid, round, postings: [{ account: 'Wallet', delta: -paid }, { account: 'Bills', delta: paid }] })
  }
  return { start: payday * rounds, balance: accounts.Wallet, entries, accounts }
}

/** The end of a payday: does what is left cover rent and food? */
export function rentCheck(balance: number, bills: number): { win: boolean; leftOver: number; shortBy: number } {
  return { win: balance >= bills, leftOver: Math.max(0, balance - bills), shortBy: Math.max(0, bills - balance) }
}

/** One decision on a payday: what it was, real or scam, what the player did, and the money. */
export interface RecordRow {
  encounterId: string
  building: EncounterDef['building']
  channel: EncounterDef['channel']
  real: boolean
  choiceId: string
  moneyIn: number
  moneyOut: number
  missed: number
}

/** Every decision of one payday, in the order they were made (first answers only). */
export function paydayRecord(answers: Answer[], encounters: EncounterDef[], round: number): RecordRow[] {
  const rows: RecordRow[] = []
  for (const a of firstAnswers(answers, round)) {
    const e = encounters.find((x) => x.id === a.encounterId)
    const c = choiceOf(encounters, a)
    if (!e || !c) continue
    rows.push({ encounterId: e.id, building: e.building, channel: e.channel, real: !!e.real, choiceId: c.id, moneyIn: c.gain ?? 0, moneyOut: (c.cost ?? 0) + c.loss, missed: c.missed ?? 0 })
  }
  return rows
}

/** Two or three personal tips from the actual decisions: what went wrong first, then what went right. */
export function paydayTips(rows: RecordRow[]): { key: string; n?: number; amount?: number }[] {
  const tips: { key: string; n?: number; amount?: number }[] = []
  const fell = rows.filter((r) => !r.real && r.choiceId === 'accept')
  const links = fell.filter((r) => r.channel === 'text').length
  const calls = fell.filter((r) => r.channel === 'call').length
  const paid = fell.filter((r) => r.channel === 'chat' || r.channel === 'payment').length
  const realNo = rows.filter((r) => r.real && r.choiceId === 'refuse')
  const checked = rows.filter((r) => r.choiceId === 'verify').length
  if (links) tips.push({ key: 'tips.links', n: links })
  if (calls) tips.push({ key: 'tips.calls', n: calls })
  if (paid) tips.push({ key: 'tips.paid', n: paid })
  if (realNo.length) tips.push({ key: 'tips.realNo', n: realNo.length, amount: realNo.reduce((s, r) => s + r.missed + r.moneyOut, 0) })
  if (!fell.length && rows.length) tips.push({ key: 'tips.noScams' })
  if (checked >= 2) tips.push({ key: 'tips.checked', n: checked })
  if (!tips.length) tips.push({ key: 'tips.start' })
  return tips.slice(0, 3)
}

export type Tier = 'proof' | 'wiser' | 'easy'

/** Scam Immunity Score out of 100 for one payday (or all of them): safe 20, tempted 10, fall 0 per scam, scaled to 100. */
export function immunity(answers: Answer[], encounters: EncounterDef[], round?: number): { score: number; tier: Tier; verdicts: Record<string, Verdict> } {
  const verdicts: Record<string, Verdict> = {}
  let points = 0
  let n = 0
  for (const a of firstAnswers(answers, round)) {
    const c = choiceOf(encounters, a)
    if (!c) continue
    verdicts[a.encounterId] = c.verdict
    points += POINTS[c.verdict]
    n++
  }
  const score = n ? Math.round((points / (n * POINTS.safe)) * 100) : 0
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

/**
 * Which scams come up on a payday, in the order they start: the character's own five,
 * then the everyday six, then a seeded mix of five. The order is shuffled for each run
 * and payday (same seed, same order); `shuffle: false` keeps the listed order (demo mode).
 */
export function roundIds(round: number, first: string[], second: string[], seed: number, shuffle = true): string[] {
  if (round <= 2) {
    const list = [...(round <= 1 ? first : second)]
    if (!shuffle) return list
    const rng = subRng(seed, `order:${round}`)
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[list[i], list[j]] = [list[j]!, list[i]!]
    }
    return list
  }
  const all = [...first, ...second]
  const rng = subRng(seed, `round:${round}`)
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[all[i], all[j]] = [all[j]!, all[i]!]
  }
  return all.slice(0, 5)
}

/**
 * Scams start one at a time, in the payday's order: the current one is the first
 * not yet faced this payday. Null once every scam of the payday is done.
 */
export function currentEncounter<T extends { id: string }>(thisRound: T[], answers: Answer[], round: number): T | null {
  const done = new Set(firstAnswers(answers, round).map((a) => a.encounterId))
  return thisRound.find((e) => !done.has(e.id)) ?? null
}

/** The gauntlet gets faster: each payday the countdowns shrink, down to 60%. */
export function timerFactor(round: number): number {
  return Math.max(0.6, 1 - 0.15 * (round - 1))
}
