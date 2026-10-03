/** Install prompt handling for the PWA ("an actual app you can download"). */
import { create } from 'zustand'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallState {
  deferred: BeforeInstallPromptEvent | null
  installed: boolean
  isIos: boolean
  isStandalone: boolean
  install: () => Promise<void>
}

const isIos = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)
const isStandalone =
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true)

export const useInstall = create<InstallState>((set, get) => ({
  deferred: null,
  installed: isStandalone,
  isIos,
  isStandalone,
  install: async () => {
    const d = get().deferred
    if (!d) return
    await d.prompt()
    const choice = await d.userChoice
    if (choice.outcome === 'accepted') set({ installed: true, deferred: null })
  },
}))

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    useInstall.setState({ deferred: e as BeforeInstallPromptEvent })
  })
  window.addEventListener('appinstalled', () => useInstall.setState({ installed: true, deferred: null }))
}

/** Service-worker update state: applied only when the player taps it on the title screen. */
export const useUpdate = create<{ ready: boolean; offlineReady: boolean; apply: () => void }>(() => ({ ready: false, offlineReady: false, apply: () => {} }))
