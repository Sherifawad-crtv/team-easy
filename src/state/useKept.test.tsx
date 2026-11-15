import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useKept } from './useKept'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useKept', () => {
  it('keeps the last value on screen for a while after it goes away', () => {
    const { result, rerender } = renderHook(({ v }: { v: string | undefined }) => useKept(v, 480), { initialProps: { v: 'chat-1' as string | undefined } })
    expect(result.current).toBe('chat-1')
    rerender({ v: undefined })
    expect(result.current).toBe('chat-1')
    act(() => { vi.advanceTimersByTime(500) })
    expect(result.current).toBeUndefined()
  })

  it('drops it at once when no time is given', () => {
    const { result, rerender } = renderHook(({ v }: { v: string | undefined }) => useKept(v, 0), { initialProps: { v: 'chat-1' as string | undefined } })
    rerender({ v: undefined })
    expect(result.current).toBeUndefined()
  })

  it('swaps straight to a new value', () => {
    const { result, rerender } = renderHook(({ v }: { v: string | undefined }) => useKept(v, 480), { initialProps: { v: 'a' as string | undefined } })
    rerender({ v: 'b' })
    expect(result.current).toBe('b')
  })
})
