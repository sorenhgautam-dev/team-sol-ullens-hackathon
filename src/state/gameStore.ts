/**
 * UI state only (Zustand). Money is never computed here: screens derive ledgers from
 * the decision log through the engine (see hooks.ts).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import type { DecisionLog, PlayerAction, ScamResponse } from '@/engine/types'
import { lived } from '@/engine/forecast'
import { simulate } from '@/engine/simulate'
import { DEMO_SCENARIO, DEMO_SEED } from '@/content/scenario'
import { PROFILES, SITA } from '@/content/profiles'
import type { Currency } from '@/i18n/currency'
import { ENERGY_PER_DAY, energyCost, spendEnergy, type EnergyKind } from './energy'
import { setHapticsEnabled, setSoundEnabled } from '@/audio/sfx'

export type Screen = 'title' | 'twin' | 'profile' | 'life' | 'results' | 'rewind' | 'capability' | 'codex' | 'settings' | 'debug' | 'fixDates' | 'impact' | 'impactPre' | 'impactPost' | 'town'
export type Tab = 'home' | 'money' | 'people' | 'phone' | 'moves'
export type SheetKind = 'gapBridge' | 'calendar' | 'mailbox' | 'moneyTrail' | 'ledger' | 'why' | 'goodnight' | 'event' | 'scam' | 'codexEntry' | null

export interface Settings {
  sound: boolean
  haptics: boolean
  reducedMotion: boolean
  currency: Currency
  demoMode: boolean
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never
/** A player action without the id/day the store assigns. */
export type ActionInput = DistributiveOmit<PlayerAction, 'id' | 'day'>

export interface Toast {
  id: number
  text: string
  tone: 'neutral' | 'good' | 'bad'
}

export interface ActionResult {
  ok: boolean
  id: string
  reasonKey?: string
}

interface GameState {
  screen: Screen
  settings: Settings
  seenIntro: boolean
  profileId: string
  seed: number
  day: number
  decisions: DecisionLog
  energy: number
  tab: Tab
  sheet: SheetKind
  sheetPayload: string | null
  hubCollapsed: boolean
  readMail: string[]
  readPhone: string[]
  monthsPlayed: number
  nextId: number
  toasts: Toast[]
  monthOver: boolean

  go: (screen: Screen) => void
  setSettings: (patch: Partial<Settings>) => void
  startMonth: (profileId: string, seed?: number) => void
  nextMonth: () => void
  setTab: (tab: Tab) => void
  openSheet: (kind: SheetKind, payload?: string | null) => void
  closeSheet: () => void
  toggleHub: () => void
  logAction: (action: ActionInput, energyKind?: EnergyKind) => ActionResult
  decideEvent: (eventId: string, choiceId: string) => void
  respondScam: (scamId: string, response: ScamResponse, tellsSpotted: number) => void
  requestNextDay: () => void
  nextDay: () => void
  skipToNextEvent: () => void
  openPending: () => boolean
  markMailRead: (id: string) => void
  markPhoneRead: (id: string) => void
  toast: (text: string, tone?: Toast['tone']) => void
  dismissToast: (id: number) => void
  resetAll: () => void
}

const defaultSettings: Settings = { sound: true, haptics: true, reducedMotion: false, currency: 'NPR', demoMode: false }

