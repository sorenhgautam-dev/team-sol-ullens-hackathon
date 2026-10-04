/**
 * The payday traps and the real messages. Generic senders only ("your bank",
 * "a delivery company", "a payment app"): no real brands. Links use the reserved
 * .example domain. Money is local and realistic (content/economy.ts): every amount is
 * a share of the character's own pay, or a typical local fee, never an exchange rate.
 * Text lives in i18n under town.<id>.*; persona params: {name}, {card}, {parcel}, {job}, {relative}, {item}, {payday}.
 */
import type { EncounterDef } from '@/engine/scamTown'
import type { Currency } from '@/i18n/currency'
import { ECONOMIES, nice } from './economy'
import { subRng } from '@/engine/rng'
import type { CharacterId } from './characters'
import type { SfxName } from '@/audio/sfx'

/** A share of the payday, an economy constant, a multiple of another amount, or the sum of two. */
type Money = number | 'fee' | 'hourly' | 'coffee' | { times: string; by: number } | { plus: [string, string] }

export interface EncounterSpec {
  id: string
  building: EncounterDef['building']
  scammer: string
  channel: EncounterDef['channel']
  lines: number
  timerSeconds: number
  /** A payment screen in the message: a request to approve, a fake screenshot, or a card form. */
  pay?: 'request' | 'screenshot' | 'form' | 'received'
  /** Arrives on the phone while walking (real ones can too, so the phone is not a giveaway). */
  phone?: boolean
  money: Record<string, Money>
  /** Loss for each risky choice: a money key, or a share of the payday (0 = no money lost). */
  loss: { fall: string | number; tempted: string | number }
  /** A real interaction: which money key comes in or goes out when accepted, and what saying no costs. */
  real?: { gain?: string; cost?: string; refuseCost?: string; refuseMissed?: string }
}

