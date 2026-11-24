import { useSyncExternalStore } from 'react'

// WIRE: privacy.consent
// Req: store compliance (GDPR consent, Apple App Tracking Transparency, Play ads policy) | Contract: settings.analytics / settings.personalizedAds | Mock: localStorage
// Real: keep the two consent choices with the account, start or stop the analytics and ads SDKs from them, and on iPhone record the system tracking answer (ATT) before personalized ads load
// Server must enforce: nothing is collected or personalized without the stored consent

// Client-side settings. These never go to the server (wire `media.download-policy`).

export type MediaPolicy = 'auto' | 'wifi' | 'manual'
export type Connection = 'wifi' | 'cellular'
export type TextSize = 'small' | 'default' | 'large'
export type UploadQuality = 'standard' | 'original'

const POLICY_KEY = 'te.media.policy'
const CONNECTION_KEY = 'te.connection'
const CACHE_KEY = 'te.media.cache'
const HAPTICS_KEY = 'te.haptics'
const TEXT_KEY = 'te.textsize'
const UPLOAD_KEY = 'te.upload'
const LESSDATA_KEY = 'te.calls.lessdata'
const PREVIEWS_KEY = 'te.previews'
const ANALYTICS_KEY = 'te.consent.analytics'
const ADS_KEY = 'te.consent.ads'

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
let hapticsOn = (() => {
  try {
    return localStorage.getItem(HAPTICS_KEY) !== 'off'
  } catch {
    return true
  }
})()
const flag = (key: string, fallback: boolean) => {
  try {
    const v = localStorage.getItem(key)
    return v === null ? fallback : v === 'on'
  } catch {
    return fallback
  }
}
let textSize: TextSize = read(TEXT_KEY, ['small', 'default', 'large'], 'default')
let uploadQuality: UploadQuality = read(UPLOAD_KEY, ['standard', 'original'], 'standard')
let lessData = flag(LESSDATA_KEY, false)
let previews = flag(PREVIEWS_KEY, true)
// Consent is off until the person turns it on (GDPR, App Tracking Transparency, Play ads policy).
let analytics = flag(ANALYTICS_KEY, false)
let personalizedAds = flag(ADS_KEY, false)
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
  haptics: () => hapticsOn,
  setHaptics(on: boolean) {
    hapticsOn = on
    write(HAPTICS_KEY, on ? 'on' : 'off')
    emit()
  },
  textSize: () => textSize,
  setTextSize(next: TextSize) { textSize = next; write(TEXT_KEY, next); emit() },
  uploadQuality: () => uploadQuality,
  setUploadQuality(next: UploadQuality) { uploadQuality = next; write(UPLOAD_KEY, next); emit() },
  lessData: () => lessData,
  setLessData(on: boolean) { lessData = on; write(LESSDATA_KEY, on ? 'on' : 'off'); emit() },
  previews: () => previews,
  setPreviews(on: boolean) { previews = on; write(PREVIEWS_KEY, on ? 'on' : 'off'); emit() },
  analytics: () => analytics,
  setAnalytics(on: boolean) { analytics = on; write(ANALYTICS_KEY, on ? 'on' : 'off'); emit() },
  personalizedAds: () => personalizedAds,
  setPersonalizedAds(on: boolean) { personalizedAds = on; write(ADS_KEY, on ? 'on' : 'off'); emit() },
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
export const useHaptics = () => useSyncExternalStore(subscribe, settings.haptics)
export const useConnection = () => useSyncExternalStore(subscribe, settings.connection)
/** Re-renders when the cached set changes; read `settings.isCached(id)` with it. */
export const useCacheVersion = () => useSyncExternalStore(subscribe, () => cacheVersion)
export const useTextSize = () => useSyncExternalStore(subscribe, settings.textSize)
export const useUploadQuality = () => useSyncExternalStore(subscribe, settings.uploadQuality)
export const useLessData = () => useSyncExternalStore(subscribe, settings.lessData)
export const usePreviews = () => useSyncExternalStore(subscribe, settings.previews)
export const useAnalyticsConsent = () => useSyncExternalStore(subscribe, settings.analytics)
export const usePersonalizedAds = () => useSyncExternalStore(subscribe, settings.personalizedAds)
