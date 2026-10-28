import { useSyncExternalStore } from 'react'

// Client-side settings. These never go to the server (wire `media.download-policy`).

export type MediaPolicy = 'auto' | 'wifi' | 'manual'
export type Connection = 'wifi' | 'cellular'

const POLICY_KEY = 'te.media.policy'
const CONNECTION_KEY = 'te.connection'
const CACHE_KEY = 'te.media.cache'

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

function read<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    if (v && (allowed as readonly string[]).includes(v)) return v as T
  } catch {
    // storage blocked
  }
  return fallback
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // the setting lasts for this page only
  }
}

let policy: MediaPolicy = read(POLICY_KEY, ['auto', 'wifi', 'manual'], 'wifi')
// The browser cannot tell Wi-Fi from mobile data reliably, so reviewers switch it by hand.
let connection: Connection = read(CONNECTION_KEY, ['wifi', 'cellular'], 'wifi')

function readCache(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(CACHE_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}
let cache = readCache()
let cacheVersion = 0

export const settings = {
  policy: () => policy,
  connection: () => connection,
  setPolicy(next: MediaPolicy) {
    policy = next
    write(POLICY_KEY, next)
    emit()
  },
  setConnection(next: Connection) {
    connection = next
    write(CONNECTION_KEY, next)
    emit()
  },
  /** DAT-03: media that was opened or downloaded stays on the device. */
  isCached: (id: string) => cache.has(id),
  cacheMedia(id: string) {
    if (cache.has(id)) return
    cache = new Set(cache).add(id)
    cacheVersion++
    write(CACHE_KEY, JSON.stringify([...cache].slice(-500)))
    emit()
  },
  clearCache() {
    cache = new Set()
    cacheVersion++
    write(CACHE_KEY, '[]')
    emit()
  },
}

export const useMediaPolicy = () => useSyncExternalStore(subscribe, settings.policy)
export const useConnection = () => useSyncExternalStore(subscribe, settings.connection)
/** Re-renders when the cached set changes; read `settings.isCached(id)` with it. */
export const useCacheVersion = () => useSyncExternalStore(subscribe, () => cacheVersion)
