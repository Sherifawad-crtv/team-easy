import { useLayoutEffect, useRef, type RefObject } from 'react'
import { useVariant } from '../experiments/experiments'

/**
 * When rows move or appear (a chat jumps to the top, a group comes back after
 * Undo), they glide from where they were instead of jumping. Rows are marked
 * with `data-flip-id`. `key` should change whenever the rows' order or set does.
 * Motion style B only; Reduce Motion skips it.
 */
export function useFlip(container: RefObject<HTMLElement | null>, key: string) {
  const ios = useVariant('motion_style') === 'B'
  const before = useRef<Map<string, number>>(new Map())
  const started = useRef(false)

  useLayoutEffect(() => {
    const el = container.current
    if (!el) return
    const rows = [...el.querySelectorAll<HTMLElement>('[data-flip-id]')]
    const now = new Map(rows.map((r) => [r.dataset.flipId!, r.getBoundingClientRect().top]))
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (ios && started.current && !reduce) {
      for (const r of rows) {
        const id = r.dataset.flipId!
        const was = before.current.get(id)
        if (was === undefined) {
          r.classList.remove('row-enter')
          void r.offsetWidth
          r.classList.add('row-enter')
        } else if (Math.abs(was - now.get(id)!) > 1) {
          const dy = was - now.get(id)!
          r.style.transition = 'none'
          r.style.transform = `translateY(${dy}px)`
          requestAnimationFrame(() => {
            r.style.transition = 'transform var(--motion-smooth-dur) var(--motion-smooth)'
            r.style.transform = ''
            window.setTimeout(() => { r.style.transition = '' }, 500)
          })
        }
      }
    }
    before.current = now
    started.current = rows.length > 0
  }, [container, key, ios])
}
