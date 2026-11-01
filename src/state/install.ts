import { useSyncExternalStore } from 'react'

// Adding the app to the home screen (docs/PWA_SPEC.md).
//
// Chrome and Edge on Android (and desktop) hand us an install prompt we can
// trigger from our own button. Safari on iPhone offers nothing like it: the
// only way is Share, then Add to Home Screen, so we teach those steps with a
// picture. Browsers inside other apps cannot install at all, so we say
// "open in your browser" instead.

export type InstallMode = 'installed' | 'prompt' | 'ios-safari' | 'ios-other' | 'in-app' | 'manual'

interface PromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface DetectInput {
  ua: string
  standalone: boolean
  hasPrompt: boolean
  /** An iPad that says it is a Mac: the only clue is a touch screen. */
  touchMac?: boolean
}

/** Works out which install route this browser has. Pure, so it can be tested. */
export function detectInstall({ ua, standalone, hasPrompt, touchMac }: DetectInput): InstallMode {
  if (standalone) return 'installed'
  const ios = /iPhone|iPad|iPod/.test(ua) || Boolean(touchMac)
  const inApp = /FBAN|FBAV|Instagram|Line\/|MicroMessenger|Snapchat|TikTok|Twitter|LinkedInApp|GSA\//.test(ua)
  if (inApp) return 'in-app'
  if (ios) {
    // Safari has "Safari/" in its name. A web view inside another app does not.
    if (!/Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)) return 'in-app'
    return /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua) ? 'ios-other' : 'ios-safari'
  }
  return hasPrompt ? 'prompt' : 'manual'
}

const FORCE_KEY = 'te.install.force'
const SNOOZE_KEY = 'te.install.snooze'
const SNOOZE_DAYS = 7

let deferred: PromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as PromptEvent
    version++
    emit()
  })
  window.addEventListener('appinstalled', () => {
    installed = true
    deferred = null
    version++
    emit()
  })
}

let version = 0

const isStandalone = () => {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
  } catch {
    return false
  }
}

/** Review tool: pretend to be another browser. */
export function forceInstallMode(mode: InstallMode | null) {
  try {
    if (mode) sessionStorage.setItem(FORCE_KEY, mode)
    else sessionStorage.removeItem(FORCE_KEY)
  } catch {
    // ignore
  }
  version++
  emit()
}
export const forcedInstallMode = (): InstallMode | null => {
  try {
    return (sessionStorage.getItem(FORCE_KEY) as InstallMode | null) ?? null
  } catch {
    return null
  }
}

function currentMode(): InstallMode {
  const forced = forcedInstallMode()
  if (forced) return forced
  if (installed) return 'installed'
  return detectInstall({
    ua: navigator.userAgent,
    standalone: isStandalone(),
    hasPrompt: Boolean(deferred),
    touchMac: /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1,
  })
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** True when the nudge on the chat list is quiet for now. */
export function snoozed(now = Date.now()): boolean {
  try {
    const at = Number(localStorage.getItem(SNOOZE_KEY))
    return Boolean(at) && now - at < SNOOZE_DAYS * 86_400_000
  } catch {
    return false
  }
}
export function snooze() {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now()))
  } catch {
    // ignore
  }
  version++
  emit()
}

/** Runs the browser's own install prompt. Only works for the `prompt` mode. */
export async function runInstallPrompt(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable'
  const e = deferred
  await e.prompt()
  const { outcome } = await e.userChoice
  deferred = null
  if (outcome === 'accepted') installed = true
  version++
  emit()
  return outcome
}

export function useInstall() {
  useSyncExternalStore(subscribe, () => version)
  const mode = currentMode()
  const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches
  return { mode, installed: mode === 'installed', touch: Boolean(touch), snoozed: snoozed() }
}
