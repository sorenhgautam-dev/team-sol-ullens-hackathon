import { useEffect, useRef, useState } from 'react'
import type { RealInputs } from '@/engine/shiftFinder'
import type { ShiftFinderRequest, ShiftFinderResponse } from '@/engine/shiftFinder.worker'

let worker: Worker | null = null
let reqId = 0
const listeners = new Map<number, (r: ShiftFinderResponse) => void>()

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null
  if (!worker) {
    worker = new Worker(new URL('../engine/shiftFinder.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<ShiftFinderResponse>) => {
      listeners.get(e.data.id)?.(e.data)
      listeners.delete(e.data.id)
    }
  }
  return worker
}

/** Runs the Shift Finder in a Web Worker; results arrive well under a second. */
export function useShiftFinder(inputs: RealInputs, excluded: string[], enabled: boolean) {
  const [response, setResponse] = useState<ShiftFinderResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const latest = useRef(0)
  const key = JSON.stringify({ inputs, excluded })
  useEffect(() => {
    if (!enabled) return
    const w = getWorker()
    if (!w) return
    const id = ++reqId
    latest.current = id
    setLoading(true)
    const timer = setTimeout(() => {
      listeners.set(id, (r) => {
        if (latest.current === id) {
          setResponse(r)
          setLoading(false)
        }
      })
      const req: ShiftFinderRequest = { id, inputs, options: { excludeBillIds: excluded, max: 3 } }
      w.postMessage(req)
    }, 150)
    return () => {
      clearTimeout(timer)
      listeners.delete(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled])
  return { response, loading }
}
