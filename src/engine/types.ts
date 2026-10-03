/**
 * Core types for the Next Payday household engine.
 * Everything here is plain data. The engine is pure: same inputs → same Ledger.
 */

export type Flexibility = 'yes' | 'maybe' | 'no'
export type Person = 'landlord' | 'family' | 'friends'

export interface Bill {
  id: string
  /** i18n key for the bill's display name */
  nameKey: string
  emoji: string
  amount: number
  /** Days of the month on which this bill is due (1-based). */
  dueDays: number[]
  flexible: Flexibility
  /** Whose trust is needed to move this bill (hearts >= 3). */
  owner?: Person
  /** Late fee if paid after the due day via the "pay late" bridge. */
  lateFee?: number
}

export type Income =
  | {
      id: string
      nameKey: string
      emoji: string
      kind: 'salary' | 'remittance'
      day: number
      amount: number
      /** Uncertain arrival: with `probability`, arrives `delayDays` late (seeded). */
      uncertain?: { delayDays: number; probability: number }
    }
  | {
      id: string
      nameKey: string
      emoji: string
      kind: 'gig'
      /** Typical daily take. */
      base: number
      /** Chance that a day yields nothing (seeded). */
      zeroDayProbability: number
      /** Multiplier range around base, e.g. [0.7, 1.3]. */
      spread: [number, number]
      /** Days of the month with no work (e.g. festival days). */
      offDays?: number[]
    }

export interface Trust {
  landlord: number
  family: number
  friends: number
}

export interface Profile {
  id: string
  nameKey: string
  emoji: string
  /** Short i18n key describing the household (profile select). */
  blurbKey: string
  startingBalance: number
  incomes: Income[]
  trust: Trust
  /** 0–100, 100 = fully private. */
  privacy: number
  /** 0–100 starting stress. */
  stress: number
  /** Optional per-profile bill overrides (e.g. no rent for a student). */
  billOverrides?: Partial<Record<string, Partial<Bill> | null>>
  /** Formal credit available (card cash advance). */
  hasFormalCredit: boolean
  /** Name key of the partner abroad / family member scammers impersonate. */
  partnerNameKey?: string
}

/* ---------- Events ---------- */

export type Effect =
  | { kind: 'spend'; amount: number; labelKey: string; emoji?: string }
  | { kind: 'receive'; amount: number; labelKey: string; emoji?: string; dayOffset?: number }
  | {
      kind: 'recurring'
      amount: number
      labelKey: string
      emoji?: string
      /** Day of the current month for the first payment (omit to start next month). */
      firstDay?: number
      /** Number of monthly payments in total. */
      months: number
    }
  | { kind: 'trust'; who: Person; delta: number }
  | { kind: 'stress'; delta: number }
  | { kind: 'privacy'; delta: number }
  | { kind: 'delayIncome'; incomeId: string; days: number }
  | { kind: 'flag'; flag: string }

export type EventType = 'tradeoff' | 'uncontrollable' | 'social' | 'fair' | 'festival'

export interface EventChoice {
  id: string
  labelKey: string
  effects: Effect[]
  /** One-line lesson shown after the consequence. */
  lessonKey?: string
  /** Capability signals this choice evidences. */
  signals?: CapabilitySignal[]
}

export interface EventDef {
  id: string
  type: EventType
  emoji: string
  titleKey: string
  textKey: string
  day: number
  /** Known in advance (shows in forecast and calendar) or a surprise. */
  foreseeable: boolean
  choices: EventChoice[]
  /** Used when no decision is logged (auto-play, forecast, rewind fallback). */
  defaultChoiceId: string
}

/* ---------- Scammers ---------- */

export type ScamResponse = 'comply' | 'verify' | 'ask' | 'wait' | 'block'

export type ScamTrigger =
  | { type: 'firstShortfall' }
  | { type: 'gapForeseen'; minDay: number }
  | { type: 'day'; day: number }
  | { type: 'dayRange'; from: number; to: number }
  | { type: 'payday'; minDay: number }
  | { type: 'afterPayday'; daysAfter: number; minDay: number }
  | { type: 'afterOffer'; flags: string[]; fallbackDay: number }
  | { type: 'eventDay'; eventId: string }

