/**
 * The playable characters of the scam-awareness game. Their attributes are fixed (story,
 * role, pay, look, the personal details the scam messages use); their NAME is the player's
 * choice, defaulting to the original cast's name. All details are fictional.
 * Their pay depends on the chosen currency: see content/economy.ts.
 */
export type CharacterId = 'sita' | 'bikash' | 'aarav'

export interface Character {
  id: CharacterId
  nameKey: string
  emoji: string
  storyKey: string
  /** Job title, a badge for the portrait, how often they are paid, and the scams that often target people like them. */
  roleKey: string
  badgeKey: string
  freqKey: string
  focusKey: string
  /** Sprite colours for the walking character. */
  /** How they look walking around town (src/ui/pixel/people.ts paints the pixel templates with it). */
  look: { shirt: string; trim: string; braid: boolean; style: 'short' | 'long' | 'cap' | 'bun'; top: 'shirt' | 'kurta'; hair: string; skin: string; pants: string }
  /** i18n keys for details the scammers "know" or use. */
  persona: { parcel: string; job: string; relative: string; card: string; item: string }
}

export const CHARACTERS: Character[] = [
  {
    id: 'sita',
    nameKey: 'profile.sita',
    emoji: '👩🏽',
    storyKey: 'char.sita.story',
    roleKey: 'char.sita.role',
    badgeKey: 'char.sita.badge',
    freqKey: 'char.sita.freq',
    focusKey: 'char.sita.focus',
    look: { shirt: '#d9734e', trim: '#f5c26b', braid: true, style: 'long', top: 'kurta', hair: '#2a1d1a', skin: '#c98a5a', pants: '#5b4b6b' },
    persona: { parcel: 'char.sita.parcel', job: 'char.sita.job', relative: 'persona.sitaPartner', card: '4821', item: 'char.sita.item' },
  },
  {
    id: 'bikash',
    nameKey: 'profile.bikash',
    emoji: '🧑🏽',
    storyKey: 'char.bikash.story',
    roleKey: 'char.bikash.role',
    badgeKey: 'char.bikash.badge',
    freqKey: 'char.bikash.freq',
    focusKey: 'char.bikash.focus',
    look: { shirt: '#3f7fa6', trim: '#e0a93b', braid: false, style: 'cap', top: 'shirt', hair: '#3a2418', skin: '#b07850', pants: '#4a3a2a' },
    persona: { parcel: 'char.bikash.parcel', job: 'char.bikash.job', relative: 'char.bikash.relative', card: '7730', item: 'char.bikash.item' },
  },
  {
    id: 'aarav',
    nameKey: 'profile.aarav',
    emoji: '👨🏽',
    storyKey: 'char.aarav.story',
    roleKey: 'char.aarav.role',
    badgeKey: 'char.aarav.badge',
    freqKey: 'char.aarav.freq',
    focusKey: 'char.aarav.focus',
    look: { shirt: '#5fae5f', trim: '#fbf4e2', braid: false, style: 'short', top: 'shirt', hair: '#1e1a1f', skin: '#d8a07a', pants: '#2b4566' },
    persona: { parcel: 'char.aarav.parcel', job: 'char.aarav.job', relative: 'char.aarav.relative', card: '1956', item: 'char.aarav.item' },
  },
]

export const CHARACTERS_BY_ID: Record<CharacterId, Character> = Object.fromEntries(CHARACTERS.map((c) => [c.id, c])) as Record<CharacterId, Character>

/** The longest name the cards and messages have room for. */
export const NAME_MAX = 14

/** Keep a typed name short and printable: letters (any script), numbers, spaces, - ' / and . */
export function cleanName(raw: string): string {
  return raw
    .normalize('NFC')
    .replace(/[^\p{L}\p{M}\p{N} '\-/.]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX)
}
