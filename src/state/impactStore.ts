/** Impact Lab: anonymous tester sessions stored only on this device. */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ImpactSession {
  id: string
  startedAt: string
  pre: number[]
  post?: number[]
  foundHiddenShortfall?: boolean
  wouldSend?: boolean
  askCopied?: boolean
  finishedAt?: string
}

interface ImpactState {
  sessions: ImpactSession[]
  activeId: string | null
  start: (pre: number[]) => void
  finish: (post: number[], foundHiddenShortfall: boolean, wouldSend: boolean) => void
  noteAskCopied: () => void
  abandon: () => void
  clear: () => void
}

export const useImpact = create<ImpactState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeId: null,
      start: (pre) => {
        const id = `s${Date.now().toString(36)}`
        set((s) => ({ sessions: [...s.sessions, { id, startedAt: new Date().toISOString(), pre }], activeId: id }))
      },
      finish: (post, foundHiddenShortfall, wouldSend) => {
        const id = get().activeId
        if (!id) return
        set((s) => ({
          sessions: s.sessions.map((x) => (x.id === id ? { ...x, post, foundHiddenShortfall, wouldSend, finishedAt: new Date().toISOString() } : x)),
          activeId: null,
        }))
      },
      noteAskCopied: () => {
        const id = get().activeId
        if (!id) return
        set((s) => ({ sessions: s.sessions.map((x) => (x.id === id ? { ...x, askCopied: true } : x)) }))
      },
      abandon: () => set({ activeId: null }),
      clear: () => set({ sessions: [], activeId: null }),
    }),
    { name: 'next-payday-impact-v1' },
  ),
)

export interface ImpactSummary {
  testers: number
  finished: number
  avgPre: number
  avgPost: number
  hiddenFound: number
  wouldSend: number
}

export function summarise(sessions: ImpactSession[]): ImpactSummary {
  const done = sessions.filter((s) => s.post)
  const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0)
  return {
    testers: sessions.length,
    finished: done.length,
    avgPre: avg(done.map((s) => s.pre.reduce((a, b) => a + b, 0))),
    avgPost: avg(done.map((s) => (s.post ?? []).reduce((a, b) => a + b, 0))),
    hiddenFound: done.filter((s) => s.foundHiddenShortfall).length,
    wouldSend: done.filter((s) => s.wouldSend).length,
  }
}
