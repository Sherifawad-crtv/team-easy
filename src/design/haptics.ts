// Haptics (docs/MOTION_PLAN.md, phase M1). A tap you can feel that matches
// something you can see, the same kind for the same event, never for every touch.
//
// Five events only:
//   selection  moving between choices: tabs, switches, chips
//   light      a small action landed: send, hang up
//   success    something finished: purchase, backup, call answered
//   warning    a confirmed removal: delete
//   error      something failed: payment, a message that did not send
//
// The web cannot reach the iPhone's Taptic Engine properly. Android browsers
// accept simple vibration. Safari on iPhone (17.4 and later) answers a toggled
// switch control with a tap, which is an unofficial trick and may stop working.
// Haptics only run in motion style B, when the Haptics setting is on, and when
// Reduce Motion is off.

import { variants } from '../experiments/experiments'
import { settings } from '../state/settings'

export type Haptic = 'selection' | 'light' | 'success' | 'warning' | 'error'

const PATTERNS: Record<Haptic, number[]> = {
  selection: [6],
  light: [10],
  success: [12, 50, 12],
  warning: [18, 60, 18],
  error: [26, 40, 26, 40, 26],
}

type Driver = (kind: Haptic) => void
let driver: Driver | null = null
/** Tests and review tools can watch or replace what a haptic does. */
export const setHapticDriver = (d: Driver | null) => { driver = d }

let ios: { label: HTMLLabelElement } | null = null
const isIos = () => typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)

function tapOnIos() {
  if (typeof document === 'undefined') return
  if (!ios) {
    const label = document.createElement('label')
    label.setAttribute('aria-hidden', 'true')
    label.style.cssText = 'position:fixed;left:-100px;top:-100px;width:1px;height:1px;opacity:0;pointer-events:none'
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    input.tabIndex = -1
    label.appendChild(input)
    document.body.appendChild(label)
    ios = { label }
  }
  ios.label.click()
}

function allowed(): boolean {
  if (variants.get('motion_style') !== 'B') return false
  if (!settings.haptics()) return false
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  } catch {
    // no matchMedia: carry on
  }
  return true
}

export function haptic(kind: Haptic): void {
  if (!allowed()) return
  if (driver) return driver(kind)
  try {
    if (isIos()) {
      // Two taps for the heavier events, so they feel different from a selection.
      tapOnIos()
      if (kind === 'success' || kind === 'warning' || kind === 'error') window.setTimeout(tapOnIos, 90)
    } else if ('vibrate' in navigator) {
      navigator.vibrate(PATTERNS[kind])
    }
  } catch {
    // haptics are a bonus, never an error
  }
}
