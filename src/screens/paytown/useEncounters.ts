/**
 * The encounters for the player's currency and character (real local amounts, no conversion),
 * and the ones glowing on this payday of the gauntlet loop.
 */
import { useMemo } from 'react'
import { useGame } from '@/state/gameStore'
import { useScam } from '@/state/scamStore'
import { FIRST_PAYDAY, SECOND_PAYDAY, localEncounters } from '@/content/scamTown'
import { paydayFor } from '@/content/economy'
import { roundIds } from '@/engine/scamTown'

export function useEncounters() {
  const currency = useGame((s) => s.settings.currency)
  const { characterId, round, seed } = useScam()
  return useMemo(() => {
    const encounters = localEncounters(currency, characterId)
    const ids = roundIds(round, FIRST_PAYDAY, SECOND_PAYDAY, seed)
    const thisRound = ids.map((id) => encounters.find((e) => e.id === id)!).filter(Boolean)
    return { encounters, thisRound, round, payday: paydayFor(currency, characterId) }
  }, [currency, characterId, round, seed])
}
