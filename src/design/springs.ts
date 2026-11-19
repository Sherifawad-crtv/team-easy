// The springs behind motion style B, as numbers a designer can tune
// (docs/MOTION_PLAN.md, M6). Defined like SwiftUI does it: `response` is how
// quick (seconds of one swing), `damping` is how bouncy (1 means no bounce).
// A spring is sampled into a CSS `linear()` curve and a duration. The same
// maths produced `src/styles/motion.css`; a test keeps the two in step.

export interface SpringSpec {
  response: number
  damping: number
}

export type SpringName = 'smooth' | 'snappy' | 'smoothSlow' | 'bouncy'

export const DEFAULT_SPRINGS: Record<SpringName, SpringSpec> = {
  smooth: { response: 0.26, damping: 1 },
  snappy: { response: 0.2, damping: 0.85 },
  smoothSlow: { response: 0.34, damping: 1 },
  bouncy: { response: 0.42, damping: 0.6 },
}

export const SPRING_LABELS: Record<SpringName, { title: string; use: string }> = {
  smooth: { title: 'Smooth', use: 'Screens, sheets, list changes' },
  snappy: { title: 'Snappy', use: 'Taps, toggles, tab changes' },
  smoothSlow: { title: 'Smooth, slow', use: 'Large moves' },
  bouncy: { title: 'Bouncy', use: 'Answering a call, purchase done' },
}

/** How far a spring that starts at rest is from its target, 0 to 1 and beyond if it overshoots. */
export function springPosition({ response, damping }: SpringSpec, t: number): number {
  const w = (2 * Math.PI) / response
  if (damping >= 0.9999) return 1 - (1 + w * t) * Math.exp(-w * t)
  const wd = w * Math.sqrt(1 - damping * damping)
  return 1 - Math.exp(-damping * w * t) * (Math.cos(wd * t) + ((damping * w) / wd) * Math.sin(wd * t))
}

/** The time until the spring stays within 0.3% of its target, in seconds. */
export function settleTime(spec: SpringSpec): number {
  let last = 0
  for (let t = 0; t < 3; t += 0.002) if (Math.abs(1 - springPosition(spec, t)) > 0.003) last = t
  return last + 0.002
}

export function springCurve(spec: SpringSpec, samples = 30): { durationMs: number; css: string } {
  const T = settleTime(spec)
  const fmt = (p: number) => (p === 0 || p === 1 ? String(p) : p.toFixed(3).replace(/0+$/, '').replace(/\.$/, ''))
  const pts = Array.from({ length: samples + 1 }, (_, i) => (i === samples ? 1 : springPosition(spec, (T * i) / samples)))
  return { durationMs: Math.round(T * 1000), css: `linear(${pts.map(fmt).join(', ')})` }
}

const KEY = 'te.motion.tuning'

export function storedTuning(): Record<SpringName, SpringSpec> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Record<SpringName, SpringSpec>>
    return { ...DEFAULT_SPRINGS, ...raw }
  } catch {
    return { ...DEFAULT_SPRINGS }
  }
}

export function saveTuning(t: Record<SpringName, SpringSpec> | null) {
  try {
    if (t) localStorage.setItem(KEY, JSON.stringify(t))
    else localStorage.removeItem(KEY)
  } catch {
    // lasts for this page only
  }
}

/** Writes the springs into CSS variables on the page. Inline values win over the stylesheet. */
export function applySprings(t: Record<SpringName, SpringSpec>, root: HTMLElement = document.documentElement) {
  const set = (name: string, spring: SpringSpec) => {
    const c = springCurve(spring)
    root.style.setProperty(`--${name}`, c.css)
    root.style.setProperty(`--${name}-dur`, `${c.durationMs}ms`)
  }
  set('motion-smooth', t.smooth)
  set('motion-snappy', t.snappy)
  set('motion-bouncy', t.bouncy)
  set('spring-spatial', t.smooth)
  set('spring-fast-spatial', t.snappy)
  set('spring-slow-spatial', t.smoothSlow)
}

/** Undo `applySprings`, back to the stylesheet's values. */
export function clearSprings(root: HTMLElement = document.documentElement) {
  for (const n of ['motion-smooth', 'motion-snappy', 'motion-bouncy', 'spring-spatial', 'spring-fast-spatial', 'spring-slow-spatial']) {
    root.style.removeProperty(`--${n}`)
    root.style.removeProperty(`--${n}-dur`)
  }
}

/** Applies what was tuned on this device, if anything, before the first screen. */
export function applyStoredTuning() {
  try {
    if (localStorage.getItem(KEY)) applySprings(storedTuning())
  } catch {
    // no storage
  }
}
