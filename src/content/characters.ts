/**
 * The playable characters of the scam-awareness game. Names and art are kept from the
 * original cast; each has a short, globally relatable story and the personal details
 * that the scam messages use (so the traps feel aimed at them). All details are fictional.
 */
export type CharacterId = 'sita' | 'bikash' | 'aarav'

export interface Character {
  id: CharacterId
  nameKey: string
  emoji: string
  storyKey: string
  /** Payday in US dollars: the starting balance in town. */
  payday: number
  /** Sprite colours for the walking character. */
  look: { shirt: string; trim: string; braid: boolean }
  /** i18n keys for details the scammers "know" or use. */
  persona: { parcel: string; job: string; relative: string; card: string; item: string }
}

export const CHARACTERS: Character[] = [
  {
    id: 'sita',
    nameKey: 'profile.sita',
    emoji: '👩🏽',
    storyKey: 'char.sita.story',
    payday: 800,
    look: { shirt: '#d9734e', trim: '#f5c26b', braid: true },
    persona: { parcel: 'char.sita.parcel', job: 'char.sita.job', relative: 'persona.sitaPartner', card: '4821', item: 'char.sita.item' },
  },
  {
    id: 'bikash',
    nameKey: 'profile.bikash',
    emoji: '🧑🏽',
    storyKey: 'char.bikash.story',
    payday: 800,
    look: { shirt: '#3f7fa6', trim: '#e0a93b', braid: false },
    persona: { parcel: 'char.bikash.parcel', job: 'char.bikash.job', relative: 'char.bikash.relative', card: '7730', item: 'char.bikash.item' },
  },
  {
    id: 'aarav',
    nameKey: 'profile.aarav',
    emoji: '👨🏽',
    storyKey: 'char.aarav.story',
    payday: 1000,
    look: { shirt: '#5fae5f', trim: '#fbf4e2', braid: false },
    persona: { parcel: 'char.aarav.parcel', job: 'char.aarav.job', relative: 'char.aarav.relative', card: '1956', item: 'char.aarav.item' },
  },
]

export const CHARACTERS_BY_ID: Record<CharacterId, Character> = Object.fromEntries(CHARACTERS.map((c) => [c.id, c])) as Record<CharacterId, Character>
