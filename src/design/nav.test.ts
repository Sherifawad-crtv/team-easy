import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetExperiments, variants } from '../experiments/experiments'
import { animateNav } from './nav'

type Doc = { startViewTransition?: unknown }
const doc = document as unknown as Doc

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  resetExperiments()
  document.body.innerHTML = '<div id="root"></div>'
})
afterEach(() => {
  delete doc.startViewTransition
  delete document.documentElement.dataset.vt
})

describe('screen transitions', () => {
  it('just navigate when the browser has no view transitions', () => {
    variants.setOverride('motion_style', 'B')
    const run = vi.fn()
    animateNav('push', run)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('just navigate in motion style A, even when the browser could animate', () => {
    variants.setOverride('motion_style', 'A')
    const start = vi.fn()
    ;doc.startViewTransition = start
    const run = vi.fn()
    animateNav('push', run)
    expect(run).toHaveBeenCalledTimes(1)
    expect(start).not.toHaveBeenCalled()
  })

  it('wraps the navigation in a view transition in style B and marks its direction', async () => {
    variants.setOverride('motion_style', 'B')
    let dir: string | undefined
    let finish: () => void = () => {}
    ;doc.startViewTransition = (cb: () => Promise<void> | void) => {
      dir = document.documentElement.dataset.vt
      void cb()
      return { finished: new Promise<void>((r) => { finish = r }) }
    }
    const run = vi.fn()
    animateNav('pop', run)
    expect(dir).toBe('pop')
    expect(run).toHaveBeenCalledTimes(1)
    finish()
    await Promise.resolve()
    await Promise.resolve()
    expect(document.documentElement.dataset.vt).toBeUndefined()
  })
})
