import { describe, expect, it } from 'vitest'
import { currentEncounter, immunity, roundIds, shuffledChoices, timerFactor, townLedger, type Answer } from '../scamTown'
import { CUES, FIRST_PAYDAY, SECOND_PAYDAY, localEncounters, REAL_MESSAGES } from '@/content/scamTown'
import { CHARACTERS } from '@/content/characters'
import { ECONOMIES, paydayFor } from '@/content/economy'
import { CURRENCIES } from '@/i18n/currency'

const EVERY = localEncounters('USD', 'sita')
const ENCOUNTERS = EVERY.filter((e) => FIRST_PAYDAY.sita.includes(e.id))
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
        for (const ids of [FIRST_PAYDAY[c.id], SECOND_PAYDAY]) {
          const l = townLedger(paydayFor(cur, c.id), ids.map((id) => ({ encounterId: id, choiceId: 'fall' })), enc)
          expect(l.balance, `${cur} ${c.id} ${ids[0]}`).toBeGreaterThan(0)
        }
      }
  })
})

describe('scam immunity score', () => {
  it('safe 20, tempted 10, fall 0, with the three tiers', () => {
    expect(immunity(all('safe'), ENCOUNTERS)).toMatchObject({ score: 100, tier: 'proof' })
    expect(immunity(all('tempted'), ENCOUNTERS)).toMatchObject({ score: 50, tier: 'wiser' })
    expect(immunity(all('fall'), ENCOUNTERS)).toMatchObject({ score: 0, tier: 'easy' })
    const mixed: Answer[] = [...all('safe').slice(0, 4), { encounterId: ENCOUNTERS[4]!.id, choiceId: 'fall' }]
    expect(immunity(mixed, ENCOUNTERS)).toMatchObject({ score: 80, tier: 'proof' })
  })
})

