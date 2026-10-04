/** Personal details the messages use, for the chosen character (all fictional). The name is the player's choice. */
import { useMemo } from 'react'
import { useScam } from '@/state/scamStore'
import { CHARACTERS_BY_ID, cleanName, type CharacterId } from '@/content/characters'
import { t } from '@/i18n'

/** The name shown for a character: the player's own name if they set one, else the default. */
export function useCharacterName(id: CharacterId): string {
  const custom = useScam((s) => s.names[id])
  return cleanName(custom ?? '') || t(CHARACTERS_BY_ID[id].nameKey)
}

export function usePersonaParams(): Record<string, string | number> {
  const id = useScam((s) => s.characterId)
  const name = useCharacterName(id)
  return useMemo(() => {
    const c = CHARACTERS_BY_ID[id]
    return { name, card: c.persona.card, parcel: t(c.persona.parcel), job: t(c.persona.job), relative: t(c.persona.relative), item: t(c.persona.item) }
  }, [id, name])
}
