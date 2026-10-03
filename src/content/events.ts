import type { EventDef } from '@/engine/types'

/** Section 4.2 fixed-trigger events. All text lives in i18n; these are keys. */
export const DEMO_EVENTS: EventDef[] = [
  {
    id: 'phone-upgrade',
    type: 'tradeoff',
    emoji: '📱',
    titleKey: 'event.phoneUpgrade.title',
    textKey: 'event.phoneUpgrade.text',
    day: 3,
    foreseeable: false,
    defaultChoiceId: 'decline',
    choices: [
      {
        id: 'instalments',
        labelKey: 'event.phoneUpgrade.instalments',
        effects: [{ kind: 'recurring', amount: 1_500, months: 12, firstDay: 3, labelKey: 'obligation.phoneInstalment', emoji: '📱' }, { kind: 'flag', flag: 'instalments' }],
        lessonKey: 'lesson.instalmentsTotal',
      },
      { id: 'decline', labelKey: 'event.phoneUpgrade.decline', effects: [], lessonKey: 'lesson.oldPhoneWorks' },
      { id: 'askTerms', labelKey: 'event.phoneUpgrade.askTerms', effects: [], signals: ['askedForInfo'], lessonKey: 'lesson.askTotalCost' },
    ],
  },
  {
    id: 'bike-repair',
    type: 'uncontrollable',
    emoji: '🛵',
    titleKey: 'event.bikeRepair.title',
    textKey: 'event.bikeRepair.text',
    day: 9,
    foreseeable: false,
    defaultChoiceId: 'repair',
    choices: [
      { id: 'repair', labelKey: 'event.bikeRepair.repair', effects: [{ kind: 'spend', amount: 3_500, labelKey: 'spend.bikeRepair', emoji: '🔧' }] },
      {
        id: 'replace',
        labelKey: 'event.bikeRepair.replace',
        effects: [{ kind: 'spend', amount: 9_000, labelKey: 'spend.bikeReplace', emoji: '🛵' }, { kind: 'stress', delta: -5 }],
      },
      {
        id: 'bus',
        labelKey: 'event.bikeRepair.bus',
        effects: [{ kind: 'spend', amount: 600, labelKey: 'spend.busFares', emoji: '🚌' }, { kind: 'stress', delta: 10 }],
        lessonKey: 'lesson.busBuysTime',
      },
    ],
  },
  {
    id: 'sell-phone',
    type: 'fair',
    emoji: '🤝',
    titleKey: 'event.sellPhone.title',
    textKey: 'event.sellPhone.text',
    day: 11,
    foreseeable: false,
    defaultChoiceId: 'fair',
    choices: [
      {
        id: 'fair',
        labelKey: 'event.sellPhone.fair',
        effects: [{ kind: 'receive', amount: 4_000, labelKey: 'receive.phoneSale', emoji: '📱' }, { kind: 'trust', who: 'friends', delta: 1 }],
        signals: ['fairPrice'],
        lessonKey: 'lesson.fairDeal',
      },
      {
        id: 'overcharge',
        labelKey: 'event.sellPhone.overcharge',
        effects: [{ kind: 'receive', amount: 7_000, labelKey: 'receive.phoneSale', emoji: '📱' }, { kind: 'trust', who: 'friends', delta: -1 }, { kind: 'flag', flag: 'overcharged' }],
        lessonKey: 'lesson.overchargeComesBack',
      },
      { id: 'keep', labelKey: 'event.sellPhone.keep', effects: [] },
    ],
  },
  {
    id: 'wedding-gift',
    type: 'social',
    emoji: '💍',
    titleKey: 'event.wedding.title',
    textKey: 'event.wedding.text',
    day: 13,
    foreseeable: true,
    defaultChoiceId: 'gift',
    choices: [
      { id: 'gift', labelKey: 'event.wedding.gift', effects: [{ kind: 'spend', amount: 2_000, labelKey: 'spend.weddingGift', emoji: '🎁' }, { kind: 'trust', who: 'friends', delta: 1 }] },
      {
        id: 'smallGift',
        labelKey: 'event.wedding.smallGift',
        effects: [{ kind: 'spend', amount: 500, labelKey: 'spend.weddingGift', emoji: '🎁' }],
        lessonKey: 'lesson.presenceOverPrice',
      },
      { id: 'skip', labelKey: 'event.wedding.skip', effects: [{ kind: 'trust', who: 'friends', delta: -1 }, { kind: 'stress', delta: 5 }] },
    ],
  },
  {
    id: 'festival',
    type: 'festival',
    emoji: '🪔',
    titleKey: 'event.festival.title',
    textKey: 'event.festival.text',
    day: 25,
    foreseeable: true,
    defaultChoiceId: 'modest',
    choices: [
      { id: 'big', labelKey: 'event.festival.big', effects: [{ kind: 'spend', amount: 5_000, labelKey: 'spend.festival', emoji: '🪔' }, { kind: 'trust', who: 'family', delta: 1 }, { kind: 'stress', delta: -10 }] },
      { id: 'modest', labelKey: 'event.festival.modest', effects: [{ kind: 'spend', amount: 2_000, labelKey: 'spend.festival', emoji: '🪔' }] },
      { id: 'minimal', labelKey: 'event.festival.minimal', effects: [{ kind: 'spend', amount: 500, labelKey: 'spend.festival', emoji: '🪔' }, { kind: 'stress', delta: 5 }], lessonKey: 'lesson.festivalBudget' },
    ],
  },
]

export const EVENTS_BY_ID: Record<string, EventDef> = Object.fromEntries(DEMO_EVENTS.map((e) => [e.id, e]))
