import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { animateNav } from './nav'

type Doc = { startViewTransition?: unknown }
const doc = document as unknown as Doc

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  document.body.innerHTML = '<div id="root"></div>'
})
afterEach(() => {
  delete doc.startViewTransition
  delete document.documentElement.dataset.vt
})

describe('screen transitions', () => {
  it('just navigate when the browser has no view transitions', () => {
    const run = vi.fn()
    animateNav('push', run)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('wraps the navigation in a view transition and marks its direction', async () => {
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

  it('never waits for an animation frame while the browser has paused drawing', async () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0)
    let update: Promise<void> | void
    ;doc.startViewTransition = (cb: () => Promise<void> | void) => {
      update = cb()
      return { finished: Promise.resolve() }
    }
    animateNav('tab', () => {})
    const outcome = await Promise.race([Promise.resolve(update!).then(() => 'done'), new Promise((r) => setTimeout(() => r('frozen'), 1000))])
    raf.mockRestore()
    expect(outcome).toBe('done')
  })
})
