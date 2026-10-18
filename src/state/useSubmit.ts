import { useCallback, useRef, useState } from 'react'

/** Tracks one submit at a time: idle, busy or failed. Returns true on success. */
export function useSubmit() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const alive = useRef(true)
  alive.current = true

  const run = useCallback(async (action: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true)
    setError(null)
    try {
      await action()
      return true
    } catch (e) {
      if (alive.current) setError(e)
      return false
    } finally {
      if (alive.current) setBusy(false)
    }
  }, [])

  const reset = useCallback(() => setError(null), [])
  return { busy, error, run, reset }
}