export const ENCOUNTER_SPECS: EncounterSpec[] = [
  { id: 'bank', building: 'bank', scammer: 'otp_snatcher', channel: 'call', lines: 3, timerSeconds: 25, money: {}, loss: { fall: 0.25, tempted: 0 } },
  { id: 'market', building: 'market', scammer: 'impersonator', channel: 'chat', lines: 3, timerSeconds: 25, pay: 'request', money: { price: 0.15 }, loss: { fall: 'price', tempted: 0.05 } },
  { id: 'post', building: 'post', scammer: 'phisher', channel: 'text', lines: 2, timerSeconds: 20, money: { fee: 'fee' }, loss: { fall: 0.18, tempted: 0 } },
  { id: 'job', building: 'job', scammer: 'job_recruiter', channel: 'chat', lines: 3, timerSeconds: 25, money: { hourly: 'hourly', kit: 0.2, small: 0.05 }, loss: { fall: 'kit', tempted: 'small' } },
  { id: 'invest', building: 'invest', scammer: 'investment_guru', channel: 'chat', lines: 3, timerSeconds: 25, money: { stake: 0.2, gain: 0.15, small: 0.05 }, loss: { fall: 'stake', tempted: 'small' } },
  // Sita's own: a fake payment screenshot from a "customer", a prize she never entered.
  { id: 'overpay', building: 'market', scammer: 'impersonator', channel: 'chat', lines: 3, timerSeconds: 25, pay: 'screenshot', money: { price: 0.08, extra: 0.15, paid: { plus: ['price', 'extra'] } }, loss: { fall: 'extra', tempted: 'price' } },
  { id: 'prize', building: 'invest', scammer: 'prize_ghost', channel: 'chat', lines: 3, timerSeconds: 22, money: { charge: 0.15, half: 0.07 }, loss: { fall: 'charge', tempted: 'half' } },
  // Bikash's own: a loan with a fee first, a fake delivery-app alert, a job abroad, a savings club.
  { id: 'loanfee', building: 'bank', scammer: 'loan_shark', channel: 'call', lines: 3, timerSeconds: 25, money: { loan: 3, procfee: 0.15 }, loss: { fall: 'procfee', tempted: 0 } },
  { id: 'apphold', building: 'post', scammer: 'phisher', channel: 'text', lines: 2, timerSeconds: 20, money: {}, loss: { fall: 0.25, tempted: 0 } },
  { id: 'abroad', building: 'job', scammer: 'job_recruiter', channel: 'chat', lines: 3, timerSeconds: 25, money: { abroadPay: 8, agentfee: 0.2, small: 0.05 }, loss: { fall: 'agentfee', tempted: 'small' } },
  { id: 'chain', building: 'invest', scammer: 'investment_guru', channel: 'chat', lines: 3, timerSeconds: 25, money: { weekly: 0.15, double: { times: 'weekly', by: 2 }, small: 0.05 }, loss: { fall: 'weekly', tempted: 'small' } },
  // Aarav's own: a "bank details" call, a second-hand laptop, a tax refund text, a task job.
  { id: 'kyc', building: 'bank', scammer: 'phisher', channel: 'call', lines: 3, timerSeconds: 25, money: {}, loss: { fall: 0.15, tempted: 0 } },
  { id: 'token', building: 'market', scammer: 'impersonator', channel: 'chat', lines: 3, timerSeconds: 25, money: { price: 0.25, token: 0.04 }, loss: { fall: 'price', tempted: 'token' } },
  { id: 'taxrefund', building: 'post', scammer: 'phisher', channel: 'text', lines: 2, timerSeconds: 20, money: { refund: 0.1 }, loss: { fall: 0.15, tempted: 0 } },
  { id: 'tasks', building: 'job', scammer: 'job_recruiter', channel: 'chat', lines: 3, timerSeconds: 25, money: { perTask: 0.005, topup: 0.15, small: 0.03 }, loss: { fall: 'topup', tempted: 'small' } },
  // Everyday traps, met from the second payday on.
  { id: 'home', building: 'home', scammer: 'impersonator', channel: 'text', lines: 3, timerSeconds: 22, money: { ask: 0.15, small: 0.05 }, loss: { fall: 'ask', tempted: 'small' } },
  { id: 'cafe', building: 'cafe', scammer: 'fine_print', channel: 'payment', lines: 2, timerSeconds: 18, pay: 'form', money: { coffee: 'coffee' }, loss: { fall: 0.15, tempted: 0.04 } },
  { id: 'tech', building: 'tech', scammer: 'loan_shark', channel: 'call', lines: 3, timerSeconds: 22, money: { fix: 0.08 }, loss: { fall: 0.17, tempted: 0.08 } },
  { id: 'gov', building: 'gov', scammer: 'otp_snatcher', channel: 'call', lines: 3, timerSeconds: 22, money: { fine: 0.17, half: { times: 'fine', by: 0.5 } }, loss: { fall: 'fine', tempted: 'half' } },
  { id: 'rental', building: 'rental', scammer: 'prize_ghost', channel: 'chat', lines: 3, timerSeconds: 25, money: { rent: 0.2, deposit: 0.16, small: 0.05 }, loss: { fall: 'deposit', tempted: 'small' } },
  { id: 'shop', building: 'shop', scammer: 'phisher', channel: 'chat', lines: 3, timerSeconds: 20, money: { price: 0.15, small: 0.05 }, loss: { fall: 'price', tempted: 'small' } },
]

/** Each scammer's colour in the reveal scene. */
export const SCAMMER_COLOUR: Record<string, string> = {
  phisher: '#b23a30',
  loan_shark: '#6e6a80',
  impersonator: '#d9734e',
  otp_snatcher: '#2b4566',
  fine_print: '#f5c26b',
  prize_ghost: '#9bb58a',
  job_recruiter: '#3f7fa6',
  investment_guru: '#5fae5f',
}

/**
 * Real, safe interactions: one per building. Money moves normally (Income and Expenses).
 * They look like the scams on purpose; the clues are in the details (in person, a receipt,
 * money coming to you, nothing asked for a code). Saying no to a real one costs a little.
 */