describe('encounter content', () => {
  it('each encounter has one fall, one tempted and one safe choice, all with text', () => {
    expect(EVERY).toHaveLength(21)
    for (const e of EVERY) {
      expect(e.choices.map((c) => c.verdict).sort()).toEqual(['fall', 'safe', 'tempted'])
      const keys = [e.thoughtKey, e.senderKey, ...e.lineKeys, e.rule.whyKey, e.rule.ruleKey, e.rule.lessonKey, ...e.choices.flatMap((c) => [c.labelKey, c.outcomeKey])]
      if (e.payKey) keys.push(e.payKey)
      for (const key of keys) expect(key in en, key).toBe(true)
      expect(e.choices.find((c) => c.verdict === 'safe')!.loss).toBe(0)
    }
  })

  it('every scam building has a start cue, and every cue text exists', () => {
    for (const e of localEncounters('USD', 'sita')) {
      const cue = CUES[e.building]
      expect(cue, e.building).toBeDefined()
      if (cue.textKey) expect(en[cue.textKey as keyof typeof en], cue.textKey).toBeTruthy()
    }
    expect(CUES.bank.kind).toBe('ring')
    expect(en['town.cue.market']).toContain('{name}')
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

describe('the gauntlet loop: paydays as rounds', () => {
  it('pay lands every round and the balance carries over', () => {
    const a: Answer[] = [
      { encounterId: 'bank', choiceId: 'fall', round: 1 },
      { encounterId: 'home', choiceId: 'safe', round: 2 },
      { encounterId: 'cafe', choiceId: 'fall', round: 2 },
    ]
    const l = townLedger(800, a, EVERY, 2)
    const bank = EVERY.find((e) => e.id === 'bank')!.choices[0]!.loss
    const cafe = EVERY.find((e) => e.id === 'cafe')!.choices[0]!.loss
    expect(l.start).toBe(1_600)
    expect(l.balance).toBe(1_600 - bank - cafe)
    expect(l.entries.filter((e) => e.kind === 'payday').map((e) => e.round)).toEqual([1, 2])
  })

  it('the same building in a new payday is a new answer', () => {
    const a: Answer[] = [
      { encounterId: 'bank', choiceId: 'fall', round: 1 },
      { encounterId: 'bank', choiceId: 'safe', round: 3 },
    ]
    expect(immunity(a, EVERY, 1).score).toBe(0)
    expect(immunity(a, EVERY, 3).score).toBe(100)
  })

  it('the score is out of 100 even with six scams in a payday', () => {
    const six: Answer[] = SECOND_PAYDAY.map((id) => ({ encounterId: id, choiceId: 'safe', round: 2 }))
    expect(immunity(six, EVERY, 2)).toMatchObject({ score: 100, tier: 'proof' })
  })

  it('round one is the character’s own five, round two the everyday six, then a seeded mix of five', () => {
    const own = FIRST_PAYDAY.bikash
    expect([...roundIds(1, own, SECOND_PAYDAY, 9)].sort()).toEqual([...own].sort())
    expect([...roundIds(2, own, SECOND_PAYDAY, 9)].sort()).toEqual([...SECOND_PAYDAY].sort())
    const r3 = roundIds(3, own, SECOND_PAYDAY, 9)
    expect(r3).toHaveLength(5)
    expect(new Set(r3).size).toBe(5)
    expect(r3.every((id) => [...own, ...SECOND_PAYDAY].includes(id))).toBe(true)
    expect(roundIds(3, own, SECOND_PAYDAY, 9)).toEqual(r3)
  })

  it('the order is shuffled for each run, the same for the same seed, and fixed in demo mode', () => {
    const own = FIRST_PAYDAY.sita
    expect(roundIds(1, own, SECOND_PAYDAY, 42)).toEqual(roundIds(1, own, SECOND_PAYDAY, 42))
    const firsts = new Set(Array.from({ length: 30 }, (_, s) => roundIds(1, own, SECOND_PAYDAY, s)[0]))
    expect(firsts.size).toBeGreaterThan(2) // not always the bank first
    const orders = new Set(Array.from({ length: 30 }, (_, s) => roundIds(2, own, SECOND_PAYDAY, s).join()))
    expect(orders.size).toBeGreaterThan(10)
    expect(roundIds(1, own, SECOND_PAYDAY, 42, false)).toEqual(own) // demo mode
  })

  it('scams start one at a time, in the payday’s order, on every payday', () => {
    const list = (ids: string[]) => ids.map((id) => ({ id }))
    const ORDER = ['bank', 'market', 'post', 'job', 'invest']
    const first = list(ORDER)
    const safe = (id: string, round = 1): Answer => ({ encounterId: id, choiceId: `${id}_safe`, round })
    expect(currentEncounter(first, [], 1)?.id).toBe('bank')
    expect(currentEncounter(first, [safe('bank')], 1)?.id).toBe('market')
    expect(currentEncounter(first, ORDER.slice(0, 4).map((id) => safe(id)), 1)?.id).toBe('invest')
    expect(currentEncounter(first, ORDER.map((id) => safe(id)), 1)).toBeNull()
    // A practice replay of a done scam does not move the order on.
    expect(currentEncounter(first, [safe('bank'), safe('bank')], 1)?.id).toBe('market')
    // Next payday starts again from the top of its own list.
    const second = list(SECOND_PAYDAY)
    expect(currentEncounter(second, ORDER.map((id) => safe(id)), 2)?.id).toBe('home')
    expect(currentEncounter(second, [safe('home', 2)], 2)?.id).toBe('cafe')
  })

  it('timers get faster each payday, down to 60%', () => {
    expect(timerFactor(1)).toBe(1)
    expect(timerFactor(2)).toBeCloseTo(0.85)
    expect(timerFactor(9)).toBe(0.6)
  })
})

describe('each character meets their own everyday scams first', () => {
  it('five each, one at each place: bank, market, post office, job centre and kiosk', () => {
    for (const c of CHARACTERS) {
      const enc = localEncounters('USD', c.id)
      const buildings = FIRST_PAYDAY[c.id].map((id) => enc.find((e) => e.id === id)?.building)
      expect(buildings, c.id).toEqual(['bank', 'market', 'post', 'job', 'invest'])
    }
  })

  it('no two characters share a scam or a rule on their first payday', () => {
    const ids = CHARACTERS.flatMap((c) => FIRST_PAYDAY[c.id])
    expect(new Set(ids).size).toBe(15)
    const enc = localEncounters('USD', 'sita')
    const rules = ids.map((id) => en[enc.find((e) => e.id === id)!.rule.ruleKey as keyof typeof en])
    expect(new Set(rules).size).toBe(15)
  })

  it('every scam has all of its text', () => {
    for (const e of localEncounters('USD', 'aarav')) {
      const keys = [e.thoughtKey, e.senderKey, ...e.lineKeys, ...e.choices.flatMap((c) => [c.labelKey, c.outcomeKey]), e.rule.whyKey, e.rule.ruleKey, e.rule.lessonKey]
      for (const k of keys) expect(en[k as keyof typeof en], k).toBeTruthy()
    }
  })

  it('the fake overpayment adds up in every currency', () => {
    for (const cur of CURRENCIES) {
      const a = localEncounters(cur, 'sita').find((e) => e.id === 'overpay')!.amounts
      expect(a.paid, cur).toBe(a.price! + a.extra!)
    }
  })
})

describe('every message reads properly in every currency', () => {
  it('no {placeholder} is left unfilled, for any place, character or currency', async () => {
    const { t } = await import('@/i18n')
    const { formatMoney } = await import('@/i18n/currency')
    for (const cur of CURRENCIES)
      for (const c of CHARACTERS) {
        const params: Record<string, string | number> = { name: t(c.nameKey), card: c.persona.card, parcel: t(c.persona.parcel), job: t(c.persona.job), relative: t(c.persona.relative), item: t(c.persona.item), payday: formatMoney(paydayFor(cur, c.id), cur), loss: formatMoney(1, cur) }
        for (const e of localEncounters(cur, c.id)) {
          const p = { ...params }
          for (const [k, v] of Object.entries(e.amounts)) p[k] = formatMoney(v, cur)
          const keys = [e.thoughtKey, e.senderKey, ...e.lineKeys, ...(e.payKey ? [e.payKey] : []), ...e.choices.flatMap((x) => [x.labelKey, x.outcomeKey]), e.rule.whyKey, e.rule.ruleKey, e.rule.lessonKey]
          for (const k of keys) expect(t(k, p), `${cur} ${c.id} ${k}`).not.toMatch(/\{\w+\}/)
        }
        for (const m of REAL_MESSAGES) for (const k of [m.senderKey, ...m.lineKeys, ...m.choices.flatMap((x) => [x.labelKey, x.outcomeKey])]) expect(t(k, params), k).not.toMatch(/\{\w+\}/)
      }
  })
})
