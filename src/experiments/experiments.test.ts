import { beforeEach, describe, expect, it } from 'vitest'
import { resetExperiments, variants } from './experiments'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  window.history.replaceState({}, '', '/')
  resetExperiments()
})

describe('experiment assignment', () => {
  it('assigns A or B and keeps it across reloads', () => {
    const first = variants.all()
    expect(['A', 'B']).toContain(first.chat_list)
    resetExperiments()
    expect(variants.all()).toEqual(first)
  })

  it('splits visitors roughly evenly', () => {
    let b = 0
    for (let i = 0; i < 400; i++) {
      localStorage.clear()
      resetExperiments()
      if (variants.get('chat_list') === 'B') b++
    }
    expect(b).toBeGreaterThan(140)
    expect(b).toBeLessThan(260)
  })

  it('lets a review override win without changing the stored assignment', () => {
    const stored = localStorage.getItem('te.variants')
    variants.setOverride('chat_list', variants.get('chat_list') === 'A' ? 'B' : 'A')
    expect(variants.isForced()).toBe(true)
    expect(localStorage.getItem('te.variants')).toBe(stored)
    variants.setOverride('chat_list', null)
    expect(variants.isForced()).toBe(false)
  })

  it('reads a forced variant from the link', () => {
    window.history.replaceState({}, '', '/?v_conversation=B')
    resetExperiments()
    expect(variants.get('conversation')).toBe('B')
    expect(variants.isForced()).toBe(true)
  })
})
