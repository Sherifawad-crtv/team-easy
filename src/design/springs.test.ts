import { describe, expect, it } from 'vitest'
import { DEFAULT_SPRINGS, applySprings, clearSprings, settleTime, springCurve, springPosition } from './springs'

// The app's TypeScript setup has no Node types, and this test only needs to read one file.
// @ts-ignore
const { readFileSync } = (await import('node:fs')) as { readFileSync: (p: string, enc: string) => string }
const css = readFileSync('src/styles/motion-ios.css', 'utf8')

describe('spring maths', () => {
  it('starts at rest and ends on target', () => {
    const c = springCurve(DEFAULT_SPRINGS.smooth)
    expect(c.css.startsWith('linear(0, ')).toBe(true)
    expect(c.css.endsWith(', 1)')).toBe(true)
  })

  it('does not overshoot with damping 1, and does with a low damping', () => {
    const peak = (s: { response: number; damping: number }) => Math.max(...Array.from({ length: 200 }, (_, i) => springPosition(s, i * 0.005)))
    expect(peak(DEFAULT_SPRINGS.smooth)).toBeLessThanOrEqual(1.0001)
    expect(peak(DEFAULT_SPRINGS.bouncy)).toBeGreaterThan(1.05)
  })

  it('takes longer to settle when it is slower or bouncier', () => {
    expect(settleTime({ response: 0.5, damping: 1 })).toBeGreaterThan(settleTime({ response: 0.3, damping: 1 }))
    expect(settleTime({ response: 0.3, damping: 0.5 })).toBeGreaterThan(settleTime({ response: 0.3, damping: 1 }))
  })

  it('matches the numbers in the stylesheet, so tuning and shipping agree', () => {
    const dur = (name: string) => Number(new RegExp(`--${name}-dur: (\\d+)ms`).exec(css)?.[1])
    expect(Math.abs(springCurve(DEFAULT_SPRINGS.smooth).durationMs - dur('motion-smooth'))).toBeLessThanOrEqual(2)
    expect(Math.abs(springCurve(DEFAULT_SPRINGS.snappy).durationMs - dur('motion-snappy'))).toBeLessThanOrEqual(2)
    expect(Math.abs(springCurve(DEFAULT_SPRINGS.bouncy).durationMs - dur('motion-bouncy'))).toBeLessThanOrEqual(2)
    expect(Math.abs(springCurve(DEFAULT_SPRINGS.smoothSlow).durationMs - dur('spring-slow-spatial'))).toBeLessThanOrEqual(2)
  })

  it('writes tuned springs onto the page and removes them again', () => {
    const root = document.createElement('div')
    applySprings({ ...DEFAULT_SPRINGS, smooth: { response: 0.6, damping: 1 } }, root)
    expect(root.style.getPropertyValue('--motion-smooth')).toMatch(/^linear\(/)
    expect(Number.parseInt(root.style.getPropertyValue('--spring-spatial-dur'))).toBeGreaterThan(600)
    clearSprings(root)
    expect(root.style.getPropertyValue('--motion-smooth')).toBe('')
  })
})
