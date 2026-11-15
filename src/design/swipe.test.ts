import { describe, expect, it } from 'vitest'
import { commitSwipe, swipeProgress } from './swipe'

describe('back swipe', () => {
  it('goes through past a third of the width', () => {
    expect(commitSwipe(140, 0.1, 390)).toBe(true)
    expect(commitSwipe(100, 0.1, 390)).toBe(false)
  })

  it('goes through on a quick flick even when short, but not on a tiny twitch', () => {
    expect(commitSwipe(60, 0.9, 390)).toBe(true)
    expect(commitSwipe(10, 0.9, 390)).toBe(false)
  })

  it('reports how open the screen is while dragging, never outside 0 to 1', () => {
    expect(swipeProgress(0, 400)).toBe(1)
    expect(swipeProgress(200, 400)).toBe(0.5)
    expect(swipeProgress(900, 400)).toBe(0)
    expect(swipeProgress(-50, 400)).toBe(1)
  })
})
