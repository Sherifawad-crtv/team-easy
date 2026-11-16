import { useLayoutEffect, useEffect, type RefObject } from 'react'

/**
 * Lets a highlight slide from one option to the next (docs/MOTION_PLAN.md, M5).
 * The container must have `data-slide`. This measures the pressed child
 * (`aria-pressed="true"`, `aria-checked="true"` or `aria-selected="true"`) and
 * hands its position to CSS as `--ind-x`, `--ind-y`, `--ind-w` and `--ind-h`.
 */
export function useSlide(ref: RefObject<HTMLElement | null>, dep: unknown) {
  useLayoutEffect(() => measure(ref.current), [ref, dep])
  // Fonts loading or the screen turning change the widths: measure again.
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => measure(el))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, dep])
}

function measure(el: HTMLElement | null) {
  if (!el) return
  const active = el.querySelector<HTMLElement>('[aria-pressed="true"], [aria-checked="true"], [aria-selected="true"]')
  if (!active) {
    el.style.setProperty('--ind-w', '0px')
    return
  }
  el.style.setProperty('--ind-x', `${active.offsetLeft}px`)
  el.style.setProperty('--ind-y', `${active.offsetTop}px`)
  el.style.setProperty('--ind-w', `${active.offsetWidth}px`)
  el.style.setProperty('--ind-h', `${active.offsetHeight}px`)
  el.dataset.ready = 'true'
}
