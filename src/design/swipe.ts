import { useEffect, useRef, type RefObject } from 'react'

/** Past a third of the width, or flicked quickly enough, a back swipe goes through. */
export function commitSwipe(dx: number, velocity: number, width: number): boolean {
  return dx > width * 0.35 || (velocity > 0.5 && dx > 24)
}

/** How far open the screen is while you drag: 1 fully open, 0 gone. */
export const swipeProgress = (dx: number, width: number) => Math.min(1, Math.max(0, 1 - dx / width))

/** Width of the strip at the left edge that starts a back swipe. Matches `.chats__edge`. */
const EDGE = 28

/**
 * Swipe from the left edge to go back, the way iPhone does it. The screen follows
 * the finger one to one, then springs open or shut from where you let go.
 * The container shows how open it is through the `--p` CSS variable.
 * A strip at the edge (`.chats__edge`, touch-action none) makes sure the browser
 * leaves those touches to us instead of starting to scroll.
 * Only touch and pen start it, never a mouse.
 */
export function useEdgeSwipeBack(container: RefObject<HTMLElement | null>, enabled: boolean, onCommit: () => void) {
  const commit = useRef(onCommit)
  commit.current = onCommit

  useEffect(() => {
    const el = container.current
    if (!el || !enabled) return
    let id = -1
    let startX = 0
    let startY = 0
    let lastX = 0
    let lastT = 0
    let velocity = 0
    let dragging = false

    const reset = (to: '0' | '1') => {
      el.classList.remove('is-dragging')
      el.style.setProperty('--p', to)
      window.setTimeout(() => el.style.removeProperty('--p'), 600)
    }

    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' || e.clientX > EDGE || !e.isPrimary) return
      id = e.pointerId
      startX = lastX = e.clientX
      startY = e.clientY
      lastT = e.timeStamp
      velocity = 0
      dragging = false
    }
    const move = (e: PointerEvent) => {
      if (e.pointerId !== id) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      if (!dragging) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { id = -1; return }
        if (dx < 8) return
        dragging = true
        el.classList.add('is-dragging')
        try { el.setPointerCapture(e.pointerId) } catch { /* not capturable */ }
      }
      const dt = e.timeStamp - lastT
      if (dt > 0) velocity = (e.clientX - lastX) / dt
      lastX = e.clientX
      lastT = e.timeStamp
      el.style.setProperty('--p', String(swipeProgress(dx, el.clientWidth)))
    }
    const end = (e: PointerEvent) => {
      if (e.pointerId !== id) return
      id = -1
      if (!dragging) return
      dragging = false
      const dx = e.clientX - startX
      if (commitSwipe(dx, velocity, el.clientWidth)) {
        reset('0')
        commit.current()
      } else {
        reset('1')
      }
    }

    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', end)
    el.addEventListener('pointercancel', end)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', end)
      el.removeEventListener('pointercancel', end)
    }
  }, [container, enabled])
}
