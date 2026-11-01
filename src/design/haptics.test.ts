import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetExperiments, variants } from '../experiments/experiments'
import { settings } from '../state/settings'
import { haptic, setHapticDriver, type Haptic } from './haptics'

let seen: Haptic[] = []
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  resetExperiments()
  settings.setHaptics(true)
  seen = []
  setHapticDriver((k) => seen.push(k))
})
afterEach(() => {
  setHapticDriver(null)
  Object.defineProperty(window, 'matchMedia', { value: undefined, configurable: true, writable: true })
})

describe('haptics', () => {
  it('fire in motion style B when the setting is on', () => {
    variants.setOverride('motion_style', 'B')
    haptic('selection')
    haptic('success')
    expect(seen).toEqual(['selection', 'success'])
  })

  it('stay silent in motion style A', () => {
    variants.setOverride('motion_style', 'A')
    haptic('light')
    expect(seen).toEqual([])
  })

  it('stay silent when the person switched them off', () => {
    variants.setOverride('motion_style', 'B')
    settings.setHaptics(false)
    haptic('error')
    expect(seen).toEqual([])
  })

  it('stay silent when Reduce Motion is on', () => {
    variants.setOverride('motion_style', 'B')
    Object.defineProperty(window, 'matchMedia', { value: () => ({ matches: true }), configurable: true, writable: true })
    haptic('warning')
    expect(seen).toEqual([])
  })
})