const R = (id: string, building: EncounterDef['building'], lines: number, money: EncounterSpec['money'], real: NonNullable<EncounterSpec['real']>): EncounterSpec => ({ id, building, scammer: '', channel: 'chat', lines, timerSeconds: 22, money, loss: { fall: 0, tempted: 0 }, real })
export const REAL_SPECS: EncounterSpec[] = [
  R('genuine_bank', 'bank', 3, { refund: 0.05 }, { gain: 'refund', refuseMissed: 'refund' }),
  { ...R('genuine_market', 'market', 2, { price: 0.06 }, { gain: 'price', refuseMissed: 'price' }), pay: 'received' },
  { ...R('genuine_post', 'post', 2, { fee: 'fee', late: 0.03 }, { cost: 'fee', refuseCost: 'late' }), channel: 'text', phone: true },
  R('genuine_job', 'job', 2, { shift: 0.05 }, { gain: 'shift', refuseMissed: 'shift' }),
  R('genuine_invest', 'invest', 2, { pass: 0.04, singles: 0.06 }, { cost: 'pass', refuseCost: 'singles' }),
  R('genuine_home', 'home', 2, { back: 0.04 }, { gain: 'back', refuseMissed: 'back' }),
  R('genuine_cafe', 'cafe', 2, { coffee: 'coffee' }, { gain: 'coffee', refuseMissed: 'coffee' }),
  R('genuine_tech', 'tech', 2, { fix: 0.04, more: 0.07 }, { cost: 'fix', refuseCost: 'more' }),
  R('genuine_gov', 'gov', 2, { refund: 0.05 }, { gain: 'refund', refuseMissed: 'refund' }),
  R('genuine_rental', 'rental', 2, { back: 0.06 }, { gain: 'back', refuseMissed: 'back' }),
  R('genuine_shop', 'shop', 2, { price: 0.05, more: 0.07 }, { cost: 'price', refuseCost: 'more' }),
  // Main Street: open any time, one quick money choice each (needs before wants, paying on time).
  R('extra_pharmacy', 'pharmacy', 2, { medicine: 0.02, later: 0.05 }, { cost: 'medicine', refuseCost: 'later' }),
  R('extra_bakery', 'bakery', 2, { bread: 0.01, cake: 0.02, later: 0.03 }, { cost: 'bread', refuseCost: 'later' }),
  R('extra_school', 'school', 2, { fee: 0.03, late: 0.05 }, { cost: 'fee', refuseCost: 'late' }),
]

/** How often each building is real on a payday (the rest are scams). A real bank branch is a safe place. */
const REAL_ODDS: Partial<Record<EncounterDef['building'], number>> = { bank: 0.5, post: 0.5 }
/** Real interactions per payday: at least one to spot, never more than two, so scams are most of it. */
const MIN_REAL = 1
const MAX_REAL = 2
/** Demo mode is fixed and predictable: the same mix every time (the bank's call is a scam, first). */
export const DEMO_MIX: Record<EncounterDef['building'], 'real' | 'scam'> = { bank: 'scam', market: 'real', post: 'real', job: 'scam', invest: 'scam', home: 'scam', cafe: 'real', tech: 'scam', gov: 'real', rental: 'scam', shop: 'real', pharmacy: 'real', bakery: 'real', school: 'real' }

/**
 * Each payday the seed decides, building by building, whether what happens there is real or
 * a scam (scams are most of it: bank and post office about half real, the rest about 30%). The same building can be
 * safe one payday and a trap the next.
 */
export function mixRound(ids: string[], round: number, seed: number, demo: boolean): string[] {
  const buildingOf = (id: string) => ENCOUNTER_SPECS.find((x) => x.id === id)?.building
  if (demo)
    return ids.map((id) => {
      const b = buildingOf(id)
      return b && DEMO_MIX[b] === 'real' ? `genuine_${b}` : id
    })
  // Roll each building against its odds; the lower the roll compared with the odds, the more "real" it is.
  const rolls = ids.map((id, i) => {
    const b = buildingOf(id)
    const odds = b ? (REAL_ODDS[b] ?? 0.3) : 0
    const u = b ? subRng(seed, `mix:${round}:${b}`)() : 1
    return { i, b, score: odds > 0 ? u / odds : Infinity }
  })
  // Scams stay the main event: every payday has at least one real interaction and never more than two.
  const ranked = [...rolls].filter((r) => r.b).sort((a, b) => a.score - b.score)
  const n = Math.min(MAX_REAL, Math.max(MIN_REAL, ranked.filter((r) => r.score < 1).length))
  const real = new Set(ranked.slice(0, n).map((r) => r.i))
  return ids.map((id, i) => (real.has(i) ? `genuine_${rolls[i]!.b}` : id))
}

