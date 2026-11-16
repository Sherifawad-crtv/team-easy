// The arithmetic behind drag gestures (docs/MOTION_PLAN.md, M3), kept apart from
// the touch handling so it can be tested.

/** Past its limit a dragged thing resists: it still moves, but less and less. */
export function rubber(distance: number, limit = 120): number {
  if (distance <= 0) return 0
  return limit * (1 - 1 / (distance / limit + 1))
}

/** Drag something down to dismiss it: a long enough pull, or a quick flick, lets it go. */
export function shouldDismiss(offset: number, velocity: number, size: number, fraction = 0.3): boolean {
  return offset > size * fraction || (velocity > 0.5 && offset > 40)
}

export type Settle = 'close' | 'medium' | 'large'

/**
 * Where a sheet with two heights lands when you let go. `offset` is how far the
 * sheet's top is below its fully open position (px), `velocity` is px per ms
 * (positive means moving down). It lands on the nearest rest point to where it
 * would be after coasting a little further.
 */
export function settleDetent(offset: number, velocity: number, mediumOffset: number, closedOffset: number): Settle {
  const projected = offset + velocity * 180
  const stops: [Settle, number][] = [['large', 0], ['medium', mediumOffset], ['close', closedOffset]]
  return stops.reduce((best, s) => (Math.abs(s[1] - projected) < Math.abs(best[1] - projected) ? s : best))[0]
}

/** Without a middle height: close or stay open. */
export function settleSingle(offset: number, velocity: number, height: number): Settle {
  return shouldDismiss(offset, velocity, height) ? 'close' : 'large'
}

/** How far a zoomed picture may be moved before its edge shows. */
export function maxPan(size: number, scale: number): number {
  return Math.max(0, ((scale - 1) * size) / 2)
}

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/**
 * Double tap: zoom in around the tap, or back out. Returns the new scale and
 * the shift that keeps the tapped point where the finger is.
 * `tapX` and `tapY` are measured from the picture's centre.
 */
export function doubleTapZoom(scale: number, tapX: number, tapY: number, zoomTo = 2.5): { scale: number; x: number; y: number } {
  if (scale > 1.05) return { scale: 1, x: 0, y: 0 }
  return { scale: zoomTo, x: -tapX * (zoomTo - 1), y: -tapY * (zoomTo - 1) }
}

export type RowSwipe = 'commit-lead' | 'open-lead' | 'commit-trail' | 'open-trail' | 'close'

/**
 * Where a swiped chat row ends up when you let go. `dx` is how far it was
 * dragged (right is positive), `velocity` px per ms, `reveal` the width of one
 * action button and `width` the width of the row. A long swipe runs the first
 * action at once; a short one leaves the buttons showing; a tiny one closes.
 */
export function settleRowSwipe(dx: number, velocity: number, reveal: number, width: number): RowSwipe {
  const side = dx >= 0 ? 'lead' : 'trail'
  const far = Math.abs(dx)
  const flick = Math.abs(velocity) > 0.9 && far > reveal * 0.8 && Math.sign(velocity) === Math.sign(dx)
  if (far > width * 0.6 || flick) return `commit-${side}`
  if (far > reveal * 0.5) return `open-${side}`
  return 'close'
}
