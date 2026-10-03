/**
 * One run through Payday Town. UI state only: the balance and score are always
 * computed by the engine (engine/scamTown.ts) from these answers.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CharacterId } from '@/content/characters'
import type { Answer } from '@/engine/scamTown'

interface ScamState {
  characterId: CharacterId
  seed: number
  /** Every answer given, in order; the engine counts only the first per encounter. */
  answers: Answer[]
  /** How many times each encounter has been shown (for shuffling and practice). */
  attempts: Record<string, number>
  /** Real messages handled: message id -> choice id. */
  real: Record<string, string>
  start: (characterId: CharacterId, seed: number) => void
  answer: (a: Answer) => void
  shown: (encounterId: string) => number
  handleReal: (id: string, choiceId: string) => void
}

export const useScam = create<ScamState>()(
  persist(
    (set, get) => ({
      characterId: 'sita',
      seed: 1,
      answers: [],
      attempts: {},
      real: {},
      start: (characterId, seed) => set({ characterId, seed, answers: [], attempts: {}, real: {} }),
      answer: (a) => set((s) => ({ answers: [...s.answers, a] })),
      shown: (encounterId) => {
        const n = get().attempts[encounterId] ?? 0
        set((s) => ({ attempts: { ...s.attempts, [encounterId]: n + 1 } }))
        return n
      },
      handleReal: (id, choiceId) => set((s) => (s.real[id] ? s : { real: { ...s.real, [id]: choiceId } })),
    }),
    { name: 'next-payday-scamtown-v1' },
  ),
)