/**
 * Each character's first payday: five everyday scams that fit their life, each teaching
 * its own rule. Always in building order (bank, market, post office, job centre, kiosk),
 * so the start cues come in the same order for everyone. Demo mode plays Sita's.
 */
export const FIRST_PAYDAY: Record<CharacterId, string[]> = {
  sita: ['bank', 'overpay', 'post', 'job', 'prize'],
  bikash: ['loanfee', 'market', 'apphold', 'abroad', 'chain'],
  aarav: ['kyc', 'token', 'taxrefund', 'tasks', 'invest'],
}
/** The everyday traps of the second payday, met by everyone. */
export const SECOND_PAYDAY = ['home', 'cafe', 'tech', 'gov', 'rental', 'shop']

const k = (id: string, part: string) => `town.${id}.${part}`

/** The encounters with real local amounts for this currency and character. */
export function localEncounters(currency: Currency, character: CharacterId, specs: EncounterSpec[] = [...ENCOUNTER_SPECS, ...REAL_SPECS]): EncounterDef[] {
  const econ = ECONOMIES[currency]
  const payday = econ.payday[character]
  return specs.map((s) => {
    const amounts: Record<string, number> = {}
    const resolve = (m: Money): number => {
      if (m === 'fee') return econ.fee
      if (m === 'hourly') return econ.hourly
      if (m === 'coffee') return econ.coffee
      if (typeof m === 'number') return nice(payday * m, currency)
      return 0
    }
    for (const [key, m] of Object.entries(s.money)) if (typeof m !== 'object') amounts[key] = resolve(m)
    for (const [key, m] of Object.entries(s.money)) if (typeof m === 'object') amounts[key] = 'plus' in m ? (amounts[m.plus[0]] ?? 0) + (amounts[m.plus[1]] ?? 0) : (amounts[m.times] ?? 0) * m.by
    const lossOf = (l: string | number) => (typeof l === 'string' ? (amounts[l] ?? 0) : l > 0 ? nice(payday * l, currency) : 0)
    const money = (key?: string) => (key ? (amounts[key] ?? 0) : 0)
    const choices: EncounterDef['choices'] = s.real
      ? [
          { id: 'accept', verdict: 'safe', labelKey: 'town.choice.accept', outcomeKey: k(s.id, 'accept.out'), loss: 0, gain: money(s.real.gain), cost: money(s.real.cost) },
          { id: 'verify', verdict: 'safe', labelKey: 'town.choice.verify', outcomeKey: k(s.id, 'verify.out'), loss: 0, gain: money(s.real.gain), cost: money(s.real.cost) },
          { id: 'refuse', verdict: 'tempted', labelKey: 'town.choice.refuse', outcomeKey: k(s.id, 'refuse.out'), loss: 0, cost: money(s.real.refuseCost), missed: money(s.real.refuseMissed) },
        ]
      : [
          { id: 'accept', verdict: 'fall', labelKey: 'town.choice.accept', outcomeKey: k(s.id, 'fall.out'), loss: lossOf(s.loss.fall) },
          { id: 'verify', verdict: 'safe', labelKey: 'town.choice.verify', outcomeKey: k(s.id, 'safe.out'), loss: 0 },
          { id: 'refuse', verdict: 'safe', labelKey: 'town.choice.refuse', outcomeKey: 'town.refuse.scam', loss: 0 },
        ]
    return {
      id: s.id,
      real: !!s.real,
      // Scams pretending to be the bank or the post office arrive on the phone while you walk.
      via: s.phone || (!s.real && (s.building === 'bank' || s.building === 'post')) ? 'phone' : undefined,
      building: s.building,
      scammer: s.scammer,
      channel: s.channel,
      thoughtKey: k(s.id, 'thought'),
      senderKey: k(s.id, 'sender'),
      lineKeys: Array.from({ length: s.lines }, (_, i) => k(s.id, `line${i + 1}`)),
      payKey: s.pay ? k(s.id, 'pay') : undefined,
      payStyle: s.pay,
      timerSeconds: s.timerSeconds,
      amounts,
      choices,
      rule: { whyKey: k(s.id, 'why'), ruleKey: k(s.id, 'rule'), lessonKey: k(s.id, 'lesson') },
    }
  })
}

