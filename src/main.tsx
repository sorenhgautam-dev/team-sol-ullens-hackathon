import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'
import { useGame } from './state/gameStore'
import { useUpdate } from './state/pwa'

// Exposed for demo scripting and QA automation (no network, no secrets).
;(window as unknown as { scamTown: typeof useGame }).scamTown = useGame

// Never reload in the middle of a payday: an update waits until the player chooses to apply it from the title screen.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh: () => useUpdate.setState({ ready: true, apply: () => void updateSW(true) }),
  onOfflineReady: () => useUpdate.setState({ offlineReady: true }),
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
