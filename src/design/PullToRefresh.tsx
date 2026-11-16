import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { useVariant } from '../experiments/experiments'
import { useMedia } from '../state/useMedia'
import { haptic } from './haptics'
import { rubber } from './gestures'

const TRIGGER = 72
const HOLD = 56

/**
 * Pull a list down from its top to refresh it, the way iPhone lists do: the
 * content follows the finger with a rubber band, a spinner turns with the pull,
 * and past the trigger point letting go starts the refresh. Phones in motion
 * style B only. `scroller` is the element that scrolls, or null for the page itself.
 */
export function PullToRefresh({ onRefresh, scroller, children }: { onRefresh: () => Promise<unknown>; scroller?: RefObject<HTMLElement | null> | null; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const ios = useVariant('motion_style') === 'B'
  const touch = useMedia('(pointer: coarse)')
  const phone = useMedia('(max-width: 1023.98px)')
  const refresh = useRef(onRefresh)
  refresh.current = onRefresh
  const enabled = ios && touch && phone

  useEffect(() => {
    const el = root.current
    const body = content.current
    if (!el || !body || !enabled) return
    const target: HTMLElement | Document = scroller?.current ?? document
    const top = () => (scroller?.current ? scroller.current.scrollTop : window.scrollY)
    let startY = 0
    let startX = 0
    let mode: 'idle' | 'maybe' | 'pull' | 'ignore' | 'busy' = 'idle'
    let armed = false

    const show = (px: number, animate: boolean) => {
      el.style.setProperty('--pull', `${px}px`)
      el.style.setProperty('--pull-p', String(Math.min(1, px / TRIGGER)))
      el.classList.toggle('is-settling', animate)
    }
    const down = (e: Event) => {
      const t = (e as TouchEvent).touches
      if (mode === 'busy' || t.length !== 1 || top() > 0) { if (mode !== 'busy') mode = 'ignore'; return }
      startY = t[0].clientY
      startX = t[0].clientX
      armed = false
      mode = 'maybe'
    }
    const move = (e: Event) => {
      if (mode === 'idle' || mode === 'ignore' || mode === 'busy') return
      const t = (e as TouchEvent).touches[0]
      const dy = t.clientY - startY
      if (mode === 'maybe') {
        if (Math.abs(t.clientX - startX) > Math.abs(dy) && Math.abs(t.clientX - startX) > 8) { mode = 'ignore'; return }
        if (dy < 8) { if (dy < -8) mode = 'ignore'; return }
        if (top() > 0) { mode = 'ignore'; return }
        mode = 'pull'
      }
      e.preventDefault()
      const px = rubber(dy, 130)
      show(px, false)
      const now = px >= TRIGGER
      if (now !== armed) { armed = now; if (armed) haptic('selection') }
    }
    const up = async () => {
      if (mode !== 'pull') { if (mode !== 'busy') mode = 'idle'; return }
      if (!armed) { mode = 'idle'; show(0, true); return }
      mode = 'busy'
      el.classList.add('is-refreshing')
      show(HOLD, true)
      const started = Date.now()
      try { await refresh.current() } catch { /* the list shows its own error */ }
      const wait = Math.max(0, 600 - (Date.now() - started))
      window.setTimeout(() => {
        el.classList.remove('is-refreshing')
        show(0, true)
        haptic('success')
        mode = 'idle'
      }, wait)
    }
    target.addEventListener('touchstart', down, { passive: true })
    target.addEventListener('touchmove', move, { passive: false })
    target.addEventListener('touchend', up)
    target.addEventListener('touchcancel', up)
    return () => {
      target.removeEventListener('touchstart', down)
      target.removeEventListener('touchmove', move)
      target.removeEventListener('touchend', up)
      target.removeEventListener('touchcancel', up)
    }
  }, [enabled, scroller])

  if (!enabled) return <>{children}</>
  return (
    <div className="ptr" ref={root}>
      <div className="ptr__ind" aria-hidden="true"><span className="ptr__spin" /></div>
      <div className="ptr__content" ref={content}>{children}</div>
    </div>
  )
}
