/**
 * The five payday traps and two real messages. Generic senders only ("your bank",
 * "a delivery company", "a payment app"): no real brands. Links use the reserved
 * .example domain. Amounts are US dollars; the currency helper converts them.
 * Text lives in i18n under town.<id>.*; persona params: {name}, {card}, {parcel}, {job}, {relative}, {item}, {payday}.
 */
import type { EncounterDef } from '@/engine/scamTown'

const k = (id: string, part: string) => `town.${id}.${part}`

function enc(
  id: EncounterDef['id'],
  building: EncounterDef['building'],
  scammer: string,
  channel: EncounterDef['channel'],
  lines: number,
  timerSeconds: number,
  losses: { fall: number; tempted: number },
  amounts: Record<string, number>,
  pay = false,
): EncounterDef {
  return {
    id,
    building,
    scammer,
    channel,
    thoughtKey: k(id, 'thought'),
    senderKey: k(id, 'sender'),
    lineKeys: Array.from({ length: lines }, (_, i) => k(id, `line${i + 1}`)),
    payKey: pay ? k(id, 'pay') : undefined,
    timerSeconds,
    amounts,
    choices: [
      { id: 'fall', verdict: 'fall', labelKey: k(id, 'fall'), outcomeKey: k(id, 'fall.out'), loss: losses.fall },
      { id: 'tempted', verdict: 'tempted', labelKey: k(id, 'tempted'), outcomeKey: k(id, 'tempted.out'), loss: losses.tempted },
      { id: 'safe', verdict: 'safe', labelKey: k(id, 'safe'), outcomeKey: k(id, 'safe.out'), loss: 0 },
    ],
    rule: { whyKey: k(id, 'why'), ruleKey: k(id, 'rule'), lessonKey: k(id, 'lesson') },
  }
}

export const ENCOUNTERS: EncounterDef[] = [
  enc('bank', 'bank', 'otp_snatcher', 'call', 3, 25, { fall: 200, tempted: 0 }, {}),
  enc('market', 'market', 'impersonator', 'chat', 3, 25, { fall: 120, tempted: 35 }, { price: 120 }, true),
  enc('post', 'post', 'phisher', 'text', 2, 20, { fall: 80, tempted: 0 }, { fee: 1.99 }),
  enc('job', 'job', 'job_recruiter', 'chat', 3, 25, { fall: 150, tempted: 40 }, { hourly: 30, kit: 150, small: 40 }),
  enc('invest', 'invest', 'investment_guru', 'chat', 3, 25, { fall: 200, tempted: 50 }, { stake: 200, double: 400, small: 50 }),
]

export const ENCOUNTERS_BY_ID: Record<string, EncounterDef> = Object.fromEntries(ENCOUNTERS.map((e) => [e.id, e]))

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
