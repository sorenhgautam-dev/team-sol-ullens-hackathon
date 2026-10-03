/** Shared React hooks. */
import { useEffect, useState } from 'react'
import { useGame } from './gameStore'

/** True when the player turned on Reduce motion, or their device asks for less motion. */
export function useReducedMotion(): boolean {
  const setting = useGame((s) => s.settings.reducedMotion)
  const [system, setSystem] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setSystem(mq.matches)
    const on = (e: MediaQueryListEvent) => setSystem(e.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return setting || system
}