export interface ScamComply {
  /** Money lost immediately. */
  loss: number
  /** Cash that lands first (a "pre-approved" loan). Repaid after the month, with weekly fees meanwhile. */
  cashIn?: number
  /** Fee every 7 days after complying until the month ends. */
  weeklyFee?: number
  /** A hidden fee that lands later. */
  laterLoss?: { amount: number; daysAfter: number }
  effects?: Effect[]
}

export interface ScamDef {
  id: string
  nameKey: string
  emoji: string
  color: string
  channel: 'sms' | 'call' | 'chat' | 'ad'
  senderKey: string
  /** Message body key. */
  hookKey: string
  /** Body used once the player's data has leaked ({name}, {partner}, {remitDay}). */
  personalHookKey?: string
  trigger: ScamTrigger
  /** Seconds on the urgency timer in the encounter UI. */
  urgencySeconds: number
  /** Suspicious fragments the player can tap (i18n keys). Empty for decoys. */
  tellKeys: string[]
  comply: ScamComply
  /** Real messages: nothing happens whatever the player does. */
  decoy?: boolean
  codex: { howKey: string; whatToDoKey: string }
}

export type ScamOutcome = 'pending' | 'scammed' | 'defended' | 'real'

export interface ScamEncounterRecord {
  scamId: string
  day: number
  personalized: boolean
  response?: ScamResponse
  outcome: ScamOutcome
  loss: number
  shieldPoints: number
  tellsSpotted: number
}

/* ---------- Player actions (every action is logged) ---------- */

export type CapabilitySignal =
  | 'forecastChecked'
  | 'cheaperBridge'
  | 'jarUsed'
  | 'scamVerified'
  | 'scamWaited'
  | 'scamBlocked'
  | 'notSure'
  | 'askedForInfo'
  | 'fairPrice'
  | 'rewindUsed'
  | 'timingLever'
  | 'askCopied'

interface ActionBase {
  id: string
  day: number
}

export type PlayerAction =
  | (ActionBase & { type: 'moveBill'; billId: string; fromDay: number; toDay: number })
  | (ActionBase & { type: 'splitBill'; billId: string; fromDay: number; days: [number, number]; fee: number })
  | (ActionBase & { type: 'payEarly'; billId: string; fromDay: number; toDay: number })
  | (ActionBase & { type: 'eventChoice'; eventId: string; choiceId: string })
  | (ActionBase & { type: 'bridge'; optionId: string; amount: number })
  | (ActionBase & { type: 'scamResponse'; scamId: string; response: ScamResponse; tellsSpotted: number })
  | (ActionBase & { type: 'jarDeposit'; amount: number })
  | (ActionBase & { type: 'jarWithdraw'; amount: number })
  | (ActionBase & { type: 'sellItem'; itemId: string; amount: number; fair: boolean })
  | (ActionBase & { type: 'extraShift'; amount: number })
  | (ActionBase & { type: 'treat'; amount: number; labelKey: string; stressDelta: number })
  | (ActionBase & { type: 'askHelp'; who: Person; amount: number })
  | (ActionBase & { type: 'forecastViewed' })
  | (ActionBase & { type: 'bridgeOptionsViewed' })
  | (ActionBase & { type: 'askCopied'; target: string })
  | (ActionBase & { type: 'rewind'; changedActionId: string })

export type DecisionLog = PlayerAction[]

/* ---------- Ledger (engine output) ---------- */

export type EntryKind =
  | 'income'
  | 'bill'
  | 'event'
  | 'bridge_in'
  | 'bridge_repay'
  | 'fee'
  | 'scam_loss'
  | 'scam_cash'
  | 'jar_in'
  | 'jar_out'
  | 'sale'
  | 'shift'
  | 'treat'

export interface Entry {
  kind: EntryKind
  /** Signed: positive into balance, negative out. */
  amount: number
  labelKey: string
  emoji: string
  ref?: { type: 'bill' | 'income' | 'event' | 'bridge' | 'scam' | 'action'; id: string }
}

