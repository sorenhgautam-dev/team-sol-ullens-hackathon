/**
 * One run through Scam Town. UI state only: the balance and score are always
 * computed by the engine (engine/scamTown.ts) from these answers.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CharacterId } from '@/content/characters'
import type { Answer } from '@/engine/scamTown'

interface ScamState {
  characterId: CharacterId
  seed: number
  /** The gauntlet loop: which payday this is (1, 2, 3, ...). */
  round: number
  /** Every answer given, in order; the engine counts only the first per encounter. */
  answers: Answer[]
  /** How many times each encounter has been shown (for shuffling and practice). */
  attempts: Record<string, number>
  /** The player's own names for the characters (empty = the default name). */
  names: Partial<Record<CharacterId, string>>
  /** Real messages handled: `${round}:${id}` -> choice id. */
  real: Record<string, string>
  start: (characterId: CharacterId, seed: number) => void
  /** Next payday: pay lands again and a new set of buildings glows. */
  nextRound: () => void
  answer: (a: Answer) => void
  shown: (encounterId: string) => number
  handleReal: (id: string, choiceId: string) => void
  setName: (id: CharacterId, name: string) => void
}

export const useScam = create<ScamState>()(
  persist(
    (set, get) => ({
      characterId: 'sita',
      seed: 1,
      round: 1,
      answers: [],
      attempts: {},
      real: {},
      names: {},
      start: (characterId, seed) => set({ characterId, seed, round: 1, answers: [], attempts: {}, real: {} }),
      nextRound: () => set((s) => ({ round: s.round + 1, attempts: {} })),
      answer: (a) => set((s) => ({ answers: [...s.answers, a] })),
      shown: (encounterId) => {
        const n = get().attempts[encounterId] ?? 0
        set((s) => ({ attempts: { ...s.attempts, [encounterId]: n + 1 } }))
        return n
      },
      setName: (id, name) => set((s) => ({ names: { ...s.names, [id]: name } })),
      handleReal: (id, choiceId) => set((s) => (s.real[id] ? s : { real: { ...s.real, [id]: choiceId } })),
    }),
    { name: 'next-payday-scamtown-v1' },
  ),
)
