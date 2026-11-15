import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { variants } from '../experiments/experiments'

// Screen-to-screen motion for stacks of pages (docs/MOTION_PLAN.md, M2), using
// the browser's View Transitions where it has them (Chrome, Safari 18 and
// later). Without them the page changes at once, as before.
//   push  the new screen slides in from the right, the old one slides back a little
//   pop   the reverse
//   tab   a quick cross-fade, no sliding
// Only motion style B uses it. Reduce Motion turns all three into a fade (in CSS).

export type NavDir = 'push' | 'pop' | 'tab'

type WithTransitions = Document & { startViewTransition?: (cb: () => Promise<void> | void) => { finished: Promise<void> } }

const supported = () => typeof document !== 'undefined' && typeof (document as WithTransitions).startViewTransition === 'function'

/** Resolves once the page has re-rendered after a navigation, or after a short wait. */
function settle(): Promise<void> {
  return new Promise((resolve) => {
    const root = document.getElementById('root')
    let done = false
    let observer: MutationObserver | undefined
    const finish = () => {
      if (done) return
      done = true
      observer?.disconnect()
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    }
    if (root) {
      observer = new MutationObserver(finish)
      observer.observe(root, { childList: true, subtree: true })
    }
    window.setTimeout(finish, 300)
  })
}

/** Runs a navigation inside a view transition when motion style B and the browser allow it. */
export function animateNav(dir: NavDir, run: () => void): void {
  if (variants.get('motion_style') !== 'B' || !supported()) {
    run()
    return
  }
  const root = document.documentElement
  root.dataset.vt = dir
  const t = (document as WithTransitions).startViewTransition!(() => {
    run()
    return settle()
  })
  void t.finished.finally(() => { delete root.dataset.vt })
}

/** `go('/account/edit')` pushes with a slide; `go(-1, 'pop')` goes back with one. */
export function useAnimatedNavigate() {
  const navigate = useNavigate()
  return useCallback(
    (to: string | number, dir: NavDir = typeof to === 'number' ? 'pop' : 'push') => animateNav(dir, () => navigate(to as never)),
    [navigate],
  )
}
