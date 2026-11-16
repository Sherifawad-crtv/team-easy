// Guard for Reduce Motion (docs/MOTION_PLAN.md, M6): every animation that moves
// or scales something must be switched off or turned into a fade when the
// person asks for less motion. This reads the stylesheets and checks that each
// such rule has a counterpart inside a `prefers-reduced-motion: reduce` block.

import { describe, expect, it } from 'vitest'

// The app's TypeScript setup has no Node types, and this test only needs to read files.
// @ts-ignore
const { readFileSync } = (await import('node:fs')) as { readFileSync: (p: string, enc: string) => string }

interface Rule { selector: string; body: string; reduced: boolean }

function parse(css: string): Rule[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const rules: Rule[] = []
  const walk = (src: string, reduced: boolean) => {
    let i = 0
    while (i < src.length) {
      const open = src.indexOf('{', i)
      if (open < 0) break
      const head = src.slice(i, open).trim()
      let depth = 1
      let j = open + 1
      while (j < src.length && depth > 0) {
        if (src[j] === '{') depth++
        else if (src[j] === '}') depth--
        j++
      }
      const body = src.slice(open + 1, j - 1)
      if (head.startsWith('@media') || head.startsWith('@supports')) walk(body, reduced || /prefers-reduced-motion:\s*reduce/.test(head))
      else if (!head.startsWith('@')) rules.push({ selector: head, body, reduced })
      i = j
    }
  }
  walk(text, false)
  return rules
}

const FILES = ['components.css', 'app.css', 'motion-ios.css', 'base.css', 'tokens.css']
const rules = FILES.flatMap((f) => parse(readFileSync(`src/styles/${f}`, 'utf8')))

/** Loading indicators and the call timers go on turning: they show waiting, not movement. */
// 'hit' is a colour flash around the message you searched for, not movement.
const ALLOWED = new Set(['turn', 'morph', 'shimmer', 'countdown', 'ring', 'answer-breathe', 'nudge', 'bob', 'hit'])
const animationName = (body: string) => /animation(?:-name)?:\s*([a-z0-9-]+)/.exec(body)?.[1]
/** Splits on commas that are not inside brackets or parentheses. */
function splitTop(sel: string): string[] {
  const out: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of sel) {
    if (ch === '(' || ch === '[') depth++
    if (ch === ')' || ch === ']') depth--
    if (ch === ',' && depth === 0) { out.push(cur); cur = '' } else cur += ch
  }
  out.push(cur)
  return out.map((x) => x.trim().replace(/\s+/g, ' '))
}

/** One selector per thing it matches: a list in `:is(...)` is spelled out. A page transition's direction does not matter here. */
function parts(sel: string): string[] {
  return splitTop(sel).flatMap((one) => {
    const m = /^(.*?)\s*:is\((.*)\)$/.exec(one)
    return (m ? splitTop(m[2]).map((item) => `${m[1]} ${item}`.trim()) : [one]).map((x) => x.replace(/\[data-vt='[a-z]+'\]/g, '[data-vt]'))
  })
}

describe('Reduce Motion', () => {
  const reducedSelectors = new Set(rules.filter((r) => r.reduced).flatMap((r) => parts(r.selector)))
  const animated = rules.filter((r) => !r.reduced && animationName(r.body) && !['none'].includes(animationName(r.body)!))

  it('finds the animations it is meant to guard', () => {
    expect(animated.length).toBeGreaterThan(20)
    expect(reducedSelectors.size).toBeGreaterThan(10)
  })

  it('has a Reduce Motion answer for every moving animation', () => {
    const missing = animated
      .filter((r) => !ALLOWED.has(animationName(r.body)!))
      .flatMap((r) => parts(r.selector))
      .filter((sel) => !reducedSelectors.has(sel))
    expect([...new Set(missing)]).toEqual([])
  })

  it('turns screen slides into a fade', () => {
    const reduced = rules.filter((r) => r.reduced).map((r) => r.body).join('\n')
    expect(reduced).toContain('vt-fade-in')
    expect(reduced).toContain('vt-fade-out')
  })
})
