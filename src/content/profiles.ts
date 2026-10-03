import type { Profile } from '@/engine/types'

export const SITA: Profile = {
  id: 'sita',
  nameKey: 'profile.sita',
  emoji: '👩🏽',
  blurbKey: 'profile.sita.blurb',
  partnerNameKey: 'persona.sitaPartner',
  startingBalance: 3_000,
  incomes: [
    { id: 'sita-local', nameKey: 'income.localWork', emoji: '🧵', kind: 'salary', day: 1, amount: 10_000 },
    {
      id: 'sita-remit',
      nameKey: 'income.remittance',
      emoji: '✈️',
      kind: 'remittance',
      day: 20,
      amount: 25_000,
      uncertain: { delayDays: 3, probability: 0.3 },
    },
  ],
  trust: { landlord: 3, family: 4, friends: 3 },
  privacy: 100,
  stress: 20,
  hasFormalCredit: false,
}

export const AARAV: Profile = {
  id: 'aarav',
  nameKey: 'profile.aarav',
  emoji: '👨🏽',
  blurbKey: 'profile.aarav.blurb',
  startingBalance: 3_000,
  incomes: [{ id: 'aarav-salary', nameKey: 'income.salary', emoji: '💼', kind: 'salary', day: 1, amount: 35_000 }],
  trust: { landlord: 3, family: 3, friends: 3 },
  privacy: 100,
  stress: 10,
  hasFormalCredit: true,
}

export const BIKASH: Profile = {
  id: 'bikash',
  nameKey: 'profile.bikash',
  emoji: '🧑🏽',
  blurbKey: 'profile.bikash.blurb',
  startingBalance: 3_000,
  incomes: [
    {
      id: 'bikash-gig',
      nameKey: 'income.gig',
      emoji: '🛵',
      kind: 'gig',
      base: 1_200,
      zeroDayProbability: 0.15,
      spread: [0.7, 1.3],
    },
  ],
  trust: { landlord: 2, family: 3, friends: 4 },
  privacy: 100,
  stress: 30,
  hasFormalCredit: false,
}

export const PROFILES: Record<string, Profile> = { sita: SITA, aarav: AARAV, bikash: BIKASH }

/* ---- Data-only archetypes for Town Mode (Section 4.7 optional profiles). Portrayed with dignity. ---- */

export const STUDENT: Profile = {
  id: 'student',
  nameKey: 'profile.student',
  emoji: '🧑🏽‍🎓',
  blurbKey: 'profile.student.blurb',
  startingBalance: 2_000,
  incomes: [{ id: 'allowance', nameKey: 'income.allowance', emoji: '✉️', kind: 'salary', day: 2, amount: 15_000 }],
  trust: { landlord: 3, family: 5, friends: 4 },
  privacy: 100,
  stress: 25,
  hasFormalCredit: false,
  billOverrides: {
    rent: { nameKey: 'bill.hostel', amount: 5_000, dueDays: [3] },
    school: { nameKey: 'bill.examFees', amount: 4_000, dueDays: [10] },
    electricity: null,
    groceries: { amount: 1_500 },
  },
}

export const TRADER: Profile = {
  id: 'trader',
  nameKey: 'profile.trader',
  emoji: '🧕🏽',
  blurbKey: 'profile.trader.blurb',
  startingBalance: 3_000,
  incomes: [{ id: 'stall', nameKey: 'income.stall', emoji: '🧺', kind: 'gig', base: 1_500, zeroDayProbability: 0.1, spread: [0.4, 1.6] }],
  trust: { landlord: 3, family: 3, friends: 4 },
  privacy: 100,
  stress: 25,
  hasFormalCredit: false,
}

export const SEASONAL: Profile = {
  id: 'seasonal',
  nameKey: 'profile.seasonal',
  emoji: '👷🏽',
  blurbKey: 'profile.seasonal.blurb',
  startingBalance: 2_500,
  incomes: [{ id: 'kiln', nameKey: 'income.kilnWages', emoji: '🧱', kind: 'salary', day: 25, amount: 20_000, uncertain: { delayDays: 7, probability: 0.3 } }],
  trust: { landlord: 2, family: 4, friends: 3 },
  privacy: 100,
  stress: 35,
  hasFormalCredit: false,
  billOverrides: { rent: { amount: 6_000 }, school: { amount: 2_000 }, internet: null },
}

export const MIXED: Profile = {
  id: 'mixed',
  nameKey: 'profile.mixed',
  emoji: '👨🏽‍👩🏽‍👧🏽',
  blurbKey: 'profile.mixed.blurb',
  startingBalance: 3_000,
  incomes: [
    { id: 'mixed-local', nameKey: 'income.localWork', emoji: '🔧', kind: 'salary', day: 1, amount: 8_000 },
    { id: 'mixed-remit', nameKey: 'income.remittance', emoji: '✈️', kind: 'remittance', day: 18, amount: 22_000, uncertain: { delayDays: 3, probability: 0.3 } },
  ],
  trust: { landlord: 3, family: 4, friends: 3 },
  privacy: 100,
  stress: 25,
  hasFormalCredit: false,
}

export const ARCHETYPES: Record<string, Profile> = { remittance: SITA, gig: BIKASH, salaried: AARAV, student: STUDENT, trader: TRADER, seasonal: SEASONAL, mixed: MIXED }
