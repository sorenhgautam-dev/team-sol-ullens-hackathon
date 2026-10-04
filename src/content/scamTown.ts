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
  pay?: 'request' | 'screenshot' | 'form'
  money: Record<string, Money>
  /** Loss for each risky choice: a money key, or a share of the payday (0 = no money lost). */
  loss: { fall: string | number; tempted: string | number }
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
export function localEncounters(currency: Currency, character: CharacterId, specs: EncounterSpec[] = ENCOUNTER_SPECS): EncounterDef[] {
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
    return {
      id: s.id,
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
      choices: [
        { id: 'fall', verdict: 'fall', labelKey: k(s.id, 'fall'), outcomeKey: k(s.id, 'fall.out'), loss: lossOf(s.loss.fall) },
        { id: 'tempted', verdict: 'tempted', labelKey: k(s.id, 'tempted'), outcomeKey: k(s.id, 'tempted.out'), loss: lossOf(s.loss.tempted) },
        { id: 'safe', verdict: 'safe', labelKey: k(s.id, 'safe'), outcomeKey: k(s.id, 'safe.out'), loss: 0 },
      ],
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
