import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useAsync } from './useAsync'

describe('useAsync refresh', () => {
  it('fetches again without going back to loading, and keeps old data when it fails', async () => {
    let n = 0
    let fail = false
    const { result } = renderHook(() => useAsync(async () => { if (fail) throw new Error('x'); return ++n }, []))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.data).toBe(1)
    const states: string[] = []
    await act(async () => { const p = result.current.refresh(); states.push(result.current.status); await p })
    expect(states).toEqual(['ready'])
    expect(result.current.data).toBe(2)
    fail = true
    await act(async () => { await result.current.refresh() })
    expect(result.current.status).toBe('ready')
    expect(result.current.data).toBe(2)
  })
})
