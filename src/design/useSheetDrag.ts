import { useEffect, useRef, type RefObject } from 'react'
import { rubber, settleDetent, settleSingle } from './gestures'

interface Options {
  sheet: RefObject<HTMLElement | null>
  backdrop: RefObject<HTMLElement | null>
  enabled: boolean
  /** Two heights: half open to start with, and full. */
  detents: boolean
  /** Runs the sheet out of view, then lets the parent unmount it. */
  onClose: () => void
}

const MEDIUM_VISIBLE = 0.52 // share of the screen the half-open sheet shows

/**
 * Drag a sheet down to close it, and between two heights when it has them,
 * the way iOS sheets behave. The sheet follows the finger, past the top it
 * resists, and it settles from the speed you let go at. Touch only.
 * The returned function closes the sheet with the same slide-out (for Escape and taps outside).
 */
export function useSheetDrag({ sheet, backdrop, enabled, detents, onClose }: Options) {
  const close = useRef(onClose)
  close.current = onClose
  const slideOut = useRef<() => void>(() => close.current())

  useEffect(() => {
    const el = sheet.current
    const dim = backdrop.current
    if (!el || !enabled) {
      slideOut.current = () => close.current()
      return
    }
    const height = () => el.offsetHeight
    const mediumOffset = () => Math.max(0, height() - window.innerHeight * MEDIUM_VISIBLE)
    let at = detents ? mediumOffset() : 0 // where the sheet rests now
    let startY = 0
    let startX = 0
    let startOffset = 0
    let lastY = 0
    let lastT = 0
    let velocity = 0
    let mode: 'idle' | 'maybe' | 'drag' | 'ignore' = 'idle'
    let handle = false

    const setOffset = (px: number, animate: boolean) => {
      el.style.transition = animate ? 'transform var(--motion-smooth-dur, 400ms) var(--motion-smooth, ease)' : 'none'
      el.style.transform = `translateY(${px}px)`
      if (dim) {
        dim.style.transition = animate ? 'background-color var(--motion-smooth-dur, 400ms) var(--motion-smooth, ease)' : 'none'
        dim.style.setProperty('--dim', String(Math.max(0, Math.min(1, 1 - px / height()))))
      }
    }
    const lock = () => { el.style.overflowY = detents && at > 1 ? 'hidden' : '' }

    const slideTo = (px: number, then?: () => void) => {
      setOffset(px, true)
      if (then) window.setTimeout(then, 330)
    }
    slideOut.current = () => slideTo(height(), () => close.current())

    // Open: half open for sheets with two heights, otherwise the normal entrance.
    if (detents) {
      el.style.animation = 'none'
      setOffset(height(), false)
      requestAnimationFrame(() => requestAnimationFrame(() => { setOffset(at, true); lock() }))
    }

    const start = (e: TouchEvent) => {
      if (e.touches.length !== 1) { mode = 'ignore'; return }
      const t = e.touches[0]
      startY = lastY = t.clientY
      startX = t.clientX
      lastT = e.timeStamp
      velocity = 0
      startOffset = detents ? at : 0
      handle = Boolean((e.target as HTMLElement).closest('.sheet__handle, .sheet__title'))
      mode = 'maybe'
    }
    const move = (e: TouchEvent) => {
      if (mode === 'idle' || mode === 'ignore') return
      const t = e.touches[0]
      const dy = t.clientY - startY
      const dx = t.clientX - startX
      if (mode === 'maybe') {
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) { mode = 'ignore'; return }
        if (Math.abs(dy) < 6) return
        // Inside a scrolled list a pull down scrolls the list first. With a half-open sheet any pull moves the sheet.
        const scrolling = el.scrollTop > 0 && !handle
        const halfOpen = detents && at > 1
        if (scrolling || (!halfOpen && !handle && dy < 0)) { mode = 'ignore'; return }
        mode = 'drag'
        startY = t.clientY - 0
        lastY = t.clientY
      }
      e.preventDefault()
      const d = t.clientY - startY
      const dt = e.timeStamp - lastT
      if (dt > 0) velocity = (t.clientY - lastY) / dt
      lastY = t.clientY
      lastT = e.timeStamp
      let offset = startOffset + d
      if (offset < 0) offset = -rubber(-offset) // resists past the top
      setOffset(offset, false)
      el.dataset.dragging = 'true'
    }
    const end = () => {
      if (mode !== 'drag') { mode = 'idle'; return }
      mode = 'idle'
      delete el.dataset.dragging
      const current = new DOMMatrixReadOnly(getComputedStyle(el).transform).m42
      if (detents) {
        const r = settleDetent(current, velocity, mediumOffset(), height())
        if (r === 'close') return slideOut.current()
        at = r === 'large' ? 0 : mediumOffset()
        setOffset(at, true)
        lock()
      } else {
        if (settleSingle(current, velocity, height()) === 'close') return slideOut.current()
        setOffset(0, true)
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
      slideOut.current = () => close.current()
    }
  }, [sheet, backdrop, enabled, detents])

  return () => slideOut.current()
}