function profileOf(id: string) {
  return PROFILES[id] ?? SITA
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      screen: 'title',
      settings: defaultSettings,
      seenIntro: false,
      profileId: 'sita',
      seed: DEMO_SEED,
      day: 1,
      decisions: [],
      energy: ENERGY_PER_DAY,
      tab: 'home',
      sheet: null,
      sheetPayload: null,
      hubCollapsed: false,
      readMail: [],
      readPhone: [],
      monthsPlayed: 0,
      nextId: 1,
      toasts: [],
      monthOver: false,

      go: (screen) => {
        set({ screen })
        if (screen === 'life') setTimeout(() => get().openPending(), 350)
      },

      setSettings: (patch) => {
        const settings = { ...get().settings, ...patch }
        setSoundEnabled(settings.sound)
        setHapticsEnabled(settings.haptics)
        set({ settings })
      },

      startMonth: (profileId, seed) => {
        const s = get()
        const newSeed = seed ?? (s.settings.demoMode ? DEMO_SEED : DEMO_SEED + s.monthsPlayed * 7)
        set({
          profileId,
          seed: newSeed,
          day: 1,
          decisions: [],
          energy: ENERGY_PER_DAY,
          tab: 'home',
          sheet: null,
          sheetPayload: null,
          readMail: [],
          readPhone: [],
          monthOver: false,
          screen: 'life',
          seenIntro: true,
        })
        // Day 1 may already hold a pending encounter.
        setTimeout(() => get().openPending(), 400)
      },

      nextMonth: () => {
        const s = get()
        set({ monthsPlayed: s.monthsPlayed + 1 })
        get().startMonth(s.profileId, s.settings.demoMode ? DEMO_SEED : s.seed + 13)
      },

      setTab: (tab) => set({ tab }),
      openSheet: (kind, payload = null) => set({ sheet: kind, sheetPayload: payload }),
      closeSheet: () => set({ sheet: null, sheetPayload: null }),
      toggleHub: () => set((s) => ({ hubCollapsed: !s.hubCollapsed })),

      logAction: (action, energyKind) => {
        const s = get()
        const cost = energyKind ? energyCost(energyKind) : 0
        const spent = spendEnergy(s.energy, cost)
        const id = `a${s.nextId}`
        if (!spent.ok) return { ok: false, id, reasonKey: 'blocked.noEnergy' }
        const full = { ...action, id, day: s.day } as PlayerAction
        const decisions = [...s.decisions, full]
        // Ask the engine whether the action applies; refund energy if it is blocked.
        const ledger = lived(DEMO_SCENARIO, profileOf(s.profileId), decisions, s.seed, s.day)
        const outcome = ledger.actionOutcomes.find((o) => o.actionId === id)
        const blocked = outcome?.status === 'blocked'
        set({ decisions, nextId: s.nextId + 1, energy: blocked ? s.energy : spent.energy })
        return blocked ? { ok: false, id, reasonKey: outcome?.reasonKey } : { ok: true, id }
      },

      decideEvent: (eventId, choiceId) => {
        get().logAction({ type: 'eventChoice', eventId, choiceId })
        set({ sheet: null, sheetPayload: null })
        setTimeout(() => get().openPending(), 350)
      },

      respondScam: (scamId, response, tellsSpotted) => {
        get().logAction({ type: 'scamResponse', scamId, response, tellsSpotted }, response)
      },

      /** Opens the first undecided event or pending scam of the current day. Returns true if something opened. */
      openPending: () => {
        const s = get()
        const ledger = lived(DEMO_SCENARIO, profileOf(s.profileId), s.decisions, s.seed, s.day)
        const today = ledger.days[s.day - 1]
        const decidedEvents = new Set(s.decisions.filter((a) => a.type === 'eventChoice').map((a) => (a.type === 'eventChoice' ? a.eventId : '')))
        const event = DEMO_SCENARIO.events.find((e) => e.day === s.day && !decidedEvents.has(e.id))
        if (event) {
          set({ sheet: 'event', sheetPayload: event.id })
          return true
        }
        const scam = today?.scams.find((x) => x.outcome === 'pending')
        if (scam) {
          set({ sheet: 'scam', sheetPayload: scam.scamId, tab: s.tab })
          return true
        }
        return false
      },

      requestNextDay: () => {
        const s = get()
        if (get().openPending()) return
        const ledger = lived(DEMO_SCENARIO, profileOf(s.profileId), s.decisions, s.seed, s.day)
        const today = ledger.days[s.day - 1]
        const busy = (today?.entries.length ?? 0) > 0 || s.decisions.some((a) => a.day === s.day && a.type !== 'forecastViewed')
        if (busy && !s.settings.demoMode) set({ sheet: 'goodnight', sheetPayload: null })
        else get().nextDay()
      },

      nextDay: () => {
        const s = get()
        if (s.day >= DEMO_SCENARIO.days) {
          set({ sheet: null, sheetPayload: null, monthOver: true, screen: 'results' })
          return
        }
        set({ day: s.day + 1, energy: ENERGY_PER_DAY, sheet: null, sheetPayload: null, tab: 'home' })
        setTimeout(() => get().openPending(), 450)
      },

      /** Long-press: advance until a day with an event or a scam, or the month ends. */
      skipToNextEvent: () => {
        const s = get()
        if (get().openPending()) return
        const full = simulate(DEMO_SCENARIO, profileOf(s.profileId), s.decisions, s.seed)
        let target = DEMO_SCENARIO.days
        for (const d of full.days) {
          if (d.day > s.day && (d.events.length > 0 || d.scams.length > 0)) {
            target = d.day
            break
          }
        }
        set({ day: target, energy: ENERGY_PER_DAY, sheet: null, sheetPayload: null, tab: 'home' })
        setTimeout(() => get().openPending(), 450)
      },

      markMailRead: (id) => set((s) => (s.readMail.includes(id) ? s : { readMail: [...s.readMail, id] })),
      markPhoneRead: (id) => set((s) => (s.readPhone.includes(id) ? s : { readPhone: [...s.readPhone, id] })),

      toast: (text, tone = 'neutral') => {
        const id = Date.now() + Math.floor(Math.random() * 1000) // UI-only id, never used by engines
        set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, tone }] }))
        setTimeout(() => get().dismissToast(id), 2600)
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      resetAll: () => {
        set({
          screen: 'title',
          settings: defaultSettings,
          seenIntro: false,
          profileId: 'sita',
          seed: DEMO_SEED,
          day: 1,
          decisions: [],
          energy: ENERGY_PER_DAY,
          tab: 'home',
          sheet: null,
          sheetPayload: null,
          hubCollapsed: false,
          readMail: [],
          readPhone: [],
          monthsPlayed: 0,
          nextId: 1,
          toasts: [],
          monthOver: false,
        })
      },
    }),
    {
      name: 'next-payday-v1',
      partialize: (s) => ({
        settings: s.settings,
        seenIntro: s.seenIntro,
        profileId: s.profileId,
        seed: s.seed,
        day: s.day,
        decisions: s.decisions,
        energy: s.energy,
        readMail: s.readMail,
        readPhone: s.readPhone,
        monthsPlayed: s.monthsPlayed,
        nextId: s.nextId,
        monthOver: s.monthOver,
        hubCollapsed: s.hubCollapsed,
      }),
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
