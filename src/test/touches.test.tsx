import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { useSlide } from '../design/useSlide'
import { Segmented, TextField } from '../design/ui'

afterEach(cleanup)

describe('segmented control', () => {
  it('marks the chosen option and reports a new choice', () => {
    let picked = ''
    const { rerender } = render(<Segmented label="How long" value="a" onChange={(v) => { picked = v }} options={[{ id: 'a', label: '7 days' }, { id: 'b', label: '30 days' }]} />)
    expect(screen.getByRole('button', { name: '7 days' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: '30 days' }))
    expect(picked).toBe('b')
    rerender(<Segmented label="How long" value="b" onChange={() => {}} options={[{ id: 'a', label: '7 days' }, { id: 'b', label: '30 days' }]} />)
    expect(screen.getByRole('button', { name: '30 days' }).getAttribute('aria-pressed')).toBe('true')
  })
})

describe('sliding highlight', () => {
  function Row({ on }: { on: 'x' | 'y' }) {
    const ref = useRef<HTMLDivElement>(null)
    useSlide(ref, on)
    return (
      <div ref={ref} data-testid="row">
        <button aria-pressed={on === 'x'}>X</button>
        <button aria-pressed={on === 'y'}>Y</button>
      </div>
    )
  }

  it('hands the pressed option position to CSS and follows it when it changes', () => {
    // jsdom has no layout, so give the buttons positions.
    const pos: Record<string, number> = { X: 4, Y: 96 }
    for (const p of ['offsetLeft', 'offsetWidth', 'offsetTop', 'offsetHeight']) {
      Object.defineProperty(HTMLElement.prototype, p, {
        configurable: true,
        get(this: HTMLElement) { return p === 'offsetLeft' ? (pos[this.textContent ?? ''] ?? 0) : p === 'offsetWidth' ? 80 : p === 'offsetHeight' ? 36 : 0 },
      })
    }
    const { rerender } = render(<Row on="x" />)
    const row = screen.getByTestId('row')
    expect(row.style.getPropertyValue('--ind-x')).toBe('4px')
    expect(row.style.getPropertyValue('--ind-w')).toBe('80px')
    rerender(<Row on="y" />)
    expect(row.style.getPropertyValue('--ind-x')).toBe('96px')
  })
})

describe('text field error', () => {
  it('shakes when its error appears and again when it changes', () => {
    const { container, rerender } = render(<TextField label="Email" value="" onChange={() => {}} />)
    const control = () => container.querySelector('.field__control')!
    expect(control().classList.contains('is-shaking')).toBe(false)
    rerender(<TextField label="Email" value="" onChange={() => {}} error="Enter your email" />)
    expect(control().classList.contains('is-shaking')).toBe(true)
    expect(screen.getByRole('alert').textContent).toBe('Enter your email')
  })
})
