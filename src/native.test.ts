import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { installNativeFeel } from './native'

let off: () => void = () => {}
let coarse = true
beforeEach(() => {
  coarse = true
  Object.defineProperty(window, 'matchMedia', { value: (q: string) => ({ matches: q.includes('coarse') ? coarse : false }), configurable: true, writable: true })
  document.body.innerHTML = '<div id="plain">text</div><input id="field" /><a id="link" href="/x">link</a>'
  off = installNativeFeel(document)
})
afterEach(() => {
  off()
  Object.defineProperty(window, 'matchMedia', { value: undefined, configurable: true, writable: true })
})

const fire = (id: string, type: string) => {
  const e = new Event(type, { bubbles: true, cancelable: true })
  document.getElementById(id)!.dispatchEvent(e)
  return e.defaultPrevented
}

describe('native feel', () => {
  it('stops the page zooming with a pinch', () => {
    expect(fire('plain', 'gesturestart')).toBe(true)
    expect(fire('plain', 'gesturechange')).toBe(true)
  })

  it('removes the browser menu on a long press, except in a text field', () => {
    expect(fire('plain', 'contextmenu')).toBe(true)
    expect(fire('field', 'contextmenu')).toBe(false)
  })

  it('leaves the menu alone with a mouse', () => {
    off()
    coarse = false
    off = installNativeFeel(document)
    expect(fire('plain', 'contextmenu')).toBe(false)
  })

  it('stops pictures and links being dragged out of the page', () => {
    expect(fire('link', 'dragstart')).toBe(true)
    expect(fire('field', 'dragstart')).toBe(false)
  })
})
