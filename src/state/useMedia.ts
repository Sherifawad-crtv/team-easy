import { useSyncExternalStore } from 'react'

const has = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'

/** True while a CSS media query matches, e.g. `useMedia('(max-width: 1023.98px)')`. False where the browser can't tell. */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      if (!has()) return () => undefined
      const m = window.matchMedia(query)
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => (has() ? window.matchMedia(query).matches : false),
    () => false,
  )
}
