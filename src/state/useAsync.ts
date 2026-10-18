import { useCallback, useEffect, useRef, useState } from 'react'

export type AsyncState<T> =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'ready'; data: T; error?: undefined }
  | { status: 'error'; data?: undefined; error: unknown }

/**
 * The one data-fetching pattern. Every screen that loads data uses it, so
 * loading, error and retry behave the same everywhere.
 */
export function useAsync<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })
  const run = useRef(0)
  const loader = useRef(load)
  loader.current = load

  const reload = useCallback(() => {
    const id = ++run.current
    setState({ status: 'loading' })
    loader.current().then(
      (data) => id === run.current && setState({ status: 'ready', data }),
      (error: unknown) => id === run.current && setState({ status: 'error', error }),
    )
  }, [])

  useEffect(() => {
    reload()
    return () => {
      run.current++
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  /** Replace the data without a loading flash (used by realtime updates). */
  const patch = useCallback((update: (prev: T) => T) => {
    setState((s) => (s.status === 'ready' ? { status: 'ready', data: update(s.data) } : s))
  }, [])

  return { ...state, reload, patch }
}
