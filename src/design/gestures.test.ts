import { describe, expect, it } from 'vitest'
import { clamp, doubleTapZoom, maxPan, rubber, settleDetent, settleSingle, shouldDismiss } from './gestures'

describe('drag arithmetic', () => {
  it('resists more and more past the limit, never going backwards', () => {
    expect(rubber(0)).toBe(0)
    expect(rubber(-20)).toBe(0)
    expect(rubber(60)).toBeLessThan(60)
    expect(rubber(400)).toBeGreaterThan(rubber(200))
    expect(rubber(4000)).toBeLessThan(120)
  })

  it('dismisses on a long pull or a quick flick, not on a small slow drag', () => {
    expect(shouldDismiss(300, 0, 800)).toBe(true)
    expect(shouldDismiss(100, 0, 800)).toBe(false)
    expect(shouldDismiss(80, 0.9, 800)).toBe(true)
    expect(shouldDismiss(20, 0.9, 800)).toBe(false)
  })

  it('lands a two-height sheet on the nearest rest point after coasting', () => {
    // medium rests 300px down, the sheet is 800px tall
    expect(settleDetent(10, 0, 300, 800)).toBe('large')
    expect(settleDetent(280, 0, 300, 800)).toBe('medium')
    expect(settleDetent(600, 0, 300, 800)).toBe('close')
    expect(settleDetent(250, -1.2, 300, 800)).toBe('large') // flicked up from half
    expect(settleDetent(150, 1.5, 300, 800)).toBe('medium') // flicked down from nearly open stops half way
    expect(settleDetent(300, 1.5, 300, 800)).toBe('close') // flicked down from half open closes
  })

  it('closes or stays for a sheet with one height', () => {
    expect(settleSingle(300, 0, 600)).toBe('close')
    expect(settleSingle(40, 0, 600)).toBe('large')
  })

  it('limits how far a zoomed picture can be moved', () => {
    expect(maxPan(400, 1)).toBe(0)
    expect(maxPan(400, 2)).toBe(200)
    expect(clamp(5, 0, 3)).toBe(3)
  })

  it('zooms in around the tap on a double tap, and back out on the next', () => {
    expect(doubleTapZoom(1, 100, -40)).toEqual({ scale: 2.5, x: -150, y: 60 })
    expect(doubleTapZoom(2.5, 100, -40)).toEqual({ scale: 1, x: 0, y: 0 })
  })
})
