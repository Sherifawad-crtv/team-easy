import { useEffect, useRef } from 'react'
import { IconClose } from '../../design/icons'
import { clamp, doubleTapZoom, maxPan, rubber, shouldDismiss } from '../../design/gestures'
import { useVariant } from '../../experiments/experiments'
import { useMedia } from '../../state/useMedia'
import type { Message } from '../../data/types'
import { messageTime } from '../chat/format'

const MAX_SCALE = 5

/**
 * Full-screen image. Tap outside or press Escape to close. On phones in motion
 * style B it behaves like Photos: pinch or double tap to zoom, drag a zoomed
 * picture around, and pull a normal-size picture down to close it while the
 * background fades away.
 */
export function ImageViewer({ message, onClose }: { message: Message; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLImageElement>(null)
  const ios = useVariant('motion_style') === 'B'
  const phone = useMedia('(max-width: 1023.98px)')
  const gestures = ios && phone
  const a = message.attachment
  // The parent hands over a new function on every render; gestures must not restart because of that.
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const layer = root.current
    const pic = img.current
    if (!layer || !pic || !gestures) return
    let scale = 1
    let x = 0
    let y = 0
    // gesture state
    let mode: 'idle' | 'pan' | 'pinch' | 'dismiss' = 'idle'
    let sx = 0
    let sy = 0
    let bx = 0
    let by = 0
    let startDist = 0
    let startScale = 1
    let lastY = 0
    let lastT = 0
    let velocity = 0
    let lastTap = { t: 0, x: 0, y: 0 }
    let moved = false

    const apply = (settle: boolean) => {
      pic.classList.toggle('is-settling', settle)
      pic.style.transform = `translate(${x}px, ${y}px) scale(${scale})`
    }
    const progress = (p: number) => {
      layer.style.setProperty('--p', String(clamp(p, 0, 1)))
      layer.classList.toggle('is-dragging', mode === 'dismiss')
    }
    const bounds = () => ({ w: maxPan(pic.clientWidth, scale), h: maxPan(pic.clientHeight, scale) })
    const dist = (e: TouchEvent) => Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)

    const start = (e: TouchEvent) => {
      moved = false
      if (e.touches.length === 2) {
        mode = 'pinch'
        startDist = dist(e)
        startScale = scale
        return
      }
      const t = e.touches[0]
      sx = t.clientX
      sy = t.clientY
      bx = x
      by = y
      lastY = t.clientY
      lastT = e.timeStamp
      velocity = 0
      mode = scale > 1.02 ? 'pan' : 'dismiss'
    }
    const move = (e: TouchEvent) => {
      if (mode === 'idle') return
      e.preventDefault()
      if (mode === 'pinch' && e.touches.length === 2) {
        moved = true
        scale = clamp(startScale * (dist(e) / startDist), 0.7, MAX_SCALE)
        apply(false)
        return
      }
      if (e.touches.length !== 1) return
      const t = e.touches[0]
      const dx = t.clientX - sx
      const dy = t.clientY - sy
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true
      if (mode === 'pan') {
        const b = bounds()
        x = clamp(bx + dx, -b.w - 60, b.w + 60)
        y = clamp(by + dy, -b.h - 60, b.h + 60)
        apply(false)
      } else {
        const dt = e.timeStamp - lastT
        if (dt > 0) velocity = (t.clientY - lastY) / dt
        lastY = t.clientY
        lastT = e.timeStamp
        y = dy > 0 ? dy : -rubber(-dy, 60)
        x = dx * 0.4
        apply(false)
        progress(Math.abs(y) / (window.innerHeight * 0.5))
      }
    }
    const end = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        // One finger of a pinch is still down: carry on as a drag of the zoomed picture.
        if (mode === 'pinch') { mode = 'pan'; sx = e.touches[0].clientX; sy = e.touches[0].clientY; bx = x; by = y }
        return
      }
      const was = mode
      mode = 'idle'
      if (was === 'dismiss') {
        if (moved && shouldDismiss(Math.abs(y), Math.abs(velocity), window.innerHeight, 0.18)) {
          y = y > 0 ? window.innerHeight : -window.innerHeight
          apply(true)
          progress(1)
          window.setTimeout(() => closeRef.current(), 300)
          return
        }
        x = 0
        y = 0
        apply(true)
        progress(0)
      } else {
        if (scale < 1.02) { scale = 1; x = 0; y = 0 }
        const b = bounds()
        x = clamp(x, -b.w, b.w)
        y = clamp(y, -b.h, b.h)
        apply(true)
      }
      // Two quick taps in the same place zoom in or out.
      if (!moved && was !== 'pinch') {
        const t = e.changedTouches[0]
        const now = e.timeStamp
        if (now - lastTap.t < 300 && Math.hypot(t.clientX - lastTap.x, t.clientY - lastTap.y) < 30) {
          const r = pic.getBoundingClientRect()
          const z = doubleTapZoom(scale, t.clientX - (r.left + r.width / 2), t.clientY - (r.top + r.height / 2))
          scale = z.scale
          const b = bounds()
          x = clamp(z.x, -b.w, b.w)
          y = clamp(z.y, -b.h, b.h)
          apply(true)
          lastTap = { t: 0, x: 0, y: 0 }
        } else {
          lastTap = { t: now, x: t.clientX, y: t.clientY }
        }
      }
    }

    pic.addEventListener('touchstart', start, { passive: true })
    pic.addEventListener('touchmove', move, { passive: false })
    pic.addEventListener('touchend', end)
    pic.addEventListener('touchcancel', end)
    return () => {
      pic.removeEventListener('touchstart', start)
      pic.removeEventListener('touchmove', move)
      pic.removeEventListener('touchend', end)
      pic.removeEventListener('touchcancel', end)
    }
  }, [gestures])

  if (!a?.url) return null
  return (
    <div className="viewer" ref={root} role="dialog" aria-modal="true" aria-label={a.name} onClick={onClose}>
      <header className="viewer__bar" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="icon-btn viewer__close" aria-label="Close" onClick={onClose}><IconClose /></button>
        <div className="viewer__who">
          <p className="viewer__name">{message.senderId === 'me' ? 'You' : message.senderName}</p>
          <p className="viewer__sub">{a.name} · {messageTime(message.at)}</p>
        </div>
      </header>
      <img ref={img} className="viewer__img" src={a.url} alt={message.text || a.name} onClick={(e) => e.stopPropagation()} draggable={false} />
      {message.text && <p className="viewer__caption" onClick={(e) => e.stopPropagation()}>{message.text}</p>}
    </div>
  )
}
