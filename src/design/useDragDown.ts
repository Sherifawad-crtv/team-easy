import { useEffect, useRef, type RefObject } from 'react'
import { rubber, shouldDismiss } from './gestures'

/**
 * Drag a full-screen layer down to dismiss it (the call screen, the picture
 * viewer). The layer follows the finger; `--drag` is how far down it is in px
 * and `--p` how close to gone it is (0 to 1), for fades and shadows. Letting go
 * past a third, or with a flick, sends it away through `onCommit`; otherwise it springs back.
 */
export function useDragDown(ref: RefObject<HTMLElement | null>, enabled: boolean, onCommit: () => void, canStart?: (target: HTMLElement) => boolean) {
  const commit = useRef(onCommit)
  commit.current = onCommit
  const can = useRef(canStart)
  can.current = canStart

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    let startY = 0
    let startX = 0
    let lastY = 0
    let lastT = 0
    let velocity = 0
    let mode: 'idle' | 'maybe' | 'drag' | 'ignore' = 'idle'

    const set = (px: number) => {
      el.style.setProperty('--drag', `${px}px`)
      el.style.setProperty('--p', String(Math.min(1, Math.max(0, px / el.clientHeight))))
    }
    const start = (e: TouchEvent) => {
      if (e.touches.length !== 1 || (can.current && !can.current(e.target as HTMLElement))) { mode = 'ignore'; return }
      startY = lastY = e.touches[0].clientY
      startX = e.touches[0].clientX
      lastT = e.timeStamp
      velocity = 0
      mode = 'maybe'
    }
    const move = (e: TouchEvent) => {
      if (mode === 'idle' || mode === 'ignore') return
      const t = e.touches[0]
      const dy = t.clientY - startY
      if (mode === 'maybe') {
        if (Math.abs(t.clientX - startX) > Math.abs(dy) && Math.abs(t.clientX - startX) > 8) { mode = 'ignore'; return }
        if (dy < 8) return
        mode = 'drag'
        el.classList.add('is-dragging')
      }
      e.preventDefault()
      const dt = e.timeStamp - lastT
      if (dt > 0) velocity = (t.clientY - lastY) / dt
      lastY = t.clientY
      lastT = e.timeStamp
      set(dy > 0 ? dy : -rubber(-dy, 60))
    }
    const end = () => {
      if (mode !== 'drag') { mode = 'idle'; return }
      mode = 'idle'
      const offset = parseFloat(el.style.getPropertyValue('--drag')) || 0
      el.classList.remove('is-dragging')
      if (shouldDismiss(offset, velocity, el.clientHeight, 0.25)) {
        set(el.clientHeight)
        window.setTimeout(() => { commit.current(); el.style.removeProperty('--drag'); el.style.removeProperty('--p') }, 320)
      } else {
        set(0)
        window.setTimeout(() => { el.style.removeProperty('--drag'); el.style.removeProperty('--p') }, 450)
      }
    }
    el.addEventListener('touchstart', start, { passive: true })
    el.addEventListener('touchmove', move, { passive: false })
    el.addEventListener('touchend', end)
    el.addEventListener('touchcancel', end)
    return () => {
      el.removeEventListener('touchstart', start)
      el.removeEventListener('touchmove', move)
      el.removeEventListener('touchend', end)
      el.removeEventListener('touchcancel', end)
    }
  }, [ref, enabled])
}
