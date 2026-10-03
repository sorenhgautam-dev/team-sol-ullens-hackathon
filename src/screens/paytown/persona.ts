/** Personal details the messages use, for the chosen character (all fictional). */
import { useMemo } from 'react'
import { useScam } from '@/state/scamStore'
import { CHARACTERS_BY_ID } from '@/content/characters'
import { t } from '@/i18n'

export function usePersonaParams(): Record<string, string | number> {
  const id = useScam((s) => s.characterId)
  return useMemo(() => {
    const c = CHARACTERS_BY_ID[id]
    return { name: t(c.nameKey), card: c.persona.card, parcel: t(c.persona.parcel), job: t(c.persona.job), relative: t(c.persona.relative), item: t(c.persona.item) }
  }, [id])
}