/**
 * How each scam starts: one at a time, the current building shows a cue above it
 * (a ringing phone, a shout, a notification...) with a sound and, for calls and buzzes, a vibration.
 */
export type CueKind = 'ring' | 'shout' | 'notify' | 'letter' | 'stranger' | 'alert' | 'tag' | 'qr'
export interface Cue {
  kind: CueKind
  /** Short text on the cue; may use {name}. */
  textKey?: string
  sound: SfxName
  vibrate?: number[]
}
export const CUES: Record<EncounterDef['building'], Cue> = {
  bank: { kind: 'ring', sound: 'ring', vibrate: [220, 120, 220] },
  market: { kind: 'shout', textKey: 'town.cue.market', sound: 'chime' },
  post: { kind: 'notify', sound: 'buzz', vibrate: [40, 60, 40] },
  job: { kind: 'letter', textKey: 'town.cue.job', sound: 'notify' },
  invest: { kind: 'stranger', sound: 'coin' },
  home: { kind: 'notify', textKey: 'town.cue.home', sound: 'buzz', vibrate: [40, 60, 40] },
  cafe: { kind: 'qr', textKey: 'town.cue.cafe', sound: 'pop' },
  tech: { kind: 'alert', textKey: 'town.cue.tech', sound: 'buzz', vibrate: [60, 40, 60] },
  gov: { kind: 'letter', textKey: 'town.cue.gov', sound: 'thud' },
  rental: { kind: 'shout', textKey: 'town.cue.rental', sound: 'chime' },
  shop: { kind: 'tag', textKey: 'town.cue.shop', sound: 'coin' },
  pharmacy: { kind: 'tag', sound: 'pop' },
  bakery: { kind: 'tag', sound: 'pop' },
  school: { kind: 'letter', sound: 'pop' },
}

/** Real messages that are safe to act on: the lesson is "verify", not "everything is a scam". */
export interface RealMessage {
  id: string
  /** Arrives after this many scams have been faced in this payday. */
  after: number
  /** Which payday it belongs to (later paydays repeat the last set). */
  round: number
  senderKey: string
  lineKeys: string[]
  choices: { id: string; best: boolean; labelKey: string; outcomeKey: string }[]
}

export const REAL_MESSAGES: RealMessage[] = [
  {
    id: 'real_bank',
    after: 1,
    round: 1,
    senderKey: 'town.real_bank.sender',
    lineKeys: ['town.real_bank.line1'],
    choices: [
      { id: 'check', best: true, labelKey: 'town.real_bank.check', outcomeKey: 'town.real_bank.check.out' },
      { id: 'delete', best: false, labelKey: 'town.real_bank.delete', outcomeKey: 'town.real_bank.delete.out' },
    ],
  },
  {
    id: 'real_family',
    after: 3,
    round: 1,
    senderKey: 'town.real_family.sender',
    lineKeys: ['town.real_family.line1'],
    choices: [
      { id: 'reply', best: true, labelKey: 'town.real_family.reply', outcomeKey: 'town.real_family.reply.out' },
      { id: 'block', best: false, labelKey: 'town.real_family.block', outcomeKey: 'town.real_family.block.out' },
    ],
  },
  {
    id: 'real_parcel',
    after: 2,
    round: 2,
    senderKey: 'town.real_parcel.sender',
    lineKeys: ['town.real_parcel.line1'],
    choices: [
      { id: 'check', best: true, labelKey: 'town.real_parcel.check', outcomeKey: 'town.real_parcel.check.out' },
      { id: 'report', best: false, labelKey: 'town.real_parcel.report', outcomeKey: 'town.real_parcel.report.out' },
    ],
  },
]
