import { useEffect, useRef, type ReactNode } from 'react'
import { haptic } from '../../design/haptics'
import { rubber, settleRowSwipe } from '../../design/gestures'

export interface SwipeAction {
  label: string
  icon: ReactNode
  /** `lead` shows when you swipe right, `trail` when you swipe left. */
  run: () => void
}

const REVEAL = 88
const EDGE = 24 // the left edge belongs to the system's back swipe
let open: { close: () => void } | null = null

/**
 * A row you can swipe sideways to reveal an action, the way Mail and Messages do
 * on iPhone. It follows the finger, a long swipe runs the action at once, a
 * short one leaves the button showing, and only one row is open at a time. The
 * same actions are always available from a long press or right click (see the chat list).
 */
export function SwipeRow({ lead, trail, enabled, children }: { lead: SwipeAction; trail: SwipeAction; enabled: boolean; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const actions = useRef({ lead, trail })
  actions.current = { lead, trail }

  useEffect(() => {
    const el = root.current
    const row = content.current
    if (!el || !row || !enabled) return
    let sx = 0
    let sy = 0
    let base = 0
    let x = 0
    let lastX = 0
    let lastT = 0
    let velocity = 0
    let armed = false
    let mode: 'idle' | 'maybe' | 'drag' | 'ignore' = 'idle'
    let isOpen = 0 // -REVEAL, 0 or REVEAL

    const set = (px: number, animate: boolean) => {
      x = px
      el.classList.toggle('is-animating', animate)
      el.style.setProperty('--dx', `${px}px`)
      el.dataset.side = px > 0 ? 'lead' : px < 0 ? 'trail' : ''
    }
    const close = () => { isOpen = 0; set(0, true) }
    const me = { close }

    const down = (e: TouchEvent) => {
      if (e.touches.length !== 1 || e.touches[0].clientX < EDGE) { mode = 'ignore'; return }
      if (open && open !== me) open.close()
      sx = e.touches[0].clientX
      sy = e.touches[0].clientY
      base = isOpen
      lastX = sx
      lastT = e.timeStamp
      velocity = 0
      armed = false
      mode = 'maybe'
    }
    const move = (e: TouchEvent) => {
      if (mode === 'idle' || mode === 'ignore') return
      const t = e.touches[0]
      const dx = t.clientX - sx
      const dy = t.clientY - sy
      if (mode === 'maybe') {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { mode = 'ignore'; return }
        if (Math.abs(dx) < 10) return
        mode = 'drag'
      }
      e.preventDefault()
      const dt = e.timeStamp - lastT
      if (dt > 0) velocity = (t.clientX - lastX) / dt
      lastX = t.clientX
      lastT = e.timeStamp
      let px = base + dx
      const limit = el.clientWidth * 0.92
      if (Math.abs(px) > limit) px = Math.sign(px) * (limit + rubber(Math.abs(px) - limit, 30))
      set(px, false)
      const nowArmed = Math.abs(px) > el.clientWidth * 0.6
      if (nowArmed !== armed) { armed = nowArmed; el.classList.toggle('is-armed', armed); if (armed) haptic('selection') }
    }
    const up = () => {
      if (mode !== 'drag') { mode = 'idle'; return }
      mode = 'idle'
      el.classList.remove('is-armed')
      const r = settleRowSwipe(x - 0, velocity, REVEAL, el.clientWidth)
      if (r === 'commit-lead' || r === 'commit-trail') {
        const a = r === 'commit-lead' ? actions.current.lead : actions.current.trail
        isOpen = 0
        set(0, true)
        haptic('light')
        a.run()
        if (open === me) open = null
      } else if (r === 'open-lead' || r === 'open-trail') {
        isOpen = r === 'open-lead' ? REVEAL : -REVEAL
        set(isOpen, true)
        open = me
      } else {
        close()
        if (open === me) open = null
      }
    }
    // A tap on an open row closes it instead of opening the chat.
    const click = (e: MouseEvent) => {
      if (isOpen !== 0 && !(e.target as HTMLElement).closest('.swipe__btn')) {
        e.preventDefault()
        e.stopPropagation()
        close()
        if (open === me) open = null
      }
    }
    el.addEventListener('touchstart', down, { passive: true })
    el.addEventListener('touchmove', move, { passive: false })
    el.addEventListener('touchend', up)
    el.addEventListener('touchcancel', up)
    el.addEventListener('click', click, true)
    return () => {
      el.removeEventListener('touchstart', down)
      el.removeEventListener('touchmove', move)
      el.removeEventListener('touchend', up)
      el.removeEventListener('touchcancel', up)
      el.removeEventListener('click', click, true)
      if (open === me) open = null
    }
  }, [enabled])

  if (!enabled) return <>{children}</>
  const run = (a: SwipeAction) => () => {
    haptic('light')
    a.run()
    root.current?.style.setProperty('--dx', '0px')
    root.current?.classList.add('is-animating')
    if (root.current) root.current.dataset.side = ''
    open = null
  }
  return (
    <div className="swipe" ref={root} data-side="">
      <div className="swipe__lead" aria-hidden={false}>
        <button type="button" className="swipe__btn swipe__btn--lead" tabIndex={-1} onClick={run(lead)}>{lead.icon}<span>{lead.label}</span></button>
      </div>
      <div className="swipe__trail">
        <button type="button" className="swipe__btn swipe__btn--trail" tabIndex={-1} onClick={run(trail)}>{trail.icon}<span>{trail.label}</span></button>
      </div>
      <div className="swipe__content" ref={content}>{children}</div>
    </div>
  )
}
