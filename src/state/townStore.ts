/** Town Mode UI state: the action history replays deterministically through the town engine. */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TownAction } from '@/engine/town'

interface TownUiState {
  seed: number
  turns: TownAction[][]
  pending: TownAction[]
  fromLife: boolean
  demoOutbreak: boolean
  selectedWard: string | null
  showReport: boolean
  start: (seed: number, opts: { fromLife?: boolean; demoOutbreak?: boolean }) => void
  queue: (a: TownAction) => void
  unqueue: (index: number) => void
  endWeek: () => void
  select: (wardId: string | null) => void
  setShowReport: (v: boolean) => void
  reset: () => void
}

export const useTown = create<TownUiState>()(
  persist(
    (set) => ({
      seed: 1,
      turns: [],
      pending: [],
      fromLife: false,
      demoOutbreak: false,
      selectedWard: null,
      showReport: false,
      start: (seed, opts) => set({ seed, turns: [], pending: [], fromLife: !!opts.fromLife, demoOutbreak: !!opts.demoOutbreak, selectedWard: null, showReport: false }),
      queue: (a) => set((s) => ({ pending: [...s.pending, a] })),
      unqueue: (i) => set((s) => ({ pending: s.pending.filter((_, j) => j !== i) })),
      endWeek: () => set((s) => ({ turns: [...s.turns, s.pending], pending: [], showReport: true, selectedWard: null })),
      select: (selectedWard) => set({ selectedWard }),
      setShowReport: (showReport) => set({ showReport }),
      reset: () => set({ turns: [], pending: [], selectedWard: null, showReport: false }),
    }),
    { name: 'next-payday-town-v1' },
  ),
)
