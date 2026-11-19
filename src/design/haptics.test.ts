import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { settings } from '../state/settings'
import { haptic, setHapticDriver, type Haptic } from './haptics'

let seen: Haptic[] = []
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  settings.setHaptics(true)
  seen = []
  setHapticDriver((k) => seen.push(k))
})
afterEach(() => {
  setHapticDriver(null)
  Object.defineProperty(window, 'matchMedia', { value: undefined, configurable: true, writable: true })
})

describe('haptics', () => {
  it('fire when the setting is on', () => {
    haptic('selection')
    haptic('success')
    expect(seen).toEqual(['selection', 'success'])
  })

  it('stay silent when the person switched them off', () => {
    settings.setHaptics(false)
    haptic('error')
    expect(seen).toEqual([])
  })

  it('stay silent when Reduce Motion is on', () => {
    Object.defineProperty(window, 'matchMedia', { value: () => ({ matches: true }), configurable: true, writable: true })
    haptic('warning')
    expect(seen).toEqual([])
  })
})
