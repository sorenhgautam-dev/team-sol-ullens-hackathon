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

/** A share of the payday, an economy constant, or a multiple of another amount. */
type Money = number | 'fee' | 'hourly' | { times: string; by: number }

export interface EncounterSpec {
  id: string
  building: EncounterDef['building']
  scammer: string
  channel: EncounterDef['channel']
  lines: number
  timerSeconds: number
  pay?: boolean
  money: Record<string, Money>
  /** Loss for each risky choice: a money key, or a share of the payday (0 = no money lost). */
  loss: { fall: string | number; tempted: string | number }
}

export const ENCOUNTER_SPECS: EncounterSpec[] = [
  { id: 'bank', building: 'bank', scammer: 'otp_snatcher', channel: 'call', lines: 3, timerSeconds: 25, money: {}, loss: { fall: 0.25, tempted: 0 } },
  { id: 'market', building: 'market', scammer: 'impersonator', channel: 'chat', lines: 3, timerSeconds: 25, pay: true, money: { price: 0.15 }, loss: { fall: 'price', tempted: 0.05 } },
  { id: 'post', building: 'post', scammer: 'phisher', channel: 'text', lines: 2, timerSeconds: 20, money: { fee: 'fee' }, loss: { fall: 0.1, tempted: 0 } },
  { id: 'job', building: 'job', scammer: 'job_recruiter', channel: 'chat', lines: 3, timerSeconds: 25, money: { hourly: 'hourly', kit: 0.2, small: 0.05 }, loss: { fall: 'kit', tempted: 'small' } },
  { id: 'invest', building: 'invest', scammer: 'investment_guru', channel: 'chat', lines: 3, timerSeconds: 25, money: { stake: 0.25, double: { times: 'stake', by: 2 }, small: 0.06 }, loss: { fall: 'stake', tempted: 'small' } },
]

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
      if (typeof m === 'number') return nice(payday * m, currency)
      return 0
    }
    for (const [key, m] of Object.entries(s.money)) if (typeof m !== 'object') amounts[key] = resolve(m)
    for (const [key, m] of Object.entries(s.money)) if (typeof m === 'object') amounts[key] = (amounts[m.times] ?? 0) * m.by
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

/** Real messages that are safe to act on: the lesson is "verify", not "everything is a scam". */
export interface RealMessage {
  id: string
  /** Arrives after this many scams have been faced. */
  after: number
  senderKey: string
  lineKeys: string[]
  choices: { id: string; best: boolean; labelKey: string; outcomeKey: string }[]
}

export const REAL_MESSAGES: RealMessage[] = [
  {
    id: 'real_bank',
    after: 1,
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
    senderKey: 'town.real_family.sender',
    lineKeys: ['town.real_family.line1'],
    choices: [
      { id: 'reply', best: true, labelKey: 'town.real_family.reply', outcomeKey: 'town.real_family.reply.out' },
      { id: 'block', best: false, labelKey: 'town.real_family.block', outcomeKey: 'town.real_family.block.out' },
    ],
  },
]
