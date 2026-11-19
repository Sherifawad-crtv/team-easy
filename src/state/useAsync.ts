import { useCallback, useEffect, useRef, useState } from 'react'
import { scenarioStore } from '../data/mock/scenario'

export type AsyncState<T> =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'ready'; data: T; error?: undefined }
  | { status: 'error'; data?: undefined; error: unknown }

// Last good answer per screen, so coming back to a tab shows what was there at once and
// refreshes quietly (stale while revalidate), like a native app. Only screens that pass a
// `cacheKey` use it. Cleared on sign in and out; the review tools' data state is part of the key.
const cache = new Map<string, unknown>()
export const clearAsyncCache = () => cache.clear()

/**
 * The one data-fetching pattern. Every screen that loads data uses it, so
 * loading, error and retry behave the same everywhere.
 */
export function useAsync<T>(load: () => Promise<T>, deps: unknown[], cacheKey?: string) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })
  const run = useRef(0)
  const loader = useRef(load)
  loader.current = load
  const keyRef = useRef<string | undefined>(undefined)
  keyRef.current = cacheKey ? `${cacheKey}|${scenarioStore.get()}|${JSON.stringify(deps)}` : undefined

  const fetchNow = useCallback((id: number, quiet: boolean) => {
    loader.current().then(
      (data) => {
        if (keyRef.current) cache.set(keyRef.current, data)
        if (id === run.current) setState({ status: 'ready', data })
      },
      (error: unknown) => {
        // A quiet refresh that fails keeps what is on screen.
        if (id === run.current && !quiet) setState({ status: 'error', error })
      },
    )
  }, [])

  const reload = useCallback(() => {
    const id = ++run.current
    setState({ status: 'loading' })
    fetchNow(id, false)
  }, [fetchNow])

  /** Fetches again without flashing the loading state. A failure keeps what is on screen. */
  const refresh = useCallback(async () => {
    const id = ++run.current
    try {
      const data = await loader.current()
      if (keyRef.current) cache.set(keyRef.current, data)
      if (id === run.current) setState({ status: 'ready', data })
    } catch {
      // keep showing the old data
    }
  }, [])

  useEffect(() => {
    const key = keyRef.current
    if (key && cache.has(key)) {
      const id = ++run.current
      setState({ status: 'ready', data: cache.get(key) as T })
      fetchNow(id, true)
    } else {
      reload()
    }
    return () => {
      run.current++
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  /** Replace the data without a loading flash (used by realtime updates). */
  const patch = useCallback((update: (prev: T) => T) => {
    setState((s) => {
      if (s.status !== 'ready') return s
      const data = update(s.data)
      if (keyRef.current) cache.set(keyRef.current, data)
      return { status: 'ready', data }
    })
  }, [])

  return { ...state, reload, refresh, patch }
}
