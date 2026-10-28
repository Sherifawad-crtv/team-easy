import { describe, expect, it } from 'vitest'
import { snippet } from './snippet'

describe('snippet', () => {
  it('marks the match, ignoring case', () => {
    const out = snippet('Can you send the Latest build?', 'latest')
    expect(out.find((p) => p.hit)?.text).toBe('Latest')
  })
  it('adds ellipses around a long text', () => {
    const text = `${'x'.repeat(80)} needle ${'y'.repeat(80)}`
    const out = snippet(text, 'needle')
    expect(out[0].text).toBe('…')
    expect(out[out.length - 1].text).toBe('…')
  })
  it('returns plain text with no match', () => {
    expect(snippet('hello', 'zzz')).toEqual([{ text: 'hello', hit: false }])
  })
})
