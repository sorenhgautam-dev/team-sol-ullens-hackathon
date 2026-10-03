/** The encounters with the player's chosen currency and character: real local amounts, no conversion. */
import { useMemo } from 'react'
import { useGame } from '@/state/gameStore'
import { useScam } from '@/state/scamStore'
import { localEncounters } from '@/content/scamTown'
import { paydayFor } from '@/content/economy'

export function useEncounters() {
  const currency = useGame((s) => s.settings.currency)
  const characterId = useScam((s) => s.characterId)
  return useMemo(() => ({ encounters: localEncounters(currency, characterId), payday: paydayFor(currency, characterId) }), [currency, characterId])
}
