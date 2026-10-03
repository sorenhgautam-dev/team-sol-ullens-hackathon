import { describe, expect, it } from 'vitest'
import { immunity, shuffledChoices, townLedger, type Answer } from '../scamTown'
import { localEncounters, REAL_MESSAGES } from '@/content/scamTown'
import { CHARACTERS } from '@/content/characters'
import { ECONOMIES, paydayFor } from '@/content/economy'
import { CURRENCIES } from '@/i18n/currency'

const ENCOUNTERS = localEncounters('USD', 'sita')
import { en } from '@/i18n/en'

const all = (choice: string): Answer[] => ENCOUNTERS.map((e) => ({ encounterId: e.id, choiceId: choice }))

describe('scam town ledger', () => {
  it('payday lands, and every loss is booked to ScamLoss with balanced postings', () => {
    const l = townLedger(800, all('fall'), ENCOUNTERS)
    const lost = ENCOUNTERS.reduce((s, e) => s + e.choices.find((c) => c.id === 'fall')!.loss, 0)
    expect(l.balance).toBe(800 - lost)
    expect(l.accounts.ScamLoss).toBe(lost)
    expect(l.accounts.Wallet + l.accounts.Income + l.accounts.ScamLoss).toBe(0)
    for (const e of l.entries) expect(e.postings.reduce((s, p) => s + p.delta, 0)).toBe(0)
  })

  it('safe answers keep the whole payday', () => {
    const l = townLedger(800, all('safe'), ENCOUNTERS)
    expect(l.balance).toBe(800)
    expect(l.entries).toHaveLength(1)
  })

  it('only the first answer counts: a practice replay never changes the ledger', () => {
    const a: Answer[] = [{ encounterId: 'bank', choiceId: 'fall' }, { encounterId: 'bank', choiceId: 'safe' }]
    expect(townLedger(800, a, ENCOUNTERS).balance).toBe(600)
  })

  it('falling for everything still leaves every character something, in every currency', () => {
    for (const cur of CURRENCIES)
      for (const c of CHARACTERS) {
        const enc = localEncounters(cur, c.id)
        const l = townLedger(paydayFor(cur, c.id), enc.map((e) => ({ encounterId: e.id, choiceId: 'fall' })), enc)
        expect(l.balance, `${cur} ${c.id}`).toBeGreaterThan(0)
      }
  })
})

describe('scam immunity score', () => {
  it('safe 20, tempted 10, fall 0, with the three tiers', () => {
    expect(immunity(all('safe'), ENCOUNTERS)).toMatchObject({ score: 100, tier: 'proof' })
    expect(immunity(all('tempted'), ENCOUNTERS)).toMatchObject({ score: 50, tier: 'wiser' })
    expect(immunity(all('fall'), ENCOUNTERS)).toMatchObject({ score: 0, tier: 'easy' })
    const mixed: Answer[] = [...all('safe').slice(0, 4), { encounterId: 'invest', choiceId: 'fall' }]
    expect(immunity(mixed, ENCOUNTERS)).toMatchObject({ score: 80, tier: 'proof' })
  })
})

describe('encounter content', () => {
  it('each encounter has one fall, one tempted and one safe choice, all with text', () => {
    for (const e of ENCOUNTERS) {
      expect(e.choices.map((c) => c.verdict).sort()).toEqual(['fall', 'safe', 'tempted'])
      const keys = [e.thoughtKey, e.senderKey, ...e.lineKeys, e.rule.whyKey, e.rule.ruleKey, e.rule.lessonKey, ...e.choices.flatMap((c) => [c.labelKey, c.outcomeKey])]
      if (e.payKey) keys.push(e.payKey)
      for (const key of keys) expect(key in en, key).toBe(true)
      expect(e.choices.find((c) => c.verdict === 'safe')!.loss).toBe(0)
    }
  })

  it('there are at least two real messages, each with text', () => {
    expect(REAL_MESSAGES.length).toBeGreaterThanOrEqual(2)
    for (const m of REAL_MESSAGES) for (const key of [m.senderKey, ...m.lineKeys, ...m.choices.flatMap((c) => [c.labelKey, c.outcomeKey])]) expect(key in en, key).toBe(true)
  })

  it('choice order is shuffled, but the same for the same seed and attempt', () => {
    const e = ENCOUNTERS[0]!
    expect(shuffledChoices(e, 7, 0).map((c) => c.id)).toEqual(shuffledChoices(e, 7, 0).map((c) => c.id))
    const orders = new Set(Array.from({ length: 12 }, (_, i) => shuffledChoices(e, 7, i).map((c) => c.id).join()))
    expect(orders.size).toBeGreaterThan(1)
  })

  it('uses no real brand names and no Nepal-specific words in the new text', () => {
    const text = Object.entries(en).filter(([k]) => k.startsWith('town.') && /^(town\.(bank|market|post|job|invest|real_)|town\.(scams|go|enter|phone|hurry))/.test(k)).map(([, v]) => v).join(' ')
    expect(text).not.toMatch(/Nepal|Kathmandu|NPR|eSewa|Khalti|Visa|Mastercard|PayPal|Amazon|FedEx|DHL/i)
  })
})

describe('realistic local money (no exchange-rate conversion)', () => {
  it('no one in rupees is paid a lakh or more', () => {
    for (const cur of ['NPR', 'INR'] as const) for (const c of CHARACTERS) expect(paydayFor(cur, c.id)).toBeLessThan(100_000)
  })

  it('rupee pay is local, not dollars times an exchange rate', () => {
    expect(paydayFor('NPR', 'sita')).not.toBe(paydayFor('USD', 'sita') * 133)
    expect(paydayFor('NPR', 'bikash')).toBe(7_000)
  })

  it('scam amounts are shares of the character’s own pay, rounded to local numbers', () => {
    const rider = localEncounters('NPR', 'bikash')
    const clerk = localEncounters('NPR', 'aarav')
    const bank = (l: typeof rider) => l.find((e) => e.id === 'bank')!.choices.find((c) => c.id === 'fall')!.loss
    expect(bank(rider)).toBe(1_750)
    expect(bank(clerk)).toBe(7_000)
    for (const e of rider) for (const v of Object.values(e.amounts)) expect(v % 1 === 0 || v === ECONOMIES.NPR.fee).toBe(true)
    expect(localEncounters('USD', 'sita').find((e) => e.id === 'post')!.amounts.fee).toBe(1.99)
  })
})