export interface LogLine {
  day: number
  emoji: string
  key: string
  params?: Record<string, string | number>
  tone: 'neutral' | 'good' | 'bad' | 'warn' | 'lesson'
  /** Why this happened (key), for the tap-to-explain sheet. */
  whyKey?: string
}

export interface ResolvedEvent {
  eventId: string
  choiceId: string
  /** True when the choice came from the log, false when the default was used. */
  decided: boolean
}

export interface DayStats {
  bufferDays: number
  stress: number
  trust: Trust
  privacy: number
}

export interface DayRecord {
  day: number
  entries: Entry[]
  /** End-of-day cash balance (with any bridging money). */
  balance: number
  /** End-of-day balance as if no bridge money had moved. Shortfall is judged on this. */
  preBridgeBalance: number
  /** Emergency jar balance. */
  jar: number
  shortfall: boolean
  events: ResolvedEvent[]
  scams: ScamEncounterRecord[]
  stats: DayStats
  log: LogLine[]
}

export interface ActionOutcome {
  actionId: string
  status: 'applied' | 'blocked'
  reasonKey?: string
}

export interface Obligation {
  labelKey: string
  amount: number
  /** Total still owed after the month ends. */
  remaining: number
  /** Monthly instalment, if any. */
  perMonth?: number
}

export interface LedgerSummary {
  shortfallDays: number
  lowestBalance: number
  endBalance: number
  /** Fees, interest, late fees and scam losses — the cost of bridging gaps. */
  gapCost: number
  scamLoss: number
  totalIn: number
  totalOut: number
  obligationsAfterMonth: Obligation[]
  finalTrust: Trust
  finalPrivacy: number
  finalStress: number
  flags: string[]
  /** Scams that actually fired and were answered (decoys excluded). */
  scamsFaced: number
  scamsDefended: number
  scamsFooled: number
  shieldPoints: number
  tellsSpotted: number
  privacyLeaked: boolean
}

export interface Ledger {
  scenarioId: string
  profileId: string
  seed: number
  days: DayRecord[]
  summary: LedgerSummary
  actionOutcomes: ActionOutcome[]
}

/* ---------- Scenario ---------- */

export interface Scenario {
  id: string
  days: number
  bills: Bill[]
  events: EventDef[]
  bridges: BridgeOption[]
  scams: ScamDef[]
}

export interface SimulateOptions {
  /** Fire events that have no logged decision, using the default choice (default true). */
  includeUnresolvedEvents?: boolean
  /** Fire foreseeable events (wedding, festival) even when undecided (default true). */
  includeForeseeable?: boolean
  /** Let scammers appear at all (default true). The forecast turns this off. */
  includeScams?: boolean
  /** Response applied to scams with no logged decision (auto-play). Default: leave them pending. */
  autoScamResponse?: ScamResponse
  /** Stop after this day (inclusive). Defaults to scenario.days. */
  throughDay?: number
}

/* ---------- Gap Bridge options (data; engine interprets) ---------- */

export type BridgeFee =
  | { type: 'none' }
  | { type: 'flat'; amount: number }
  | { type: 'flatPercent'; percent: number }
  | { type: 'monthlyPercent'; monthlyPercent: number }
  | { type: 'percentPlusMonthly'; percent: number; monthlyPercent: number }

export type BridgeTerm = { type: 'nextIncome' } | { type: 'days'; days: number }

export interface BridgeOption {
  id: string
  nameKey: string
  emoji: string
  /** Cash: money arrives now, repaid later. deferBill: a specific bill is paid late with a fee. */
  mechanism: 'cash' | 'deferBill'
  billId?: string
  fee: BridgeFee
  term: BridgeTerm
  hiddenCostKey: string
  trust?: { who: Person; delta: number }
  privacy?: number
  flags?: string[]
  requiresFormalCredit?: boolean
  /** Illustrative annualised rate for display. */
  aprPercent?: number
  /** Where the rate comes from. Show "Rates are illustrative" until set. */
  source?: string
}

export interface BridgeQuote {
  optionId: string
  amount: number
  fee: number
  repayDay: number
  /** Total leaving the balance later (principal + fee, or bill + fee). */
  repayTotal: number
  days: number
}
