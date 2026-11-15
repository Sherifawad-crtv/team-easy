import { useEffect, useState } from 'react'

/** Keeps showing the last value for `ms` after it goes away, so a screen can finish sliding out. */
export function useKept<T>(value: T | undefined, ms: number): T | undefined {
  const [kept, setKept] = useState(value)
  useEffect(() => {
    if (value !== undefined) {
      setKept(value)
      return
    }
    if (ms <= 0) {
      setKept(undefined)
      return
    }
    const t = window.setTimeout(() => setKept(undefined), ms)
    return () => window.clearTimeout(t)
  }, [value, ms])
  return value ?? (ms > 0 ? kept : undefined)
}
