/**
 * App state (Zustand): which screen is showing, the player's settings, and toasts.
 * The scam run itself (character, answers, paydays) lives in scamStore.ts.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import type { Currency } from '@/i18n/currency'
import { setHapticsEnabled, setSoundEnabled } from '@/audio/sfx'

export type Screen = 'title' | 'settings' | 'pick' | 'town' | 'results'

export interface Settings {
  sound: boolean
  haptics: boolean
  reducedMotion: boolean
  currency: Currency
  demoMode: boolean
}

export interface Toast {
  id: number
  text: string
  tone: 'neutral' | 'good' | 'bad'
}

interface GameState {
  screen: Screen
  settings: Settings
  toasts: Toast[]
  go: (screen: Screen) => void
  setSettings: (patch: Partial<Settings>) => void
  toast: (text: string, tone?: Toast['tone']) => void
  dismissToast: (id: number) => void
  resetAll: () => void
}

const defaultSettings: Settings = { sound: true, haptics: true, reducedMotion: false, currency: 'USD', demoMode: false }

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      screen: 'title',
      settings: defaultSettings,
      toasts: [],

      go: (screen) => set({ screen }),

      setSettings: (patch) => {
        const settings = { ...get().settings, ...patch }
        setSoundEnabled(settings.sound)
        setHapticsEnabled(settings.haptics)
        set({ settings })
      },

      toast: (text, tone = 'neutral') => {
        const id = Date.now() + Math.floor(Math.random() * 1000) // UI-only id
        set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, tone }] }))
        setTimeout(() => get().dismissToast(id), 2600)
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      resetAll: () => {
        set({ screen: 'title', settings: defaultSettings, toasts: [] })
        setSoundEnabled(true)
        setHapticsEnabled(true)
      },
    }),
    {
      name: 'scam-town-settings',
      partialize: (s) => ({ settings: s.settings }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          setSoundEnabled(state.settings.sound)
          setHapticsEnabled(state.settings.haptics)
        }
      },
    },
  ),
)

/** Select several fields at once without re-rendering on every store change (Zustand v5 needs shallow equality for object selectors). */
export function useGameShallow<T>(selector: (s: GameState) => T): T {
  return useGame(useShallow(selector))
}
