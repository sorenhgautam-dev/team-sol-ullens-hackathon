import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'
import { useGame } from './state/gameStore'

// Exposed for demo scripting and QA automation (no network, no secrets).
;(window as unknown as { nextPayday: typeof useGame }).nextPayday = useGame

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
